import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";

import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as r53 from "aws-cdk-lib/aws-route53";
import { Asset } from "aws-cdk-lib/aws-s3-assets";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as elbTargets from "aws-cdk-lib/aws-elasticloadbalancingv2-targets";
 

import { CfnModelBiasJobDefinition } from "aws-cdk-lib/aws-sagemaker";
import * as fs from "fs";
import * as path from "path";


import { ProjectRole } from "./components/project-role";
import { ZomboidAccess } from "./components/zomboid-access";
import { ResourceLookupStack } from "./nested-stacks/lookup";
import { GameServerStack } from "@ianpants/project-zomboid-server"

export class ProjectZomboidSimpleServer extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // ---- Lookups
    // Use a nested stack
    // unpack lookups
    const { vpc, sg, hz } = new ResourceLookupStack(
      this,
      "resource-lookup-stack"
    );

    // ran into errors trying to add 22 for local as a construct, come back later
    // abandon for ssm?
    // const localSg = new AllowLocal(this, "local-22", {sg});
    const role = new ProjectRole(this, "project-role");

    // ---- Define instance ami (lookup on ubuntu website)
    const machineImage = ec2.MachineImage.genericLinux({
      "us-east-1": this.node.tryGetContext('ami'), // Ubuntu xenial us-east-1 LTS
    });

    // prepare all assets as folder
    const s3Assets = new Asset(this, "pz-server-bundle", {
      path: "./assets/server-config/",
    });
    s3Assets.grantRead(role.role);

    // prepare s3 assets
    // todo::stack? construct?
    const s3UnitFile = new Asset(this, "pz-unit-file", {
      path: "./assets/projectzomboid.service",
    });
    s3UnitFile.grantRead(role.role);

    // We will be adding more to this as we go
    const multipartUserData = new ec2.MultipartUserData();

    // Basic instance level packages
    // todo::docker
    const setupCommands = ec2.UserData.forLinux();
    setupCommands.addCommands(
      `echo "---- Install deps"`,
      `sudo add-apt-repository multiverse`,
      `sudo dpkg --add-architecture i386`,
      `sudo apt update`,
      `sudo apt install -y lib32gcc1 libsdl2-2.0-0:i386 docker.io awscli unzip`
    );

    // Use `addUserDataPart` to set the multipart as the default on the stack
    // s3 download commands will fail without a stand-in default (if multipart)
    multipartUserData.addUserDataPart(setupCommands, "", true);
    multipartUserData.addCommands(
      `echo "---- Add users"`,
      `sudo usermod -aG docker ubuntu`,
      `sudo usermod -aG docker steam`
    );
    
    var iniTemplateFile = fs
      .readFileSync(path.join(__dirname, "..", "assets", "server_template.ini"))
    // Build configs from mod files
    var modFile = fs
      .readFileSync(path.join(__dirname, "..", "assets", "mods.txt"))

    
    // let config = buildServerConfig(
    //   multipartUserData,
    //   s3Assets,
    //   s3UnitFile,
    //   modInstallFile
    // )
    var gameServerConfig = new GameServerStack(this, "game-config", {
      serverConfigFolder,
      unitFile,
      modFile,
      iniTemplateFile
  // configAssets: Asset,
  // unitFileAsset: Asset,
  // templateFile?: Buffer,
  // modFile?: Buffer,
  // serverName?: string
    })

    // multipartUserData.addUserDataPart(gameServerConfig.)

    console.log("In main")
    console.log(gameServerConfig)

    // ---- Start server
    const instance = new ec2.Instance(this, "project-zomboid-ec2", {
      instanceType: new ec2.InstanceType("t2.medium"),
      machineImage: machineImage,
      vpc: vpc,
      keyName: "pz-mac",
      securityGroup: sg,
      role: role.role,
      userData: multipartUserData,
    });

    let eip = new ec2.CfnEIP(this, "Ip");

    let ec2Assoc = new ec2.CfnEIPAssociation(this, "Ec2Association", {
      eip: eip.ref,
      instanceId: instance.instanceId
    });

    // todo::Tags are easier now but I am still lazy, more tags
    cdk.Tags.of(instance).add("game", "projectzomboid");

    // Holder for pz sg's
    const zomboidServerSg = new ec2.SecurityGroup(
      this,
      "zomboid-server-port-reqs",
      {
        vpc: vpc,
        allowAllOutbound: true,
        description: "sg to match zomboid requirements",
      }
    );

    // Following two sg's are for Steam
    zomboidServerSg.addIngressRule(
      ec2.Peer.ipv4("0.0.0.0/0"),
      ec2.Port.tcpRange(27010, 27020),
      "steam tcp rules"
    );

    zomboidServerSg.addIngressRule(
      ec2.Peer.ipv4("0.0.0.0/0"),
      ec2.Port.udpRange(27010, 27020),
      "steam udp rules"
    );

    // Loop users out of context and provide access via sg
    // This is simplest possible design based on user IP so I don't have to 
    // have private subnets, NATs, or anything else that costs money
    let users = this.node.tryGetContext('users')
    for (let key in users){
      let value = users[key];
      new ZomboidAccess(this, "zomboid-users-"+value, {
        securityGroup: zomboidServerSg, 
        playersIp: value,
        player: key
      })
    }

    // add the pz ingress rules
    instance.addSecurityGroup(zomboidServerSg);

// 
// 
// 

    const lb = new elbv2.NetworkLoadBalancer(this, 'simple-lb', {
      vpc,
      internetFacing: true
    });

    // const listener = lb.addListener('Listener', {
    //   port: 16261,
    //   protocol: elbv2.Protocol.TCP_UDP,
    //   // certificates: [{
    //   //   certificateArn: "arn:aws:acm:us-east-1:346096930733:certificate/f77c70fb-b512-427c-8707-ed09784838f0"
    //   // }],
    // });

    // const instanceIdTarget = new elbTargets.InstanceIdTarget(instance.instanceId, 16261);
    // const group = listener.addTargets('Target', {
    //   port: 16261,
    //   protocol: elbv2.Protocol.TCP_UDP,
    //   targets: [instanceIdTarget]
    // });

    // group.node.addDependency(vpc.internetConnectivityEstablished);
// 
// 
// 



    // Add a hosted zone, each game is one server, one subdomain, plan accordingly
    const pzHZ = new r53.PublicHostedZone(this, "HostedZoneDev", {
      zoneName: this.node.tryGetContext('subdomain') + "." + hz.zoneName,
    });

    new r53.ARecord(this, "PzARecordB", {
      zone: pzHZ,
      target: r53.RecordTarget.fromIpAddresses(instance.instancePublicIp),
    });


    // todo::This can probably be a downstream lookup
    new r53.NsRecord(this, "NsForParentDomain", {
      zone: hz,
      recordName: this.node.tryGetContext('subdomain')+".adventurebrave.com",
      values: pzHZ.hostedZoneNameServers!, // exclamation is like, hey it might be null but no: https://stackoverflow.com/questions/54496398/typescript-type-string-undefined-is-not-assignable-to-type-string
    });

    // Create outputs for connecting
    new cdk.CfnOutput(this, "IP Address", { value: instance.instancePublicIp });
    // new cdk.CfnOutput(this, 'Download Key Command', { value: 'aws secretsmanager get-secret-value --secret-id ec2-ssh-key/cdk-keypair/private --query SecretString --output text > cdk-key.pem && chmod 400 cdk-key.pem' })
    // new cdk.CfnOutput(this, 'ssh command', { value: 'ssh -i cdk-key.pem -o IdentitiesOnly=yes ec2-user@' + instance.instancePublicIp })
  }
}

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as fs from "fs";
import * as path from "path";

import { ProjectRole } from "./components/project-role";
import { VPCLookup, HostedZoneLookupStack } from "@ianpants/pants-constructs";
import { GameServerStack, InfraConfig, GameConfig } from "@ianpants/project-zomboid-server"

export interface ConfigProps extends cdk.StackProps {
  region: string,
  keyName: string,
  vpcId: string;
  securityGroupId: string;
  domainname: string,
  subdomain: string,
  servername: string,
  instancetype: string,
  public: boolean,
  fresh: boolean,
}

export class ProjectZomboidSimpleServer extends Stack {
  constructor(scope: Construct, id: string, props: ConfigProps) {
    super(scope, id, props);

    // ---- Lookups
    // Use a nestded stack
    // unpack lookups
    // const { vpc, sg, hz, vol } = new ResourceLookupStack(
    //   this,
    //   "resource-lookup-stack",
    //   {
    //     vpcId: props.vpcId,
    //     sgId: props.securityGroupId,
    //     domainname: props.domainname!,
    //     subdomain: props.subdomain!,
    //   }
    // );
    let vpcLookup = new VPCLookup(this, `${props.servername}-vpc-lookup`, { vpcId: props.vpcId })

    const projectRole = new ProjectRole(this, `${props.servername}-project-role`);
    cdk.Tags.of(projectRole).add("game", `${props.servername}-projectzomboid`);


    let appSG = new ec2.SecurityGroup(this, `${props.servername}-security-group`, {
      vpc: vpcLookup.vpc,
    })

    let hz = new HostedZoneLookupStack(this, `${props.servername}-hosted-zone-lookup`, {
      domainName: `${props.domainname}`
    })

    let vol = new ec2.Volume(this, `${props.domainname}-vol`, {
      availabilityZone: 'us-east-2a',
      size: cdk.Size.gibibytes(20),
    });
    cdk.Tags.of(vol).add("game", `pz-${props.subdomain}-vol`);
    cdk.Tags.of(vol).add("Name", `pz-${props.subdomain}-vol`);


    let infra = {
      vpc: vpcLookup.vpc, // should be derived
      keyName: props.keyName,
      region: props.region,
      role: projectRole.role, // should be made here
      subdomain: props.subdomain,
      hostedzoneid: hz.hz.hostedZoneId, // Should be derived
      instancetype: props.instancetype, // should use some kind of map
      sg: appSG, // should be here
      hz: hz, // should be dervice
      vol: vol, // made here? ephemeral solution?
    }

    // const vpc = new 
    // TODO::SG should be local to the app
    // sg.addIngressRule(
    //   Peer.ipv4("108.49.70.185/0"),
    //   Port.tcp(22),
    //   "ssh for local"
    // );

    // const hz = new HostedZone(this, "hosted-zone", {
    //   zoneName: `${props?.cfg.subdomain}.${props?.cfg.servername}.com`,
    // })

    // Stack role


    // See README for mod file format
    // TODO::Optional if local?
    const modFile = fs.readFileSync(path.join(process.cwd(), "assets", "mods.txt"));

    let game = {
      fileList: [
        "_server.ini",
        "_SandboxVars.lua",
        "_spawnregions.lua",
        "_spawnpoints.lua"
      ],
      distdir: "assets/dist",
      servername: props.servername,
      modFile: modFile,
      public: props.public,
      fresh: props.fresh,
    }



    // Process files needed for a server
    var gameServerConfig = new GameServerStack(this, "game-config", {
      game: game,
      infra: infra,
    })

    // console.log(gameServerConfig.node.findAll())
    // console.log(gameServerConfig.userData)

  }
}


    // 
    //
    //

    // const lb = new elbv2.NetworkLoadBalancer(this, 'simple-lb', {
    //   vpc,
    //   internetFacing: true
    // });

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

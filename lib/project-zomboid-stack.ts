import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
import { Peer, Port } from "aws-cdk-lib/aws-ec2";

import * as fs from "fs";
import * as path from "path";

import { ProjectRole } from "./components/project-role";
import { ResourceLookupStack } from "./nested-stacks/lookup";
import { GameServerStack, ServerConfig, GameServerProps } from "@ianpants/project-zomboid-server"

interface ConfigProps extends cdk.StackProps {
  cfg: ServerConfig;
  vpcId: string;
  securityGroupId: string;
  keyName: string;
}

const DIST_DIR = "./assets/dist/"

export class ProjectZomboidSimpleServer extends Stack {
  constructor(scope: Construct, id: string, props: ConfigProps) {
    super(scope, id, props);

    // ---- Lookups
    // Use a nestded stack
    // unpack lookups
    const { vpc, sg, hz } = new ResourceLookupStack(
      this,
      "resource-lookup-stack",
      {
        vpcId: props.vpcId,
        sgId: props.securityGroupId,
        hostedZoneID: props.cfg.hostedzoneid!,
        hostedZoneName: "pz.adventurebrave.com",
        subdomain: props.cfg.subdomain!,
      }
    );

    // const vpc = new 
    sg.addIngressRule(
      Peer.ipv4("..."),
      Port.tcp(22),
      "ssh for local"
    );
    // const hz = new HostedZone(this, "hosted-zone", {
    //   zoneName: `${props?.cfg.subdomain}.${props?.cfg.servername}.com`,
    // })

    // Stack role
    const projectRole = new ProjectRole(this, "project-role");

    cdk.Tags.of(projectRole).add("game", "projectzomboid");


    // const modFile = fs.readFileSync(path.join(process.cwd(), "assets", "mods.txt"));
    // props.cfg.modFile = modFile;
    // console.log("try and start");

    // (() => {

    // })



    // fs.readdir(DIST_DIR, (err, files) => {
    //   if (err) throw err;
    //   for (const file of files) {
    //     console.log(file);
    //     fs.stat(path.join(DIST_DIR, file), function (err, fileProps) {
    //       err ? console.log(err) : null;
    //       fileProps.isDirectory() ? console.log("recurse") : console.log(file);
    //       // stats.isFile();
    //       // stats.isDirectory();
    //       // stats.isSymbolicLink();
    //     });
    //     // fs.unlink(path.join(DIST_DIR, file), err => {
    //     //   if (err) throw err;
    //     // });
    //   }
    // });

    // Process files needed for a server
    var gameServerConfig = new GameServerStack(this, "game-config", {
      cfg: props!.cfg,
      role: projectRole.role,
      vpc: vpc,
      sg: sg,
      hz: hz,
    })

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

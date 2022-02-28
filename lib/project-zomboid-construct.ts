// import {CfnOutput, ITaggable, TagManager} from "aws-cdk-lib";
// import { Construct } from 'constructs';
// import {NatProvider, InstanceType, Vpc, IVpc, SecurityGroup} from 'aws-cdk-lib/aws-ec2';
// import { Asset } from "aws-cdk-lib/aws-s3-assets";

// import * as fs from "fs";
// import * as path from "path";

// import * as ec2 from "aws-cdk-lib/aws-ec2";
// import * as iam from "aws-cdk-lib/aws-iam";

// import { buildServerConfig } from "./logic/server-config"

// export interface GameServerProps {
//   vpc: ec2.IVpc,
//   ami: string, // default us-east-2 Ubuntu 20.04
//   sg: ec2.SecurityGroup,
//   subdomain?: string,
//   modFile?: Buffer
// }

// export class GameServerStack extends Construct implements ITaggable {

//   // public readonly CoreVpc: IVpc;
//   public readonly tags: TagManager;

//   constructor(scope: Construct, id: string, props: GameServerProps) {
//     super(scope, id);

//     // Create role
//     let serverRole = new iam.Role(this, "ec2Role", {
//       assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
//     });

//     serverRole.addManagedPolicy(
//       iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
//     );

//     // ---- Define instance ami (lookup on ubuntu website)
//     const machineImage = ec2.MachineImage.genericLinux({
//       "us-east-2": this.node.tryGetContext('ami'), // Ubuntu xenial us-east-1 LTS
//     });

//     // prepare all assets as folder
//     const s3Assets = new Asset(this, "pz-server-bundle", {
//       path: "./assets/server-config/",
//     });
//     s3Assets.grantRead(serverRole);

//     // prepare s3 assets
//     // todo::stack? construct?
//     const s3UnitFile = new Asset(this, "pz-unit-file", {
//       path: "./assets/projectzomboid.service",
//     });
//     s3UnitFile.grantRead(serverRole);

//     // We will be adding more to this as we go
//     const multipartUserData = new ec2.MultipartUserData();

//     // Basic instance level packages
//     // todo::docker
//     const setupCommands = ec2.UserData.forLinux();
//     setupCommands.addCommands(
//       `echo "---- Install deps"`,
//       `sudo add-apt-repository multiverse`,
//       `sudo dpkg --add-architecture i386`,
//       `sudo apt update`,
//       `sudo apt install -y lib32gcc1 libsdl2-2.0-0:i386 docker.io awscli unzip`
//     );

//     // Use `addUserDataPart` to set the multipart as the default on the stack
//     // s3 download commands will fail without a stand-in default (if multipart)
//     multipartUserData.addUserDataPart(setupCommands, "", true);
//     multipartUserData.addCommands(
//       `echo "---- Add users"`,
//       `sudo usermod -aG docker ubuntu`,
//       `sudo usermod -aG docker steam`
//     );

//     let config = buildServerConfig(
//       multipartUserData,
//       s3Assets,
//       s3UnitFile,
//       props.modFile
//     )

//     console.log(config)


//     // ---- Start server
//     const instance = new ec2.Instance(this, "project-zomboid-ec2", {
//       instanceType: new ec2.InstanceType("t2.medium"),
//       machineImage: machineImage,
//       vpc: props.vpc,
//       keyName: "pz-mac",
//       securityGroup: props.sg,
//       role: serverRole,
//       userData: multipartUserData,
//     });

//   //   // Configure the `natGatewayProvider` when defining a Vpc
//   //   const natGatewayProvider = NatProvider.instance({
//   //     instanceType: new InstanceType('t2.micro'),
//   //   });

//   //   // The code that defines your stack goes here
//   //   const baseVpc = new Vpc(this, 'base-vpc', {
//   //     cidr: props.cidrRange,
//   //     maxAzs: props.azs,
//   //     natGatewayProvider: natGatewayProvider,
//   //   })
//   //   const vpcSG = new SecurityGroup(this, 'SG', { vpc: baseVpc });

//   //   new CfnOutput(this, "VPC ID", { value: baseVpc.vpcId});
//   //   new CfnOutput(this, "SG ID", { value: vpcSG.securityGroupId});
//   }
// }


// // import * as ec2 from '@aws-cdk/aws-ec2';
// // import * as cdk from '@aws-cdk/core';

// // export class CdkStarterStack extends cdk.Stack {
// //   constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
// //     super(scope, id, props);

// //     const vpc = new ec2.Vpc(this, 'my-cdk-vpc', {
// //       cidr: '10.0.0.0/16',
// //       natGateways: 1,
// //       maxAzs: 3,
// //       subnetConfiguration: [
// //         {
// //           name: 'private-subnet-1',
// //           subnetType: ec2.SubnetType.PRIVATE,
// //           cidrMask: 24,
// //         },
// //         {
// //           name: 'public-subnet-1',
// //           subnetType: ec2.SubnetType.PUBLIC,
// //           cidrMask: 24,
// //         },
// //         {
// //           name: 'isolated-subnet-1',
// //           subnetType: ec2.SubnetType.ISOLATED,
// //           cidrMask: 28,
// //         },
// //       ],
// //     });
// //   }
// // }

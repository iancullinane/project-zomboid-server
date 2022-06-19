#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ConfigProps } from '../lib/project-zomboid-stack';
import { ProjectZomboidSimpleServer } from "../lib/project-zomboid-stack";
import * as yaml from "js-yaml";

// import { HzLookUpProps } from "@ianpants/pants-constructs";

import * as fs from "fs";
import * as path from "path";

// const envSheeta = { account: '208744038881', region: 'us-east-2' };
const envIan = { region: "us-east-1", account: "346096930733" }; // Ian
const envSheeta = { region: "us-east-2", account: "208744038881" }; // Sheeta


var cfg = JSON.parse(fs.readFileSync('config/base.json', 'utf-8')) as ConfigProps;

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

// {
//     "vpcId": "vpc-09eeb8c5da940f7d0",
//     "securityGroupId": "sg-0e605cffa6a7b51a4",
//     "region": "us-east-2",
//     "keyName": "pz-sheeta-key",
//     "domainname": "sheeta.cloud",
//     "subdomain": "thepain",
//     "servername": "thepain",
//     "instancetype": "t2.medium",
//     "modFile": "assets/mods.txt",
//     "public": true,
//     "fresh": false
// }

const app = new cdk.App({
  context: {
    users: {
      eignhpants: "108.49.70.185/24"
    },
  }
});

// let hz = new HzLookUpProps

new ProjectZomboidSimpleServer(app, "ProjectZomboidServerLiquidSnake", {
  env: envSheeta,
  ...cfg
});

// 
// TODO::Constructs to impl
// 

// Make a volume
// this.vol = new ec2.Volume(this, `${props.domainname}-vol`, {
//   availabilityZone: 'us-east-2a',
//   size: cdk.Size.gibibytes(20),
// });
// cdk.Tags.of(this.vol).add("game", `pz-${props.subdomain}-vol`);
// cdk.Tags.of(this.vol).add("Name", `pz-${props.subdomain}-vol`);

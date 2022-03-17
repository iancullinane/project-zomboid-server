#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ProjectZomboidSimpleServer } from "../lib/project-zomboid-stack";

import * as fs from "fs";

// const envSheeta = { account: '208744038881', region: 'us-east-2' };
const envIan = { region: "us-east-1", account: "..." }; // Ian
const envSheeta = { region: "us-east-2", account: "..." }; // Sheeta


const app = new cdk.App({
  context: {
    // ...
  }
});

new ProjectZomboidSimpleServer(app, "ProjectZomboidServerThePain", {
  env: envSheeta,
  cfg: {
    region: "us-east-",
    ami: "ami-",
    keyName: "keyyy",
    hostedzoneid: "blef", // pz in sheeta
    servername: "blarf",
    instancetype: "t2.medium",
    modFile: fs.readFileSync(`assets/mods.txt`),
    public: true
    // fresh: true
  },
  vpcId: "vpc-0",
  securityGroupId: "sg-0e",
  keyName: "keyyyy",
});

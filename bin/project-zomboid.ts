#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ProjectZomboidSimpleServer } from "../lib/project-zomboid-stack";

const envSheeta  = { account: '208744038881', region: 'us-east-2' };
const envIan = { region: "us-east-1", account: "346096930733"};


const app = new cdk.App({
  context: {
    ami: "ami-01b996646377b6619",
    users: {
      Fedyakin: "24.218.221.80/32",
      eignhpants: "108.49.70.185/32"
    },
    subdomain: "sheeta"
  },
});
new ProjectZomboidSimpleServer(app, "ProjectZomboidServerDev", { env: envIan });

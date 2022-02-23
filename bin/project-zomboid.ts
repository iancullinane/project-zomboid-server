#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ProjectZomboidSimpleServer } from "../lib/project-zomboid-stack";

const app = new cdk.App({
  context: {
    ami: "ami-01b996646377b6619", // Ubuntu 20.04 LTS
    users: {
      Fedyakin: "...",
      eignhpants: "..."
    },
    subdomain: "test"
  },
});
new ProjectZomboidSimpleServer(app, "ProjectZomboidServerTest", {
  
  env: {
    region: "us-east-1",
    account: "...",
  },
});

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Stack } from "aws-cdk-lib";
import { ServerConfig } from "@ianpants/project-zomboid-server";
interface ConfigProps extends cdk.StackProps {
    cfg: ServerConfig;
}
export declare class ProjectZomboidSimpleServer extends Stack {
    constructor(scope: Construct, id: string, props?: ConfigProps);
}
export {};

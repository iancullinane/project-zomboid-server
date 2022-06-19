import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as r53 from "aws-cdk-lib/aws-route53";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
export declare class ResourceLookupStack extends cdk.NestedStack {
    readonly vpc: ec2.IVpc;
    readonly sg: ec2.ISecurityGroup;
    readonly hz: r53.IHostedZone;
    constructor(scope: Construct, id: string, props?: cdk.NestedStackProps);
}

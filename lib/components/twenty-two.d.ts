import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
export interface AllowLocalProps {
    sg: ec2.SecurityGroup;
    cidr: string;
}
export declare class AllowLocal extends Construct {
    constructor(scope: Construct, id: string, props: AllowLocalProps);
}

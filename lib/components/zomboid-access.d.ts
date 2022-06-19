import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
export interface ZomboidAccessProps {
    securityGroup: ec2.SecurityGroup;
    playersIp: string;
    player: string;
}
export declare class ZomboidAccess extends Construct {
    constructor(scope: Construct, id: string, props: ZomboidAccessProps);
}

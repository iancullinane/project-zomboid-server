import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
export declare class ProjectRole extends Construct {
    readonly role: iam.IRole;
    constructor(scope: Construct, id: string);
}

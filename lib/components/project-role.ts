import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class ProjectRole extends Construct {
  public readonly role: iam.IRole;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create role
    this.role = new iam.Role(this, "ec2Role", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    this.role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
    );
  }
}

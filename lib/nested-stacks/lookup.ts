import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as r53 from "aws-cdk-lib/aws-route53";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

// Provides lookups from an existing environment, nested so the underlying
// lookups can be updated 
export class ResourceLookupStack extends cdk.NestedStack {

  // Export the results
  public readonly vpc: ec2.IVpc;
  public readonly sg: ec2.ISecurityGroup;
  public readonly hz: r53.IHostedZone;

  // TODO::Make a real props object to make this not hardcoded
  constructor(scope: Construct, id: string, props?: cdk.NestedStackProps) {
    super(scope, id, props);

    // The default is public so proceed accordingly
    this.vpc = ec2.Vpc.fromLookup(this, "Vpc", {
      isDefault: true,
    });

    this.sg = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      "central-access-sg",
      "sg-0ee14c2817414038f"
    );

    this.hz = r53.HostedZone.fromHostedZoneAttributes(
      this,
      "adventurebrave-hostedzone",
      { zoneName: "adventurebrave.com", hostedZoneId: "Z2URBRDZG4MDWO" }
    );
  }

}

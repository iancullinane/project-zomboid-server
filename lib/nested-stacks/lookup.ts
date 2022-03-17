import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as r53 from "aws-cdk-lib/aws-route53";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface LookUpProps extends cdk.NestedStackProps {
  vpcId: string,
  sgId: string,
  hostedZoneID: string,
  hostedZoneName: string,
  subdomain: string,
}

// Provides lookups from an existing environment, nested so the underlying
// lookups can be updated 
export class ResourceLookupStack extends cdk.NestedStack {

  // Export the results
  public readonly vpc: ec2.IVpc;
  public readonly sg: ec2.ISecurityGroup;
  public readonly hz: r53.IHostedZone;

  // TODO::Make a real props object to make this not hardcoded
  constructor(scope: Construct, id: string, props?: LookUpProps) {
    super(scope, id, props);

    if (props === undefined) {
      console.log("TODO");
      return
    }

    // Expects you to know VPC name
    // Could also do an Fn.Import
    this.vpc = ec2.Vpc.fromLookup(this, "Vpc", {
      vpcId: props?.vpcId
    });

    this.sg = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      `vpc-security-group-${this.vpc.vpcId}`,
      props.sgId
    );

    // This method is preferred because using the `fromHostedZone` lookup
    // causes you to lose the zone name, which is used downstream
    this.hz = r53.HostedZone.fromHostedZoneAttributes(
      this,
      `${props.hostedZoneName}.com-${props.hostedZoneID}`,
      { zoneName: props.hostedZoneName, hostedZoneId: props.hostedZoneID }
    );
  }

}

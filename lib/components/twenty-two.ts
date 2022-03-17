// discove resources at runtime
// https://cdkworkshop.com/20-typescript/40-hit-counter/200-handler.html

// export interface HitCounterProps {
//   /** the function for which we want to count url hits **/
//   downstream: lambda.IFunction;
// }

// export class HitCounter extends Construct {
//   constructor(scope: Construct, id: string, props: HitCounterProps) {
//     super(scope, id);

//     // TODO
//   }
// }
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export interface AllowLocalProps {
  sg: ec2.SecurityGroup;
  cidr: string;
}

export class AllowLocal extends Construct {

  constructor(scope: Construct, id: string, props: AllowLocalProps) {
    super(scope, id);

    props.sg.addIngressRule(
      ec2.Peer.ipv4(props.cidr),
      ec2.Port.tcp(22),
      "local"
    );

  }
}

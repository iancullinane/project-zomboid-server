
# project-zomboid-server
CDK and config for a Project Zomboid server

### Mounting a volume

```
    // const mountCommands = ec2.UserData.forLinux();
    // mountCommands.addCommands(
    //   `echo "---- Start Setup"`,
    //   // Retrieve token for accessing EC2 instance metadata (https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instancedata-data-retrieval.html)
    //   `TOKEN=$(curl -SsfX PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")`,
    //   // Retrieve the instance Id of the current EC2 instance
    //   `INSTANCE_ID=$(curl -SsfH "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id)`,
    //   // Attach the volume to /dev/xvdz
    //   `aws --region ${Stack.of(this).region} ec2 attach-volume --volume-id ${
    //     volume.volumeId
    //   } --instance-id $INSTANCE_ID --device ${targetDevice}`,
    //   // Wait until the volume has attached
    //   `while ! test -e ${targetDevice}; do sleep 1; done`
    //   // The volume will now be mounted. You may have to add additional code to format the volume if it has not been prepared.
    // );
```

### Network Load Balancer

```
const vpc = new ec2.Vpc(stack, 'VPC', {
  maxAzs: 2
});

const lb = new elbv2.NetworkLoadBalancer(stack, 'LB', {
  vpc,
  internetFacing: true
});

const listener = lb.addListener('Listener', {
  port: 443,
  certificates: [{
    certificateArn: "foo"
  }],
});

const group = listener.addTargets('Target', {
  port: 443,
  targets: [new elbv2.IpTarget('10.0.1.1')]
});

group.node.addDependency(vpc.internetConnectivityEstablished);

```

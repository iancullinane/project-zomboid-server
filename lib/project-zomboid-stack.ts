import * as cdk from "aws-cdk-lib";
import { Stack, StackProps } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as r53 from "aws-cdk-lib/aws-route53";
import { Asset } from "aws-cdk-lib/aws-s3-assets";
import { CfnModelBiasJobDefinition } from "aws-cdk-lib/aws-sagemaker";
import { Construct } from "constructs";
import * as fs from "fs";
import * as path from "path";
import { ProjectRole } from "./components/project-role";
import { ZomboidAccess } from "./components/zomboid-access";
import { ResourceLookupStack } from "./nested-stacks/lookup";

export class ProjectZomboidSimpleServer extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // ---- Lookups
    // Use a nested stack
    // unpack lookups
    const { vpc, sg, hz } = new ResourceLookupStack(
      this,
      "resource-lookup-stack"
    );

    // ran into errors trying to add 22 for local as a construct, come back later
    // abandon for ssm?
    // const localSg = new AllowLocal(this, "local-22", {sg});
    const role = new ProjectRole(this, "project-role");

    // ---- Define instance ami (lookup on ubuntu website)
    const machineImage = ec2.MachineImage.genericLinux({
      "us-east-1": this.node.tryGetContext('ami'), // Ubuntu xenial us-east-1 LTS
    });

    // prepare all assets as folder
    const s3Assets = new Asset(this, "pz-server-bundle", {
      path: "./assets/server-config/",
    });
    s3Assets.grantRead(role.role);

    // prepare s3 assets
    // todo::stack? construct?
    const s3UnitFile = new Asset(this, "pz-unit-file", {
      path: "./assets/projectzomboid.service",
    });
    s3UnitFile.grantRead(role.role);

    // const iniFile = new Asset(this, "pz-ini-file", {
    //   path: "./assets/server-config/adventurebrave.ini",
    // });
    // iniFile.grantRead(role.role);

    // const luaFile = new Asset(this, "pz-lua-file", {
    //   path: "./assets/server-config/adventurebrave_SandboxVars.lua",
    // });
    // luaFile.grantRead(role.role);

    // We will be adding more to this as we go
    const multipartUserData = new ec2.MultipartUserData();

    // Basic instance level packages
    // todo::docker
    const setupCommands = ec2.UserData.forLinux();
    setupCommands.addCommands(
      `echo "---- Install deps"`,
      `sudo add-apt-repository multiverse`,
      `sudo dpkg --add-architecture i386`,
      `sudo apt update`,
      `sudo apt install -y lib32gcc1 libsdl2-2.0-0:i386 docker.io awscli unzip`
    );

    // Use `addUserDataPart` to set the multipart as the default on the stack
    // s3 download commands will fail without a stand-in default (if multipart)
    multipartUserData.addUserDataPart(setupCommands, "", true);
    multipartUserData.addCommands(
      `echo "---- Add users"`,
      `sudo usermod -aG docker ubuntu`,
      `sudo usermod -aG docker steam`
    );
    
    // Start compile config
    // I would actually do this as a seperate container but I was interested
    // in writing some code direct into the cdk file
    let steamcmdMods = Array<string>();
    let modsNamesArray = Array<string>();
    let workshopIDArray = Array<string>();

    // Read the local mods folder
    var modInstallArray = fs
      .readFileSync(path.join(__dirname, "..", "assets", "mods.txt"))
      .toString()
      .split("\n");  
    
    // Populate arrays from file
    modInstallArray.forEach((v, i) => {
      if (v === ""){
        return
      }
    
      // This is actually unused, see below
      let modConfig = v.split(/\s+/)
      steamcmdMods[i] = `+workshop_download_item 380870 ${modConfig[0]}`      
      workshopIDArray.push(`${modConfig[0]}`)
      modsNamesArray.push(`${modConfig[1]}`)
    });

    // Open .ini file, put mods in correct places
    var iniFileTemplate = fs
      .readFileSync(path.join(__dirname, "..", "assets", "adventurebrave_template.ini"))
      .toString()
      .split("\n"); 
    iniFileTemplate.pop() // this will be empty stupid format on save
    // Fill in mod config for server
    iniFileTemplate.forEach((v, i) => {
      v === "Mods=" ? iniFileTemplate[i] = `Mods=${modsNamesArray.join(";")}` : null ;
      v === "WorkshopItems=" ? iniFileTemplate[i] = `WorkshopItems=${workshopIDArray.join(";")}` : null ;
    });

    // Write "real" .ini file
    var file = fs.createWriteStream('./assets/server-config/adventurebrave.ini');
    file.on('error', (err) => { console.log(`error writing file: ${err}`) });
    iniFileTemplate.forEach((v) => {  file.write(`${v}\n`)});
    file.end();

    // --- end compile config
    
    // Print result if I want to look it over
    console.log(workshopIDArray)
    console.log(modsNamesArray)


    // Install steam commands
    // You can ask the steamcmd container to dl workshop items (compiled into
    // steamcmdMods variable), but you need to login, took awhile to figure 
    // this out the the feature exists I just don't use it, the following 
    // will used the compiled mods config to provide steamcmd with the right args:
    // ${steamcmdMods.join(' ')} \
    let installCommands: string[] = [
      `echo "---- Install PZ"`,
      `mkdir /home/steam/pz`,
      `docker run -v /home/steam/pz:/data steamcmd/steamcmd:ubuntu-18 \
      +login anonymous \
      +force_install_dir /data \
      +app_update 380870 validate \
      +quit`
    ]

    // Object to hold future UserData
    multipartUserData.addCommands(...installCommands);

    // Zip up config directory, I know this will zip because I am using the
    // folder as my `localFile`
    multipartUserData.addS3DownloadCommand({
      bucket: s3Assets.bucket,
      bucketKey: s3Assets.s3ObjectKey,
      localFile: "/home/steam/files/",
    });

    // This will be a single object because it is a filename
    multipartUserData.addS3DownloadCommand({
      bucket: s3UnitFile.bucket,
      bucketKey: s3UnitFile.s3ObjectKey,
      localFile: "/etc/systemd/system/projectzomboid.service",
    });

    // Place, enable, and start the service
    multipartUserData.addCommands(
      `mkdir -p /home/steam/pz/Server/`, // Just in case
      `unzip /home/steam/files/${s3Assets.s3ObjectKey} -d /home/steam/pz/Server/`,
      `chmod +x /etc/systemd/system/projectzomboid.service`,
      `systemctl enable projectzomboid.service`,
    );

    // ---- Start server
    const instance = new ec2.Instance(this, "project-zomboid-ec2", {
      instanceType: new ec2.InstanceType("t2.medium"),
      machineImage: machineImage,
      vpc: vpc,
      keyName: "...",
      securityGroup: sg,
      role: role.role,
      userData: multipartUserData,
    });

    // todo::Tags are easier now but I am still lazy, more tags
    cdk.Tags.of(instance).add("game", "projectzomboid");

    // Holder for pz sg's
    const zomboidServerSg = new ec2.SecurityGroup(
      this,
      "zomboid-server-port-reqs",
      {
        vpc: vpc,
        allowAllOutbound: true,
        description: "sg to match zomboid requirements",
      }
    );

    // Following two sg's are for Steam
    zomboidServerSg.addIngressRule(
      ec2.Peer.ipv4("0.0.0.0/0"),
      ec2.Port.tcpRange(27010, 27020),
      "steam tcp rules"
    );

    zomboidServerSg.addIngressRule(
      ec2.Peer.ipv4("0.0.0.0/0"),
      ec2.Port.udpRange(27010, 27020),
      "steam udp rules"
    );

    // Loop users out of context and provide access via sg
    // This is simplest possible design based on user IP so I don't have to 
    // have private subnets, NATs, or anything else that costs money
    let users = this.node.tryGetContext('users')
    for (let key in users){
      let value = users[key];
      new ZomboidAccess(this, "zomboid-users-"+value, {
        securityGroup: zomboidServerSg, 
        playersIp: value,
        player: key
      })
    }

    // add the pz ingress rules
    instance.addSecurityGroup(zomboidServerSg);

    // Add a hosted zone, each game is one server, one subdomain, plan accordingly
    const pzHZ = new r53.PublicHostedZone(this, "HostedZoneDev", {
      zoneName: this.node.tryGetContext('subdomain') + "." + hz.zoneName,
    });

    new r53.ARecord(this, "PzARecordB", {
      zone: pzHZ,
      target: r53.RecordTarget.fromIpAddresses(instance.instancePublicIp),
    });


    // todo::This can probably be a downstream lookup
    new r53.NsRecord(this, "NsForParentDomain", {
      zone: hz,
      recordName: this.node.tryGetContext('subdomain')+".adventurebrave.com",
      values: pzHZ.hostedZoneNameServers!, // exclamation is like, hey it might be null but no: https://stackoverflow.com/questions/54496398/typescript-type-string-undefined-is-not-assignable-to-type-string
    });

    // Create outputs for connecting
    new cdk.CfnOutput(this, "IP Address", { value: instance.instancePublicIp });
    // new cdk.CfnOutput(this, 'Download Key Command', { value: 'aws secretsmanager get-secret-value --secret-id ec2-ssh-key/cdk-keypair/private --query SecretString --output text > cdk-key.pem && chmod 400 cdk-key.pem' })
    // new cdk.CfnOutput(this, 'ssh command', { value: 'ssh -i cdk-key.pem -o IdentitiesOnly=yes ec2-user@' + instance.instancePublicIp })
  }
}

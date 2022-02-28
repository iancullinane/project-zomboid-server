// export function sayHello() {
//   console.log('hi')
// }

// import * as fs from "fs";
// import * as path from "path";

// import * as ec2 from "aws-cdk-lib/aws-ec2";
// import { Asset } from "aws-cdk-lib/aws-s3-assets";


// interface Config {
//   steamcmdMods?: Array<string>
//   modsNamesArray?: Array<string>
//   workshopIDArray?: Array<string>
// }

// export function buildServerConfig(
//   multipartUserData: ec2.MultipartUserData,
//   configAssets: Asset,
//   unitFileAsset: Asset,
//   modFile?: Buffer): Config {

//   let steamcmdMods = Array<string>();
//   let modsNamesArray = Array<string>();
//   let workshopIDArray = Array<string>();

//   // Read the local mods folder
//     // var modInstallArray = fs
//     //   .readFileSync(path.join(__dirname, "..", "assets", "mods.txt"))
//     //   .toString()
//     //   .split("\n");  
    
  
//   var modInstallArray = Array<string>();
//   modFile === undefined || modFile === null ? null : modInstallArray = modFile.toString().split("\n");
    
//   // Populate arrays from source
//   modInstallArray.forEach((v, i) => {
//     if (v === ""){ return }

//     // This is actually unused, see below
//     let modConfig = v.split(/\s+/)
//       steamcmdMods[i] = `+workshop_download_item 380870 ${modConfig[0]}`      
//       workshopIDArray.push(`${modConfig[0]}`)
//       modsNamesArray.push(`${modConfig[1]}`)
//     });

//     // Open .ini file, put mods in correct places
//     var iniFileTemplate = fs
//       .readFileSync(path.join(__dirname, "..", "..", "assets", "adventurebrave_template.ini"))
//       .toString()
//       .split("\n"); 
//     iniFileTemplate.pop() // this will be empty stupid format on save
    
//     // Fill in mod config for server
//     iniFileTemplate.forEach((v, i) => {
//       v === "Mods=" ? iniFileTemplate[i] = `Mods=${modsNamesArray.join(";")}` : null ;
//       v === "WorkshopItems=" ? iniFileTemplate[i] = `WorkshopItems=${workshopIDArray.join(";")}` : null ;
//     });

//     // Write "real" .ini file
//     var file = fs.createWriteStream('./assets/server-config/adventurebrave.ini');
//     file.on('error', (err) => { console.log(`error writing file: ${err}`) });
//     iniFileTemplate.forEach((v) => {  file.write(`${v}\n`)});
//     file.end();

//     // Print result if I want to look it over
//     // console.log(workshopIDArray)
//     // console.log(modsNamesArray)


//     // Install steam commands
//     // You can ask the steamcmd container to dl workshop items (compiled into
//     // steamcmdMods variable), but you need to login, took awhile to figure 
//     // this out the the feature exists I just don't use it, the following 
//     // will used the compiled mods config to provide steamcmd with the right args:
//     // ${steamcmdMods.join(' ')} \
//     let installCommands: string[] = [
//       `echo "---- Install PZ"`,
//       `mkdir /home/steam/pz`,
//       `docker run -v /home/steam/pz:/data steamcmd/steamcmd:ubuntu-18 \
//       +login anonymous \
//       +force_install_dir /data \
//       +app_update 380870 validate \
//       +quit`
//     ]

//     // Object to hold future UserData
//     multipartUserData.addCommands(...installCommands);

//     // Zip up config directory, I know this will zip because I am using the
//     // folder as my `localFile`
//     multipartUserData.addS3DownloadCommand({
//       bucket: configAssets.bucket,
//       bucketKey: configAssets.s3ObjectKey,
//       localFile: "/home/steam/files/",
//     });

//     // This will be a single object because it is a filename
//     multipartUserData.addS3DownloadCommand({
//       bucket: unitFileAsset.bucket,
//       bucketKey: unitFileAsset.s3ObjectKey,
//       localFile: "/etc/systemd/system/projectzomboid.service",
//     });

//     // Place, enable, and start the service
//     multipartUserData.addCommands(
//       `mkdir -p /home/steam/pz/Server/`, // Just in case
//       `unzip /home/steam/files/${configAssets.s3ObjectKey} -d /home/steam/pz/Server/`,
//       `chmod +x /etc/systemd/system/projectzomboid.service`,
//       `systemctl enable projectzomboid.service`,
//       `systemctl start projectzomboid.service`,
//     );


//   return {
//     steamcmdMods,
//     modsNamesArray,
//     workshopIDArray
//   }

// } 
//     // 
//     // Begin build server
//     // 
//     // Start compile config
//     // I would actually do this as a seperate container but I was interested
//     // in writing some code direct into the cdk file
//     // let steamcmdMods = Array<string>();
//     // let modsNamesArray = Array<string>();
//     // let workshopIDArray = Array<string>();

    
const ftp = require("basic-ftp");
const path = require("path");
const fs = require("fs");
const helper = require("./helper")


const ftpConfig = {
    host: helper.config("ftpHostPrimary"),
    user: helper.config("ftpDefaultUser"),
    password: helper.config("ftpDefaultPass"),
    port: 21,
    secure: false,
};

module.exports = {
    async upload(fileSrc, localDir, ftpDir){
        const client = new ftp.Client();
        client.ftp.verbose = false;
        try {
            await client.access(ftpConfig);

            const remotePath = helper.config("ftpDefaultDir")+ftpDir;
            const localSrc = path.resolve(localDir, fileSrc);

            // const stats = fs.statSync(localSrc);
            // const fileSize = stats.size;
            // client.trackProgress(info => {
            //     const bytesTransferred = info.bytes;
            //     const percentage = ((bytesTransferred / fileSize) * 100).toFixed(2);
            //     console.log(`Procesess Uploading file ${fileSrc} : ${percentage}% (${bytesTransferred} / ${fileSize} bytes)`);
            //     // helper.sendInfo(`Procesess Uploading file ${fileSrc} : ${percentage}% (${bytesTransferred} / ${fileSize} bytes)`);
            // });

            await client.ensureDir(remotePath);
            await client.uploadFrom(localSrc, `${remotePath}/${fileSrc}`);
            client.close();
            // client.trackProgress();
            // await new Promise(resolve => client.close(resolve));
            return true;
        } catch (error) {
            client.close();
            // client.trackProgress();
            // await new Promise(resolve => client.close(resolve));
            // console.log(`Error upload file to FTP Server. (ErrorMessage : ${error})`);
            // helper.sendLogs(`Error upload file to FTP Server. (ErrorMessage : ${error})`, true);
            throw error;
        }
    },
    async download(fileSrc, localDir, ftpDir){
        try {
            const client = new ftp.Client();
            client.ftp.verbose = false;
            await client.access(ftpConfig);

            const remoteSrc = helper.config("ftpDefaultDir")+ftpDir+"/"+fileSrc;
            const localSave = path.resolve(localDir, fileSrc);
            await helper.createPath(localDir);

            // const remoteFiles = await client.list(helper.config("ftpDefaultDir") + ftpDir);
            // const fileInfo = remoteFiles.find(f => f.name === fileSrc);
            // const fileSize = fileInfo ? fileInfo.size : 0;

            // client.trackProgress(info => {
            //     if (fileSize > 0) {
            //         const percentage = ((info.bytes / fileSize) * 100).toFixed(2);
            //         // console.log(`Downloading: ${percentage}%`);
            //         helper.sendInfo(`Procesess Downloading file ${fileSrc} : ${percentage}%`);
            //     }
            // });

            await client.downloadTo(localSave, remoteSrc);
            client.close();
            // client.trackProgress();
            // await new Promise(resolve => client.close(resolve));
            
            return true;
        } catch (error) {
            client.close();
            // client.trackProgress();
            helper.sendLogs(`Error download file to FTP Server. (ErrorMessage : ${error})`, true);
            throw error
        }
    }
}
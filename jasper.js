const fs = require("fs");
const path = require("path");
const { exec } = require('child_process');

module.exports = {
    async run({
        username = String,
        password = String,
        jdbc_driver = String,
        jdbc_url = String,
        paramters = [],
        jasper = String,
        output = String,
        filename = String,
        format = String
    }) {
        return new Promise(async (resolve, reject) => {
            const jasperstarter = path.join(__dirname, "./lib/jasperstarter/bin/jasperstarter");
            const jdbc_dir = path.join(__dirname, "./lib/jasperstarter/jdbc")
            const outputPath = output + "\\" + filename;
    
            let params = "";
            if (paramters.length > 0) {
                paramters.forEach((pr) => {
                    Object.entries(pr).forEach(([key, value]) => {
                        params += ` ${key}="${value}"`
                    });
                });
            }
            
            const command = `${jasperstarter} pr "${jasper}" -o "${outputPath}" -f "${format}" -t generic --db-url "${jdbc_url}" --db-driver "${jdbc_driver}" -u "${username}" -p "${password}" --jdbc-dir "${jdbc_dir}" ${params.length > 0 ? '-P '+params : ''}`;

            exec(command, (error, stdout, stderr) => {
                if(error){
                    reject({
                        message: `Failed to create a ${format} file from jasper.`,
                        error: error.message
                    });
                }else{
                    resolve({
                        message: `Successfully created a ${format} file from jasper.`,
                        fileName: `${filename}.${format}`,
                        pathReport: output, 
                    })
                }
            })
        });
    }
}
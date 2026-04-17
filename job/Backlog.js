const fs = require("fs");
const path = require("path");
const moment = require("moment");

const {oracledb, getConnect, replaceParam} = require("../dbase");
const helper = require("../helper");
const ExcelApp = require("../ExcelApp");
const ftp = require("../ftp")
const mail = require("../mail")
const logger = require("../logger");

async function backlog() {
    try {
        
        const wms = await getConnect("wms");
        const dcs = ["104","108","110","105","106"];

        const pathReport = path.resolve(__dirname, helper.config("pathReport"), "Backlog");
        await helper.createPath(pathReport);
        const excelData = [];

        for(const dc of dcs){
            let querySQL = helper.getSql("report", "rpt_backlog.sql");
            querySQL = replaceParam(querySQL, "PARAMS", `AND od.O_FACILITY_ALIAS_ID in('${dc}')`)
            const {rows: data} = await wms.execute(querySQL);
            
            if(data.length > 0){
                excelData.push({sheetName: dc, data: data})
            }
        }

        if(excelData.length > 0){
            const fileName = `Backlog ${moment(new Date()).format("DD-MMM-YYYY")}.xlsx`;
            const xlsx = await ExcelApp.xlsx(pathReport, fileName, excelData);
            if(Object.hasOwn(xlsx, "pathReport")){  
                await ftp.upload(xlsx.fileName, xlsx.pathReport, "/Backlog")   
                helper.sendLogs(`Report ${fileName}, Successfully.`, true)
            }
        }
        
        await wms.close();
        helper.standBy();
    } catch (error) {
        logger.error(`Report Backlog error => ${error.message}`)
        throw error;
    }
    
}

module.exports = {
    backlog
}
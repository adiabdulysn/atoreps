const fs = require("fs");
const path = require("path");
const moment = require("moment");

const {oracledb, getConnect, replaceParam} = require("../dbase");
const helper = require("../helper");
const ExcelApp = require("../ExcelApp");
const ftp = require("../ftp")
const mail = require("../mail")
const logger = require("../logger");

async function reportEventID(){
    try {
        const wms = await getConnect("wms");

        const sheets = ["104", "110", "108"];
        const attachments = [];

        for(const sh of sheets)
        {

            let queryStm = helper.getSql("report", "wms_stm_event_id.sql");
            let queryPo = helper.getSql("report", "wms_po_event_id.sql");
            queryStm = replaceParam(queryStm, 'DC_CODE', sh);
            queryPo = replaceParam(queryPo, 'DC_CODE', sh);
            const {rows: rowStm} = await wms.execute(queryStm);
            const {rows: rowPo} = await wms.execute(queryPo);
            let excelData = [];
            if(rowStm.length > 0){
                excelData.push({ sheetName: "STM",data: rowStm})
            }
            if(rowPo.length > 0){
                excelData.push({ sheetName: "PO",data: rowPo})
            }
            if(excelData.length > 0){
                const pathReport = path.resolve(__dirname, helper.config("pathReport"), "Event ID");
                const fileName = `${sh}_Event ID ${moment(new Date()).format("DD-MMM-YY")}.xlsx`;
                await helper.createPath(pathReport);
                const xlsx = await ExcelApp.xlsx(pathReport, fileName, excelData);
                if(Object.hasOwn(xlsx, "pathReport")){ 
                    await ftp.upload(xlsx.fileName, xlsx.pathReport, "/Event ID")           
                    attachments.push({
                        filename: xlsx.fileName,
                        fullPath: path.resolve(xlsx.pathReport, xlsx.fileName),
                        pathReport: xlsx.pathReport
                    })
                    excelData=[];
                }
            }
        }

        await wms.close();

        if(attachments.length > 0){
            await mail.send({
                to: "ANALYST.REBUYING@HYPERMART.CO.ID, aridi@hypermart.co.id, nurma.susilawati@hypermart.co.id, regina.rumahorbo@hypermart.co.id, muhammad.danial@hypermart.co.id, yedi.suryadiningrat@hypermart.co.id, astrianto@hypermart.co.id, grocery.food.pool.order@hypermart.co.id, nana.maulana@hypermart.co.id, aep.saepudin@hypermart.co.id, bambang.krismanto@hypermart.co.id, hendry.susanto@hypermart.co.id, sunarti@hypermart.co.id, indit.yulianto@hypermart.co.id, zulkarnaen.dc.mfb@hypermart.co.id, rebuyer.dc.balaraja@hypermart.co.id, CONSOLIDATOR.STM.DC.BALARAJA@HYPERMART.CO.ID, SUYANTO.MFB@HYPERMART.CO.ID, rebuyer.supervisor.2.omic@hypermart.co.id, rebuyer.supervisor.1.omic@hypermart.co.id, consolidator.xdok@hypermart.co.id, rebuyer.dc.fresh.porong@hypermart.co.id, consolidator.dcsurabaya@hypermart.co.id, rebuyer.dc.surabaya@hypermart.co.id, rebuyer.dc.fresh@hypermart.co.id, consolidator.stm.dccibitung@hypermart.co.id",
                cc: "setiyadi@hypermart.co.id",
                subject: `Event ID ${moment(new Date()).format("DD-MMM-YY")}`,
                message: `<p>
                    Dear All, <br><br>
                    Berikut Report Event ID ${moment(new Date()).format("DD-MMM-YY")}.<br>
                    File dapat di akses/unduh alamat di bawah ini.<br>
                    File Sharing : ${helper.config("ftpDefaultDir")}/Event ID<br>
                </p>`
            });
            helper.sendLogs(`Report Event ID ${moment(new Date()).format("DD-MMM-YY")}, Successfully.`, true)
            helper.standBy();
        }
    } catch (error) {
        logger.error(error);
    }
}

module.exports={
    reportEventID
}
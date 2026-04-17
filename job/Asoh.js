const fs = require("fs");
const path = require("path");
const moment = require("moment");

const {oracledb, getConnect, replaceParam} = require("../dbase");
const helper = require("../helper");
const ExcelApp = require("../ExcelApp");
const ftp = require("../ftp")
const mail = require("../mail")
const logger = require("../logger");

async function AsohLL() {
    try {
        let querySQL = helper.getSql("report", "rpt_asoh_ll.sql");
        const wms = await getConnect("wms");
        const {rows: data} = await wms.execute(querySQL);
        const excelData = [];

        const pathReport = path.resolve(__dirname, helper.config("pathReport"), "ASOH");
        await helper.createPath(pathReport);

        if(data.length > 0){
            excelData.push({sheetName: "ASOH LL", data: data})
            const fileName = `Asoh DC LL ${moment(new Date()).format("DD-MMM-YYYY")}.xlsx`;
            const xlsx = await ExcelApp.xlsx(pathReport, fileName, excelData);
            if(Object.hasOwn(xlsx, "pathReport")){  
                await mail.send({
                    to: "s1.msm.151@hypermart.co.id, s1.msm.172@hypermart.co.id, s1.msm.178@hypermart.co.id, s1.msm.182@hypermart.co.id, s1.msm.642@hypermart.co.id, s1.msm.644@hypermart.co.id, s1.msm.650@hypermart.co.id, s1.msm.135@hypermart.co.id",
                    cc: "spv.dc.hl.timika@hypermart.co.id, spv.dc.ll.timika@hypermart.co.id, eric.syah@hypermart.co.id, eric.syah@hypermart.co.id, buyer.timika@hypermart.co.id, herman.susanto@hypermart.co.id, achmad.muhajir@hypermart.co.id, rahman.yuliansyah@hypermart.co.id, hendra.kurnia@hypermart.co.id, irvan.fitriadi@hypermart.co.id, saepullah@hypermart.co.id, asst.foodmart.644@hypermart.co.id, asst.foodmart.642@hypermart.co.id",
                    subject: `${fileName.replace(/.xlsx/g, '')}`,
                    attachments: [{filename: xlsx.fileName, path: path.resolve(xlsx.pathReport, xlsx.fileName)}],
                    message: `<p>
                        Dear All, <br/><br/>
                        Berikut data ${fileName.replace(/.xlsx/g, '')}.<br/><br/>
                        File Sharing : ${helper.config("ftpDefaultDir")}/ASOH<br/>
                    </p>`
                })

                await ftp.upload(xlsx.fileName, xlsx.pathReport, "/ASOH")   
                helper.sendLogs(`Report ${fileName}, Successfully.`, true)
            }
        }
        await wms.close();
        helper.standBy();
    } catch (error) {
        logger.error(`Error ASOH LL (${error.message})`);
        throw error;
    }
}

async function AsohHL () {
    try {
        const wms = await getConnect("wms");
        const aisle = ["H", "T", "C"];
        const excelData = [];
        const excelDataFresh = [];

        for(const al of aisle){
            let dept;
            switch (al) {
                case "H":
                    dept = "Dray";
                    break;
                case "T":
                    dept = "Coklat";
                    break;
                case "C":
                    dept = "Fresh";
                    break;
            }

            let querySQL = helper.getSql("report", "rpt_asoh_hl.sql");
            querySQL = replaceParam(querySQL, "DEPT", dept);
            querySQL = replaceParam(querySQL, "AISLE", ` and substr(aisle,1,1) in('${al}')`);
            const {rows: data} = await wms.execute(querySQL);
            if(data.length > 0){
                excelData.push({sheetName: dept, data: data})
            }
            if(al==='C' && data.length > 0){
                excelDataFresh.push({sheetName: dept, data: data})
            }
        }
        const pathReport = path.resolve(__dirname, helper.config("pathReport"), "ASOH");
        await helper.createPath(pathReport);

        if(excelData.length > 0) {
            const fileName = `Asoh DC HL ${moment(new Date()).format("DD-MMM-YYYY")}.xlsx`;
            const xlsx = await ExcelApp.xlsx(pathReport, fileName, excelData);
            if(Object.hasOwn(xlsx, "pathReport")){  
                await mail.send({
                    to: "s1.msm.151@hypermart.co.id, s1.msm.172@hypermart.co.id, s1.msm.178@hypermart.co.id, s1.msm.182@hypermart.co.id, s1.msm.642@hypermart.co.id, s1.msm.644@hypermart.co.id, s1.msm.650@hypermart.co.id, s1.msm.135@hypermart.co.id",
                    cc: "spv.dc.hl.timika@hypermart.co.id, spv.dc.ll.timika@hypermart.co.id, eric.syah@hypermart.co.id, eric.syah@hypermart.co.id, buyer.timika@hypermart.co.id, herman.susanto@hypermart.co.id, achmad.muhajir@hypermart.co.id, rahman.yuliansyah@hypermart.co.id, hendra.kurnia@hypermart.co.id, irvan.fitriadi@hypermart.co.id, saepullah@hypermart.co.id, asst.foodmart.644@hypermart.co.id, asst.foodmart.642@hypermart.co.id; rebuyer.cross.dockmsm@hypermart.co.id; steffen.kekung@hypermart.co.id; suyanto.mfb@hypermart.co.id",
                    subject: `${fileName.replace(/.xlsx/g, '')}`,
                    attachments: [{filename: xlsx.fileName, path: path.resolve(xlsx.pathReport, xlsx.fileName)}],
                    message: `<p>
                        Dear All, <br/><br/>
                        Berikut data ${fileName.replace(/.xlsx/g, '')}.<br/><br/>
                        File Sharing : ${helper.config("ftpDefaultDir")}/ASOH<br/>
                    </p>`
                })

                await ftp.upload(xlsx.fileName, xlsx.pathReport, "/ASOH")   
                helper.sendLogs(`Report ${fileName}, Successfully.`, true)
            }
        }

        if(excelDataFresh.length > 0) {
            const fileName = `Asoh Fresh DC HL ${moment(new Date()).format("DD-MMM-YYYY")}.xlsx`;
            const xlsxFresh = await ExcelApp.xlsx(pathReport, fileName, excelDataFresh);
            if(Object.hasOwn(xlsxFresh, "pathReport")){  
                await mail.send({
                    to: "sisilya.telussa@hypermart.co.id, Tommy.Librawanto@hypermart.co.id, junaedi@hypermart.co.id, hari.istijan@hypermart.co.id, herman.susanto@hypermart.co.id, dc.timika@hypermart.co.id, buyer.timika@hypermart.co.id",
                    cc: "helpdesk.fresh.dc@hypermart.co.id, andrico@hypermart.co.id, irvan.fitriadi@hypermart.co.id, rahman.yuliansyah@hypermart.co.id",
                    subject: `${fileName.replace(/.xlsx/g, '')}`,
                    attachments: [{filename: xlsxFresh.fileName, path: path.resolve(xlsxFresh.pathReport, xlsxFresh.fileName)}],
                    message: `<p>
                        Dear All, <br/><br/>
                        Berikut data ${fileName.replace(/.xlsx/g, '')}.<br/><br/>
                        File Sharing : ${helper.config("ftpDefaultDir")}/ASOH<br/>
                    </p>`
                })
                await ftp.upload(xlsxFresh.fileName, xlsxFresh.pathReport, "/ASOH") 
                helper.sendLogs(`Report ${fileName}, Successfully.`, true)
            }
        }

        await wms.close();
        helper.standBy();

    } catch (error) {
        logger.error(`Error ASOH HL (${error.message})`);
        throw error;
    }
}

async function AsohSupplierPng() {
    try {
        let querySQL = helper.getSql("report", "rpt_asoh_supplier_png.sql");
        const rms = await getConnect("rms");
        const {rows: data} = await rms.execute(querySQL);

        const excelData = [];
        const pathReport = path.resolve(__dirname, helper.config("pathReport"), "ASOH");
        await helper.createPath(pathReport);

        if(data.length > 0){
            excelData.push({sheetName: "Data", data: data})
            const fileName = `Asoh PNG ${moment(new Date()).format("DD-MMM-YYYY")}.xlsx`;
            const xlsx = await ExcelApp.xlsx(pathReport, fileName, excelData);
            if(Object.hasOwn(xlsx, "pathReport")){  
                await mail.send({
                    to: "indrawan.i@pg.com, latief.vs@pg.com, sujoyono.o@pg.com,  putrilestari.a@pg.com, winarni.t@pg.com, fujiana.ff@pg.com",
                    cc: "setiyadi@hypermart.co.id, ANALYST.REBUYING@HYPERMART.CO.ID, julia.nency@hypermart.co.id, m.nono.s@hypermart.co.id, steffen.kekung@hypermart.co.id, aridi@hypermart.co.id, SUYANTO.MFB@HYPERMART.CO.ID, rebuyer.supervisor.1.omic@hypermart.co.id, consolidator.xdok@hypermart.co.id, sunarti@hypermart.co.id; suyanto.mfb@hypermart.co.id",
                    subject: `${fileName.replace(/.xlsx/g, '')}`,
                    attachments: [{filename: xlsx.fileName, path: path.resolve(xlsx.pathReport, xlsx.fileName)}],
                    message: `<p>
                        Dear All, <br/><br/>
                        Berikut data ${fileName.replace(/.xlsx/g, '')}.<br/><br/>
                        File Sharing : ${helper.config("ftpDefaultDir")}/ASOH<br/>
                    </p>`
                })

                await ftp.upload(xlsx.fileName, xlsx.pathReport, "/ASOH")   
                helper.sendLogs(`Report ${fileName}, Successfully.`, true)
            }
        }
        await rms.close();
        helper.standBy();

    } catch (error) {
        logger.error(`Error ASOH PNG (${error.message})`);
        throw error;
    }
}


module.exports={
    AsohLL,
    AsohHL,
    AsohSupplierPng
}
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const helper = require("../../helper");
const ExcelApp = require("../../ExcelApp");
const mail = require("../../mail"); 
const ftp = require("../../ftp")
const logger = require("../../logger");

const {uploadMultiple, getConnect, replaceParam} = require("../../dbase");


async function BastCibitung(){
    try {
        await uploadMultiple({
            dbSrc: "tms_prod",
            sqlSrc: "ul_bast_source.sql",
            dbDest: "dccib",
            sqlDest: "ul_bast_destination.sql",
            sqlPath: "cib",
            tableDest: "BAP_DETAIL_TEMP",
            fetchSize: 150,
            uploadName: "BAP DC Cibitung",
            onProgress: (data) => {
                const percentage = (data.totalInsert / data.totalData) * 100;
                helper.sendInfo(`Procesess upload BAP DC Cibitung : ${percentage.toFixed(2)}% (${data.totalInsert} / ${data.totalData})`);
            },
            onComplete: ({success, message, error}) => {
                helper.sendLogs(message, true)
                helper.standBy();
            }
        });
        
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function  StuffingCargoTimika() {
    try {
        let querySql = helper.getSql("cib", "rpt_suffing_cargo.sql");
        const connect = await getConnect("wms");
        const {rows: result} = await connect.execute(querySql);
        if(result.length > 0){

            const excelData=[{
                sheetName: "Data",
                data: result
            }]

            const pathReport = path.join(helper.config("pathReport"), "Stuffing Cargo");
            const excelFileName = `CIB DETAIL STUFFING CARGO TIMIKA_${moment(new Date()).add(-1, "days").format("DD-MMM-YY")}.xlsx`
            helper.createPath(pathReport);
            const xlsx = await ExcelApp.xlsx(pathReport, excelFileName, excelData);
            
            if(Object.hasOwn(xlsx, "pathReport")){
                await ftp.upload(xlsx.fileName, xlsx.pathReport, "/Stuffing Cargo")
                await mail.send({
                    // to: "helpdesk.fresh.dc@hypermart.co.id",
                    to: "staff.project.ops@hypermart.co.id, spv.operasional.fdc@hypermart.co.id, eko.purwanto@hypermart.co.id, syamsul.nurdin@hypermart.co.id",
                    cc: "helpdesk.fresh.dc@hypermart.co.id, andrico@hypermart.co.id",
                    subject: `DETAIL STUFFING CARGO TIMIKA_${moment(new Date()).add(-1, "days").format("DD-MMM-YY")}`,
                    attachments:[
                        {
                            filename: xlsx.fileName,
                            path: path.join(xlsx.pathReport, xlsx.fileName)
                        }
                    ],
                    message: `<p>
                        Dear All, <br><br>
                        Berikut data Stuffing Cargo Timika ${moment(new Date()).add(-1, "days").format("DD-MMM-YY")}
                    </p>`
                })
                helper.sendLogs(`Report ${excelFileName}, Successfully.`, true)
                helper.standBy();
            }
        }
    } catch (error) {
        logger.error(error);
        throw error;
    }
}
async function PoXdockUnproccess() {
    try {
        let periodStart = moment(new Date()).add(-7, "days").format("DD-MMM-YY");
        let periodEnd = moment(new Date()).add(-1, "days").format("DD-MMM-YY");
        let querySql = helper.getSql("cib", "rpt_po_xdock_unprocess.sql");
        querySql = querySql.replace(/{{DEPT_CDOE}}/g, "AND SUBSTR(OLI.ITEM_NAME, 1, 2) IN ('96')");
        querySql = querySql.replace(/{{VERIFY_DTTM}}/g, `AND TO_CHAR(A.VERIFIED_DTTM, 'DD-Mon-YYYY') BETWEEN '${periodStart}' AND '${periodEnd}'`);

        const connect = await getConnect("wms");
        const {rows: result} = await connect.execute(querySql);
        if(result.length > 0){

            const excelData=[{
                sheetName: "Data",
                data: result
            }]

            const pathReport = path.join(helper.config("pathReport"), "PO Xdock UnProcess");
            const excelFileName = `PO Xdock UnProcess_${periodStart} - ${periodEnd}.xlsx`
            helper.createPath(pathReport);
            const xlsx = await ExcelApp.xlsx(pathReport, excelFileName, excelData);
            
            if(Object.hasOwn(xlsx, "pathReport")){
                await ftp.upload(xlsx.fileName, xlsx.pathReport, "/PO Xdock UnProcess")
                await mail.send({
                    to: "darus.primanto@hypermart.co.id, irvan.fitriadi@hypermart.co.id, qc.fresh.hpm@hypermart.co.id",
                    cc: "helpdesk.fresh.dc@hypermart.co.id, andrico@hypermart.co.id",
                    subject: excelFileName.replace(/.xlsx/g, ''),
                    attachments:[
                        {
                            filename: xlsx.fileName,
                            path: path.join(xlsx.pathReport, xlsx.fileName)
                        }
                    ],
                    message: `<p>
                        Dear All, <br><br>
                        Berikut data ${excelFileName.replace(/.xlsx/g, '')}
                    </p>`
                })
                // helper.sendLogs(`Report ${excelFileName}, Successfully.`, true)
                // helper.standBy();
            }
        }
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function VesselTimika(){
    try {
        const querySJ = `SELECT TC_SHIPMENT_ID SJ
                        FROM SHIPMENT
                        WHERE O_FACILITY_ID ='108'
                        AND SHIPMENT_STATUS = '80'
                        AND ASSIGNED_SHIP_VIA = 'VL06'
                        AND TRUNC(LAST_UPDATED_DTTM)=TRUNC(SYSDATE-1)`;
        let queryStuffing = helper.getSql("cib", "rpt_stuffing_with_pcs.sql");
        let queryBAP = helper.getSql("cib", "ul_bast_source.sql");
        let queryManifestVessel = helper.getSql("cib", "rpt_manifest_vessel.sql");
        const wms = await getConnect("wms");
        const {rows: shipment} = await wms.execute(querySJ);
        
        if(shipment.length > 0){
            
            const sj = `'${shipment.map(row => row['SJ']).join("','")}'`;
            queryManifestVessel = replaceParam(queryManifestVessel, "PARAMS", ` AND a.LOAD_NBR IN (${sj})`)
            queryStuffing = replaceParam(queryStuffing, "PARAMS", ` AND S.TC_SHIPMENT_ID IN (${sj})`)

            const dccib = await getConnect("dccib");
            const {rows: manifest} = await dccib.execute(queryManifestVessel);

            const tms = await getConnect("tms_prod");
            const [bap] = await tms.execute(`WITH bap AS (
                    ${queryBAP}
                    )
                    select WHSE,TRANSPORTER,TRUCK_TYPE,DRIVER_NAME,TRUCK_NBR,STORE,STORE_NAME,REGION,REQUEST_NUMBER,BAST_NUMBER,RESI_NUMBER,SJ_NUMBER,DC_SEAL_NUMBER,DC_SEAL_COLOR,CONTAINER_SEAL_NUMBER,CONTAINER_NUMBER,CHAMBER,TOTAL_CASES,TOTAL_WEIGHTS,TOTAL_VOLUMES,NOTE,INVOICE,BAST_DATETIME from bap where SJ_NUMBER in(${sj})
                `)
            const {rows: stuffing} = await wms.execute(queryStuffing);
            await wms.close();
            await dccib.close();
            await tms.close();

            const excelData = [];
            if(bap.length > 0){
                excelData.push({
                    sheetName: "BAP",
                    data: bap
                })
            }
            if(stuffing.length > 0){
                excelData.push({
                    sheetName: "Detail",
                    data: stuffing
                })
            }
            if(bap.length > 0){
                excelData.push({
                    sheetName: "Karantina",
                    data: manifest
                })
            }

            if(excelData.length > 0){
                const pathReport = path.join(helper.config("pathReport"), "Stuffing Vessel Timika");
                const excelFileName = `STUFFING VESSEL TIMIKA_${moment(new Date()).add(-1, "days").format("DD-MMM-YY")}.xlsx`
                helper.createPath(pathReport);
                const xlsx = await ExcelApp.xlsx(pathReport, excelFileName, excelData);
                
                if(Object.hasOwn(xlsx, "pathReport")){
                    await ftp.upload(xlsx.fileName, xlsx.pathReport, "/Stuffing Vessel Timika")
                    await mail.send({
                        to: "staff.project.ops@hypermart.co.id, eko.purwanto@hypermart.co.id, syamsul.nurdin@hypermart.co.id, candra.irawan@hypermart.co.id, irvan.fitriadi@hypermart.co.id",
                        cc: "andrico@hypermart.co.id, helpdesk.fresh.dc@hypermart.co.id",
                        subject: excelFileName.replace(/.xlsx/g, ''),
                        attachments:[
                            {
                                filename: xlsx.fileName,
                                path: path.join(xlsx.pathReport, xlsx.fileName)
                            }
                        ],
                        message: `<p>
                            Dear All, <br><br>
                            Berikut data ${excelFileName.replace(/.xlsx/g, '')}
                        </p>`
                    })
                    helper.sendLogs(`Report ${excelFileName}, Successfully.`, true)
                    helper.standBy();
                }
            }

        }

    } catch (error) {
        logger.error(error);
        throw error;
    }
}

/* === REPORT GM === */
async function Backlog() {
    try {
        let querySQL = helper.getSql("cib", "rpt_backlog.sql");
        const dccib = await getConnect("dccib");
        const {rows: backlog} = await dccib.execute(querySQL);
        await dccib.close();

        const pathReport = path.join(helper.config("pathReport"), "CIBITUNG");
        const excelFileName = `FDC BACKLOG_${moment(new Date()).add(-1, "days").format("DD-MMM-YY")}.xlsx`
        helper.createPath(pathReport);

        if(backlog.length > 0){
            const excelData = [{sheetName: "BACKLOG", data: backlog}]
            const xlsx = await ExcelApp.xlsx(pathReport, excelFileName, excelData);
            if(Object.hasOwn(xlsx, "pathReport")){
                helper.sendLogs(`Report ${excelFileName}, Successfully.`, true)
                helper.standBy();
            }
        }

    } catch (error) {
        logger.error(error);
        throw error;
    }
}
async function StmCancel() {
    try {
        let querySQL = helper.getSql("cib", "rpt_detail_stm_cancel.sql");
        const wms = await getConnect("wms");
        const {rows: data} = await wms.execute(querySQL);
        await wms.close();

        const pathReport = path.join(helper.config("pathReport"), "CIBITUNG");
        const excelFileName = `FDC STM CANCEL_${moment(new Date()).add(-1, "days").format("DD-MMM-YY")}.xlsx`
        helper.createPath(pathReport);

        if(data.length > 0){
            const excelData = [{sheetName: "STM CANCEL", data: data}]
            const xlsx = await ExcelApp.xlsx(pathReport, excelFileName, excelData);
            if(Object.hasOwn(xlsx, "pathReport")){
                helper.sendLogs(`Report ${excelFileName}, Successfully.`, true)
                helper.standBy();
            }
        }

    } catch (error) {
        logger.error(error);
        throw error;
    }
}
async function ThroughputWms() {
    try {
        let querySQL = helper.getSql("cib", "rpt_throughput_wms.sql");
        const dccib = await getConnect("dccib");
        const {rows: data} = await dccib.execute(querySQL);
        await dccib.close();

        const pathReport = path.join(helper.config("pathReport"), "CIBITUNG");
        const excelFileName = `FDC THROUGHPUT_${moment(new Date()).add(-1, "days").format("DD-MMM-YY")}.xlsx`
        helper.createPath(pathReport);

        if(data.length > 0){
            const excelData = [{sheetName: "THROUGHPUT", data: data}]
            const xlsx = await ExcelApp.xlsx(pathReport, excelFileName, excelData);
            if(Object.hasOwn(xlsx, "pathReport")){
                helper.sendLogs(`Report ${excelFileName}, Successfully.`, true)
                helper.standBy();
            }
        }

    } catch (error) {
        logger.error(error);
        throw error;
    }
}
async function StmIncoming() {
    try {
        let querySQL = helper.getSql("cib", "rpt_stm_incoming.sql");
        const dccib = await getConnect("dccib");
        const {rows: data} = await dccib.execute(querySQL);
        await dccib.close();

        const pathReport = path.join(helper.config("pathReport"), "CIBITUNG");
        const excelFileName = `FDC STM INCOMING_${moment(new Date()).add(-1, "days").format("DD-MMM-YY")}.xlsx`
        helper.createPath(pathReport);

        if(data.length > 0){
            const excelData = [{sheetName: "STM INCOMING", data: data}]
            const xlsx = await ExcelApp.xlsx(pathReport, excelFileName, excelData);
            if(Object.hasOwn(xlsx, "pathReport")){
                helper.sendLogs(`Report ${excelFileName}, Successfully.`, true)
                helper.standBy();
            }
        }

    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function RunBacklogGM(){
    try {

        await StmCancel();
        await ThroughputWms();
        await StmIncoming();

        const reportDate = moment(new Date()).add(-1, "days").format("DD-MMM-YY");
        const reportPath = path.join(helper.config("pathReport"), "CIBITUNG");
        const reportFile = [`FDC BACKLOG_${reportDate}.xlsx`, `FDC THROUGHPUT_${reportDate}.xlsx`, `FDC STM CANCEL_${reportDate}.xlsx`, `FDC STM INCOMING_${reportDate}.xlsx`];

        const attachments = [];
        for(const rf of reportFile){
            if (fs.existsSync(path.resolve(`${reportPath}/${rf}`))) { 
                attachments.push({
                    filename: rf,
                    path: path.resolve(`${reportPath}/${rf}`)
                })
            }
        }
        if(attachments.length > 0){
            await mail.send({
                to: "rahman.yuliansyah@hypermart.co.id, irvan.fitriadi@hypermart.co.id",
                cc: "andrico@hypermart.co.id, helpdesk.fresh.dc@hypermart.co.id",
                subject: `FDC (BACKLOG, THROUGHPUT, STM CANCEL, STM INCOMMING) ${reportDate}`,
                attachments:attachments,
                message: `<p>
                    Dengan Hormat, <br><br>
                    Berikut Report FDC <i>(BACKLOG, THROUGHPUT, STM CANCEL, STM INCOMMING)</i> ${reportDate}
                </p>`
            })
            helper.sendLogs(`Send Email Report FDC (BACKLOG, THROUGHPUT, STM CANCEL, STM INCOMMING) ${reportDate}, Successfully.`, true)
            helper.standBy();
        }

    } catch (error) {
        logger.error(error);
        throw error;
    }
}
/* === END REPORT GM === */

module.exports = {
    BastCibitung,
    StuffingCargoTimika,
    PoXdockUnproccess,
    VesselTimika,
    Backlog,
    RunBacklogGM
}
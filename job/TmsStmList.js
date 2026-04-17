const fs = require("fs");
const path = require("path");
const moment = require("moment");

const { oracledb, getConnect, replaceParam } = require("../dbase");
const helper = require("../helper");
const ftp = require("../ftp");
const mail = require("../mail");
const Jasper = require("../jasper");
const logger = require("../logger");

let attachments = [];

async function generetedStmList(file_name, tc_shipment_id, data, outputStm){
    let jasperFile = "";
    let parameters =[];

    await helper.createPath(outputStm);

    const sj_number = tc_shipment_id.includes(",") ? tc_shipment_id.replace(/,/g, "','") : tc_shipment_id;
    if(data.dc_code=="108"){
        parameters.push({ TC_SHIPMENT_ID: `AND ol.TC_SHIPMENT_ID IN('${sj_number}')` });
        jasperFile = path.join(__dirname, "./../jasper/StmListNew.jrxml");
    }else{
        parameters.push({ a_tc_shipment_id: `and a.tc_shipment_id in('${sj_number}')` });
        if (data.facility_code == "88") {
            jasperFile = path.join(__dirname, "./../jasper/Distro_Detail_88.jrxml");
          } else {
            jasperFile = path.join(__dirname, "./../jasper/Distro_Detail.jrxml");
        }
    }

    helper.sendLogs("Genereted File STM List...", true);

    await Jasper.run({
        username: "MATHWMPROD_RO",
        password: "C651qi_5#Pcd_q",
        jdbc_driver: "oracle.jdbc.driver.OracleDriver",
        jdbc_url: "jdbc:oracle:thin:@//172.24.129.167:1521/MATHPDB.DB",
        paramters: parameters,
        jasper: jasperFile,
        output: outputStm,
        filename: "STM_"+file_name,
        format: "pdf",
    }).then(async (response) => {
        attachments.push({
          filename: response.fileName,
          path: path.resolve(response.pathReport, response.fileName)
        });
        if(data.dc_code== "104"){
          await generetedSpStore(sj_number, data.dc_code, outputStm, data);
        }
        helper.sendLogs(`Genereted File STM List for store : ${data.facility_code} - ${data.facility_name} successfully!`, true);
        await sendMailSTM(data);
    }).catch((error) => {
      helper.sendLogs(`Genereted File STM List error => ${JSON.stringify(error)})`, true);
      logger.error("[TMS] Genereted File Jasper STM List error => "+JSON.stringify(error));
    });
}

async function generetedSpStore(sj_number, dc_code, outputStm, data){
  try{
    const wms = await getConnect("wms");
    const {rows: pharmacy} = await wms.execute(`SELECT ol.TC_SHIPMENT_ID "shipment_number",ol.FINAL_DEST_FACILITY_ALIAS_ID "store_code", ol.C_FACILITY_ALIAS_ID "dc_code"  FROM OUTPT_LPN ol 
                        JOIN OUTPT_LPN_DETAIL old ON ol.INVC_BATCH_NBR = old.INVC_BATCH_NBR 
                        JOIN item_cbo ic ON old.item_id = ic.item_id 
                        JOIN item_facility_mapping_wms ifmw ON old.item_id = ifmw.item_id
                        WHERE ol.TC_SHIPMENT_ID IN('${sj_number}')
                        and substr(ic.ITEM_NAME,1,2) IN('68','35')
                        AND ifmw.PICK_LOCN_ASSIGN_TYPE in ('DPL','DPS','DOL','DOS','DON','LOL','LOS','ABS','AKB','AKD','AKL','AKN','AKS','AKZ','AKA','DTL','DTS','DGL','DGS','DKL','LKZ','DKS','LKL','DNL','DNS','LNL','LNS','LNZ')
                        GROUP BY ol.TC_SHIPMENT_ID,ol.FINAL_DEST_FACILITY_ALIAS_ID,ol.C_FACILITY_ALIAS_ID`);

    if(pharmacy.length > 0){
      const fileSpName = "SP_"+dc_code+"_"+data.facility_code+"_"+pharmacy.map(item => item.shipment_number).join("-");
      const paramsSP = pharmacy.map(item => item.shipment_number).join("','");
      const jasperFile = path.join(__dirname, "./../jasper/sp_toko_new.jrxml");

      helper.sendLogs("Genereted File SP Pharmacy...", true);
      await Jasper.run({
          username: "MATHWMPROD_RO",
          password: "C651qi_5#Pcd_q",
          jdbc_driver: "oracle.jdbc.driver.OracleDriver",
          jdbc_url: "jdbc:oracle:thin:@//172.24.129.167:1521/MATHPDB.DB",
          paramters: [
              { a_tc_shipment_id: `and a.tc_shipment_id in('${paramsSP}')` }
          ],
          jasper: jasperFile,
          output: outputStm,
          filename: fileSpName,
          format: "pdf"
      }).then((response) => {          
        attachments.push({
            filename: response.fileName,
            path: path.resolve(response.pathReport, response.fileName)
        });
        helper.sendLogs(`Genereted File SP Pharmacy for store : ${pharmacy[0].store_code} successfully!`, true);
    }).catch((error) => {
      helper.sendLogs(`Genereted File SP Pharmacy error => ${JSON.stringify(error)}`, true);
      logger.error("[TMS]Genereted File SP Pharmacy error => "+JSON.stringify(error));
    });
  }

  }catch(error){
    helper.sendLogs(`Genereted File SP Pharmacy error => ${error.message}`, true);
    logger.error("[TMS] Genereted File SP Pharmacy error => "+error.message);
    throw error;
  }
}

async function sendMailSTM(data){
  try{
    if(attachments.length > 0){

      const fileSP = attachments.find(item => item.filename.startsWith("SP_")) ? true : false;
        
      const style = `<style>
                .table {
                    border-collapse: collapse;
                    color: #000;
                    font-family: Calibri, sans-serif; 
                    font-size: 14px;
                 }
                 .table tr td {
                    border: 1px solid #fff;
                    padding: 3px;
                    color: #000;
                    font-family: Calibri, sans-serif; 
                    font-size: 14px;
                 }
                </style>`;
      let table = `${style}
            <table class="table">
                <tr>
                    <td>From</td>
                    <td>: ${data.dc_name}</td>
                </tr>
                <tr>
                    <td style="width: 120px;">Shipment Date</td>
                    <td>: ${data.scan_bast_ddtm}</td>
                </tr>
                <tr>
                    <td>Shipment Number</td>
                    <td>: ${data.shipment_number}</td>
                </tr>
                <tr>
                    <td>BAST Number</td>
                    <td>: ${data.bast_number}</td>
                </tr>
                <tr>
                    <td>Total Cases</td>
                    <td>: ${data.total_cases}</td>
                </tr>
                <tr>
                    <td>Driver Name</td>
                    <td>: ${data.driver}</td>
                </tr>
                <tr>
                    <td>Plate Number</td>
                    <td>: ${data.plate_number}</td>
                </tr>`;
          if(data.container_number!==null){
              table +=`<tr>
              <td>Container Number</td>
              <td>: ${data.container_number}</td>
              </tr>`;
              
          }
          if (data.driver_phone_number !== null) {
              table +=`<tr>
              <td>Phone Number</td>
              <td>: ${data.driver_phone_number}</td>
              </tr>`;
          }
          if (data.email_transporter !== null) {
              table +=`<tr>
              <td>Email Transporter</td>
              <td>: ${data.email_transporter}</td>
              </tr>`;
          }
      table += `</table><br/>`;

      let spMessage = "";
      if(fileSP){
        spMessage += `
        <p>File Sharing (SP PHARMACY) : <b>//File_Sharing/DC_Balaraja/${helper.config("ftpDefaultDir")}/STM List/SP PHARMACY/${data.facility_code}</b>.</p><br>
        <p>Untuk File (SP PHARMACY) mohon untuk di Tanda Tangan dan Stempel,</p>
        <p>Jika sudah mohon untuk di Scan dan Upload ke alamat (File Sharing : <b>//File_Sharing/DC_Balaraja/${helper.config("ftpDefaultDir")}/STM List/SP Toko (sudah ttd PJO)/${data.facility_code}</b>).</p>
        <p><i>(Untuk kategori non obat tidak perlu di scan).</i>.</p><br>`
      }

      helper.sendLogs("Sending Email STM List...", true);
      const mailResult = await mail.send({
        account: "tms_admin",
        to: data.email_to,
        cc: data.email_cc,
        subject: `Informasi Pengiriman Barang ${data.dc_name}`,
        attachments: attachments,
        message: `<p>
            Dear All, <br/><br/>
            Kami infromasikan akan ada pengiriman ke <b>${data.facility_code} - ${data.facility_name}</b>.<br/><br/>
            ${table}
            Report STM List dapat di akses/unduh alamat di bawah ini.<br>
            File Sharing : <b>/${helper.config("ftpDefaultDir")}/STM List/${data.facility_code}</b><br>
            ${spMessage}
        </p>`,
      });

      if(mailResult){
        const tms = await getConnect("tms_prod");
        await tms.execute(`update request_stops set send_email_ba = 1 where request_stop_id = '${data.request_stop_id}'`);
        await tms.close();

        helper.sendLogs(`Email STM List for ${data.facility_code} - ${data.facility_name} sent successfully!`, true);
      }
      
      
      for(const att of attachments){
        helper.sendLogs(`Uploading file ${att.filename} to FTP...`, true);
        if(att.filename.startsWith("SP_")){
          await ftp.upload(att.filename, att.path.replace(`${att.filename}`, ""), `/STM List/SP PHARMACY/${data.facility_code}`);
        }else{
          await ftp.upload(att.filename, att.path.replace(`${att.filename}`, ""), `/STM List/${data.facility_code}`);
        }
      }
      helper.sendLogs(`All file uploaded to FTP successfully!`, true);

      attachments = [];
      helper.sendLogs("All process for STM List done!", true);
      helper.standBy();
    }
  }catch(error){
    helper.standBy();
    logger.error(`[TMS] Run STM List error => ${error.message}`);
    throw error;
  }
}

async function Run() {
  try {
    const tms = await getConnect("tms_prod");
    const [bast] = await tms.execute(`select *
      from bast_store
      where length(shipment_number) > 0 
      and scan_bast_ddtm is not null and transporter_name not like '%TRANSHIPMENT%'
      and send_email_ba = 0
      limit 3
      `);

    let outputStm = path.resolve(__dirname, helper.config("pathReport"), "STM List");

    if(bast.length > 0){

      helper.sendInfo("STM List Running...");
      helper.sendLogs("STM List Running...", true);

      for(const ba of bast){

        // Cek BA Transhipment
        const [transhipment] = await tms.execute(`select * from bast_store_transhipment
          where length(shipment_number) > 0 
          and scan_bast_ddtm is not null 
          and send_email_ba = 0 
          and request_stop_id = '${ba.request_stop_id}' `)

        if(transhipment.length > 0){
          helper.sendLogs(`STM List for store : ${transhipment[0]["facility_code"]}`, true);

          const sj_file_format = transhipment[0]["shipment_number"].includes(",") ? transhipment[0]["shipment_number"].length > 200 ? transhipment[0]["shipment_number"].split(",").slice(0,4).join("-")+"-MORE SJ" : transhipment[0]["shipment_number"].replace(/,/g, "-") : transhipment[0]["shipment_number"];
          const file_name = transhipment[0]["dc_code"] + "_" + transhipment[0]["facility_code"] + "_" + sj_file_format;
          await generetedStmList(file_name, transhipment[0]["shipment_number"], transhipment[0], outputStm);
        }else{
          helper.sendLogs(`STM List for store : ${ba["facility_code"]}`, true);
          const sj_file_format = ba["shipment_number"].includes(",") ? ba["shipment_number"].length > 200 ? ba["shipment_number"].split(",").slice(0,4).join("-")+"-MORE SJ" : ba["shipment_number"].replace(/,/g, "-") : ba["shipment_number"];
          const file_name = ba["dc_code"] + "_" + ba["facility_code"] + "_" + sj_file_format;

          await generetedStmList(file_name, ba["shipment_number"], ba, outputStm);
        }
        
      }
    }
    await tms.close();
  } catch (error) {
    logger.error(`[TMS] STM List error (${error.message})`);
    throw error;
  }
}


module.exports = {
    Run,
};
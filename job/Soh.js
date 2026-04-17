const fs = require("fs");
const path = require("path");
const moment = require("moment");

const { oracledb, getConnect, replaceParam } = require("../dbase");
const helper = require("../helper");
const ExcelApp = require("../ExcelApp");
const ftp = require("../ftp");
const mail = require("../mail");
const logger = require("../logger");

async function Starlink() {
  try {
    // Buat Folder Report
    const pathReport = path.resolve(
      __dirname,
      helper.config("pathReport"),
      "SOH",
    );
    await helper.createPath(pathReport);

    // Buat Koneksi
    const wms = await getConnect("wms");
    const rms = await getConnect("rms");

    // Query SQL
    const sqlWms = `select FACILITY_ALIAS_ID "Dc"
                        ,FACILITY_NAME "Dc Name"
                        ,ic.item_name "Item"
                        ,ic.DESCRIPTION "Item Desc"
                        ,sum( Wi.ON_HAND_QTY) "Soh"
                        ,Intransit_Qty "Intransit Qty"
                        ,' ' "On Order Qty"
                from wm_inventory wi  
                        inner join item_cbo ic on wi.item_id=ic.item_id
                        inner join item_wms iw on iw.item_id=ic.item_id
                        inner join facility_alias fa on fa.FACILITY_ID=wi.C_FACILITY_ID
                        left join locn_hdr lh on lh.locn_id=wi.LOCATION_ID
                        left join lpn lp  on lp.tc_lpn_id=wi.tc_lpn_id and lp.INBOUND_OUTBOUND_INDICATOR='I'
                        left join (select DESTINATION_FACILITY_ALIAS_ID Dc ,
                                    ic.ITEM_NAME  Item,
                                    ic.DESCRIPTION "Item Desc",
                                    sum(SHIPPED_QTY) Intransit_Qty
                                    from asn asn
                                    inner join ASN_detail ad on ad.asn_id=asn.asn_id
                                    inner join item_cbo ic on ic.item_id=ad.SKU_ID
                                    inner join item_wms iw on iw.item_id=ic.item_id
                                    left join asn_status ast on ast.ASN_STATUS=asn.ASN_STATUS
                                    left join BUSINESS_PARTNER bp on bp.BUSINESS_PARTNER_ID=asn.BUSINESS_PARTNER_ID and bp.MARK_FOR_DELETION='0'
                                    where DESTINATION_TYPE ='W'
                                    and DESTINATION_FACILITY_ALIAS_ID in ('104','110')
                                    and asn.asn_status ='20'
                                    and ic.item_name in ('98818909','98818918','98826758','98826767','98842703','98842712','98843042','98843051','98856083') 
                                    group by DESTINATION_FACILITY_ALIAS_ID  ,
                                    ic.ITEM_NAME  ,
                                    ic.DESCRIPTION )  int on int.Item=ic.item_name   and int.Dc=FACILITY_ALIAS_ID   
                where ic.item_name in ('98818909','98818918','98826758','98826767','98842703','98842712','98843042','98843051','98856083')
                group by FACILITY_ALIAS_ID, FACILITY_NAME, ic.item_name, ic.DESCRIPTION, Intransit_Qty`;
    const sqlRms = `select LOC "Dc & Store",STORE_NAME "Dc & Store Name",im.ITEM "Sku",im.ITEM_DESC "Sku Desc", STOCK_ON_HAND "Soh",IN_TRANSIT "Intransit",On_order_qty "On Order Qty"
        from item_loc_soh@rmsprdsm ils 
        inner join item_master@rmsprdsm im on im.ITEM=ils.ITEM 
        inner join store@rmsprdsm st on st.STORE=ils.LOC 
        left join (SELECT a.TO_LOC,c.ITEM,ITEM_DESC,sum(TSF_QTY) IN_TRANSIT
                        FROM tsfhead@rmsprdsm a,store@rmsprdsm b,tsfdetail@rmsprdsm c , item_master@rmsprdsm d
                        WHERE a.TO_LOC=b.store
                        and a.tsf_no=c.tsf_no
                        and c.item=d.item
                        and a.to_loc_type = 'S'
                        AND a.from_loc_type = 'W'
                        and a.STATUS ='S'
                        and c.item in  ('98818909','98818918','98826758','98826767','98842703','98842712','98843042','98843051','98856083') 
                        group by c.ITEM,ITEM_DESC,a.TO_LOC ) aa on aa.ITEM=im.ITEM and aa.TO_LOC=ils.LOC
            left join (SELECT a.TO_LOC,c.ITEM,ITEM_DESC,sum(TSF_QTY) On_order_qty
                        FROM tsfhead@rmsprdsm a,store@rmsprdsm b,tsfdetail@rmsprdsm c , item_master@rmsprdsm d
                        WHERE a.TO_LOC=b.store
                        and a.tsf_no=c.tsf_no
                        and c.item=d.item
                        and a.to_loc_type = 'S'
                        AND a.from_loc_type = 'W'
                        and a.STATUS ='A'
                        and c.item in  ('98818909','98818918','98826758','98826767','98842703','98842712','98843042','98843051','98856083') 
                        group by c.ITEM,ITEM_DESC,a.TO_LOC ) ab on ab.ITEM=im.ITEM and ab.TO_LOC=ils.LOC
        where LOC_TYPE ='S'
        and im.item in  ('98818909','98818918','98826758','98826767','98842703','98842712','98843042','98843051','98856083')
        order by STOCK_ON_HAND desc`;

    // Excute Query
    const { rows: sohWms } = await wms.execute(sqlWms);
    const { rows: sohRms } = await rms.execute(sqlRms);

    // Untuk Push data dari excute query ke excel
    const excelData = [];

    // Cek Data ada atau tidak
    if (sohWms.length > 0) {
      excelData.push({ sheetName: "DC", data: sohWms });
    }
    if (sohRms.length > 0) {
      excelData.push({ sheetName: "STORE", data: sohRms });
    }

    // Export ke Excel
    if (excelData.length > 0) {
      const fileName = `SOH Starlink ${moment(new Date()).format("DD-MMM-YYYY")}.xlsx`;
      const xlsx = await ExcelApp.xlsx(pathReport, fileName, excelData);

      // Jika data berhasil di export maka kirim email dan upload ke filezila server
      if (Object.hasOwn(xlsx, "pathReport")) {
        await mail.send({
          to: "devi.ennito@datalake.id, nike.kosasih@datalake.id, calvin.purnama@datalake.id, taufik.ramadhan@datalake.id, daniel.sinaga@datalake.id, ilyasa.ning@mpc.id, marisa.putri.agustina@hypermart.co.id, galih.prabowo@hypermart.co.id, silvia.reynold@corfin.id",
          cc: "abdul.aziz@hypermart.co.id, setiyadi@hypermart.co.id, ahmad.baskara@hypermart.co.id, steffen.kekung@hypermart.co.id, rebuyer.dc.surabaya@hypermart.co.id, riza.ichwanda@hypermart.co.id, rahman.yuliansyah@hypermart.co.id, glen.sebastian@hypermart.co.id, hendra.kurnia@hypermart.co.id, wahyu.wicaksono@hypermart.co.id",
          subject: `Report ${fileName.replace(/.xlsx/g, "")}`,
          attachments: [
            {
              filename: xlsx.fileName,
              path: path.resolve(xlsx.pathReport, xlsx.fileName),
            },
          ],
          message: `<p>
                        Dear All, <br/><br/>
                        Berikut Report ${fileName.replace(/.xlsx/g, "")}.<br/><br/>
                        File Sharing : ${helper.config("ftpDefaultDir")}/SOH<br/>
                    </p>`,
        });

        // Fungsi upload file ke filezila
        await ftp.upload(xlsx.fileName, xlsx.pathReport, "/SOH");

        helper.sendLogs(`Report ${fileName}, Successfully.`, true);
      }
    }

    // Close koneksi
    await wms.close();
    await rms.close();
    helper.standBy();
    // test log
    // console.log("Job SOH Starlink, done");
  } catch (error) {
    // console.log(error);
    logger.error(`Report SOH Starlink error (${error.message})`);
    throw error;
  }
}

module.exports = {
  Starlink,
};

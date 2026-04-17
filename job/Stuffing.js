const fs = require("fs");
const path = require("path");
const moment = require("moment");

const { oracledb, getConnect, replaceParam } = require("../dbase");
const helper = require("../helper");
const ExcelApp = require("../ExcelApp");
const ftp = require("../ftp");
const mail = require("../mail");
const logger = require("../logger");

async function Dept97() {
  try {
    const wms = await getConnect("wms");
    const reportPath = "Stuffing Dept 97";

    let querySQL = helper.getSql("report", "rpt_stuffing_dept_97.sql");
    const { rows: data } = await wms.execute(querySQL);

    let excelData = [];
    if (data.length > 0) {
      excelData.push({ sheetName: "Data", data: data });
    }

    if (excelData.length > 0) {
      const pathReport = path.resolve(
        __dirname,
        helper.config("pathReport"),
        reportPath,
      );
      const fileName = `Stuffing Dept 97 ${moment(new Date()).format("DD-MMM-YYYY")}.xlsx`;
      await helper.createPath(pathReport);
      const xlsx = await ExcelApp.xlsx(pathReport, fileName, excelData);
      if (Object.hasOwn(xlsx, "pathReport")) {
        await ftp.upload(xlsx.fileName, xlsx.pathReport, `/${reportPath}`);

        await mail.send({
          to: "rebuyer.dc.fresh.porong@hypermart.co.id, consolidator.dcsurabaya@hypermart.co.id, rebuyer.dc.surabaya@hypermart.co.id, shindy.anugrah@hypermart.co.id, evi.rahayu@hypermart.co.id, martinus.sumaryono@hypermart.co.id, widi.yanti@hypermart.co.id, rusli.sutardi@hypermart.co.id, fauzi@hypermart.co.id, sulastri@hypermart.co.id, dedy.hermawan@hypermart.co.id, ela.n.avifah@hypermart.co.id, buyer.hyper.pakuwon@hypermart.co.id, agus.widodo@hypermart.co.id, rebuyer.supervisor.2.omic@hypermart.co.id, Kadek.tia.mulyana@hypermart.co.id, risin.anan@hypermart.co.id, spv.fresh.dc.sorong@hypermart.co.id, qc.fresh.porong@hypermart.co.id, irvan.fitriadi@hypermart.co.id",
          cc: "helpdesk.fresh.dc@hypermart.co.id",
          subject: xlsx.fileName.replace(/.xlsx/g, ""),
          attachments: [
            {
              filename: xlsx.fileName,
              path: path.resolve(xlsx.pathReport, xlsx.fileName),
            },
          ],
          message: `<p>
                        Dear All, <br><br>
                        Berikut Report ${xlsx.fileName.replace(/.xlsx/g, "")}.<br>
                        File dapat di akses/unduh alamat di bawah ini.<br>
                        File Sharing : ${helper.config("ftpDefaultDir")}/${reportPath}<br>
                    </p>`,
        });

        helper.sendLogs(
          `Report ${xlsx.fileName.replace(/.xlsx/g, "")}, Successfully.`,
          true,
        );
      }
    }

    await wms.close();
    helper.standBy();
  } catch (error) {
    logger.error(`Error ASOH LL (${error.message})`);
    throw error;
  }
}

module.exports = {
  Dept97,
};

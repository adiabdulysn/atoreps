const fs = require("fs");
const path = require("path");
const moment = require("moment");
const lodash = require("lodash");
const excel = require("exceljs");

const {getConnect, replaceParam} = require("../dbase");
const helper = require("../helper");
const ExcelApp = require("../ExcelApp");
const ftp = require("../ftp");
const mail = require("../mail");
const logger = require("../logger");

async function OrderCancel() {
    try {
        
        const wms = await getConnect("wms");

        const dcs = ["104","108","110","105","106"];
        // const dcs = ["110"];
        
        let pivotSummary = [];
        let excelData=[];
        for(const dc of dcs){
            let querySQL = helper.getSql("report", "rpt_stm_cancel.sql");
            querySQL = replaceParam(querySQL, "PARAMS", ` and O_FACILITY_ALIAS_ID = '${dc}'`);
            let querySummary = `SELECT "Dc", "Dc_Name", "Dept", "Cancel Type", count("Item") "Sku", SUM("Cancel Qty") "Cancel Qty", SUM("Cost") "Value" 
            FROM (
                ${querySQL}
            )
            GROUP BY "Dc", "Dc_Name", "Dept", "Cancel Type"
            ORDER BY SUM("Cost") DESC, "Dept" ASC`;
            const {rows: detail} = await wms.execute(querySQL);
            const {rows: summary} = await wms.execute(querySummary);

            for(const sum of summary){
                pivotSummary.push({
                    dc: sum['Dc'],
                    dc_name: sum['Dc_Name'],
                    dept: sum['Dept'],
                    cancel_type: sum['Cancel Type'],
                    sku: sum['Sku'],
                    qty_cancel: sum['Cancel Qty'],
                    value: sum['Value']
                })
            }
            excelData.push({
                sheetName: dc,
                data: detail
            })
        }
        await wms.close();
        const pathReport = path.join(helper.config("pathReport"), "Daily Order Cancel");
        const excelFileName = `Order Cancel ${moment(new Date()).add(-1, "days").format("DD-MMM-YY")}.xlsx`
        helper.createPath(pathReport);
        const xlsx = await ExcelApp.xlsx(pathReport, excelFileName, excelData);

        if(Object.hasOwn(xlsx, "pathReport")){
            
            const workbook = new excel.Workbook();
            await workbook.xlsx.readFile(path.resolve(xlsx.pathReport, xlsx.fileName));
            const sheet = workbook.addWorksheet("SUMMARY");

            const groupDc = lodash.groupBy(pivotSummary, 'dc');
            
            const borderStyle = { top: {style:'thin', color: {argb: '497ac9'}}, left: {style:'thin', color: {argb: '497ac9'}}, bottom: {style:'thin', color: {argb: '497ac9'}}, right: {style:'thin', color: {argb: '497ac9'}} };
            let currentRow = 1;
            for (const dc in groupDc) {

                const headerRow = sheet.getRow(currentRow);
                headerRow.values = ["DC", "DC Name", "Dept", "Cancel Type", "SKU", "Qty Cancel", "Values", "PCT"];
                headerRow.eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '497ac9' } }; 
                    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
                    cell.border = borderStyle;
                });
                
                const startGroupRow = currentRow + 1;
                let dataRow = startGroupRow;
        
                // const groupDept = lodash.groupBy(groupDc[dc], "dept");
                const sumValues = lodash.sumBy(groupDc[dc], 'value');
                const groupDept = lodash.groupBy(groupDc[dc].map(row => {
                    const sumCriteria = lodash.sumBy(lodash.filter(groupDc[dc], { dept: row.dept, cancel_type: row.cancel_type }), "value")
                    const pct = sumCriteria / sumValues;
                    return {
                        ...row,
                        pct: pct
                    };
                }), "dept");
                
                for (const dept in groupDept) {
                    const startDeptRow = dataRow;
        
                    groupDept[dept].forEach((row) => {
                        sheet.getCell(dataRow, 1).value = row.dc;
                        sheet.getCell(dataRow, 2).value = row.dc_name;
                        sheet.getCell(dataRow, 3).value = row.dept;
                        sheet.getCell(dataRow, 4).value = row.cancel_type;
                        sheet.getCell(dataRow, 5).value = row.sku;
                        sheet.getCell(dataRow, 6).value = row.qty_cancel;
                        sheet.getCell(dataRow, 7).value = row.value;
                        sheet.getCell(dataRow, 8).value = row.pct;

                        for(let i=1; i<=8; i++) {
                            sheet.getCell(dataRow, i).border = borderStyle;
                            if([5,6,7].includes(i)) sheet.getCell(dataRow, i).numFmt="#,##0.00"
                            if([8].includes(i)) sheet.getCell(dataRow, i).numFmt="0.00%"
                        }
                        dataRow++;
                    });
        
                    if (dataRow - 1 > startDeptRow) {
                        sheet.mergeCells(startDeptRow, 3, dataRow - 1, 3);
                    }
                }
        
                sheet.mergeCells(startGroupRow, 1, dataRow - 1, 1);
                sheet.mergeCells(startGroupRow, 2, dataRow - 1, 2);
                
                [1, 2, 3].forEach(col => {
                    sheet.getCell(startGroupRow, col).alignment = { vertical: 'top', horizontal: 'left' };
                });
        
                const totalRow = sheet.getRow(dataRow);
                totalRow.getCell(1).value = "Grand Total";
                sheet.mergeCells(dataRow, 1, dataRow, 4); 
                
                totalRow.getCell(5).value = { formula: `SUM(E${startGroupRow}:E${dataRow-1})` };
                totalRow.getCell(6).value = { formula: `SUM(F${startGroupRow}:F${dataRow-1})` };
                totalRow.getCell(7).value = { formula: `SUM(G${startGroupRow}:G${dataRow-1})` };
                totalRow.getCell(8).value = { formula: `SUM(H${startGroupRow}:H${dataRow-1})` };
        
                totalRow.eachCell((cell, colNumber) => {
                    cell.font = { bold: true, color: { argb: '000000' } };
                    cell.border = borderStyle
                    if (colNumber === 8) {
                        cell.numFmt="0.00%"
                    }else{
                        cell.numFmt="#,##0.00"
                    }
                });
        
                currentRow = dataRow + 3;
            }
            sheet.columns.forEach(column => {
                let maxLength = 0;
                column.eachCell({ includeEmpty: true }, cell => {
                    const columnLength = cell.value ? cell.value.toString().length : 10;
                    if (columnLength > maxLength) {
                    maxLength = columnLength;
                    }
                });
                column.width = maxLength + 2;
            });
            await workbook.xlsx.writeFile(path.resolve(xlsx.pathReport, xlsx.fileName));

            const htmlSummaryOrderCancel = htmlOrderCancelSummary(pivotSummary);
            await mail.send({
                to: "helpdesk.operation.spv@hypermart.co.id, herman.susanto@hypermart.co.id, rahman.yuliansyah@hypermart.co.id, glen.sebastian@hypermart.co.id, halpy.gustiawan@hypermart.co.id, irvan.fitriadi@hypermart.co.id, abdul.aziz@hypermart.co.id",
                cc: "muhamad.ubay.baidillah@hypermart.co.id, ahmad.baskara@hypermart.co.id, Kadek.tia.mulyana@hypermart.co.id, fauzi.kamil@hypermart.co.id, fendra.alamsyah@hypermart.co.id, andrico@hypermart.co.id, steffen.kekung@hypermart.co.id, sugeng@hypermart.co.id, sarjana@hypermart.co.id, darita@hypermart.co.id, riza.ichwanda@hypermart.co.id, helpdesk.fresh.dc@hypermart.co.id, helpdesk.dc.surabaya.msm@hypermart.co.id, setiyadi@hypermart.co.id, SDM.DC@hypermart.co.id, hernu.subekti@hypermart.co.id, mgr.oprdc.porong@hypermart.co.id, spv.it.inv.timika@hypermart.co.id, dc.customerservice.balarajamsm@hypermart.co.id, dc.cust.service.fresh@hypermart.co.id, mutia.khoirunnisa@hypermart.co.id, hendra.kurnia@hypermart.co.id, sunarti@hypermart.co.id, ajeng.soebadra@hypermart.co.id, hariadi@hypermart.co.id, dwi.susanto@hypermart.co.id, CONSOLIDATOR.STM.DC.BALARAJA@HYPERMART.CO.ID",
                subject: `Daily ${xlsx.fileName.replace(/.xlsx/g, '')}`,
                message: `<p>
                    Dear All, <br><br>
                    Berikut Summary Daily ${xlsx.fileName.replace(/.xlsx/g, '')}.<br>
                    Report Detail dapat di akses/unduh alamat di bawah ini.<br>
                    File Sharing : ${helper.config("ftpDefaultDir")}/Daily Order Cancel<br><br>
                </p>
                ${htmlSummaryOrderCancel}
                <br><br>`
            });

            await ftp.upload(xlsx.fileName, xlsx.pathReport, "/Daily Order Cancel")
        }
    } catch (error) {
        logger.error(error);
        throw error;
    }
}
function htmlOrderCancelSummary(pivotSummary) {
    const groupDc = lodash.groupBy(pivotSummary, 'dc');
    const blueHeader = "#497ac9";
    
    let html = `<div style="font-family: Calibri, sans-serif; font-size: 13px; color: #000;">`;

    for (const dc in groupDc) {
        html += `
        <table border="0" cellpadding="2" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px; font-family: Calibri, sans-serif;">
            <thead>
                <tr>
                    <th style="width: 80px; background-color: ${blueHeader}; color: white; border: 1px solid ${blueHeader}; text-align: left;">DC</th>
                    <th style="width: 150px; background-color: ${blueHeader}; color: white; border: 1px solid ${blueHeader}; text-align: left;">DC Name</th>
                    <th style="width: 80px; background-color: ${blueHeader}; color: white; border: 1px solid ${blueHeader}; text-align: left;">Dept</th>
                    <th style="width: 200px; background-color: ${blueHeader}; color: white; border: 1px solid ${blueHeader}; text-align: left;">Cancel Type</th>
                    <th style="width: 100px; background-color: ${blueHeader}; color: white; border: 1px solid ${blueHeader}; text-align: left;">SKU</th>
                    <th style="width: 150px; background-color: ${blueHeader}; color: white; border: 1px solid ${blueHeader}; text-align: left;">Qty Cancel</th>
                    <th style="width: 250px; background-color: ${blueHeader}; color: white; border: 1px solid ${blueHeader}; text-align: left;">Values</th>
                    <th style="width: 250px; background-color: ${blueHeader}; color: white; border: 1px solid ${blueHeader}; text-align: left;">PCT</th>
                </tr>
            </thead>
            <tbody>`;

        const dataGroup = groupDc[dc];
        // const groupDept = lodash.groupBy(dataGroup, "dept");
        // const groupDept = lodash.groupBy(groupDc[dc], "dept");
        const sumValues = lodash.sumBy(dataGroup, 'value');
        const groupDept = lodash.groupBy(dataGroup.map(row => {
            const sumCriteria = lodash.sumBy(lodash.filter(dataGroup, { dept: row.dept, cancel_type: row.cancel_type }), "value")
            const pct = sumCriteria / sumValues;
            return {
                ...row,
                pct: pct
            };
        }), "dept");
        
        const totalRowsInDc = dataGroup.length;
        let isFirstDcRow = true;
        let pushSumPct = [];

        for (const dept in groupDept) {
            const deptData = groupDept[dept];
            const deptRowspan = deptData.length;
            let isFirstDeptRow = true;

            deptData.forEach((row) => {
                html += `<tr>`;
                
                // DC & DC Name Rowspan
                if (isFirstDcRow) {
                    html += `<td rowspan="${totalRowsInDc}" valign="top" style="border: 1px solid ${blueHeader};">${row.dc}</td>`;
                    html += `<td rowspan="${totalRowsInDc}" valign="top" style="border: 1px solid ${blueHeader};">${row.dc_name}</td>`;
                    isFirstDcRow = false;
                }

                // DEPT Rowspan
                if (isFirstDeptRow) {
                    html += `<td rowspan="${deptRowspan}" valign="top" style="border: 1px solid ${blueHeader};">${row.dept}</td>`;
                    isFirstDeptRow = false;
                }

                // Detail Cells dengan border manual di setiap cell
                html += `<td style="border: 1px solid ${blueHeader};">${row.cancel_type}</td>`;
                html += `<td style="border: 1px solid ${blueHeader}; text-align: right;">${Number(row.sku).toLocaleString()}</td>`;
                html += `<td style="border: 1px solid ${blueHeader}; text-align: right;">${Number(row.qty_cancel).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>`;
                html += `<td style="border: 1px solid ${blueHeader}; text-align: right;">${Number(row.value).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>`;
                html += `<td style="border: 1px solid ${blueHeader}; text-align: right;">${(row.pct * 100).toFixed(2)}%</td>`;
                
                html += `</tr>`;

                pushSumPct.push(row.pct);
                // console.log(`${(row.pct)}`)
            });
        }

        // GRAND TOTAL BARIS
        const sumSku = lodash.sumBy(dataGroup, r => Number(r.sku));
        const sumQty = lodash.sumBy(dataGroup, r => Number(r.qty_cancel));
        const sumVal = lodash.sumBy(dataGroup, r => Number(r.value));
        const sumPct = lodash.sum(pushSumPct);
        pushSumPct=[]

        html += `
            <tr style="background-color: #f2f2f2; font-weight: bold;">
                <td colspan="4" align="center" style="border: 1px solid ${blueHeader};">Grand Total</td>
                <td align="right" style="border: 1px solid ${blueHeader};">${sumSku.toLocaleString()}</td>
                <td align="right" style="border: 1px solid ${blueHeader};">${sumQty.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td align="right" style="border: 1px solid ${blueHeader};">${sumVal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td align="right" style="border: 1px solid ${blueHeader};">${(sumPct * 100).toFixed(2)}%</td>
            </tr>`;

        html += `</tbody></table><br/>`;
    }

    html += `</div>`;
    return html;
}

// OrderCancel();
module.exports = {
    OrderCancel
}
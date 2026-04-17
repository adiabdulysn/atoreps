const fs = require("fs");
const path = require("path");
const moment = require("moment");
const helper = require("../helper");
const ExcelApp = require("../ExcelApp");
const mail = require("../mail"); 
const ftp = require("../ftp")
const logger = require("../logger");

const {uploadMultiple, getConnect, replaceParam} = require("../dbase");

async function updateBookingPos() {
    try {
        let querySql = helper.getSql("precise", "ul_po_booking_source.sql");
        const wms = await getConnect("wms");
        const {rows: data} = await wms.execute(querySql);
        await wms.close();

        const updateColumns = Object.keys(data[0]).filter(col => col !== "po_id");
        const po_id = data.map(row => row.po_id);
        const buildCaseColumns = (col, data) => {
            const cases = data.map(row => `WHEN '${row.po_id}' THEN '${row[col] ?? null}'`).join("\n");
            return `${col} = CASE po_id\n${cases}\nEND`;
        }
        const setClause = updateColumns.map(col => `${buildCaseColumns(col, data)}`).join(",\n");
        const precise = await getConnect("precise");
        const sqlUpdate = `UPDATE booking_pos\nSET\n${setClause.replace(/'null'/g, 'NULL')}\nWHERE po_id IN (${po_id.join(",")})`;
        await precise.execute(sqlUpdate);
        await precise.close();
        helper.sendLogs(`Update Booking Pos successfully with ${data.length} records`, true);

    } catch (error) {
        logger.error(`Error update Booking Pos => ${error.message}`)
        throw error;
    }
}

module.exports = {
    updateBookingPos
}
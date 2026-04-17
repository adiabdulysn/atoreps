const fs = require("fs");
const path = require("path");
const moment = require("moment");
const helper = require("../helper");
const {upload, uploadCsv} = require("../dbase");
const logger = require("../logger")

async function ShipmentReceiveStore() {
    try{

        await upload({
            dbSrc: "rms",
            sqlSrc: "ul_shipment_receive_store_source.sql",
            dbDest: "tms_prod",
            sqlDest: "ul_shipment_receive_store_destination.sql",
            sqlPath: "tms",
            fetchSize: 200,
            uploadName: "Shipment Receive Store",
            onProgress: (data) => {
                const percentage = (data.totalInsert / data.totalData) * 100;
                helper.sendInfo(`Procesess upload Shipment Receive Store : ${percentage.toFixed(2)}% (${data.totalInsert} / ${data.totalData})`)
            },
            onComplete: ({success, message, error}) => {
                helper.sendLogs(message, true)
                helper.standBy();
            }
        });
    }catch(error){
        logger.error(error);
        throw error;
    }
}

module.exports = {
    ShipmentReceiveStore
}
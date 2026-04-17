const fs = require("fs");
const path = require("path");
const moment = require("moment");
const helper = require("../helper");
const logger = require("../logger");
const {upload, uploadCsv} = require("../dbase");

async function ItemHsCode() {
    try {
        await upload({
            dbSrc: "rms",
            querySrc: `select item "item", hs_code "hs_code", to_char(sysdate, 'YYYY-MM-DD HH24:MI:SS') "last_update" from MPP_ITEM_HSCODE`,
            dbDest: "efaktur",
            queryDest: `insert into item_hscode (item, hs_code, last_update) values ? on duplicate key update item=values(item), hs_code=values(hs_code), last_update=values(last_update)`,
            fetchSize: 250,
            uploadName: "Item Master HS CODE",
            onProgress: (data) => {
                const percentage = (data.totalInsert / data.totalData) * 100;
                helper.sendInfo(`Procesess upload Item Master HS CODE : ${percentage.toFixed(2)}% (${data.totalInsert} / ${data.totalData})`)
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

module.exports = {
    ItemHsCode
}
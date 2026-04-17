const path = require("path");
const mail = require("../../mail");
const jasper = require("../../jasper");
const helper = require("../../helper");
const dbase = require("../../dbase");
const ExcelApp = require("../../ExcelApp");

(async()=>{

    try {
        const a = helper.CronTrigger("2026-01-05 08:15:00", "weekly")
        console.log(a)
    } catch (error) {
        console.log(error)
    }


})();
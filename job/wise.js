const fs = require("fs");
const path = require("path");
const moment = require("moment");
const helper = require("../helper");
const {upload, uploadCsv} = require("../dbase");
const logger = require("../logger")

/*  === Master Upload === */

async function User(){
    try {
        await upload({
            dbSrc: "wms",
            sqlSrc: "ul_ucl_users_source.sql",
            dbDest: "wise",
            sqlDest: "ul_ucl_users_destination.sql",
            sqlPath: "wise",
            fetchSize: 200,
            uploadName: "Users",
            onProgress: (data) => {
                const percentage = (data.totalInsert / data.totalData) * 100;
                helper.sendInfo(`Procesess upload User : ${percentage.toFixed(2)}% (${data.totalInsert} / ${data.totalData})`)
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

async function Facilities(){
    try {
        await upload({
            dbSrc: "wms",
            sqlSrc: "ul_facilities_source.sql",
            dbDest: "wise",
            sqlDest: "ul_facilities_destination.sql",
            sqlPath: "wise",
            fetchSize: 200,
            uploadName: "Facilities",
            onProgress: (data) => {
                const percentage = (data.totalInsert / data.totalData) * 100;
                helper.sendInfo(`Procesess upload Facilities : ${percentage.toFixed(2)}% (${data.totalInsert} / ${data.totalData})`)
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

async function BusinessPartners(){
    try {
        await upload({
            dbSrc: "wms",
            sqlSrc: "ul_businesspartners_source.sql",
            dbDest: "wise",
            sqlDest: "ul_businesspartners_destination.sql",
            sqlPath: "wise",
            fetchSize: 200,
            uploadName: "Business Partners",
            onProgress: (data) => {
                const percentage = (data.totalInsert / data.totalData) * 100;
                helper.sendInfo(`Procesess upload Business Partners : ${percentage.toFixed(2)}% (${data.totalInsert} / ${data.totalData})`)
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

async function Items(){
    try {
        await upload({
            dbSrc: "wms",
            sqlSrc: "ul_items_source.sql",
            dbDest: "wise",
            sqlDest: "ul_items_destination.sql",
            sqlPath: "wise",
            uploadName: "Items",
            fetchSize: 200,
            onProgress: (data) => {
                const percentage = (data.totalInsert / data.totalData) * 100;
                helper.sendInfo(`Procesess upload Items Master : ${percentage.toFixed(2)}% (${data.totalInsert} / ${data.totalData})`)
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

async function Locations(){
    try {
        await upload({
            dbSrc: "wms",
            sqlSrc: "ul_locations_source.sql",
            dbDest: "wise",
            sqlDest: "ul_locations_destination.sql",
            sqlPath: "wise",
            uploadName: "Locations",
            fetchSize: 200,
            onProgress: (data) => {
                const percentage = (data.totalInsert / data.totalData) * 100;
                helper.sendInfo(`Procesess upload Locations : ${percentage.toFixed(2)}% (${data.totalInsert} / ${data.totalData})`)
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

async function Shippers(){
    try {
        await upload({
            dbSrc: "wms",
            sqlSrc: "ul_shippers_source.sql",
            dbDest: "wise",
            sqlDest: "ul_shippers_destination.sql",
            sqlPath: "wise",
            uploadName: "Shippers",
            fetchSize: 200,
            onProgress: (data) => {
                const percentage = (data.totalInsert / data.totalData) * 100;
                helper.sendInfo(`Procesess upload Shippers : ${percentage.toFixed(2)}% (${data.totalInsert} / ${data.totalData})`)
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

async function OutofStock(){
    try {

        await uploadCsv({
            dbSrc: "rms",
            sqlSrc: "ul_oos_source.sql",
            sqlPath: "wise",
            dbDest: "wise",
            tableSrc: "oos",
            setColumn: ["cut_off_date", "region", "format", "store_code", "store_name", "div_name", "group_name", "old_dept_name", "dept_name", "class_name", "item_code", "item_description", "matrix_abcxyz", "source_wh", "stock_category", "oos_dc", "from_dc", "oos_supplier", "from_supplier", "oos_all", "poos_all", "pareto", "pure", "block_md", "autorep", "singlepick", "dc_insufficient", "dc_assortment", "oos_sl_supplier", "oos_forever", "daily_basket", "mhi_timika", "kpe", "asoh", "safety_stock", "purchase_needed", "sales_lost", "intransit", "on_ordered", "sum_ordered", "notes"],
            truncate: true,
            uploadName: "Out Of Stock",
            onProgress: (data) => {
                const percentage = (data.totalGetData / data.totalData) * 100;
                helper.sendInfo(`Procesess upload Out Of Stock : ${percentage.toFixed(2)}% (${data.totalGetData} / ${data.totalData})`)
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

async function Backlog(){
    try {
        await uploadCsv({
            dbSrc: "wms",
            sqlSrc: "ul_backlog_source.sql",
            sqlPath: "wise",
            dbDest: "wise",
            tableSrc: "backlog",
            setColumn: ["run_date", "dc", "merch_type", "territory", "facility_alias_id", "stm_number", "stm_status", "stm_type", "stm_date", "verified_date", "waved_date", "item_id", "oos", "quantity", "cartons", "volume", "weight", "value"],
            uploadName: "Backlog",
            onProgress: (data) => {
                const percentage = (data.totalGetData / data.totalData) * 100;
                helper.sendInfo(`Procesess data Backlog : ${percentage.toFixed(2)}% (${data.totalGetData} / ${data.totalData})`)
                // console.log(`Procesess data Backlog : ${percentage.toFixed(2)}% (${data.totalGetData} / ${data.totalData})`)
            },
            onComplete: ({success, message, error}) => {
                // console.log(message)
                helper.sendLogs(message, true)
                helper.standBy();
            }
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}


/*  === Transaction Upload === */
async function Throughput(){
    try {
        await upload({
            dbSrc: "wms",
            sqlSrc: "ul_throughput_source.sql",
            dbDest: "wise",
            sqlDest: "ul_throughput_destination.sql",
            sqlPath: "wise",
            uploadName: "Throughput",
            onProgress: (data) => {
                const percentage = (data.totalInsert / data.totalData) * 100;
                helper.sendInfo(`Procesess upload Throughput : ${percentage.toFixed(2)}% (${data.totalInsert} / ${data.totalData})`)
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

async function Throughput(){
    try {
        let querySource = helper.getSql("wise", "ul_throughput_source.sql");
        let queryDestination = helper.getSql("wise", "ul_throughput_destination.sql"); 
        let params = ` AND TO_CHAR(s.ship_date,'YYYY-MM-DD') BETWEEN TO_CHAR(sysdate-2, 'YYYY-MM-DD') AND TO_CHAR(sysdate, 'YYYY-MM-DD')`;

        querySource = querySource.replace(/::pParam::/g, params);

        await upload({
            dbSrc: "rms",
            dbDest: "wise",
            querySrc: querySource,
            queryDest: queryDestination,
            uploadName: "Throughput",
            onProgress: (data) => {
                const percentage = (data.totalInsert / data.totalData) * 100;
                // console.log(`Procesess upload Throughput : ${percentage.toFixed(2)}% (${data.totalInsert} / ${data.totalData})`)
                helper.sendInfo(`Procesess upload Throughput : ${percentage.toFixed(2)}% (${data.totalInsert} / ${data.totalData})`)
            },
            onComplete: ({success, message, error}) => {
                // console.log(message)
                helper.sendLogs(message, true)
                helper.standBy();
            }
        });
        
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function Productivity(){
    try {
        let querySource = helper.getSql("wise", "ul_productivity_source.sql");
        let queryDestination = helper.getSql("wise", "ul_productivity_destination.sql"); 
        let params = ` AND TO_CHAR(ptt.create_date_time, 'YYYY-MM-DD') BETWEEN TO_CHAR(sysdate-1, 'YYYY-MM-DD') AND TO_CHAR(sysdate, 'YYYY-MM-DD')`;

        querySource = querySource.replace(/::pParam::/g, params);

        await upload({
            dbSrc: "wms",
            dbDest: "wise",
            querySrc: querySource,
            queryDest: queryDestination,
            uploadName: "Productivity",
            onProgress: (data) => {
                const percentage = (data.totalInsert / data.totalData) * 100;
                // console.log(`Procesess upload Productivity : ${percentage.toFixed(2)}% (${data.totalInsert} / ${data.totalData})`)
                helper.sendInfo(`Procesess upload Productivity : ${percentage.toFixed(2)}% (${data.totalInsert} / ${data.totalData})`)
            },
            onComplete: ({success, message, error}) => {
                // console.log(message)
                helper.sendLogs(message, true)
                helper.standBy();
            }
        });
        
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function Activities(){
    try {
        let querySource = helper.getSql("wise", "ul_activities_source.sql");
        let queryDestination = helper.getSql("wise", "ul_activities_destination.sql"); 
        let params = ` AND TO_CHAR(ptt.create_date_time, 'YYYY-MM-DD') BETWEEN TO_CHAR(sysdate-1, 'YYYY-MM-DD') AND TO_CHAR(sysdate, 'YYYY-MM-DD')`;

        querySource = querySource.replace(/::pParam::/g, params);

        await upload({
            dbSrc: "wms",
            dbDest: "wise",
            querySrc: querySource,
            queryDest: queryDestination,
            uploadName: "Activities",
            onProgress: (data) => {
                const percentage = (data.totalInsert / data.totalData) * 100;
                // console.log(`Procesess upload Activities : ${percentage.toFixed(2)}% (${data.totalInsert} / ${data.totalData})`)
                helper.sendInfo(`Procesess upload Activities : ${percentage.toFixed(2)}% (${data.totalInsert} / ${data.totalData})`)
            },
            onComplete: ({success, message, error}) => {
                // console.log(message)
                helper.sendLogs(message, true)
                helper.standBy();
            }
        });
        
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function Receiving(){
    try {
        let querySource = helper.getSql("wise", "ul_receiving_source.sql");
        let queryDestination = helper.getSql("wise", "ul_receiving_destination.sql"); 
        let params = ` AND TO_CHAR(a.LAST_UPDATED_DTTM, 'YYYY-MM-DD') = TO_CHAR(SYSDATE, 'YYYY-MM-DD')`;

        querySource = querySource.replace(/::pParam::/g, params);

        await upload({
            dbSrc: "wms",
            dbDest: "wise",
            querySrc: querySource,
            queryDest: queryDestination,
            uploadName: "Receiving",
            onProgress: (data) => {
                const percentage = (data.totalInsert / data.totalData) * 100;
                // console.log(`Procesess upload Receiving : ${percentage.toFixed(2)}% (${data.totalInsert} / ${data.totalData})`)
                helper.sendInfo(`Procesess upload Receiving : ${percentage.toFixed(2)}% (${data.totalInsert} / ${data.totalData})`)
            },
            onComplete: ({success, message, error}) => {
                // console.log(message)
                helper.sendLogs(message, true)
                helper.standBy();
            }
        });
        
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function Orders(){
    try {
        let querySource = helper.getSql("wise", "ul_orders_source.sql");
        let queryDestination = helper.getSql("wise", "ul_orders_destination.sql"); 
        let params = ` AND TO_CHAR(o.LAST_UPDATED_DTTM,'YYYY-MM-DD') BETWEEN TO_CHAR(SYSDATE-7, 'YYYY-MM-DD') AND TO_CHAR(SYSDATE, 'YYYY-MM-DD')`;

        querySource = querySource.replace(/::pParam::/g, params);

        await upload({
            dbSrc: "wms",
            dbDest: "wise",
            querySrc: querySource,
            queryDest: queryDestination,
            uploadName: "Orders",
            onProgress: (data) => {
                const percentage = (data.totalInsert / data.totalData) * 100;
                // console.log(`Procesess upload Orders : ${percentage.toFixed(2)}% (${data.totalInsert} / ${data.totalData})`)
                helper.sendInfo(`Procesess upload Orders : ${percentage.toFixed(2)}% (${data.totalInsert} / ${data.totalData})`)
            },
            onComplete: ({success, message, error}) => {
                // console.log(message)
                helper.sendLogs(message, true)
                helper.standBy();
            }
        });
        
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function OrderCancels(){
    try {
        let querySource = helper.getSql("wise", "ul_ordercancels_source.sql");
        let queryDestination = helper.getSql("wise", "ul_ordercancels_destination.sql"); 
        let params = ` AND TO_CHAR(oli.last_updated_dttm,'YYYY-MM-DD') = TO_CHAR(SYSDATE, 'YYYY-MM-DD')`;

        querySource = querySource.replace(/::pParam::/g, params);

        await upload({
            dbSrc: "wms",
            dbDest: "wise",
            querySrc: querySource,
            queryDest: queryDestination,
            uploadName: "Order Cancels",
            onProgress: (data) => {
                const percentage = (data.totalInsert / data.totalData) * 100;
                // console.log(`Procesess upload OrderCancels : ${percentage.toFixed(2)}% (${data.totalInsert} / ${data.totalData})`)
                helper.sendInfo(`Procesess upload OrderCancels : ${percentage.toFixed(2)}% (${data.totalInsert} / ${data.totalData})`)
            },
            onComplete: ({success, message, error}) => {
                // console.log(message)
                helper.sendLogs(message, true)
                helper.standBy();
            }
        });
        
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function Adjustments(){
    try {
        let querySource = helper.getSql("wise", "ul_adjustments_source.sql");
        let queryDestination = helper.getSql("wise", "ul_adjustments_destination.sql"); 
        let params = ` AND TO_CHAR(pt.create_date_time,'YYYY-MM-DD') = TO_CHAR(SYSDATE, 'YYYY-MM-DD')`;

        querySource = querySource.replace(/::pParam::/g, params);

        await upload({
            dbSrc: "wms",
            dbDest: "wise",
            querySrc: querySource,
            queryDest: queryDestination,
            uploadName: "Adjustments",
            onProgress: (data) => {
                const percentage = (data.totalInsert / data.totalData) * 100;
                // console.log(`Procesess upload Adjustments : ${percentage.toFixed(2)}% (${data.totalInsert} / ${data.totalData})`)
                helper.sendInfo(`Procesess upload Adjustments : ${percentage.toFixed(2)}% (${data.totalInsert} / ${data.totalData})`)
            },
            onComplete: ({success, message, error}) => {
                // console.log(message)
                helper.sendLogs(message, true)
                helper.standBy();
            }
        });
        
    } catch (error) {
        logger.error(error);
        throw error;
    }
}


module.exports={
    User,
    Facilities,
    BusinessPartners,
    Items,
    Locations,
    Shippers,
    OutofStock,
    Backlog,
    Throughput,
    Productivity,
    Activities,
    Receiving,
    Orders,
    OrderCancels,
    Adjustments
}


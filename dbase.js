process.env.ORA_SDTZ = 'UTC+07:00';

const oracledb = require("oracledb");
const mysql2 = require("mysql2/promise");
const helper = require("./helper");
const path = require("path");
const fs = require("fs");
const moment = require("moment");

if (!oracledb.oracleClientVersion) {
  oracledb.initOracleClient({
    libDir: path.join(__dirname, 'lib', 'instantclient_12_2')
  });
}
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const database = helper.config("database");

async function getConnect(db = null){
    try {
        if (!database[db]) {
            throw new Error(`Database configuration for "${db}" not found`);
        }

        const dbConfig = { ...database[db] };
        const driver = dbConfig.driver;
        
        if (driver === "mysql") {
            delete dbConfig.driver;
            return await mysql2.createConnection({
                ...dbConfig,
                timezone: '+07:00',
                multipleStatements: true
            });
        } else if (driver === "oracle") {
            delete dbConfig.driver;
            return await oracledb.getConnection({
                ...dbConfig,
                logging: false,
            });
        } else {
            throw new Error(`Unsupported database driver: ${driver}`);
        }
    } catch (error) {
        console.error(`Error connecting to database "${db}":`, error.message);
        throw error;
    }
}

function getDriverType(connection) {
    if (connection.constructor.name === 'Connection') {
        return 'oracle';
    } else if (connection.constructor.name === 'PromiseConnection') {
        return 'mysql';
    }
    return 'unknown';
}

async function safeClose(connection, connName = 'connection') {
    if (!connection) return;
    
    try {
        if (connection.constructor.name === 'Connection') {
            await connection.close();
        } else if (connection.end) {
            await connection.end();
        }
    } catch (error) {
        if (error.message && !error.message.includes('closed')) {
            console.error(`Error closing ${connName}:`, error.message);
        }
    }
}

async function upload({ 
        dbSrc=String, 
        sqlSrc="",
        querySrc="", 
        dbDest=String, 
        sqlDest="",
        queryDest="", 
        sqlPath=String, 
        fetchSize=10000, 
        uploadName="", 
        onProgress=null, 
        onComplete=null
}){
    let conSrc = null;
    let conDest = null;
    let totalInsert = 0;
    let totalData = 0;
    let streamEnded = false;
    let hasError = false;
    let querySource = null;
    let queryDestination = null;
    try {

        querySource = querySrc.length > 0 && querySrc !="" ? querySrc : helper.getSql(sqlPath, sqlSrc);
        queryDestination = queryDest.length > 0 && queryDest !="" ? queryDest : helper.getSql(sqlPath, sqlDest);

        conSrc = await getConnect(dbSrc);
        conDest = await getConnect(dbDest);

        const {rows: totData} = await conSrc.execute(`select count(*) "total" from(${querySource})`);
        totalData = totData.length > 0 ? totData[0].total : 0;

        const stream = conSrc.queryStream(querySource, [], {
            fetchArraySize: fetchSize,
            outFormat: oracledb.OUT_FORMAT_OBJECT,
        });

        let buffer = [];
        let columns;

        await new Promise((resolve, reject) => {
            stream.on("data", async (row) => {
                try {
                    stream.pause();
                    
                    if (!columns) {
                        columns = Object.keys(row);
                    }
                    
                    buffer.push(columns.map(c => row[c]));
                    totalInsert++;
                    
                    if (onProgress && typeof onProgress === 'function') {
                        onProgress({
                            message: `Processing upload ${uploadName} data.`,
                            totalInsert,
                            totalData
                        });
                    }
                    
                    if (buffer.length === fetchSize) {
                        await conDest.query(queryDestination, [buffer]);
                        buffer = [];
                    }

                    stream.resume();
                } catch (error) {
                    hasError = true;
                    stream.destroy(error);
                    reject(error);
                }
            });

            stream.on("end", async () => {
                try {
                    streamEnded = true;
                    
                    if (buffer.length > 0 && !hasError) {
                        await conDest.query(queryDestination, [buffer]);
                        buffer = [];
                    }

                    if (onComplete && typeof onComplete === 'function') {
                        onComplete({
                            success: true,
                            message: `Upload ${uploadName} completed successfully!`,
                            totalInsert,
                            totalData
                        });
                    }

                    resolve();
                } catch (error) {
                    hasError = true;
                    reject(error);
                }
            });
            
            stream.on("error", (error) => {
                hasError = true;
                reject(error);
            });
        });

    } catch (error) {
        hasError = true;
        
        if (onComplete && typeof onComplete === 'function') {
            onComplete({
                success: false,
                message: `Upload ${uploadName} error!`,
                error: error.message
            });
        }
        
        throw error;
        
    } finally {
        await safeClose(conSrc, `${uploadName} Source Connection`);
        await safeClose(conDest, `${uploadName} Destination Connection`);
    }
}


async function uploadMultiple({ 
        dbSrc=String, 
        sqlSrc="",
        querySrc="", 
        dbDest=String, 
        sqlDest="",
        tableDest="",
        queryDest="", 
        sqlPath=String, 
        fetchSize=10000, 
        uploadName="", 
        onProgress=null, 
        onComplete=null
}){
    let conSrc = null;
    let conDest = null;
    let totalInsert = 0;
    let totalData = 0;
    let streamEnded = false;
    let hasError = false;
    let querySource = null;
    let queryDestination = null;
    try {

        querySource = querySrc.length > 0 && querySrc !="" ? querySrc : helper.getSql(sqlPath, sqlSrc);
        queryDestination = queryDest.length > 0 && queryDest !="" ? queryDest : helper.getSql(sqlPath, sqlDest);

        conSrc = await getConnect(dbSrc);
        conDest = await getConnect(dbDest);

        const driverSrc = getDriverType(conSrc);
        const driverDest = getDriverType(conDest);
        let oracleColumn = [];

        if(driverDest=="oracle"){
            const {rows: oracleCol} = await conDest.execute(`SELECT column_id,column_name, data_type, data_length,owner FROM all_tab_columns WHERE table_name = '${tableDest}' ORDER BY column_id`);
            oracleColumn=oracleCol;
        }

        let stream=null;
        if(driverSrc=="mysql"){
            const [results, fields] = await conSrc.execute(`WITH src AS (
                ${querySource}
                ) 
                SELECT count(*) total FROM src`);
            totalData = results[0].total;
            stream = conSrc.connection.query(querySource).stream();
        }

        if(driverSrc == "oracle"){
            const {rows: totData} = await conSrc.execute(`select count(*) "total" from(${querySource})`);
            totalData = totData.length > 0 ? totData[0].total : 0;

            stream = conSrc.queryStream(querySource, [], {
                fetchArraySize: fetchSize,
                outFormat: oracledb.OUT_FORMAT_OBJECT,
            });
        }


        let buffer = [];
        let columns;

        await new Promise((resolve, reject) => {
            stream.on("data", async (row) => {
                try {
                    stream.pause();
                    
                    if (!columns) {
                        columns = Object.keys(row);
                    }
                    
                    buffer.push(columns.map(c => row[c]));
                    totalInsert++;
                    
                    if (onProgress && typeof onProgress === 'function') {
                        onProgress({
                            message: `Processing upload ${uploadName} data.`,
                            totalInsert,
                            totalData
                        });
                    }
                    
                    if (buffer.length === fetchSize) {
                        if(driverDest=="mysql"){
                            await conDest.query(queryDestination, [buffer]);
                        }
                        if(driverDest=="oracle"){
                            await conDest.executeMany(queryDestination, buffer, {autoCommit: true});
                        }
                        buffer = [];
                    }

                    stream.resume();
                } catch (error) {
                    hasError = true;
                    stream.destroy(error);
                    reject(error);
                }
            });
            
            stream.on("end", async () => {
                try {
                    streamEnded = true;
                    
                    if (buffer.length > 0 && !hasError) {
                        if(driverDest=="mysql"){
                            await conDest.query(queryDestination, [buffer]);
                        }
                        if(driverDest=="oracle"){
                            await conDest.executeMany(queryDestination, buffer, {autoCommit: true});
                        }
                        buffer = [];
                    }

                    if (onComplete && typeof onComplete === 'function') {
                        onComplete({
                            success: true,
                            message: `Upload ${uploadName} completed successfully!`,
                            totalInsert,
                            totalData
                        });
                    }

                    resolve();
                } catch (error) {
                    hasError = true;
                    reject(error);
                }
            });
            
            stream.on("error", (error) => {
                hasError = true;
                reject(error);
            });
        });

    } catch (error) {
        hasError = true;
        
        if (onComplete && typeof onComplete === 'function') {
            onComplete({
                success: false,
                message: `Upload ${uploadName} error!`,
                error: error.message
            });
        }
        
        throw error;
        
    } finally {
        await safeClose(conSrc, `${uploadName} Source Connection`);
        await safeClose(conDest, `${uploadName} Destination Connection`);
    }
}

async function uploadCsv({
        dbSrc=String, 
        sqlSrc="",
        querySrc="", 
        sqlPath=String, 
        dbDest=String, 
        tableSrc=String,
        setColumn=String,
        truncate=false,
        fetchSize=10000,
        uploadName="",
        onProgress=null, 
        onComplete=null
    }) {
    let conSrc = null;
    let conDest = null;
    let totalData = 0;
    let totalGetData = 0;
    let pathTemp = null;
    let hasError = false;
    let querySource=null;
    try {

        querySource = querySrc.length > 0 && querySrc !="" ? querySrc : helper.getSql(sqlPath, sqlSrc);

        const fileTemp = `${moment(new Date()).format("YYMMDDHHmmss")}.csv`;
        pathTemp = path.join(__dirname, "/temp", fileTemp);
        
        const writeStream = fs.createWriteStream(pathTemp, { flags: "w" });

        conSrc = await getConnect(dbSrc);
        
        const {rows: totData} = await conSrc.execute(`select count(*) "total" from(${querySource})`);
        totalData = totData.length > 0 ? totData[0].total : 0;

        const stream = conSrc.queryStream(querySource, [], {
            fetchArraySize: fetchSize,
            outFormat: oracledb.OUT_FORMAT_OBJECT,
        });

        let headerWritten = false;

        await new Promise((resolve, reject) => {
            stream.on("data", (row) => {
                try {
                    if (!headerWritten) {
                        writeStream.write(Object.keys(row).join(",") + "\n");
                        headerWritten = true;
                    }
                    
                    const line = Object.values(row)
                        .map((v) => (v === null ? "" : `"${String(v).replace(/"/g, '""')}"`))
                        .join(",");
                    writeStream.write(line + "\n");
                    totalGetData++;

                    if (onProgress && typeof onProgress === 'function') {
                        onProgress({
                            message: `Processing export data ${uploadName} to csv.`,
                            totalGetData,
                            totalData
                        });
                    }
                } catch (error) {
                    hasError = true;
                    stream.destroy(error);
                    reject(error);
                }
            });
            
            stream.on("end", () => {
                resolve();
            });
            
            stream.on("error", (error) => {
                hasError = true;
                reject(error);
            });
        });

        await new Promise(resolve => writeStream.end(resolve));
        
        await safeClose(conSrc, `${uploadName} Source Connection`);
        conSrc = null;
        
        if (totalGetData > 0 && !hasError) {
            conDest = await getConnect(dbDest);

            await conDest.query(`
                SET autocommit=0;
                SET unique_checks=0;
                SET foreign_key_checks=0;
            `);

            if (truncate) {
                if (onComplete && typeof onComplete === 'function') {
                    onComplete({
                        success: true,
                        message: `TRUNCATE TABLE ${tableSrc}`,
                    });
                }
                await conDest.query(`TRUNCATE TABLE ${tableSrc}`);
            }

            const setVar = Array.from({ length: setColumn.length }, (_, i) => `@var${i+1}`).join(", ");
            const SetCol = setColumn.map((r, i) => `${r} = NULLIF(@var${i+1}, '')`).join(", ");
            const sqlUpload = `
                LOAD DATA LOCAL INFILE '${pathTemp.replace(/\\/g, "\\\\")}'
                INTO TABLE ${tableSrc}
                FIELDS TERMINATED BY ',' 
                ENCLOSED BY '"'
                LINES TERMINATED BY '\n'
                IGNORE 1 ROWS
                (${setVar})
                SET ${SetCol}
            `;
            
            if (onComplete && typeof onComplete === 'function') {
                onComplete({
                    success: true,
                    message: `Process import data csv to table ${tableSrc}`,
                });
            }

            await conDest.query({
                sql: sqlUpload,
                infileStreamFactory: () => fs.createReadStream(pathTemp),
                timeout: 0
            });
            
            await conDest.query("COMMIT");

            if (onComplete && typeof onComplete === 'function') {
                onComplete({
                    success: true,
                    message: `Import/Upload ${uploadName} completed successfully.`,
                });
            }
        }

    } catch (error) {
        hasError = true;
        
        if (onComplete && typeof onComplete === 'function') {
            onComplete({
                success: false,
                message: `Upload ${uploadName} failed, errorMessage => ${error.message}`,
                error: error
            });
        }
        
        throw error;
        
    } finally {
        await safeClose(conSrc, `${uploadName} Source Connection`);
        await safeClose(conDest, `${uploadName} Destination Connection`);
        
        if (pathTemp && fs.existsSync(pathTemp)) {
            try {
                // fs.unlinkSync(pathTemp);
                console.log(`Temp file deleted: ${pathTemp}`);
            } catch (error) {
                console.error(`Error deleting temp file:`, error.message);
            }
        }
    }
}

function replaceParam(sql=null, param=null, bind=null){
    return sql.replace(new RegExp(`{{${param}}}`, 'g'), bind);
}

function normalizeValue(value, maxLength) {
    if (value == null) return null;

    if (typeof value === 'string' && maxLength) {
        if (value.length > maxLength) {
            return value.substring(0, maxLength);
        }
    }
    return value;
}

module.exports = {
    oracledb,
    getConnect,
    getDriverType,
    replaceParam,
    upload,
    uploadCsv,
    uploadMultiple
};
const { ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const logger = require("./logger");

module.exports = {
    config(obj){
        const cfg = {
            appName: "Atoreps",
            appDescription: "Automations Reports Systems",
            version: "2.3.5",
            autoUpdate: false,
            pathApp: __dirname,
            pathReport: "C:/Atoreps Report/",
            autoStart: true,
            cloudWms: "172.24.129.167",
            ftpHostPrimary: "192.168.0.90",
            ftpHostSecondary: "103.146.58.17",
            ftpDefaultUser: "dcbal",
            ftpDefaultPass: "dcb",
            ftpDefaultDir: "/File_Sharing/DC_Balaraja/Atoreps Report",
            location: "DC MPPA",
            emailAccount: {
                dc_report: {
                    emailName: "DC Reports",
                    emailUser: "dc.reports",
                    emailPass: this.getJSON("emailPassword", "dc_report"),
                    emailAddress: "dc.reports@hypermart.co.id"
                },
                tms_admin: {
                    emailName: "TMS Admin",
                    emailUser: "tms.admin",
                    emailPass: this.getJSON("emailPassword", "tms_admin"),
                    emailAddress: "tms.admin@hypermart.co.id"
                },
            },
            database:{
                atoreps: {
                    user: "dcmppa",
                    password: "dcmppa@2023",
                    host: "172.18.1.249",
                    port: "3306",
                    database: "atoreps",
                    driver: "mysql",
                },
                precise: {
                    user: "mppa",
                    password: "Qe32024",
                    host: "192.168.209.56",
                    port: "3306",
                    database: "precise",
                    driver: "mysql",
                },
                tms_prod: {
                    user: "mppa",
                    password: "Qe32024",
                    host: "192.168.209.56",
                    port: "3306",
                    database: "tms_prod",
                    driver: "mysql",
                },
                wise: {
                    user: "mppa",
                    password: "Qe32024",
                    host: "192.168.209.56",
                    port: "3306",
                    database: "wise",
                    driver: "mysql",
                },
                efaktur: {
                    user: "mppa",
                    password: "Qe32024",
                    host: "192.168.209.56",
                    port: "3306",
                    database: "efaktur",
                    driver: "mysql",
                },
                dcbal: {
                    user: "admtg",
                    password: "fior3",
                    connectionString: "(DESCRIPTION =(ADDRESS = (PROTOCOL = TCP)(HOST = 172.18.1.251)(PORT = 1521)) (CONNECT_DATA = (SERVER = DEDICATED)(SERVICE_NAME = dcbal)))",
                    driver: "oracle",
                },
                wms: {
                    user: "MATHWMPROD_RO",
                    password: "C651qi_5#Pcd_q",
                    connectionString: "(DESCRIPTION =(ADDRESS = (PROTOCOL = TCP)(HOST = 172.24.129.167)(PORT = 1521)) (CONNECT_DATA = (SERVER = DEDICATED)(SERVICE_NAME = MATHPDB.DB)))",
                    driver: "oracle",
                },
                rms: {
                    user: "rmsprdsm",
                    password: "u8kj31js",
                    connectionString: "(DESCRIPTION =(ADDRESS = (PROTOCOL = TCP)(HOST = 192.168.200.10)(PORT = 1521)) (CONNECT_DATA = (SERVER = DEDICATED)(SID = rmsprdsm)))",
                    driver: "oracle",
                },
                rmsitdc: {
                    user: "MPPAITDC",
                    password: "dctim1234",
                    connectionString: "(DESCRIPTION =(ADDRESS = (PROTOCOL = TCP)(HOST = 192.168.200.10)(PORT = 1521)) (CONNECT_DATA = (SERVER = DEDICATED)(SID = rmsprdsm)))",
                    driver: "oracle",
                },
                dccib: {
                    user: "CBTBA",
                    password: "cbtba",
                    connectionString: "(DESCRIPTION = (ADDRESS_LIST = (ADDRESS = (PROTOCOL = TCP)(HOST = 172.25.172.250)(PORT = 1521)))(CONNECT_DATA = (SERVICE_NAME = DCFRESH)(SERVER=DEDICATED)))",
                    driver: "oracle",
                },
            }
        }
        return cfg[obj]
    },
    startUp(){
        const logs = `+=======================================+\n` +
                    `|               [${this.config("appName")}]               |\n` +
                    `|      Automations Report Systems       |\n` +
                    `|        Version Ware : ${this.config("version")}           |\n` +
                    `+=======================================+\n` +
                    `Application starting ...\n` +
                    `Application is ready ...\n` +
                    `--- Standby ---\n`;
        ipcMain.emit("sendLogs", null, logs);
    },
    standBy(){
        ipcMain.emit('sendInfo', null, 'INFO : Application dalam mode Standby. Dilarang keras merubah format tanggal & jam pada komputer yang digunakan, menutup / close server ini!!!')
    },
    sendLogs(logs="", isTime=false){
        logger.info(logs);
        ipcMain.emit("sendLogs", null, isTime ? moment(new Date()).format("YYYY-MM-DD HH:mm:ss")+`  ${logs}` : logs);
    },
    sendInfo(info=""){
        // logger.info(info);
        ipcMain.emit('sendInfo', null, info)
    },
    async createPath(path){
        if (!fs.existsSync(path)) {
            fs.mkdir(path, { recursive: true, }, (err) => { });
        }
    },
    getJSON(fileName, obj=null){
        const jsonFile = JSON.parse(fs.readFileSync(path.resolve(__dirname, `${fileName}.json`), "utf8"));
        return obj!=null ? jsonFile[obj] : jsonFile;
    },
    getSql(pathSql, fileName){
        return fs.readFileSync(path.resolve(__dirname, `sql`, pathSql, fileName), "utf8");
    },
    CronTrigger(date, type, options = {}) {
        const d = new Date(date);

        const minute     = d.getMinutes().toString().padStart(2, '0');      // 01-60
        const hour       = d.getHours().toString().padStart(2, '0');        // 00-24
        const dayOfMonth = d.getDate().toString().padStart(2, '0');        // 01-31
        const month      = (d.getMonth() + 1).toString().padStart(2, '0'); // 01-12
        const dayOfWeek  = d.getDay();                                     // Tetap 0 (karena ini index hari)

        switch (type) {
            case "minute": {
                if (options.interval) {
                    return `*/${options.interval} * * * *`;
                }
                return `*/${minute} * * * *`;
            }
            case "hour": {
                return `${minute} * * * *`;
            }
            case "hour-minute": {
                return `${minute} ${hour} * * *`;
            }
            case "daily": {
                return `${minute} ${hour} * * *`;
            }
            case "weekly": {
                return `${minute} ${hour} * * ${dayOfWeek}`;
            }
            case "monthly": {
                return `${minute} ${hour} ${dayOfMonth} * *`;
            }
            case "yearly": {
                return `${minute} ${hour} ${dayOfMonth} ${month} *`;
            }
            case "weekday": {
                return `${minute} ${hour} * * 1-5`;
            }

            default:
                throw new Error(`Invalid cron type: ${type}`);
        }
    }
}
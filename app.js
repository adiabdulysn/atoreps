const {   
    app,
    BrowserWindow,
    ipcMain,
    Tray,
    Menu,
    Notification,
    dialog
} = require('electron');
const cron = require("node-cron");
const path = require('node:path');
const fs = require('fs');
process.env.TZ = "Asia/Jakarta";

let win;
let tray = null;
const ipc = ipcMain;

const helper = require("./helper");
const scheduler = require("./scheduler"); 

app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");

const createWindow = async () => {
    win = new BrowserWindow({
        width: 890,
        height: 595,
        show: false,
        autoHideMenuBar: true,
        resizable: false,
        fullscreen: false,
        frame: false,
        devTools: true,
        titleBarStyle: "hidden",
        transparent: true,
        webPreferences: {
            contextMenu: false,
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, "ui/preload.js"),
        },
        focusable: true,
        title: helper.config("appName"),
        icon: path.join(__dirname, "assets/img/logo.ico"),
    });

    win.loadFile("ui/main.html");

    win.once("ready-to-show", () => {
        win.show();
    });

    win.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'I' && input.ctrl && input.shift) {
        event.preventDefault();
        }
    });

    app.setAppUserModelId(helper.config("appName"));

    let showNotification = function (title, body) {
        new Notification({
            icon: `./assets/img/logo-32x32.png`,
            title: title,
            body: body,
        }).show();
    };

    ipc.handle("down-icon", (event, data) => {
        if (data.status == "down") {
            win.setIcon(path.join(__dirname, "assets/img/logo-red.ico"));
        } else {
            win.setIcon(path.join(__dirname, "assets/img/logo.ico"));
        }
    });

    ipc.handle("notify", (event, data) => {
        showNotification(data.title, data.message);
    });

    ipc.handle("min", () => {
        tray = new Tray("assets/img/tray.png");
        const template = [
            {
                label: app_name,
                icon: "assets/img/tray.png",
                enabled: false,
            },
            {
                type: "separator",
            },
            {
                label: "Show Apps",
                click: function () {
                win.show();
                tray.destroy();
                },
            },
            {
                label: "Close Apps",
                click: function () {
                win.close();
                },
            }
        ];
        const contextMenu = Menu.buildFromTemplate(template);
        tray.setContextMenu(contextMenu);
        tray.setToolTip(app_name);
        win.hide();
    });

    ipc.handle("reload", () => {
        app.quit();
        app.relaunch();
    });

    ipc.on('sendLogs', (event, message) => {
        win.webContents.send('sendLogs', message);
    });
    
    ipc.on('sendInfo', (event, message) => {
        win.webContents.send('sendInfo', message);
    });
    
    
    win.on("system-context-menu", (e) => {
        e.preventDefault();
    });
    
    // win.on("blur", () => {
    //     win.focus();
    // })
    win.on("closed", () => {
        win = null;
    });
}

const LockApp = app.requestSingleInstanceLock();
if (!LockApp) {
  app.quit();
} else {
  app.whenReady().then(async () => {
      createWindow();

      setTimeout(async () => {
          helper.standBy();
          helper.startUp();
    },1000);

    setTimeout(async () => {
          await scheduler.run();
    },2000);


    cron.schedule("*/2 * * * *", async() => {
        win.focus();
        win.show();
    })

  });
}

setInterval(() => {
    if (win && win.webContents && win.webContents.isCrashed()) {
        helper.sendLogs("Renderer crashed, reloading UI...");
        win.reload();
    }
}, 5000);

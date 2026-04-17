const { ipcRenderer } = require("electron");
const ping = require("ping");
const moment = require("moment-timezone");
moment.tz.setDefault("Asia/Jakarta");
const path = require("path");
const helper = require("../helper.js")
var $ = require("jquery");

var interVal = 0;
var HostPrimary = helper.config("cloudWms");
var HostSecondary = helper.config("ftpHostPrimary");

document.getElementById("app_name").innerHTML = helper.config("appDescription");
document.getElementById("location").innerHTML = helper.config("location");
document.getElementById("version").innerHTML = helper.config("version");

$(".header").on("mousemove", function () {
  $(".header").css({
    "-webkit-app-region": "drag",
  });
  $(".header").css({
    opacity: "0.8",
  });
  $(".content").css({
    opacity: "0.8",
  });
});
$(".header").on("mouseup", function () {
  $(".header").css({
    opacity: "",
    "-webkit-app-region": "",
  });
  $(".content").css({
    opacity: "",
  });
});
$(".header").on("mousedown", function () {
  $(".header").css({
    opacity: "",
    "-webkit-app-region": "",
  });
  $(".content").css({
    opacity: "",
  });
});
$(".content, .header").on("mouseover", function () {
  $(".header").css({
    opacity: "",
    "-webkit-app-region": "",
  });
  $(".content").css({
    opacity: "",
  });
});

function Minimize() {
  ipcRenderer.invoke("min");
  ipcRenderer.invoke("notify", {
    icon: "info",
    title: "Information",
    message: "Minimaze to system Tray",
  });
}

function Reload() {
  ipcRenderer.invoke("notify", {
    icon: "info",
    title: "Information",
    message: "Restart",
  });
  ipcRenderer.invoke("reload");
}

function PingHost() {
  /* Database Ping */
  var hosts = [HostPrimary, HostSecondary];
  hosts.forEach(function (host) {
    ping.sys.probe(host, function (isAlive) {
      if (isAlive == true) {
        if (host == HostPrimary) {
          document.getElementById("host_primary").innerHTML = '<span style="color: #00cc99;">ONLINE</span>';
          ipcRenderer.invoke("down-icon", {
            status: "up",
          });
        }
        if (host == HostSecondary) {
          document.getElementById("host_secondary").innerHTML = '<span style="color: #00cc99;">ONLINE</span>';
        }
      } else {
        if (host == HostPrimary) {
          document.getElementById("host_primary").innerHTML = '<span style="color: #ff0000;">OFFLINE</span>';
            ipcRenderer.invoke("down-icon", {
                status: "down",
            });
        }
        if (host == HostSecondary) {
          document.getElementById("host_secondary").innerHTML = '<span style="color: #ff0000;">OFFLINE</span>';
        }
      }
    });
  });
}

ipcRenderer.on("sendLogs", (event, message) => {
    var logs = document.getElementById("logs").value;
    document.getElementById("logs").value = logs + message + "\n";
    var focus = document.getElementById("logs");
    focus.scrollTop = focus.scrollHeight;
});

ipcRenderer.on("sendInfo", (event, message) => {
    document.getElementById("info").innerHTML = message;
});

setInterval(() => {
  interVal++;
  document.getElementById("clock").innerHTML = moment().format("HH:mm:ss");
  document.getElementById("date").innerHTML = moment().format("DD MMMM YYYY");
  PingHost();
  if (interVal > 2800) {
    interVal = 0;
    document.getElementById("logs").value = "";
    document.getElementById("info").innerHTML = "";
  }
}, 1000);


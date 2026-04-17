const nodemailer = require("nodemailer");
const ntlm = require('nodemailer-ntlm-auth');
const helper = require("./helper");
const moment = require("moment");

module.exports = {
    async send({
        to = String,
        cc = String,
        subject = String,
        message = String,
        attachments = [],
        account = "dc_report"
    }){
        try {
            const emailAccount = helper.config("emailAccount");
            const { emailName, emailUser, emailPass, emailAddress } = emailAccount[account];
            const transporter = nodemailer.createTransport({
                auth: {
                    type: 'custom',
                    method: 'NTLM',
                    user: emailUser,
                    pass: emailPass,
                    options: {
                        domain: "mfb"
                    }
                },
                customAuth: {
                    NTLM: ntlm
                },
                host: '192.168.209.101',
                port: 587,
                secure: false,
                requireTLS: false,
                tls: { rejectUnauthorized: false },
                debug: true,
            });
            const template = `<style>
                            p,h1,h2,h3,h4,h5,h6,table, tr, td { font-family: Calibri, sans-serif; font-size: 14px;}
                            p,h1,h2,h3,h4,h5,h6 {margin: 4px 0px; font-size: 14px;}
                            .mail-body{
                                font-family: Calibri, sans-serif;
                                font-size: 14px;
                                margin:0 0 0 0.8ex;
                                padding-left:1ex;
                                border-left:1px solid #CCCCCC;
                                display: block;
                                width: 100%;
                            }
                        </style>
                        <div class="mail-body">
                            ${message}
                            <br/>
                            <p>Demikian yang dapat kami sampaikan atas perhatiannya kami ucapkan terima kasih.</p>
                            <br>
                            -Support System-
                            <br><br>
                            Print Date : ${moment(new Date()).format("YYYY-MM-DD HH:mm:ss")}
                            <br>
                            <font color=red> Catatan : Email ini di buat oleh Komputer, Mohon Jangan Membalas email ini !</font>
                        </div>
                        `;
            await transporter.sendMail({
                from: `${emailName} <${emailAddress}>`,
                to: to,
                cc: `${emailAddress}, ${cc}`,
                subject: subject,
                html: template,
                attachments: attachments
            });

            await transporter.close();
            
            return true;

        } catch (error) {
            throw error;
        }
    },

    tableFormat(data = []){

        let thead = "";
        let tbody = "";

        Object.entries(data[0]).forEach(([key, value]) => {
            thead += `<th>${key}</th>`;
        });

        data.forEach((row) => {
            tbody += "<tr>";
            Object.entries(row).forEach(([key, value]) => {
                tbody += `<td>${value}</td>`;
            });
            tbody += "</tr>";
        })

        let style = `<style>
            .table {
                font-family: Arial, Helvetica, sans-serif;
                border-collapse: collapse;
                color: #000;
                font-size: 11px;
            }
            .table tr th {
                border: 1px solid #000;
                padding: 5px;
                color: #000;
            }
            .table tr td {
                border: 1px solid #000;
                padding: 3px;
                color: #000;
            }
        </style>`

        let table = `
        ${style}
        <table class="table">
                    <thead>
                        <tr>${thead}</tr>
                    </thead>
                    <tbody>
                        ${tbody}
                    </tbody>
                </table>`
        return table;
    }
}
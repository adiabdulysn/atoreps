const excel = require("exceljs");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const helper = require("./helper");

module.exports = {
    async xlsx(pathReport = String, fileName = String, data = []) {
        try {
            const workbook = new excel.Workbook();
            helper.createPath(pathReport);

            for (const sh of data) {
                const worksheet = workbook.addWorksheet(sh.sheetName);
                const keys = sh.data.length > 0 ? Object.keys(sh.data[0]) : [];
                
                const columns = keys.map(key => ({
                    header: key.replace(/_/g, ' ').toUpperCase(),
                    key: key,
                    width: 15
                }));
                worksheet.columns = columns;
                worksheet.addRows(sh.data);

                worksheet.eachRow((row, rowNumber) => {

                    row.eachCell((cell, colNumber) => {
                        cell.font = {
                            size: 10,
                            name: 'Calibri'
                        };
                        const value = cell.value;
                        
                        if (value === null || value === undefined) {
                            return;
                        }

                        if (value instanceof Date) {
                            cell.numFmt = 'mm/dd/yyyy hh:mm:ss';
                        } else if (typeof value === 'string' && this.isDateString(value)) {
                            const dateValue = moment.utc(value).local();
                            if (dateValue.isValid()) {
                                cell.value = dateValue.toDate();
                                cell.numFmt = value.includes(':') ? 'yyyy-mm-dd hh:mm:ss' : 'yyyy-mm-dd';
                            }
                            /* if (!isNaN(dateValue.getTime())) {
                                cell.value = dateValue;
                                if (value.includes(':')) {
                                    cell.numFmt = 'mm/dd/yyyy hh:mm:ss';
                                } else {
                                    cell.numFmt = 'mm/dd/yyyy';
                                }
                            } */
                        }else if (typeof value === 'number') {
                            if (Number.isInteger(value)) {
                                cell.numFmt = '0';
                            } else {
                                const decimalPlaces = this.getDecimalPlaces(value);
                                if (decimalPlaces > 0) {
                                    cell.numFmt = '0.' + '0'.repeat(Math.min(decimalPlaces, 4));
                                } else {
                                    cell.numFmt = '0';
                                }
                            }
                            cell.alignment = { horizontal: 'right' };
                        }else if (typeof value === 'string' && this.isNumericString(value)) {
                            const numValue = parseFloat(value.replace(/,/g, ''));
                            if (!isNaN(numValue)) {
                                cell.value = numValue;
                                if (Number.isInteger(numValue)) {
                                    cell.numFmt = '0';
                                } else {
                                    const decimalPlaces = this.getDecimalPlaces(numValue);
                                    cell.numFmt = '0.' + '0'.repeat(Math.min(decimalPlaces, 4));
                                }
                                cell.alignment = { horizontal: 'right' };
                            }
                        }else {
                            cell.alignment = { horizontal: 'left' };
                        }
                    });

                });

                worksheet.columns.forEach(column => {
                    let maxLength = 0;
                    column.eachCell({ includeEmpty: true }, cell => {
                        let columnLength = 10;
                        if (cell.value) {
                            if (cell.value instanceof Date) {
                                columnLength = 20;
                            } else {
                                columnLength = cell.value.toString().length;
                            }
                        }
                        if (columnLength > maxLength) {
                            maxLength = columnLength;
                        }
                    });
                    column.width = Math.min(maxLength + 2, 50);
                });

                worksheet.views = [
                    {
                        state: "frozen",
                        ySplit: 1,
                        xSplit: 0,
                        topLeftCell: "A2",
                        activeCell: "A2",
                    },
                ];
            }

            const locationSave = path.resolve(pathReport, fileName);
            await workbook.xlsx.writeFile(locationSave);
            
            return {pathReport, fileName};
        } catch (error) {
            throw error;
        }
    },

    isDateString(value) {
        const datePatterns = [
            /^\d{4}-\d{2}-\d{2}/, // ISO: 2024-12-25
            /^\d{2}\/\d{2}\/\d{4}/, // 25/12/2024
            /^\d{2}-\d{2}-\d{4}/, // 25-12-2024
            /^\d{4}\/\d{2}\/\d{2}/, // 2024/12/25
        ];
        
        return datePatterns.some(pattern => pattern.test(value));
    },

    isNumericString(value) {
        return /^-?[\d,]*\.?\d+$/.test(value.trim());
    },

    getDecimalPlaces(num) {
        const match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
        if (!match) return 0;
        return Math.max(
            0,
            (match[1] ? match[1].length : 0) - (match[2] ? +match[2] : 0)
        );
    },

    async csv(pathReport = String, fileName = String, data = []) {
        try {
            helper.createPath(pathReport);

            const writeStream = fs.createWriteStream(path.join(pathReport, fileName), { flags: "w" });
            writeStream.write(Object.keys(data[0]).join(",") + "\n");

            for (const row of data) {
                const line = Object.values(row).map((v) => {
                    if (v === null || v === undefined) return "";
                    
                    if (v instanceof Date) {
                        return `"${v.toISOString()}"`;
                    }
                    
                    return `"${String(v).replace(/"/g, '""')}"`;
                }).join(",");
                writeStream.write(line + "\n");
            }
            
            await new Promise(resolve => writeStream.end(resolve));
            return {pathReport, fileName};
        } catch (error) {
            throw error;
        }
    },

    async readExcelFile(fullPath="", sheetName=""){
        try {
            const filepath = path.join(__dirname, fullPath);
            const workbook = new excel.Workbook();
            await workbook.xlsx.readFile(filepath);
            const worksheet = workbook.getWorksheet(sheetName) || workbook.getWorksheet(1);

            let data = [];
            let headers = [];
            worksheet.getRow(1).eachCell((cell, cn) => {
                headers[cn] = cell.value;
            })
            if(worksheet){
                worksheet.eachRow({includeEmpty: true}, (row, rn) => {
                    if(rn > 1){
                        const rowData = {};
                        row.eachCell({includeEmpty: true}, (cell, cn) => {
                            const header = headers[cn];
                            rowData[header] = cell.result !== undefined ? cell.result : cell.value;
                        });
                        data.push(rowData);
                    }
                })
            }
            return data;
        } catch (error) {
            throw error;
        }
    }
}
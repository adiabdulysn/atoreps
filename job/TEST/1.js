const ExcelJS = require('exceljs');
const lodash = require("lodash");
const helper = require("../../helper");

(async () => {
    const data = helper.getJSON("summary");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Summary');

    const groupDc = lodash.groupBy(data, 'dc');
    let currentRow = 1;

    for (const dc in groupDc) {
        // 1. TULIS TITLE/HEADER (Style Blue)
        const headerRow = sheet.getRow(currentRow);
        headerRow.values = ["DC", "DC Name", "Dept", "Cancel Type", "SKU", "Qty Cancel", "Values"];
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '497ac9' } }; // Warna biru
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.border = { top: {style:'thin', color: {argb: '497ac9'}}, left: {style:'thin', color: {argb: '497ac9'}}, bottom: {style:'thin', color: {argb: '497ac9'}}, right: {style:'thin', color: {argb: '497ac9'}} };
        });

        const startGroupRow = currentRow + 1;
        let dataRow = startGroupRow;

        const groupDept = lodash.groupBy(groupDc[dc], "dept");
        
        for (const dept in groupDept) {
            const startDeptRow = dataRow;

            groupDept[dept].forEach((row) => {
                sheet.getCell(dataRow, 1).value = row.dc;
                sheet.getCell(dataRow, 2).value = row.dc_name;
                sheet.getCell(dataRow, 3).value = row.dept;
                sheet.getCell(dataRow, 4).value = row.cancel_type;
                sheet.getCell(dataRow, 5).value = row.sku;
                sheet.getCell(dataRow, 6).value = row.qty_cancel;
                sheet.getCell(dataRow, 7).value = row.value;

                // Border untuk setiap cell detail
                for(let i=1; i<=7; i++) {
                    sheet.getCell(dataRow, i).border = { top: {style:'thin', color: {argb: '497ac9'}}, left: {style:'thin', color: {argb: '497ac9'}}, bottom: {style:'thin', color: {argb: '497ac9'}}, right: {style:'thin', color: {argb: '497ac9'}} };
                    if(i >= 5) sheet.getCell(dataRow, i).numFmt="#,##0"
                }
                dataRow++;
            });

            // 2. MERGE DEPT (Kolom C)
            if (dataRow - 1 > startDeptRow) {
                sheet.mergeCells(startDeptRow, 3, dataRow - 1, 3);
            }
        }

        // 3. MERGE DC & DC NAME (Kolom A & B)
        sheet.mergeCells(startGroupRow, 1, dataRow - 1, 1);
        sheet.mergeCells(startGroupRow, 2, dataRow - 1, 2);
        
        // Alignment agar teks di tengah hasil merge
        [1, 2, 3].forEach(col => {
            sheet.getCell(startGroupRow, col).alignment = { vertical: 'top', horizontal: 'left' };
        });

        // 4. GRAND TOTAL BARIS
        const totalRow = sheet.getRow(dataRow);
        totalRow.getCell(1).value = "Grand Total";
        sheet.mergeCells(dataRow, 1, dataRow, 4); // Merge A sampai D
        
        // Formula SUM Otomatis
        totalRow.getCell(5).value = { formula: `SUM(E${startGroupRow}:E${dataRow-1})` };
        totalRow.getCell(6).value = { formula: `SUM(F${startGroupRow}:F${dataRow-1})` };
        totalRow.getCell(7).value = { formula: `SUM(G${startGroupRow}:G${dataRow-1})` };

        totalRow.eachCell(cell => {
            cell.font = { bold: true, color: { argb: '000000' } };
            cell.border = { top: {style:'thin', color: {argb: '497ac9'}}, left: {style:'thin', color: {argb: '497ac9'}}, bottom: {style:'thin', color: {argb: '497ac9'}}, right: {style:'thin', color: {argb: '497ac9'}} };
            cell.numFmt="#,##0"
        });

        currentRow = dataRow + 3; // Beri jarak 1 baris kosong antar DC
    }

    // Auto-fit Column Width
    sheet.columns.forEach(column => {
        column.width = 15;
    });

    await workbook.xlsx.writeFile("Order Summary2.xlsx");
    console.log("File Created!");
})();
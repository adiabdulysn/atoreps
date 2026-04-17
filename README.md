# atoreps (Automation Report Systems)

**atoreps** adalah aplikasi otomasi berbasis Node.js yang dirancang untuk menangani pembuatan laporan (Reporting) dan sinkronisasi data (ETL - Extract, Transform, Load) antar sistem database perusahaan secara otomatis dan terjadwal.

## 🚀 Fitur Utama

- **Otomasi Laporan:** Menghasilkan laporan dalam format Excel (`.xlsx`) dan PDF (via JasperReports).
- **Sinkronisasi Data (ETL):** Pemindahan data skala besar antar database (Oracle ke MySQL) menggunakan metode Streaming dan CSV Upload.
- **Distribusi Multi-Channel:** Pengiriman otomatis hasil laporan melalui Email (SMTP/NTLM) dan FTP Server.
- **Penjadwalan Dinamis:** Pengaturan jadwal tugas (scheduler) yang dikelola melalui file konfigurasi Excel (`taskScheduler.xlsx`).
- **Antarmuka Desktop:** Dibangun dengan Electron untuk memudahkan monitoring log dan status aplikasi secara real-time.

## 🛠️ Teknologi & Stack

- **Runtime:** Node.js
- **Frontend/UI:** Electron (HTML/CSS/JS)
- **Database Sources:** Oracle (WMS, RMS, DCBAL) & MySQL (WISE, TMS, EFAKTUR)
- **Reporting Engine:** JasperReports (via JasperStarter) & ExcelJS
- **Transport:** Nodemailer (Email) & basic-ftp (FTP)

## 📁 Struktur Folder Utama

- `/job`: Berisi logika bisnis (script) untuk setiap tugas otomasi.
- `/sql`: Kumpulan query SQL mentah yang diorganisir berdasarkan sistem.
- `/jasper`: Template laporan JasperReports (`.jrxml` & `.jasper`).
- `/lib`: Library eksternal (Oracle Instant Client & JasperStarter).
- `/ui`: File sumber untuk antarmuka grafis Electron.
- `dbase.js`: Core module untuk manajemen koneksi database dan fungsi upload data.
- `helper.js`: Utilitas pendukung dan konfigurasi global aplikasi.
- `scheduler.js`: Logika pengatur waktu yang membaca konfigurasi dari Excel.

## 🔄 Alur Kerja Aplikasi (Application Flow)

Aplikasi beroperasi mengikuti siklus berikut:

1.  **Initialization (Startup):** 
    - Aplikasi membaca konfigurasi dari `helper.js`.
    - `scheduler.js` memuat daftar tugas dari `taskScheduler.xlsx`.
    - Aplikasi mendaftarkan trigger Cron berdasarkan waktu yang ditentukan di Excel.

2.  **Triggering:**
    - Saat waktu yang dijadwalkan tiba, Scheduler memanggil fungsi spesifik di dalam folder `/job`.

3.  **Data Processing (The Job):**
    - **Extraction:** Job membuka koneksi ke database sumber (misal: Oracle WMS) dan mengambil data menggunakan SQL dari folder `/sql`.
    - **Transformation/Processing:** 
        - Jika tugasnya adalah **Reporting**, data diproses menjadi file Excel melalui `ExcelApp.js` atau PDF melalui `jasper.js`.
        - Jika tugasnya adalah **ETL**, data disiapkan untuk dipindahkan (langsung atau via file CSV sementara).
    - **Loading/Upload:** Data hasil ETL dimasukkan ke database target (misal: MySQL WISE).

4.  **Distribution:**
    - File laporan yang berhasil dibuat akan disimpan di folder lokal (default: `C:/Atoreps Report/`).
    - File tersebut secara otomatis diunggah ke folder sharing di **FTP Server**.
    - Link FTP atau file fisik dikirim sebagai lampiran melalui **Email** ke daftar distribusi yang ditentukan.

5.  **Logging & Cleanup:**
    - Status keberhasilan atau kegagalan dicatat ke dalam `logs/` dan ditampilkan di UI.
    - Aplikasi kembali ke mode **Standby** menunggu jadwal berikutnya.

## 📖 User Guide: Menambahkan Job Baru

Ikuti langkah-langkah berikut untuk menambahkan otomasi laporan atau ETL baru ke dalam sistem:

### Langkah 1: Siapkan Query SQL
Simpan query SQL Anda di folder `sql/` sesuai modulnya. Gunakan parameter `{{PARAM}}` jika diperlukan.
*   Lokasi: `sql/report/nama_report.sql`

### Langkah 2: Buat Script Job
Buat file JavaScript di folder `job/`. Anda bisa menyontek pola dari `job/Soh.js`.
```javascript
const { getConnect } = require("../dbase");
const helper = require("../helper");
const ExcelApp = require("../ExcelApp");
const mail = require("../mail");

async function MyNewReport() {
    const db = await getConnect("wms");
    const sql = helper.getSql("report", "nama_report.sql");
    const { rows } = await db.execute(sql);
    
    if (rows.length > 0) {
        const path = "C:/Atoreps Report/MyFolder";
        const xlsx = await ExcelApp.xlsx(path, "Report.xlsx", [{ sheetName: "Data", data: rows }]);
        await mail.send({ 
            to: "user@example.com", 
            subject: "New Report", 
            message: "Terlampir report terbaru.",
            attachments: [{ filename: xlsx.fileName, path: xlsx.pathReport + "/" + xlsx.fileName }]
        });
    }
    await db.close();
}

module.exports = { MyNewReport };
```

### Langkah 3: Konfigurasi di Excel (taskScheduler.xlsx)
Buka file `taskScheduler.xlsx` dan tambahkan baris pada sheet **job**:
| Kolom | Deskripsi | Contoh |
|---|---|---|
| **enable** | Status job (1=Aktif, 0=Nonaktif) | `1` |
| **description** | Nama tampilan di log aplikasi | `Kirim Report Stok` |
| **file** | Path file script (dari root) | `job/MyNewJob.js` |
| **module** | Nama fungsi yang akan dipanggil | `MyNewReport` |
| **trigger** | Tipe interval | `daily` |
| **cron** | Jadwal eksekusi (Format Cron) | `0 08 * * *` (Setiap jam 8 pagi) |

### Langkah 4: Restart Aplikasi
Aplikasi akan membaca ulang konfigurasi Excel saat pertama kali dijalankan. Restart aplikasi untuk mengaktifkan job baru.

## ⚙️ Persyaratan Sistem

- **Node.js:** Versi 16.x atau lebih tinggi.
- **Oracle Instant Client:** Diperlukan untuk koneksi ke database Oracle (sudah disertakan di `/lib/instantclient_12_2`).
- **Java JRE:** Diperlukan untuk menjalankan modul JasperStarter.
- **Akses Network:** Pastikan aplikasi memiliki akses ke IP database, server SMTP, dan server FTP yang terdaftar di konfigurasi.

---
*Developed as an internal tool for Automation Report Systems.*

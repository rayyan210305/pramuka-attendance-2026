# PRAMUKA ATTENDANCE SYSTEM 2026

## Project Specification --- Event-Based Barcode Attendance

> Dokumen ini adalah blueprint teknis dan desain untuk digunakan sebagai
> konteks utama oleh Antigravity saat membangun project.

------------------------------------------------------------------------

# 1. Project Overview

**Nama Project:** Pramuka Attendance System 2026

**Konsep utama:** Sistem absensi digital berbasis Barcode/QR pada ID
Card peserta. Barcode dipindai menggunakan kamera laptop melalui
browser. Setelah barcode berhasil dibaca, sistem mengambil data peserta
dari database dan mencatat kehadiran berdasarkan **kegiatan yang sedang
aktif**.

Sistem menggunakan konsep **Event-Based Attendance System**, sehingga
satu peserta dapat memiliki banyak record absensi dalam satu hari
berdasarkan kegiatan, lomba, atau event yang diikuti.

Contoh:

``` text
PRAMUKA EVENT 2026
│
├── 05 Agustus 2026
│   ├── Upacara Pembukaan
│   ├── Materi Kepramukaan
│   ├── Lomba Pionering
│   ├── Lomba Semaphore
│   └── Penutupan
│
└── 06 Agustus 2026
    ├── Kegiatan A
    ├── Kegiatan B
    └── Lomba C
```

Peserta harus melakukan scan pada setiap kegiatan yang membutuhkan
absensi.

------------------------------------------------------------------------

# 2. Tujuan Project

Project bertujuan untuk:

1.  Menggantikan proses absensi manual menggunakan kertas.
2.  Mempercepat proses registrasi kehadiran peserta.
3.  Mengurangi kesalahan pencatatan.
4.  Memanfaatkan ID Card peserta sebagai identitas digital.
5.  Memungkinkan satu peserta memiliki banyak absensi berdasarkan
    kegiatan.
6.  Menyediakan dashboard monitoring kehadiran secara real-time.
7.  Menyediakan histori dan rekap kehadiran.
8.  Memudahkan panitia mencari peserta yang sudah atau belum hadir.
9.  Mendukung kegiatan reguler, event, dan lomba dalam satu sistem.
10. Menghasilkan sistem dengan tampilan Modern Futuristic &
    Tech-Centric.

------------------------------------------------------------------------

# 3. Problem Statement

Proses absensi pada event Pramuka dapat melibatkan banyak peserta dan
banyak kegiatan dalam satu hari.

Jika menggunakan absensi manual:

-   Proses scan/check-in lambat.
-   Data mudah salah tulis.
-   Rekap membutuhkan waktu.
-   Sulit mengetahui peserta yang sudah hadir pada kegiatan tertentu.
-   Sulit membuat laporan per sekolah.
-   Sulit membedakan absensi antar kegiatan.
-   Data dapat tercecer atau duplikat.

Solusi yang dibuat adalah sistem absensi digital berbasis barcode yang
menghubungkan:

``` text
ID Card
   ↓
Barcode
   ↓
Camera Laptop
   ↓
Barcode Scanner
   ↓
Participant Database
   ↓
Active Activity
   ↓
Attendance Database
   ↓
Dashboard & Report
```

------------------------------------------------------------------------

# 4. Konsep Utama Sistem

Sistem menggunakan prinsip:

> **One Participant + One Activity = One Attendance Record**

Artinya satu peserta dapat memiliki banyak record absensi, tetapi hanya
satu record untuk aktivitas yang sama.

Contoh:

``` text
Ahmad
├── Upacara Pembukaan       → Hadir
├── Materi Kepramukaan      → Hadir
├── Lomba Pionering         → Hadir
├── Lomba Semaphore         → Belum Hadir
└── Penutupan               → Belum Hadir
```

Sistem TIDAK menggunakan aturan:

``` text
1 peserta = 1 absensi per hari
```

Sistem menggunakan:

``` text
1 peserta = banyak absensi berdasarkan activity
```

------------------------------------------------------------------------

# 5. Struktur Hirarki Data

Struktur utama:

``` text
EVENT
│
├── ACTIVITIES
│   ├── KEGIATAN
│   ├── LOMBA
│   └── EVENT
│
├── PARTICIPANTS
│   ├── Nama
│   ├── Asal Sekolah
│   ├── Golongan
│   └── Barcode ID
│
└── ATTENDANCE
    ├── Participant
    ├── Activity
    ├── Scan Time
    └── Status
```

Relasi:

``` text
Event
  │
  └──< Activities
          │
          └──< Attendance >── Participant
```

------------------------------------------------------------------------

# 6. Jenis Entitas

## 6.1 Event

Event adalah acara utama.

Contoh:

``` text
PRAMUKA EVENT 2026
```

Field minimal:

-   id
-   name
-   description
-   start_date
-   end_date
-   status
-   created_at
-   updated_at

Status:

-   DRAFT
-   ACTIVE
-   COMPLETED
-   ARCHIVED

------------------------------------------------------------------------

## 6.2 Activity

Activity adalah kegiatan di dalam sebuah event.

Activity dapat berupa:

-   KEGIATAN
-   LOMBA
-   EVENT

Contoh:

``` text
Upacara Pembukaan
Materi Kepramukaan
Lomba Pionering
Lomba Semaphore
Penutupan
```

Field:

-   id
-   event_id
-   name
-   description
-   type
-   date
-   start_time
-   end_time
-   status
-   created_at
-   updated_at

Status:

-   SCHEDULED
-   ACTIVE
-   COMPLETED
-   CANCELLED

------------------------------------------------------------------------

## 6.3 Participant

Participant adalah peserta yang terdaftar.

Data wajib:

1.  Nama
2.  Asal Sekolah
3.  Penggalang/Penegak
4.  Barcode ID

Field:

-   id
-   barcode_id
-   name
-   school
-   category
-   created_at
-   updated_at

Category:

``` text
PENGGALANG
PENEGAK
```

Barcode ID harus unik.

------------------------------------------------------------------------

## 6.4 Attendance

Attendance menyimpan riwayat kehadiran.

Field:

-   id
-   participant_id
-   activity_id
-   scanned_at
-   status
-   scanner_source
-   notes
-   created_at

Status minimal:

``` text
PRESENT
```

Sistem dapat dikembangkan untuk status lain jika diperlukan.

------------------------------------------------------------------------

# 7. Database Constraint

Database harus mencegah peserta melakukan absensi ganda pada activity
yang sama.

Gunakan unique constraint:

``` text
UNIQUE(participant_id, activity_id)
```

Contoh:

``` text
Ahmad + Lomba Pionering
```

hanya boleh memiliki satu attendance record.

Jika Ahmad scan kembali:

``` text
⚠️ PESERTA SUDAH ABSEN

Ahmad
Lomba Pionering
10:24:32
```

Jangan membuat record baru.

------------------------------------------------------------------------

# 8. Barcode / ID Card

Setiap peserta memiliki ID Card.

Barcode harus menyimpan **ID unik peserta**, bukan seluruh data pribadi.

Contoh:

``` text
PRM-2026-0001
PRM-2026-0002
PRM-2026-0003
```

Rekomendasi:

-   Barcode ID bersifat unik.
-   Barcode tidak boleh digunakan oleh dua peserta.
-   Data peserta tetap disimpan di database.
-   Barcode hanya menjadi key untuk mencari participant.

Jika menggunakan QR Code:

``` text
PRM-2026-0001
```

Jika menggunakan barcode garis seperti kartu anggota, gunakan format
barcode yang sesuai, misalnya Code 128.

Implementasi scanner harus mendukung kamera laptop melalui browser.

------------------------------------------------------------------------

# 9. Camera Scanner

Scanner menggunakan:

``` text
Laptop Camera
      ↓
Browser
      ↓
Camera API
      ↓
Barcode / QR Scanner
      ↓
Decoded Barcode ID
```

Tidak diperlukan barcode scanner USB sebagai perangkat utama.

Browser harus meminta permission:

``` text
Allow camera access
```

Jika permission ditolak, tampilkan:

``` text
Camera access is required.

Please allow camera permission
and reload the page.
```

------------------------------------------------------------------------

# 10. Active Activity Concept

Scanner tidak boleh aktif tanpa activity yang dipilih.

Panitia harus:

1.  Login/admin access.
2.  Memilih event.
3.  Memilih activity.
4.  Mengaktifkan scanner.
5.  Peserta melakukan scan.

Contoh:

``` text
ACTIVE ACTIVITY

🏆 LOMBA PIONERING
05 August 2026
10:00 - 11:00

[ OPEN SCANNER ]
```

Setelah scanner aktif:

``` text
SCANNER STATUS
● READY TO SCAN
```

------------------------------------------------------------------------

# 11. Attendance Flow

Flow utama:

``` text
ADMIN / PANITIA
       │
       ▼
Pilih Event
       │
       ▼
Pilih Activity
       │
       ▼
Aktifkan Scanner
       │
       ▼
Peserta menunjukkan ID Card
       │
       ▼
Camera membaca Barcode
       │
       ▼
Barcode ID ditemukan?
    ┌──┴──┐
   YA    TIDAK
    │       │
    │       ▼
    │   ERROR:
    │   Peserta tidak terdaftar
    │
    ▼
Ambil data Participant
    │
    ▼
Cek Attendance
    │
    ├── Sudah ada
    │      ↓
    │   "Sudah Absen"
    │
    └── Belum ada
           ↓
      Simpan Attendance
           ↓
      "ABSEN BERHASIL"
           ↓
      Update Dashboard
```

------------------------------------------------------------------------

# 12. Validasi Absensi

## 12.1 Barcode Tidak Terdaftar

Jika barcode tidak ditemukan:

``` text
❌ PESERTA TIDAK TERDAFTAR

Barcode:
PRM-2026-0099

Silakan hubungi panitia.
```

Tidak boleh membuat attendance record.

------------------------------------------------------------------------

## 12.2 Peserta Sudah Absen

Jika peserta sudah melakukan absensi:

``` text
⚠️ SUDAH ABSEN

Nama:
Ahmad

Activity:
Lomba Pionering

Waktu:
10:24:32
```

Tidak boleh membuat duplicate record.

------------------------------------------------------------------------

## 12.3 Activity Tidak Aktif

Jika scanner mencoba digunakan tanpa activity aktif:

``` text
⚠️ NO ACTIVE ACTIVITY

Please select an activity
before scanning.
```

------------------------------------------------------------------------

## 12.4 Activity Sudah Selesai

Jika activity berstatus COMPLETED:

``` text
⚠️ ACTIVITY CLOSED

Lomba Pionering

Attendance is no longer available.
```

Admin dapat memiliki opsi untuk membuka kembali jika diperlukan.

------------------------------------------------------------------------

# 13. Success State

Setelah scan berhasil:

``` text
┌─────────────────────────────────────────────┐
│                                             │
│                     ✓                       │
│                                             │
│              ABSEN BERHASIL                 │
│                                             │
│          MIFTAHUL RIZKI                     │
│          SMA NEGERI 1 MEDAN                 │
│          PENEGAK                            │
│                                             │
│       LOMBA PIONERING                       │
│       05 AUG 2026 • 10:24:32               │
│                                             │
└─────────────────────────────────────────────┘
```

Success screen harus muncul secara singkat lalu scanner kembali ke:

``` text
READY TO SCAN
```

Tujuannya agar panitia dapat langsung melakukan scan peserta berikutnya.

------------------------------------------------------------------------

# 14. Dashboard

Dashboard utama harus menampilkan informasi activity yang sedang aktif.

Contoh konsep:

``` text
┌──────────────────────────────────────────────────────────┐
│ ⚡ PRAMUKA ATTENDANCE SYSTEM 2026       05 AUG 10:24     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ACTIVE ACTIVITY                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ 🏆 LOMBA PIONERING                                   │ │
│ │ 05 August 2026 • 10:00 - 11:00                     │ │
│ │                                                      │ │
│ │                  READY TO SCAN                       │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│                 ┌──────────────────────┐                 │
│                 │                      │                 │
│                 │    CAMERA AREA       │                 │
│                 │                      │                 │
│                 │     ▦ SCANNING       │                 │
│                 │                      │                 │
│                 └──────────────────────┘                 │
│                                                          │
│ TODAY                                                    │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐            │
│ │ 👥 250     │ │ ✓ 183      │ │ ⏱ 67      │            │
│ │ PESERTA    │ │ HADIR      │ │ BELUM     │            │
│ └────────────┘ └────────────┘ └────────────┘            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 15. Dashboard Statistics

Dashboard activity minimal menampilkan:

-   Total peserta terdaftar.
-   Total peserta hadir.
-   Total peserta belum hadir.
-   Persentase kehadiran.
-   Total scan berhasil.
-   Total scan duplicate.
-   Total barcode tidak dikenal.

Contoh:

``` text
TOTAL PESERTA       250
HADIR               183
BELUM HADIR          67
PERSENTASE        73.2%
```

------------------------------------------------------------------------

# 16. Participant Management

Admin dapat:

-   Melihat peserta.
-   Menambahkan peserta.
-   Mengubah data peserta.
-   Menghapus peserta.
-   Mencari peserta.
-   Filter berdasarkan sekolah.
-   Filter berdasarkan golongan.
-   Generate barcode ID.
-   Melihat histori absensi peserta.

Data:

``` text
Barcode ID
Nama
Asal Sekolah
Golongan
```

------------------------------------------------------------------------

# 17. Activity Management

Admin dapat:

-   Membuat event.
-   Membuat activity.
-   Menentukan jenis activity.
-   Menentukan tanggal.
-   Menentukan jam mulai.
-   Menentukan jam selesai.
-   Mengaktifkan activity.
-   Menutup activity.
-   Membatalkan activity.
-   Melihat jumlah peserta hadir.

Contoh:

``` text
EVENT
PRAMUKA EVENT 2026

ACTIVITIES

[ACTIVE] Lomba Pionering
05 Aug | 10:00 - 11:00
Attendance: 183/250

[SCHEDULED] Lomba Semaphore
05 Aug | 13:00 - 14:00

[SCHEDULED] Penutupan
05 Aug | 15:30 - 16:30
```

------------------------------------------------------------------------

# 18. Attendance History

Sistem harus menyediakan histori.

Contoh:

``` text
Attendance History

Ahmad
SMA Negeri 1 Medan
Penegak

05 Aug 2026
✓ Upacara Pembukaan       08:01
✓ Materi Kepramukaan      09:15
✓ Lomba Pionering         10:30
✗ Lomba Semaphore         -
✗ Penutupan               -
```

------------------------------------------------------------------------

# 19. Reporting

Sistem harus dapat menampilkan:

## Rekap per Activity

``` text
Lomba Pionering

Total Peserta : 250
Hadir         : 183
Belum Hadir   : 67
Attendance    : 73.2%
```

## Rekap per Sekolah

``` text
SMA Negeri 1 Medan
Peserta      : 35
Hadir        : 31
Belum Hadir  : 4
Attendance   : 88.57%

SMA Negeri 2 Medan
Peserta      : 28
Hadir        : 27
Belum Hadir  : 1
Attendance   : 96.43%
```

## Rekap per Golongan

``` text
PENGGALANG
Total : 120
Hadir : 95

PENEGAK
Total : 130
Hadir : 88
```

------------------------------------------------------------------------

# 20. Export

Sistem sebaiknya mendukung export:

-   CSV
-   Excel/XLSX

Data export dapat berisi:

``` text
Nama
Asal Sekolah
Golongan
Activity
Tanggal
Waktu Scan
Status
```

Contoh:

``` text
Ahmad | SMA Negeri 1 Medan | Penegak | Lomba Pionering | 05-08-2026 | 10:24:32 | PRESENT
```

------------------------------------------------------------------------

# 21. Modern Futuristic & Tech-Centric Design

Desain harus terasa modern dan teknologi tinggi, tetapi tetap mudah
digunakan oleh panitia.

## Visual Direction

Gunakan:

-   Dark UI sebagai default.
-   Glassmorphism secukupnya.
-   Futuristic cards.
-   Subtle grid pattern.
-   Neon-style accent.
-   Scanner animation.
-   Glowing status indicator.
-   Rounded cards.
-   High contrast typography.
-   Clean spacing.
-   Responsive layout.
-   Micro-interactions.

Jangan membuat UI terlalu ramai.

Prioritas:

``` text
USABILITY
    ↓
CLARITY
    ↓
SPEED
    ↓
FUTURISTIC VISUAL
```

Futuristic tidak boleh mengurangi keterbacaan.

------------------------------------------------------------------------

# 22. Scanner Visual

Scanner harus memiliki visual yang jelas.

Contoh:

``` text
┌────────────────────────────┐
│                            │
│        ┌──────────┐        │
│        │          │        │
│        │  SCAN    │        │
│        │          │        │
│        └──────────┘        │
│                            │
│       ● READY TO SCAN      │
└────────────────────────────┘
```

Scanner dapat memiliki:

-   Scanning line animation.
-   Corner brackets.
-   Status indicator.
-   Camera preview.
-   Success animation.
-   Error animation.

------------------------------------------------------------------------

# 23. Color & Typography Direction

Jangan hard-code terlalu banyak warna pada komponen.

Gunakan design tokens/CSS variables.

Contoh konsep:

``` css
--background
--surface
--surface-glass
--text-primary
--text-secondary
--accent
--success
--warning
--danger
--border
```

Warna accent dapat digunakan untuk memberikan kesan teknologi.

Typography harus:

-   Modern.
-   Mudah dibaca.
-   Memiliki hierarchy yang jelas.
-   Cocok untuk dashboard.

------------------------------------------------------------------------

# 24. Responsive Design

Sistem minimal harus nyaman digunakan pada:

-   Laptop.
-   Desktop.
-   Tablet.

Prioritas utama adalah laptop karena kamera digunakan dari laptop.

Scanner harus tetap nyaman ketika browser berada dalam:

``` text
Fullscreen
```

------------------------------------------------------------------------

# 25. Suggested Page Structure

``` text
/
├── Login / Admin
│
├── Dashboard
│
├── Scanner
│
├── Events
│   ├── Event List
│   ├── Create Event
│   └── Event Detail
│
├── Activities
│   ├── Activity List
│   ├── Create Activity
│   └── Activity Detail
│
├── Participants
│   ├── Participant List
│   ├── Add Participant
│   ├── Edit Participant
│   └── Participant Detail
│
├── Attendance
│   ├── Current Attendance
│   └── Attendance History
│
└── Reports
    ├── Activity Report
    ├── School Report
    ├── Category Report
    └── Export
```

------------------------------------------------------------------------

# 26. Suggested API Structure

Jika menggunakan REST API:

``` text
GET    /api/events
POST   /api/events
GET    /api/events/:id
PUT    /api/events/:id
DELETE /api/events/:id

GET    /api/activities
POST   /api/activities
GET    /api/activities/:id
PUT    /api/activities/:id
DELETE /api/activities/:id

GET    /api/participants
POST   /api/participants
GET    /api/participants/:id
PUT    /api/participants/:id
DELETE /api/participants/:id

GET    /api/attendance
POST   /api/attendance
GET    /api/attendance/:id

POST   /api/scan
```

Endpoint penting:

``` text
POST /api/scan
```

Request:

``` json
{
  "barcode_id": "PRM-2026-0001",
  "activity_id": 12
}
```

Response success:

``` json
{
  "success": true,
  "status": "PRESENT",
  "message": "Attendance recorded successfully",
  "participant": {
    "name": "Ahmad",
    "school": "SMA Negeri 1 Medan",
    "category": "PENEGAK"
  },
  "activity": {
    "name": "Lomba Pionering"
  },
  "scanned_at": "2026-08-05T10:24:32"
}
```

Duplicate:

``` json
{
  "success": false,
  "status": "ALREADY_ATTENDED",
  "message": "Participant has already attended this activity"
}
```

Unknown barcode:

``` json
{
  "success": false,
  "status": "PARTICIPANT_NOT_FOUND",
  "message": "Participant is not registered"
}
```

------------------------------------------------------------------------

# 27. Recommended Database Schema

Jika menggunakan relational database:

``` sql
CREATE TABLE events (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activities (
    id INTEGER PRIMARY KEY,
    event_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(30) NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    status VARCHAR(30) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE TABLE participants (
    id INTEGER PRIMARY KEY,
    barcode_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    school VARCHAR(255) NOT NULL,
    category VARCHAR(30) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendance (
    id INTEGER PRIMARY KEY,
    participant_id INTEGER NOT NULL,
    activity_id INTEGER NOT NULL,
    scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) NOT NULL,
    scanner_source VARCHAR(100),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(id),
    FOREIGN KEY (activity_id) REFERENCES activities(id),
    UNIQUE (participant_id, activity_id)
);
```

------------------------------------------------------------------------

# 28. Team / Regu Support

Versi awal sistem harus **siap dikembangkan untuk sistem regu/tim**,
tetapi fitur ini tidak wajib menjadi bagian MVP jika belum diperlukan.

Jika event lomba menggunakan regu:

``` text
Lomba Pionering
│
├── Regu Garuda
│   ├── Ahmad
│   ├── Budi
│   └── Candra
│
└── Regu Elang
    ├── Dimas
    ├── Fajar
    └── Rizky
```

Struktur database dapat dikembangkan:

``` text
teams
├── id
├── name
├── school
└── category

team_members
├── id
├── team_id
└── participant_id
```

Untuk MVP, jangan memaksakan fitur team jika kebutuhan event belum
mengharuskannya.

------------------------------------------------------------------------

# 29. Security & Data Integrity

Minimal:

1.  Barcode ID harus unik.
2.  Participant ID tidak boleh duplikat.
3.  Attendance tidak boleh duplikat untuk participant + activity.
4.  Admin page harus memiliki authentication.
5.  Input user harus divalidasi.
6.  Jangan mempercayai data dari client tanpa validasi server.
7.  Jangan menyimpan data sensitif yang tidak diperlukan.
8.  Database harus memiliki backup.
9.  API harus menangani error dengan response yang konsisten.

------------------------------------------------------------------------

# 30. Error Handling

Gunakan error state yang mudah dipahami.

### Camera Error

``` text
CAMERA UNAVAILABLE
Please check camera permission.
```

### Barcode Invalid

``` text
INVALID BARCODE
Please scan a valid participant ID.
```

### Participant Not Found

``` text
PARTICIPANT NOT FOUND
This ID Card is not registered.
```

### Duplicate

``` text
ALREADY ATTENDED
This participant has already been recorded
for this activity.
```

### No Activity

``` text
NO ACTIVE ACTIVITY
Select an activity before scanning.
```

### Server Error

``` text
SYSTEM ERROR
Unable to save attendance.
Please try again.
```

------------------------------------------------------------------------

# 31. Performance Requirements

Scanner harus dirancang untuk proses scan cepat.

Target UX:

``` text
Barcode detected
      ↓
Validation
      ↓
Database query
      ↓
Save attendance
      ↓
Success UI
```

Idealnya proses terasa hampir real-time.

Setelah success/error, scanner harus otomatis siap untuk peserta
berikutnya tanpa reload halaman.

------------------------------------------------------------------------

# 32. Development Stack

Stack harus dipilih dengan prinsip:

-   Sederhana.
-   Stabil.
-   Mudah dikembangkan.
-   Cocok untuk project lokal.
-   Tidak membutuhkan infrastruktur berlebihan untuk MVP.

Recommended stack:

``` text
Backend:
Node.js
Express.js

Frontend:
HTML
CSS
JavaScript
EJS atau template engine yang sesuai

Database:
SQLite untuk MVP/local deployment

Scanner:
Browser Camera API
Barcode/QR scanning library

Export:
CSV/XLSX

Development:
npm
```

Jika project berkembang menjadi multi-device/server deployment, database
dapat dipindahkan ke PostgreSQL/MySQL tanpa mengubah konsep data secara
fundamental.

------------------------------------------------------------------------

# 33. Suggested Folder Structure

Jika menggunakan Node.js + Express + EJS:

``` text
pramuka-attendance/
│
├── app.js
├── package.json
├── .env
├── README.md
├── PROJECT_SPECIFICATION.md
│
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── models/
│   ├── middleware/
│   ├── database/
│   └── utils/
│
├── views/
│   ├── layouts/
│   ├── dashboard/
│   ├── scanner/
│   ├── events/
│   ├── activities/
│   ├── participants/
│   ├── attendance/
│   └── reports/
│
├── public/
│   ├── css/
│   ├── js/
│   ├── images/
│   └── icons/
│
├── data/
│   └── database.sqlite
│
└── exports/
```

Struktur boleh disesuaikan dengan framework yang dipilih, tetapi
pemisahan antara backend, database, views, dan static assets harus
dipertahankan.

------------------------------------------------------------------------

# 34. MVP Scope

MVP harus fokus pada fitur inti:

## Must Have

-   Admin access.
-   Participant management.
-   Barcode ID.
-   Camera scanner.
-   Event management.
-   Activity management.
-   Active activity selection.
-   Scan participant.
-   Attendance recording.
-   Duplicate attendance prevention.
-   Participant not found validation.
-   Dashboard.
-   Attendance history.
-   Basic reports.

## Nice to Have

-   Excel export.
-   CSV export.
-   Print ID Card.
-   Barcode generator.
-   School statistics.
-   Category statistics.
-   Fullscreen scanner.
-   Sound feedback.
-   Advanced analytics.

## Future Development

-   Multi-device attendance.
-   Cloud database.
-   Team/regu management.
-   Offline-first synchronization.
-   Role-based access control.
-   Advanced reporting.
-   Public display/dashboard.
-   QR/Barcode batch generation.
-   Event scoring integration.

------------------------------------------------------------------------

# 35. User Roles

Minimal MVP:

``` text
ADMIN / PANITIA
```

Admin dapat:

-   Manage event.
-   Manage activity.
-   Manage participant.
-   Start/stop scanner.
-   View attendance.
-   View reports.

Future:

``` text
SUPER ADMIN
PANITIA ABSENSI
PANITIA LOMBA
VIEWER
```

------------------------------------------------------------------------

# 36. Important UX Rule

Scanner adalah fitur utama.

Saat panitia membuka scanner, jangan membuat mereka melalui banyak
langkah.

Target flow:

``` text
Login
 ↓
Select Activity
 ↓
Open Scanner
 ↓
Scan
 ↓
Success
 ↓
Next Scan
```

Setelah scanner aktif, input berikutnya harus dapat diproses tanpa klik
tambahan jika memungkinkan.

------------------------------------------------------------------------

# 37. Sound Feedback

Sistem dapat memberikan audio feedback:

Success:

``` text
Beep ✓
```

Duplicate:

``` text
Warning beep
```

Invalid:

``` text
Error beep
```

Audio harus dapat dimatikan melalui setting.

------------------------------------------------------------------------

# 38. Real-Time Dashboard

Dashboard harus memperbarui statistik setelah attendance berhasil.

Contoh:

Sebelum scan:

``` text
Hadir: 182
Belum: 68
```

Setelah scan:

``` text
Hadir: 183
Belum: 67
```

Tidak perlu reload seluruh halaman.

Gunakan AJAX/fetch atau mekanisme real-time yang sesuai.

------------------------------------------------------------------------

# 39. Acceptance Criteria

Project dianggap berhasil jika:

### Participant

-   [ ] Admin dapat menambahkan peserta.
-   [ ] Barcode ID otomatis/unik.
-   [ ] Data nama tersimpan.
-   [ ] Data sekolah tersimpan.
-   [ ] Data Penggalang/Penegak tersimpan.

### Event

-   [ ] Admin dapat membuat event.
-   [ ] Event dapat memiliki banyak activity.

### Activity

-   [ ] Activity dapat dibuat.
-   [ ] Activity memiliki type.
-   [ ] Activity memiliki tanggal.
-   [ ] Activity memiliki waktu.
-   [ ] Activity dapat diaktifkan/dinonaktifkan.

### Scanner

-   [ ] Browser dapat mengakses kamera laptop.
-   [ ] Barcode dapat dibaca.
-   [ ] Barcode dicocokkan dengan database.
-   [ ] Peserta terdaftar dapat melakukan absensi.
-   [ ] Peserta tidak terdaftar ditolak.
-   [ ] Peserta yang sudah absen ditolak sebagai duplicate.
-   [ ] Scanner dapat langsung melanjutkan ke peserta berikutnya.

### Attendance

-   [ ] Attendance terhubung dengan participant.
-   [ ] Attendance terhubung dengan activity.
-   [ ] Timestamp tersimpan.
-   [ ] Tidak ada duplicate participant + activity.

### Dashboard

-   [ ] Total peserta terlihat.
-   [ ] Total hadir terlihat.
-   [ ] Total belum hadir terlihat.
-   [ ] Activity aktif terlihat.
-   [ ] Statistik berubah setelah scan.

### Reporting

-   [ ] Histori absensi dapat dilihat.
-   [ ] Rekap activity dapat dilihat.
-   [ ] Rekap sekolah dapat dilihat.
-   [ ] Rekap Penggalang/Penegak dapat dilihat.

### UI

-   [ ] Modern.
-   [ ] Futuristic.
-   [ ] Tech-centric.
-   [ ] Responsive.
-   [ ] Mudah digunakan panitia.
-   [ ] Scanner menjadi fokus utama.

------------------------------------------------------------------------

# 40. Development Priority

Implementasikan secara bertahap:

## Phase 1 --- Foundation

``` text
Project setup
Database
Models
Basic server
Admin authentication
```

## Phase 2 --- Participant

``` text
Participant CRUD
Barcode ID
Participant search
```

## Phase 3 --- Event & Activity

``` text
Event CRUD
Activity CRUD
Activity status
Active activity
```

## Phase 4 --- Scanner

``` text
Camera access
Barcode detection
Participant lookup
Validation
Attendance insert
```

## Phase 5 --- Dashboard

``` text
Statistics
Recent scans
Activity status
Attendance counter
```

## Phase 6 --- Reporting

``` text
History
School report
Category report
Export
```

## Phase 7 --- UI Polish

``` text
Futuristic UI
Animations
Scanner experience
Responsive design
Loading states
Error states
Success states
```

------------------------------------------------------------------------

# 41. Antigravity Implementation Instructions

Antigravity harus mengikuti prinsip berikut:

1.  Jangan langsung membuat seluruh sistem tanpa memvalidasi struktur.
2.  Implementasikan berdasarkan phase.
3.  Pastikan aplikasi dapat dijalankan setelah setiap phase.
4.  Jangan menghapus fitur yang sudah bekerja ketika menambahkan fitur
    baru.
5.  Jangan membuat duplicate database logic.
6.  Gunakan modular architecture.
7.  Gunakan server-side validation.
8.  Jangan mempercayai barcode sebagai data profile; barcode hanya
    identifier.
9.  Pastikan attendance selalu terhubung ke activity.
10. Jangan mengizinkan duplicate attendance.
11. Jangan mengaktifkan scanner tanpa active activity.
12. Jangan menggunakan mock data sebagai pengganti database pada final
    implementation.
13. Gunakan environment variables untuk konfigurasi.
14. Buat error handling yang jelas.
15. Jangan mengorbankan usability demi visual futuristic.
16. Prioritaskan scanner performance.
17. Gunakan semantic HTML dan accessible controls.
18. Pastikan UI dapat digunakan dengan keyboard.
19. Pastikan database schema memiliki foreign key dan constraint yang
    benar.
20. Dokumentasikan keputusan teknis penting.

------------------------------------------------------------------------

# 42. Core Business Rule

Business rule paling penting:

``` text
A participant can attend multiple activities,
but can only attend each activity once.
```

Dalam bentuk sederhana:

``` text
PARTICIPANT
     │
     ├── Activity A → PRESENT
     ├── Activity B → PRESENT
     ├── Activity C → PRESENT
     ├── Activity D → NOT ATTENDED
     └── Activity E → PRESENT
```

Bukan:

``` text
PARTICIPANT
     │
     └── Daily Attendance → PRESENT
```

------------------------------------------------------------------------

# 43. Final Product Vision

Produk akhir harus terasa seperti sistem absensi event profesional:

``` text
             PRAMUKA EVENT 2026
                    │
                    ▼
          ┌───────────────────┐
          │  EVENT MANAGEMENT  │
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │ ACTIVITY MANAGEMENT│
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │  ACTIVE SCANNER    │
          └─────────┬─────────┘
                    │
              CAMERA SCAN
                    │
                    ▼
          ┌───────────────────┐
          │ PARTICIPANT CHECK  │
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │ ATTENDANCE RECORD  │
          └─────────┬─────────┘
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
     DASHBOARD              REPORT
```

Sistem harus cepat, jelas, modern, dan reliable untuk digunakan pada
event dengan banyak peserta dan banyak kegiatan.

------------------------------------------------------------------------

# 44. Final Instruction

**Build the project as an Event-Based Barcode Attendance System for a
Pramuka event.**

The system must:

-   Use participant ID Cards with unique Barcode/QR IDs.
-   Scan using the laptop camera through a browser.
-   Retrieve participant information from the database.
-   Record attendance against the currently active activity.
-   Support multiple activities within the same event and same day.
-   Support activity types: KEGIATAN, LOMBA, EVENT.
-   Store participant name, school, and PENGGALANG/PENEGAK category.
-   Prevent duplicate attendance for the same participant and activity.
-   Provide admin management.
-   Provide dashboard and attendance reports.
-   Be designed using a Modern Futuristic & Tech-Centric visual
    language.
-   Prioritize speed and usability for real-world event operations.
-   Keep the architecture extensible for future team/regu, cloud,
    multi-device, and advanced reporting features.

**Do not treat this as a simple daily attendance application. The core
architecture must be activity/event based.**

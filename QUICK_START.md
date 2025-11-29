# 🚀 Quick Start Guide - Sistem CPL

Panduan cepat untuk menggunakan Sistem Capaian Pembelajaran Lulusan (CPL) Universitas Muhammadiyah Makassar.

---

## 📖 Daftar Isi

1. [Login ke Sistem](#1-login-ke-sistem)
2. [Dashboard Overview](#2-dashboard-overview)
3. [Input Nilai Mahasiswa](#3-input-nilai-mahasiswa)
4. [Laporan CPL dengan CPMK Breakdown](#4-laporan-cpl-dengan-cpmk-breakdown)
5. [Manajemen Data & Import Nilai](#5-manajemen-data--import-nilai)
6. [CPL & Pemetaan Kurikulum](#6-cpl--pemetaan-kurikulum)
7. [Tips & Troubleshooting](#7-tips--troubleshooting)

---

## 1. Login ke Sistem

### Akses Landing Page

1. Buka browser dan akses `http://localhost:3000`
2. Halaman landing akan menampilkan informasi sistem
3. Klik tombol **"Login"** di header

### Kredensial Login (5 Program Studi)

Sistem menyediakan akun demo untuk 5 Kaprodi:

| Role | Email | Password | Program Studi |
|------|-------|----------|---------------|
| **Kaprodi Informatika** | kaprodi.informatika@unismuh.ac.id | kaprodi123 | S1 Teknik Informatika (INF) |
| **Kaprodi Arsitektur** | kaprodi.arsitektur@unismuh.ac.id | kaprodi123 | S1 Arsitektur (ARS) |
| **Kaprodi PWK** | kaprodi.pwk@unismuh.ac.id | kaprodi123 | S1 Perencanaan Wilayah Kota (PWK) |
| **Kaprodi Sipil** | kaprodi.sipil@unismuh.ac.id | kaprodi123 | S1 Teknik Sipil (SIP) |
| **Kaprodi Elektro** | kaprodi.elektro@unismuh.ac.id | kaprodi123 | S1 Teknik Elektro (ELK) |

### Quick Login

- Pilih role dari dropdown di halaman login
- Klik tombol **"Quick Login"** untuk login langsung
- Setelah login berhasil, Anda akan diarahkan ke dashboard prodi masing-masing

---

## 2. Dashboard Overview

### Tampilan Dashboard

Dashboard menampilkan overview capaian pembelajaran dengan **Tree Diagram** hierarki:

#### **Tree Diagram CPL-MK-CPMK**
- Visualisasi struktur: `CPL → Mata Kuliah → CPMK`
- Expandable nodes: Klik CPL untuk melihat MK terkait
- Color-coded: Biru (CPL), Hijau (MK), Ungu (CPMK)
- Menampilkan bobot setiap CPMK

**Contoh Hierarki:**
```
CPL1: Mampu menerapkan pemikiran logis
  └── Pemrograman Web (MK001) - 3 SKS
      ├── CPMK1-1: Memahami konsep dasar web (Bobot: 20%)
      ├── CPMK1-2: Menguasai HTML/CSS (Bobot: 30%)
      ├── CPMK1-3: Implementasi JavaScript (Bobot: 25%)
      └── CPMK1-4: Framework modern (Bobot: 25%)
```

#### **Statistik Cepat**
- Total Mahasiswa
- Jumlah Mata Kuliah
- CPL Tercapai (rata-rata ≥75)
- Semester Aktif

#### **Grafik Pencapaian**
- Radar Chart: Visualisasi 8 CPL per prodi
- Bar Chart: Trend CPL per semester
- Line Chart: Progress mahasiswa

### Navigasi

- **Navbar**: Logo, Program Studi, Profil user, Logout
- **Sidebar**: 
  - 🏠 Dashboard
  - ✏️ Input Nilai
  - 📊 Laporan
  - 📁 Manajemen Data (NEW!)
  - 🎯 CPL & Pemetaan
  - ⚙️ Settings
- **Mobile**: Hamburger menu responsive

---

## 3. Input Nilai Mahasiswa

### Langkah Input Nilai (Manual)

1. **Akses Menu Input**
   - Klik **"Input Nilai"** di sidebar
   - Pilih mahasiswa dari dropdown (tersaring per prodi)

2. **Pilih Mata Kuliah**
   - Dropdown menampilkan MK sesuai semester mahasiswa
   - Contoh: "Pemrograman Web (INF101) - 3 SKS"
   - Sistem menampilkan daftar CPMK untuk MK tersebut

3. **Input Nilai CPMK**
   - Masukkan nilai 0-100 untuk setiap CPMK
   - Bobot otomatis ditampilkan di samping input
   - Kalkulasi real-time ditampilkan

   **Contoh:**
   ```
   Pemrograman Web (INF101)
   
   CPMK1-1: Konsep Dasar (Bobot: 20%) → Nilai: 85
   CPMK1-2: HTML/CSS (Bobot: 30%)     → Nilai: 90
   CPMK1-3: JavaScript (Bobot: 25%)   → Nilai: 78
   CPMK1-4: Framework (Bobot: 25%)    → Nilai: 82
   
   Nilai MK = (85×0.2) + (90×0.3) + (78×0.25) + (82×0.25) = 84.5
   ```

4. **Simpan Nilai**
   - Klik tombol **"Simpan Nilai"**
   - Sistem otomatis:
     * Menghitung nilai MK
     * Mendistribusikan ke CPL terkait
     * Menyimpan ke localStorage
   - Notifikasi sukses muncul

### Kalkulasi Otomatis (Weighted Average)

**Formula:**
1. **Nilai MK** = Σ (Nilai CPMK × Bobot CPMK)
2. **Nilai CPL** = Σ (Nilai CPMK terkait × Bobot CPMK) / Jumlah CPMK

**Contoh Distribusi:**
```
CPL3: Mampu menerapkan pemikiran logis
├── MK: Pemrograman Web (Bobot: 100% / 8 MK = 12.5%)
│   ├── CPMK1-1 → CPL3 (Kontribusi: 12.5% × 20% = 2.5%)
│   ├── CPMK1-2 → CPL3 (Kontribusi: 12.5% × 30% = 3.75%)
│   └── dst...
└── Nilai CPL3 = Rata-rata tertimbang dari semua CPMK
```

---

## 4. Laporan CPL dengan CPMK Breakdown

### Akses Laporan

1. Klik **"Laporan"** di sidebar
2. Filter laporan:
   - **Mahasiswa**: Pilih dari dropdown (tersaring per prodi)
   - **Semester**: Pilih semester 1-8
3. Klik **"Generate Laporan"**

### Fitur Laporan (NEW!)

#### **1. Tabel CPL dengan Breakdown**
- Tabel utama menampilkan 8 CPL dengan nilai
- **Klik baris CPL** untuk membuka breakdown detail
- Expandable accordion menampilkan:
  * **Mata Kuliah** yang berkontribusi ke CPL
  * **CPMK** dalam setiap MK
  * **Bobot** masing-masing CPMK
  * **Nilai Tertimbang** (Nilai × Bobot)
  * **Kontribusi ke CPL** (persentase)

**Contoh Breakdown:**
```
📘 CPL3: Mampu menerapkan pemikiran logis (Nilai: 82.5) [Klik untuk expand]
  
  📗 Pemrograman Web (INF101) - 3 SKS
  ┌─────────────┬───────┬───────────────┬─────────────┐
  │ CPMK        │ Bobot │ Nilai         │ Kontribusi  │
  ├─────────────┼───────┼───────────────┼─────────────┤
  │ CPMK1-1     │ 20%   │ 85 × 0.20 = 17│ 2.5% ke CPL │
  │ CPMK1-2     │ 30%   │ 90 × 0.30 = 27│ 3.75% ke CPL│
  │ CPMK1-3     │ 25%   │ 78 × 0.25 = 20│ 3.13% ke CPL│
  │ CPMK1-4     │ 25%   │ 82 × 0.25 = 21│ 3.13% ke CPL│
  └─────────────┴───────┴───────────────┴─────────────┘
  
  📗 Struktur Data (INF102) - 3 SKS
  [Daftar CPMK...]
```

#### **2. Visualisasi**
- **Radar Chart**: Overview 8 CPL
- **Bar Chart**: Perbandingan per CPL
- **Progress Indicator**: Status tercapai/cukup/belum

#### **3. Export**
- **Export PDF**: Download laporan lengkap dengan breakdown
- **Export Excel**: Data tabular untuk analisis lanjut

### Tips Membaca Laporan

- **Status CPL:**
  * 🟢 **Tercapai** (≥75): Target sudah tercapai
  * 🟡 **Cukup** (60-74): Perlu peningkatan
  * 🔴 **Belum Tercapai** (<60): Perlu perhatian khusus

- **Interpretasi Bobot:**
  * Bobot CPMK menunjukkan tingkat kepentingan dalam MK
  * Kontribusi ke CPL = Bobot MK × Bobot CPMK
  * CPL dengan banyak MK memiliki bobot terdistribusi

---

## 5. Manajemen Data & Import Nilai

### Overview Menu Manajemen Data (NEW!)

Menu ini menyediakan 4 tab untuk mengelola data secara efisien:

#### **Tab 1: Import Nilai**

**Fungsi:** Import data nilai mahasiswa dari file Excel/CSV secara batch

**Langkah-langkah:**
1. **Pilih Filter**
   - Prodi: Informatika/Arsitektur/PWK/Sipil/Elektro
   - Semester: 1-8

2. **Download Template**
   - Klik **"Download Contoh File"**
   - Tersedia format: `.xlsx` dan `.csv`
   - Template berisi kolom: NIM, Nama, MK1, MK2, ...MKn

3. **Upload File**
   - Klik **"Pilih File"** atau drag & drop
   - Format yang diterima: `.xlsx`, `.csv`
   - Maksimal ukuran: 5MB

4. **Preview Data**
   - Sistem menampilkan preview tabel
   - Validasi otomatis: NIM, Nilai (0-100)
   - Tampilkan error jika ada data tidak valid

5. **Import**
   - Klik **"Import Data"**
   - Sistem otomatis:
     * Menyimpan nilai MK
     * Menghitung nilai CPMK
     * Mendistribusikan ke CPL
     * Menyimpan ke localStorage
   - Tampilkan hasil: Total, Berhasil, Gagal

**Format Excel/CSV:**
```csv
NIM,Nama,INF101,INF102,INF103,INF104,INF105,INF106,INF107,INF108
105841109601,Andi Miftah,85,90,78,82,88,75,92,80
105841109602,Annisya Ariska,90,85,82,88,92,78,85,87
...
```

**Contoh File Disediakan:**
- `contoh-import-informatika-sem1.xlsx` (10 mahasiswa, 8 MK)
- `contoh-import-informatika-sem2.xlsx` (10 mahasiswa, 7 MK)
- `contoh-import-arsitektur-sem2.xlsx` (10 mahasiswa, 9 MK)
- Format CSV juga tersedia

#### **Tab 2: Mahasiswa**

**Fungsi:** Monitoring mahasiswa yang sudah memiliki nilai

**Fitur:**
- Tabel mahasiswa dengan data nilai
- Kolom:
  * NIM
  * Nama
  * Prodi
  * Angkatan
  * Semester
  * Total Nilai (jumlah MK yang sudah diinput)
  * Dari Import (jumlah nilai hasil import)
  * Status: 🟢 Terimport / 🔵 Mock Data / ⚪ Manual

**Filter:**
- Prodi (dropdown)
- Refresh button untuk update real-time

**Statistik Mahasiswa:**
- Total mahasiswa dengan nilai
- Rata-rata nilai per mahasiswa
- Mahasiswa dengan nilai lengkap

#### **Tab 3: Mata Kuliah**

**Fungsi:** Statistik nilai per mata kuliah

**Tampilan:** Grid cards per MK

**Informasi per MK:**
- Kode & Nama MK
- SKS
- Jumlah mahasiswa yang mengambil
- Statistik nilai:
  * Rata-rata (dengan color coding)
  * Nilai minimum
  * Nilai maksimum
  * Progress bar visual
- Data import: Jumlah nilai dari import batch

**Filter:**
- Prodi (dropdown)
- Semester (dropdown)
- Refresh button

**Color Coding:**
- 🟢 Hijau: Rata-rata ≥75 (Baik)
- 🟡 Kuning: Rata-rata 60-74 (Cukup)
- 🔴 Merah: Rata-rata <60 (Kurang)

#### **Tab 4: CPL & CPMK**

**Fungsi:** Overview pencapaian CPL dengan distribusi

**Summary Cards:**
- 🟢 **CPL Tercapai**: Jumlah CPL dengan rata-rata ≥75
- 🟡 **CPL Cukup**: Jumlah CPL dengan rata-rata 60-74
- 🔴 **CPL Belum Tercapai**: Jumlah CPL dengan rata-rata <60

**Tabel CPL:**
- Kode CPL
- Deskripsi lengkap
- Jumlah mahasiswa
- Statistik:
  * Rata-rata
  * Minimum
  * Maksimum
- Distribusi (badges):
  * ✅ Tercapai (hijau)
  * ⚠️ Cukup (kuning)
  * ❌ Belum Tercapai (merah)

**Info Box:**
- Penjelasan kalkulasi otomatis CPL dari CPMK
- Formula perhitungan weighted average

**Filter:**
- Prodi (dropdown)
- Semester (dropdown)
- Refresh button

### Integrasi Antar Tab

**Workflow:**
```
1. Tab Import Nilai
   ↓
   [Upload Excel/CSV] → [Preview] → [Import]
   ↓
   Data tersimpan di localStorage
   ↓
2. Tab Mahasiswa
   ↓
   [Refresh] → Menampilkan mahasiswa dengan nilai baru
   ↓
3. Tab Mata Kuliah
   ↓
   [Refresh] → Statistik MK terupdate
   ↓
4. Tab CPL & CPMK
   ↓
   [Refresh] → CPL dihitung otomatis dari nilai MK
```

**Real-time Update:**
- Setiap import otomatis trigger refresh
- Tombol **"Refresh"** di setiap tab untuk manual update
- Integrasi penuh: localStorage → dataIntegration.ts → UI

---

## 6. CPL & Pemetaan Kurikulum

### Akses Menu CPL Mapping

1. Klik **"CPL & Pemetaan"** di sidebar
2. Tampilan tabel matrix: CPL vs MK vs CPMK

### Struktur Data (Per Prodi)

#### **Informatika (INF) - 69 Mata Kuliah, 144 SKS**
- **8 CPL:** CPL1-CPL8
- **69 MK:** INF101-INF169
- **CPMK Detail:** 6 MK memiliki CPMK lengkap dengan bobot

**Contoh MK Informatika:**
| Semester | Kode MK | Nama MK | SKS | CPL Terkait |
|----------|---------|---------|-----|-------------|
| 1 | INF101 | Pemrograman Web | 3 | CPL3, CPL6, CPL7 |
| 1 | INF102 | Struktur Data | 3 | CPL3, CPL5 |
| 1 | INF103 | Matematika Diskrit | 3 | CPL2, CPL3 |
| 2 | INF201 | Basis Data | 3 | CPL4, CPL6 |
| 2 | INF202 | Pemrograman Berorientasi Objek | 3 | CPL3, CPL5 |

**Lihat daftar lengkap:** [MK_CODES.md](#mk-codes-reference) (akan dibuat)

#### **Arsitektur (ARS) - 50+ Mata Kuliah, 145 SKS**
- **8 CPL:** CPL1-CPL8
- **50+ MK:** ARS101-ARS5xx
- **CPMK Detail:** 7 MK memiliki CPMK lengkap

**Contoh MK Arsitektur:**
| Semester | Kode MK | Nama MK | SKS | CPL Terkait |
|----------|---------|---------|-----|-------------|
| 1 | ARS101 | Pengantar Arsitektur | 2 | CPL1, CPL2 |
| 1 | ARS102 | Gambar Teknik | 3 | CPL3, CPL4 |
| 2 | ARS201 | Studio Perancangan 1 | 4 | CPL2, CPL3, CPL5 |

#### **PWK, Sipil, Elektro**
- Masing-masing memiliki struktur CPL dan MK tersendiri
- Total ~50-70 MK per prodi
- Daftar lengkap tersedia di MK_CODES.md

### Pemetaan CPMK ke CPL

**Contoh Mapping (Pemrograman Web - INF101):**

| CPMK | Deskripsi | Bobot CPMK | CPL Terkait | Bobot ke CPL |
|------|-----------|------------|-------------|--------------|
| CPMK1-1 | Konsep dasar web | 20% | CPL3 | 30% |
| CPMK1-2 | HTML/CSS | 30% | CPL6 | 40% |
| CPMK1-3 | JavaScript | 25% | CPL6 | 35% |
| CPMK1-4 | Framework | 25% | CPL7 | 45% |

**Interpretasi:**
- CPMK1-1 berkontribusi 20% terhadap nilai MK
- CPMK1-1 berkontribusi 30% terhadap CPL3 dari MK ini
- Jika Nilai CPMK1-1 = 85, kontribusi ke MK = 85 × 0.20 = 17
- Kontribusi ke CPL3 = 85 × (100%/jumlah MK) × 0.20 = ...

---

## 7. Tips & Troubleshooting

### Tips Penggunaan

✅ **Gunakan Import untuk Batch Data**
- Lebih cepat untuk input banyak mahasiswa
- Download template untuk format yang benar
- Validasi data di Excel sebelum import

✅ **Input Manual untuk Update Cepat**
- Gunakan untuk update nilai individual
- Real-time calculation

✅ **Manfaatkan Tab Manajemen**
- Tab Mahasiswa: Cek kelengkapan nilai
- Tab Mata Kuliah: Monitoring performa MK
- Tab CPL: Monitoring pencapaian agregat

✅ **Breakdown CPMK di Laporan**
- Klik CPL untuk melihat detail kontribusi
- Identifikasi CPMK yang lemah
- Fokus perbaikan pada CPMK dengan kontribusi besar

✅ **Refresh Setelah Import**
- Klik refresh di setiap tab untuk update data
- Sistem otomatis refresh setelah import

✅ **Export Laporan Berkala**
- Export PDF untuk dokumentasi
- Export Excel untuk analisis lanjut

### Troubleshooting

❌ **File Import Gagal**
- **Cek format:** Harus `.xlsx` atau `.csv`
- **Cek kolom:** NIM dan Nama harus ada
- **Cek nilai:** Harus angka 0-100
- **Cek encoding CSV:** Gunakan UTF-8

❌ **Preview Tidak Muncul**
- File terlalu besar (>5MB)
- Format tidak didukung
- Coba download ulang template

❌ **Data Tidak Terupdate di Tab Lain**
- Klik tombol **"Refresh"** manual
- Clear browser cache (Ctrl+Shift+Del)
- Reload halaman (F5)

❌ **Nilai CPL Tidak Berubah Setelah Import**
- Pastikan MK yang diimport ter-mapping ke CPL
- Cek di Tab CPL apakah CPMK sudah ada bobot
- Refresh dashboard (F5)

❌ **Breakdown CPMK Tidak Muncul**
- Pastikan laporan sudah di-generate
- Klik baris CPL untuk expand
- Pastikan ada data nilai untuk mahasiswa tersebut

❌ **Export PDF/Excel Belum Berfungsi**
- Fitur masih mockup di development
- Akan diaktifkan di production

### Keyboard Shortcuts

- `Ctrl + R` atau `F5`: Refresh halaman
- `Tab`: Navigasi antar input field
- `Enter`: Submit form
- `Esc`: Tutup modal/dropdown

### Command Cheat Sheet (Development)

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Clear cache
rm -rf .next && npm run dev

# Check errors
npm run lint
```

---

## 📱 Akses Mobile

Sistem CPL responsive dan dapat diakses via smartphone:

1. Buka browser mobile (Chrome, Safari, Firefox)
2. Akses URL: `http://localhost:3000` atau domain production
3. Fitur mobile:
   - Sidebar → Hamburger menu
   - Chart → Optimized untuk layar kecil
   - Table → Horizontal scroll
   - Cards → Stacked layout
   - Touch-friendly buttons

---

## 🔄 Update Data (Development Mode)

### Data Mock

File: `src/data/mockData.ts`

**Struktur:**
```typescript
// 5 Prodi
export const prodiData = [...];

// 8 CPL per prodi
export const cplData = [...];

// Mahasiswa
export const mahasiswaData = [...];

// Mata Kuliah (69 untuk Informatika, 50+ untuk lainnya)
export const mkData = [...];

// CPMK dengan bobot
export const cpmkData = [...];

// Mapping CPMK → CPL
export const cpmkToCplMapping = [...];
```

### Data Integration

File: `src/utils/dataIntegration.ts`

**Fungsi utama:**
- `getCombinedNilaiData()`: Merge localStorage + mockData
- `hitungNilaiCPLPerSemesterIntegrated()`: Kalkulasi CPL
- `hitungCPMKBreakdownPerCPL()`: Breakdown detail CPMK

**Priority:** localStorage > mockData

---

## 📚 MK Codes Reference

### Informatika (69 MK, 144 SKS)

**Semester 1 (8 MK, 20 SKS):**
- INF101: Pemrograman Web (3 SKS) → CPL3, CPL6, CPL7
- INF102: Struktur Data (3 SKS) → CPL3, CPL5
- INF103: Matematika Diskrit (3 SKS) → CPL2, CPL3
- INF104: Algoritma Pemrograman (3 SKS) → CPL3, CPL5
- INF105: Sistem Digital (2 SKS) → CPL4, CPL5
- INF106: Bahasa Inggris Teknik (2 SKS) → CPL1, CPL8
- INF107: Pancasila (2 SKS) → CPL1, CPL8
- INF108: Pendidikan Agama (2 SKS) → CPL1, CPL8

**Semester 2 (7 MK, 18 SKS):**
- INF201: Basis Data (3 SKS) → CPL4, CPL6
- INF202: Pemrograman Berorientasi Objek (3 SKS) → CPL3, CPL5
- INF203: Sistem Operasi (3 SKS) → CPL4, CPL5
- INF204: Jaringan Komputer (3 SKS) → CPL4, CPL5
- INF205: Statistika (2 SKS) → CPL2, CPL3
- INF206: Kewarganegaraan (2 SKS) → CPL1, CPL8
- INF207: Bahasa Indonesia (2 SKS) → CPL1, CPL8

*[Untuk daftar lengkap semua semester, lihat MK_CODES.md]*

### Arsitektur (50+ MK, 145 SKS)

**Semester 1:**
- ARS101: Pengantar Arsitektur (2 SKS) → CPL1, CPL2
- ARS102: Gambar Teknik (3 SKS) → CPL3, CPL4
- ARS103: Matematika Teknik (3 SKS) → CPL2, CPL3
- *[Lihat MK_CODES.md untuk lengkap]*

### PWK, Sipil, Elektro

Daftar lengkap MK untuk 3 prodi lainnya tersedia di **MK_CODES.md**

---

## 🧪 Testing Checklist

### Login Testing
- [ ] Login dengan 5 akun kaprodi berhasil
- [ ] Quick login berfungsi
- [ ] Redirect ke dashboard sesuai prodi
- [ ] Logout berhasil

### Dashboard Testing
- [ ] Tree diagram tampil dan interactive
- [ ] Expand/collapse CPL-MK-CPMK works
- [ ] Statistik cards tampil benar
- [ ] Radar chart render dengan 8 CPL

### Input Nilai Testing
- [ ] Dropdown mahasiswa tersaring per prodi
- [ ] Dropdown MK tersaring per semester
- [ ] Input nilai 0-100 dengan validasi
- [ ] Kalkulasi real-time berfungsi
- [ ] Simpan nilai berhasil
- [ ] localStorage update

### Laporan Testing
- [ ] Generate laporan berhasil
- [ ] Tabel CPL tampil dengan 8 rows
- [ ] Klik CPL expand breakdown
- [ ] Breakdown menampilkan MK cards
- [ ] Breakdown menampilkan tabel CPMK
- [ ] Bobot dan nilai tertimbang benar
- [ ] Export button tampil (mockup)

### Manajemen Data Testing
- [ ] Tab Import: Upload .xlsx berhasil
- [ ] Tab Import: Upload .csv berhasil
- [ ] Tab Import: Preview tampil benar
- [ ] Tab Import: Import data save ke localStorage
- [ ] Tab Mahasiswa: Tampilkan mahasiswa dengan nilai
- [ ] Tab Mahasiswa: Filter prodi works
- [ ] Tab Mata Kuliah: Statistik MK tampil
- [ ] Tab Mata Kuliah: Color coding benar
- [ ] Tab CPL: Summary cards update
- [ ] Tab CPL: Distribusi badges tampil
- [ ] Refresh button di semua tab works
- [ ] Integrasi antar tab berfungsi

### CPL Mapping Testing
- [ ] Tabel matrix tampil
- [ ] 8 CPL untuk setiap prodi
- [ ] CPMK mapping ke CPL benar

### Responsive Testing
- [ ] Mobile: Hamburger menu works
- [ ] Mobile: Sidebar collapse
- [ ] Mobile: Table horizontal scroll
- [ ] Mobile: Cards stack vertically
- [ ] Tablet: Layout adjust
- [ ] Desktop: Full layout

---

## 🆘 Bantuan Lebih Lanjut

### Dokumentasi
- **Quick Start**: `QUICK_START.md` (dokumen ini)
- **Technical Docs**: `TECHNICAL_DOC.md`
- **README**: `README.md`
- **Import Guide**: `PANDUAN-IMPORT-NILAI.md`
- **MK Codes**: `MK_CODES.md`

### Kontak
- **Developer**: Lihat TECHNICAL_DOC.md
- **User Support**: Hubungi administrator sistem
- **Bug Report**: Catat error message dan langkah reproduksi
- **GitHub**: https://github.com/Nur-Hidayat-FTI22E/CPL_Sign.git

---

**© 2025 Universitas Muhammadiyah Makassar**

*Panduan ini untuk versi development. Fitur production mungkin berbeda.*

**Version:** 2.0 (Updated with Import Feature & CPMK Breakdown)  
**Last Updated:** Januari 2025

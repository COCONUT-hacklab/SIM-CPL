# Panduan Import Nilai Mahasiswa

## Format File yang Didukung

Sistem mendukung import file dengan format berikut:
- **CSV** (Comma-Separated Values) - `.csv`
- **TSV** (Tab-Separated Values) - `.tsv` 
- **Text file** dengan delimiter koma (,), semicolon (;), atau tab

## Struktur File

### Kolom Wajib
1. **NIM** - Nomor Induk Mahasiswa (kolom pertama)
2. **Nama** - Nama lengkap mahasiswa (kolom kedua)

### Kolom Nilai Mata Kuliah
- Kolom ketiga dan seterusnya berisi **Kode MK** atau **Nama MK** sebagai header
- Nilai harus dalam rentang **0-100**
- Kolom MK harus sesuai dengan semester yang dipilih

## Contoh Format File

### Contoh 1: Format CSV dengan koma (,)
```csv
NIM,Nama,INF101,INF102,INF103,INF104,INF105,INF106,INF107,INF108
2024001,Ahmad Fauzi,85,88,90,82,85,87,80,84
2024002,Siti Aisyah,92,89,95,88,92,90,85,91
2024003,Budi Santoso,78,82,85,75,80,83,78,80
```

### Contoh 2: Format CSV dengan semicolon (;)
```csv
NIM;Nama;INF101;INF102;INF103;INF104;INF105;INF106;INF107;INF108
2024001;Ahmad Fauzi;85;88;90;82;85;87;80;84
2024002;Siti Aisyah;92;89;95;88;92;90;85;91
```

### Contoh 3: Format TSV (Tab-separated)
```
NIM	Nama	INF101	INF102	INF103	INF104	INF105	INF106	INF107	INF108
2024001	Ahmad Fauzi	85	88	90	82	85	87	80	84
2024002	Siti Aisyah	92	89	95	88	92	90	85	91
```

## File Contoh yang Tersedia

Di folder root project tersedia file contoh:

### 1. `contoh-import-informatika-sem1.csv`
- Program Studi: **Teknik Informatika**
- Semester: **1**
- Mata Kuliah: INF101, INF102, INF103, INF104, INF105, INF106, INF107, INF108
- Jumlah mahasiswa: 10 orang

### 2. `contoh-import-informatika-sem2.csv`
- Program Studi: **Teknik Informatika**
- Semester: **2**
- Mata Kuliah: INF201, INF202, INF203, INF204, INF205, INF206, INF207
- Jumlah mahasiswa: 10 orang

### 3. `contoh-import-arsitektur-sem2.csv`
- Program Studi: **Arsitektur**
- Semester: **2**
- Mata Kuliah: ARS201, ARS202, ARS203, ARS204, ARS205, ARS206, ARS207, ARS208, ARS209
- Jumlah mahasiswa: 10 orang

### 4. `contoh-import-semicolon.csv`
- Contoh format dengan delimiter semicolon (;)
- Program Studi: **Teknik Informatika**
- Semester: **1**

## Cara Import

1. **Login ke sistem** sebagai Kaprodi
2. Pilih menu **"Manajemen Data"** di sidebar
3. Klik tab **"Import Nilai"**
4. **Pilih filter:**
   - Program Studi (INF, ARS, PWK, SIP, ELK)
   - Semester (1-8)
5. **Upload file:**
   - Klik tombol "Pilih File"
   - Pilih file CSV/TXT yang sudah disiapkan
6. **Preview data:**
   - Klik tombol "Preview Data"
   - Periksa apakah data sudah benar
7. **Import:**
   - Jika sudah sesuai, klik "Import ke Sistem"
   - Sistem akan otomatis:
     - Menyimpan nilai ke database lokal
     - Menghitung bobot CPMK
     - Menghitung nilai CPL
     - Menampilkan statistik import

## Catatan Penting

### Pencocokan Mata Kuliah
- Sistem akan mencocokkan header kolom dengan **kode MK** atau **nama MK**
- Pencocokan tidak case-sensitive (huruf besar/kecil diabaikan)
- Spasi dan karakter khusus diabaikan dalam pencocokan
- Contoh: "INF105", "inf105", "Algoritma & Pemrograman" akan cocok dengan MK INF105

### Validasi Data
- **NIM dan Nama** harus diisi (wajib)
- **Nilai** harus angka dalam rentang 0-100
- Kolom nilai yang kosong atau tidak valid akan diabaikan
- Mahasiswa yang belum terdaftar akan otomatis dibuat ID-nya

### Perhitungan Otomatis
Setelah import berhasil, sistem akan otomatis menghitung:

1. **Bobot CPMK per MK:**
   - Setiap MK memiliki beberapa CPMK
   - Nilai MK dibagi rata ke semua CPMK
   - Contoh: MK A (nilai 85) punya 4 CPMK → masing-masing CPMK dapat kontribusi dari nilai 85

2. **Bobot MK terhadap CPL:**
   - Setiap CPL terkait dengan beberapa MK
   - Bobot dibagi rata ke semua MK yang terkait
   - Contoh: CPL1 terkait 5 MK → bobot per MK = 100%/5 = 20%

3. **Nilai CPL:**
   - Nilai CPL = rata-rata dari semua MK yang berkontribusi
   - Hasil dapat dilihat di halaman **"Laporan CPL"**

## Troubleshooting

### File tidak bisa dibaca
- Pastikan file dalam format CSV atau text
- Coba buka file dengan text editor, pastikan ada delimiter (koma/semicolon/tab)
- Pastikan encoding file UTF-8

### Data tidak muncul di preview
- Periksa header kolom harus ada "NIM" dan "Nama"
- Pastikan minimal ada 1 baris data setelah header
- Periksa delimiter konsisten di semua baris

### Import gagal atau nilai tidak masuk
- Pastikan Program Studi dan Semester sudah dipilih dengan benar
- Pastikan kode MK di file sesuai dengan MK yang ada di semester tersebut
- Nilai harus berupa angka 0-100

### Tidak ada mata kuliah yang ditampilkan
- Pastikan sudah memilih Program Studi dan Semester yang benar
- Periksa di data master apakah MK untuk prodi/semester tersebut sudah tersedia

## Tips

1. **Gunakan file contoh** sebagai template
2. **Copy-paste** dari Excel ke file contoh, lalu save as CSV
3. **Preview dulu** sebelum import untuk memastikan data benar
4. **Import bertahap** per semester untuk mempermudah tracking
5. **Backup data** sebelum import massal

## Kontak Support

Jika mengalami kendala dalam import data, hubungi:
- Tim IT: 
- Admin Sistem CPL: 

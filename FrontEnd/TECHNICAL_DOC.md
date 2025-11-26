# 📘 Technical Documentation - Sistem CPL

**Sistem Capaian Pembelajaran Lulusan**  
Universitas Muhammadiyah Makassar

---

## 📋 Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Directory Structure](#3-directory-structure)
4. [Data Models](#4-data-models)
5. [Data Flow & Integration](#5-data-flow--integration)
6. [Calculation Algorithms](#6-calculation-algorithms)
7. [Component Architecture](#7-component-architecture)
8. [State Management](#8-state-management)
9. [API & Functions Reference](#9-api--functions-reference)
10. [Security](#10-security)
11. [Performance](#11-performance)
12. [Testing](#12-testing)
13. [Deployment](#13-deployment)

---

## 1. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 14)                 │
├─────────────────────────────────────────────────────────────┤
│  Landing Page  │  Login  │  Dashboard  │  Input  │  Laporan │
│                │  Auth   │  Overview   │  Nilai  │  CPL     │
├────────────────┴─────────┴─────────────┴─────────┴──────────┤
│                     Manajemen Data (NEW!)                    │
│  ┌──────────┬──────────────┬──────────────┬───────────────┐ │
│  │  Import  │  Mahasiswa   │  Mata Kuliah │  CPL & CPMK   │ │
│  │  Nilai   │  Monitoring  │  Statistics  │  Overview     │ │
│  └──────────┴──────────────┴──────────────┴───────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Component Layer                           │
│  Navbar │ Sidebar │ Charts │ Tables │ Forms │ Cards         │
├─────────────────────────────────────────────────────────────┤
│                    Data Integration Layer                    │
│  getCombinedNilaiData() │ hitungNilaiCPLPerSemester()      │
│  hitungCPMKBreakdownPerCPL() │ Data Merge Logic            │
├─────────────────────────────────────────────────────────────┤
│                    Data Storage Layer                        │
│  ┌─────────────────┐        ┌────────────────┐             │
│  │  localStorage   │   +    │   mockData.ts  │             │
│  │  (User Input)   │        │   (Static)     │             │
│  └─────────────────┘        └────────────────┘             │
│         Priority: localStorage > mockData                    │
└─────────────────────────────────────────────────────────────┘
```

### System Flow Diagram

```
[User Login] → [Authentication]
     ↓
[Dashboard] → [Tree Diagram CPL-MK-CPMK]
     ↓
[Input Nilai Manual] ──┐
                       ├──→ [localStorage]
[Import Excel/CSV] ────┘         ↓
                         [Data Integration Layer]
                                  ↓
                    ┌─────────────┴─────────────┐
                    ↓                           ↓
            [Auto Calculate]              [Merge with Mock]
            CPL ← CPMK ← MK                     ↓
                    ↓                    [Refresh Trigger]
            [Update All Tabs]                   ↓
                    ↓                    ┌──────┴──────┐
            ┌───────┴────────┐           ↓             ↓
            ↓                ↓      [Mahasiswa]   [Mata Kuliah]
     [Laporan CPL]    [Dashboard]        ↓             ↓
     (with Breakdown)  (Updated)    [CPL & CPMK]  [Statistics]
```

---

## 2. Technology Stack

### Frontend Framework
```yaml
Core:
  - Next.js: 14.2.33 (App Router)
  - React: 19.0.0
  - TypeScript: 5.x

Styling:
  - Tailwind CSS: 3.3
  - Custom CSS Variables
  - Responsive Design (Mobile-first)

Libraries:
  - Recharts: 2.10.x (Charts & Visualizations)
  - xlsx: 0.18.5 (Excel parsing)
  - lucide-react: Icons (optional)

State Management:
  - React Hooks (useState, useEffect, useCallback)
  - localStorage API
  - Session Storage (auth)

Build Tools:
  - ESLint: 9.x
  - PostCSS: 8.x
  - Autoprefixer
```

### Development Environment
```bash
Node.js: 18+ or 20+
Package Manager: npm (recommended) / yarn / pnpm
Port: 3000 (default)
Browser: Chrome, Firefox, Safari, Edge (latest versions)
```

---

## 3. Directory Structure

### Complete Project Structure

```
kkp-plus-new/
├── public/                          # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── page.jsx                # Landing page (/)
│   │   ├── layout.js               # Root layout
│   │   ├── globals.css             # Global styles + Tailwind
│   │   ├── favicon.ico             # Site favicon
│   │   │
│   │   ├── (auth)/                 # Auth route group
│   │   │   ├── login/
│   │   │   │   └── page.jsx       # Login page
│   │   │   └── layout.jsx          # Auth layout
│   │   │
│   │   ├── dashboard/              # Dashboard route
│   │   │   ├── page.jsx           # Main dashboard with tree diagram
│   │   │   └── layout.jsx          # Dashboard layout
│   │   │
│   │   ├── input-nilai/
│   │   │   └── page.jsx           # Manual input nilai form
│   │   │
│   │   ├── laporan/                # Laporan CPL
│   │   │   └── page.tsx           # Report with CPMK breakdown
│   │   │
│   │   ├── manajemen/              # Manajemen Data (NEW!)
│   │   │   └── page.tsx           # 4 tabs: Import, Mahasiswa, MK, CPL
│   │   │
│   │   ├── cpl-mapping/            # CPL Pemetaan
│   │   │   └── page.tsx           # CPL-MK-CPMK mapping matrix
│   │   │
│   │   ├── penilaian/
│   │   │   └── page.jsx           # Penilaian module
│   │   │
│   │   └── pengumuman/
│   │       └── page.jsx           # Announcement page
│   │
│   ├── components/                  # Reusable components
│   │   ├── Navbar.jsx              # Top navigation bar
│   │   ├── Sidebar.jsx             # Side navigation (6 menus)
│   │   ├── LayoutWrapper.jsx       # Layout HOC
│   │   ├── BodyClassManager.jsx    # Body class manager
│   │   ├── RadarCPL.jsx            # Radar chart component
│   │   ├── CardCPL.jsx             # CPL card display
│   │   ├── AdvancedCharts.jsx      # Advanced chart components
│   │   ├── SemesterFilter.jsx      # Semester filter dropdown
│   │   ├── ProdiSelector.jsx       # Prodi selector
│   │   ├── MkGradeInput.jsx        # MK grade input form
│   │   └── CpmkBreakdownDisplay.jsx # CPMK breakdown table
│   │
│   ├── data/                        # Data layer
│   │   ├── mock.js                 # Main mock data (Informatika)
│   │   ├── mock-arsitektur.js      # Arsitektur data
│   │   └── kurikulumArsitektur.js  # Arsitektur kurikulum
│   │
│   └── utils/                       # Utility functions
│       ├── dataIntegration.ts      # Data integration layer (CORE)
│       └── gradeCalculator.js      # Grade calculation utilities
│
├── contoh-import-*.xlsx/csv         # Example import files
├── PANDUAN-IMPORT-NILAI.md          # Import guide
├── QUICK_START.md                   # Quick start guide
├── TECHNICAL_DOC.md                 # This file
├── README.md                        # Project overview
├── MK_CODES.md                      # MK codes reference (to be created)
│
├── package.json                     # Dependencies
├── package-lock.json                # Lock file
├── next.config.mjs                  # Next.js configuration
├── tailwind.config.js               # Tailwind configuration
├── postcss.config.mjs               # PostCSS configuration
├── eslint.config.mjs                # ESLint configuration
├── jsconfig.json                    # JavaScript configuration
├── .gitignore                       # Git ignore rules
└── .next/                           # Build output (generated)
```

### Key Files Explanation

#### **src/utils/dataIntegration.ts** (350+ lines)
Core integration layer yang menggabungkan data dari localStorage dan mockData.

**Key Functions:**
- `getCombinedNilaiData()`: Merge nilai dari localStorage + mockData
- `hitungNilaiCPLPerSemesterIntegrated()`: Kalkulasi CPL dengan weighted average
- `hitungCPMKBreakdownPerCPL()`: Breakdown detail CPMK per CPL
- Priority: localStorage > mockData

#### **src/app/dashboard/manajemen/page.tsx** (1000+ lines)
Halaman manajemen data dengan 4 tab terintegrasi.

**Features:**
- Tab Import: Upload Excel/CSV, preview, import
- Tab Mahasiswa: Monitoring mahasiswa dengan nilai
- Tab Mata Kuliah: Statistik per MK
- Tab CPL: Overview pencapaian CPL
- Real-time refresh mechanism

#### **src/app/dashboard/laporan/page.tsx** (900+ lines)
Laporan CPL dengan expandable CPMK breakdown.

**Features:**
- Generate laporan per mahasiswa + semester
- Expandable CPL rows
- Detail breakdown: MK → CPMK dengan bobot
- Export PDF/Excel (mockup)

#### **src/data/mock.js**
Data statis untuk Informatika (69 MK, 8 CPL, 144 SKS).

**Contains:**
- `prodiData`: 5 Program Studi
- `cplData`: 8 CPL per prodi
- `mahasiswaData`: Daftar mahasiswa
- `mkData`: 69 Mata Kuliah Informatika
- `cpmkData`: CPMK dengan bobot
- `cpmkToCplMapping`: Mapping CPMK → CPL

---

## 4. Data Models

### TypeScript Interfaces

```typescript
// ============= CORE ENTITIES =============

interface Prodi {
  kode: string;           // 'INF', 'ARS', 'PWK', 'SIP', 'ELK'
  nama: string;           // 'S1 Teknik Informatika'
  fakultas: string;       // 'Teknik'
  totalSKS: number;       // 144, 145, etc.
}

interface Mahasiswa {
  id: string;
  nim: string;            // '105841109601'
  nama: string;           // 'Andi Miftah'
  prodiKode: string;      // 'INF'
  angkatan: string;       // '2021'
  semester: number;       // 1-8
  email?: string;
  noHP?: string;
}

interface CPL {
  kode: string;           // 'CPL1', 'CPL2', ...
  prodiKode: string;      // 'INF'
  deskripsi: string;      // 'Mampu menerapkan pemikiran logis...'
  kategori: 'sikap' | 'pengetahuan' | 'keterampilan_umum' | 'keterampilan_khusus';
}

interface MataKuliah {
  kode: string;           // 'INF101', 'ARS201'
  nama: string;           // 'Pemrograman Web'
  sks: number;            // 2, 3, 4
  semester: number;       // 1-8
  prodiKode: string;      // 'INF'
  jenis: 'wajib' | 'pilihan';
  prasyarat?: string[];   // ['INF100']
}

interface CPMK {
  kode: string;           // 'CPMK1-1'
  mkKode: string;         // 'INF101'
  deskripsi: string;      // 'Memahami konsep dasar web'
  bobot: number;          // 20 (dalam persen)
  urutan: number;         // 1, 2, 3, 4
}

interface CPMKtoCPLMapping {
  cpmkKode: string;       // 'CPMK1-1'
  cplKode: string;        // 'CPL3'
  bobot: number;          // 30 (kontribusi CPMK terhadap CPL ini)
}

// ============= NILAI & TRANSACTIONS =============

interface NilaiMahasiswa {
  id: string;
  mahasiswaId: string;
  mkKode: string;
  semester: string;       // '2023/2024 Ganjil'
  tahunAjaran: string;    // '2023/2024'
  nilaiAkhir: number;     // 0-100
  nilaiHuruf: string;     // 'A', 'B+', 'B', etc.
  nilaiCPMK: NilaiCPMK[];
  tanggalInput: string;   // ISO date
  inputBy: string;        // user ID
  source: 'manual' | 'import' | 'mock';
}

interface NilaiCPMK {
  cpmkKode: string;
  nilai: number;          // 0-100
  bobot: number;          // 20 (persen)
}

interface CPLResult {
  cplKode: string;
  deskripsi: string;
  nilai: number;          // 0-100
  status: 'tercapai' | 'cukup' | 'belum_tercapai';
  jumlahCPMK: number;
  jumlahMK: number;
}

// ============= BREAKDOWN & ANALYTICS =============

interface CPMKBreakdown {
  cplKode: string;
  cplDeskripsi: string;
  nilaiCPL: number;
  mataKuliah: MKBreakdown[];
}

interface MKBreakdown {
  mkKode: string;
  mkNama: string;
  mkSKS: number;
  bobotMK: number;        // 100% / jumlah MK
  cpmkList: CPMKDetail[];
  nilaiMK: number;
  kontribusiKeCPL: number;
}

interface CPMKDetail {
  cpmkKode: string;
  cpmkDeskripsi: string;
  bobot: number;          // bobot dalam MK
  nilai: number;
  nilaiTertimbang: number;  // nilai × bobot
  kontribusiKeCPL: number;  // bobotMK × bobot × nilai
}

// ============= IMPORT DATA =============

interface ImportRecord {
  nim: string;
  nama: string;
  [mkKode: string]: number | string;  // Dynamic MK columns
}

interface ImportResult {
  total: number;
  sukses: number;
  gagal: number;
  errors: ImportError[];
}

interface ImportError {
  row: number;
  nim: string;
  field: string;
  message: string;
}

// ============= USER & AUTH =============

interface User {
  id: string;
  email: string;
  nama: string;
  role: 'admin' | 'kaprodi' | 'dosen' | 'mahasiswa';
  prodiKode?: string;     // for kaprodi
}

interface LoginCredentials {
  email: string;
  password: string;
}
```

### Database Schema (Future - PostgreSQL)

```sql
-- Prodi
CREATE TABLE prodi (
  kode VARCHAR(3) PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  fakultas VARCHAR(50),
  total_sks INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Mahasiswa
CREATE TABLE mahasiswa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nim VARCHAR(20) UNIQUE NOT NULL,
  nama VARCHAR(100) NOT NULL,
  prodi_kode VARCHAR(3) REFERENCES prodi(kode),
  angkatan VARCHAR(4),
  semester INTEGER,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_mahasiswa_nim (nim),
  INDEX idx_mahasiswa_prodi (prodi_kode)
);

-- CPL
CREATE TABLE cpl (
  kode VARCHAR(10) PRIMARY KEY,
  prodi_kode VARCHAR(3) REFERENCES prodi(kode),
  deskripsi TEXT,
  kategori VARCHAR(30),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Mata Kuliah
CREATE TABLE mata_kuliah (
  kode VARCHAR(10) PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  sks INTEGER,
  semester INTEGER,
  prodi_kode VARCHAR(3) REFERENCES prodi(kode),
  jenis VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_mk_prodi (prodi_kode),
  INDEX idx_mk_semester (semester)
);

-- CPMK
CREATE TABLE cpmk (
  kode VARCHAR(20) PRIMARY KEY,
  mk_kode VARCHAR(10) REFERENCES mata_kuliah(kode),
  deskripsi TEXT,
  bobot INTEGER,
  urutan INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_cpmk_mk (mk_kode)
);

-- CPMK to CPL Mapping
CREATE TABLE cpmk_cpl_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpmk_kode VARCHAR(20) REFERENCES cpmk(kode),
  cpl_kode VARCHAR(10) REFERENCES cpl(kode),
  bobot INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_mapping_cpmk (cpmk_kode),
  INDEX idx_mapping_cpl (cpl_kode)
);

-- Nilai Mahasiswa
CREATE TABLE nilai_mahasiswa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mahasiswa_id UUID REFERENCES mahasiswa(id),
  mk_kode VARCHAR(10) REFERENCES mata_kuliah(kode),
  semester VARCHAR(20),
  tahun_ajaran VARCHAR(10),
  nilai_akhir DECIMAL(5,2),
  nilai_huruf VARCHAR(2),
  source VARCHAR(10),
  input_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_nilai_mahasiswa (mahasiswa_id),
  INDEX idx_nilai_mk (mk_kode),
  INDEX idx_nilai_semester (semester)
);

-- Nilai CPMK (detail)
CREATE TABLE nilai_cpmk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nilai_mahasiswa_id UUID REFERENCES nilai_mahasiswa(id) ON DELETE CASCADE,
  cpmk_kode VARCHAR(20) REFERENCES cpmk(kode),
  nilai DECIMAL(5,2),
  bobot INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_nilai_cpmk_nilai_id (nilai_mahasiswa_id),
  INDEX idx_nilai_cpmk_kode (cpmk_kode)
);
```

---

## 5. Data Flow & Integration

### Data Integration Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              dataIntegration.ts (Core Module)                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────┐         ┌──────────────┐                │
│  │ localStorage  │         │  mockData.ts │                │
│  │ (User Input)  │         │  (Static)    │                │
│  └───────┬───────┘         └──────┬───────┘                │
│          │                        │                          │
│          └────────┬───────────────┘                          │
│                   ↓                                           │
│        getCombinedNilaiData()                                │
│                   ↓                                           │
│        [Merge with Priority: localStorage > mock]            │
│                   ↓                                           │
│     ┌─────────────┴─────────────┐                           │
│     ↓                           ↓                            │
│  hitungNilaiCPL          hitungCPMKBreakdown                │
│  PerSemester             PerCPL                              │
│     ↓                           ↓                            │
│  CPL Results            Detailed Breakdown                   │
│  (aggregated)           (MK → CPMK → CPL)                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Integration Functions

#### 1. **getCombinedNilaiData()**
Menggabungkan data nilai dari localStorage dan mockData.

```typescript
export function getCombinedNilaiData(): NilaiMahasiswa[] {
  // 1. Load dari localStorage
  const localData = loadNilaiFromLocalStorage();
  
  // 2. Load mockData
  const mockData = nilaiMahasiswaData;
  
  // 3. Merge dengan priority localStorage
  const combined = [...localData];
  
  mockData.forEach(mock => {
    const exists = combined.find(
      c => c.mahasiswaId === mock.mahasiswaId && 
           c.mkKode === mock.mkKode
    );
    if (!exists) {
      combined.push({ ...mock, source: 'mock' });
    }
  });
  
  return combined;
}
```

#### 2. **hitungNilaiCPLPerSemesterIntegrated()**
Kalkulasi CPL menggunakan weighted average dari CPMK.

```typescript
export function hitungNilaiCPLPerSemesterIntegrated(
  mahasiswaId: string,
  semester: number
): CPLResult[] {
  // 1. Get combined data
  const allNilai = getCombinedNilaiData();
  
  // 2. Filter by mahasiswa & semester
  const nilaiMhs = allNilai.filter(
    n => n.mahasiswaId === mahasiswaId && 
         getMKSemester(n.mkKode) === semester
  );
  
  // 3. Initialize CPL accumulator
  const cplScores: Map<string, {
    totalNilai: number;
    totalBobot: number;
    jumlahCPMK: number;
    jumlahMK: number;
  }> = new Map();
  
  // 4. Process each nilai
  nilaiMhs.forEach(nilai => {
    // Get MK bobot (100% / jumlah MK per CPL)
    const mkCount = getMKCountPerCPL(nilai.mkKode);
    const bobotMK = 100 / mkCount;
    
    // Process each CPMK
    nilai.nilaiCPMK.forEach(nc => {
      // Get CPMK bobot dalam MK
      const cpmk = getCPMK(nc.cpmkKode);
      const bobotCPMK = cpmk.bobot;
      
      // Get CPL mappings
      const mappings = getCPLMappings(nc.cpmkKode);
      
      mappings.forEach(mapping => {
        if (!cplScores.has(mapping.cplKode)) {
          cplScores.set(mapping.cplKode, {
            totalNilai: 0,
            totalBobot: 0,
            jumlahCPMK: 0,
            jumlahMK: 0
          });
        }
        
        const score = cplScores.get(mapping.cplKode)!;
        
        // Calculate weighted contribution
        // Kontribusi = Nilai × (BobotMK / 100) × (BobotCPMK / 100)
        const kontribusi = nc.nilai * (bobotMK / 100) * (bobotCPMK / 100);
        
        score.totalNilai += kontribusi;
        score.totalBobot += (bobotMK / 100) * (bobotCPMK / 100);
        score.jumlahCPMK++;
      });
    });
  });
  
  // 5. Calculate final CPL scores
  return Array.from(cplScores.entries()).map(([cplKode, score]) => {
    const nilai = score.totalBobot > 0 
      ? Math.round(score.totalNilai / score.totalBobot)
      : 0;
    
    return {
      cplKode,
      deskripsi: getCPLDescription(cplKode),
      nilai,
      status: getStatus(nilai),
      jumlahCPMK: score.jumlahCPMK,
      jumlahMK: score.jumlahMK
    };
  });
}
```

#### 3. **hitungCPMKBreakdownPerCPL()**
Breakdown detail kontribusi MK dan CPMK ke CPL.

```typescript
export function hitungCPMKBreakdownPerCPL(
  mahasiswaId: string,
  semester: number
): CPMKBreakdown[] {
  // Similar logic to hitungNilaiCPL but returns detailed breakdown
  // Returns structure: CPL → MK → CPMK with all calculations
  
  const breakdowns: CPMKBreakdown[] = [];
  
  // Group by CPL
  cplData.forEach(cpl => {
    const mkList: MKBreakdown[] = [];
    
    // Get all MK that contribute to this CPL
    const relevantMK = getMKForCPL(cpl.kode, semester);
    
    relevantMK.forEach(mk => {
      const cpmkList: CPMKDetail[] = [];
      
      // Get CPMK for this MK
      const cpmks = getCPMKForMK(mk.kode);
      
      cpmks.forEach(cpmk => {
        // Get nilai for this CPMK
        const nilaiCPMK = getNilaiCPMK(mahasiswaId, cpmk.kode);
        
        cpmkList.push({
          cpmkKode: cpmk.kode,
          cpmkDeskripsi: cpmk.deskripsi,
          bobot: cpmk.bobot,
          nilai: nilaiCPMK,
          nilaiTertimbang: nilaiCPMK * (cpmk.bobot / 100),
          kontribusiKeCPL: calculateContribution(nilaiCPMK, cpmk, mk, cpl)
        });
      });
      
      mkList.push({
        mkKode: mk.kode,
        mkNama: mk.nama,
        mkSKS: mk.sks,
        bobotMK: 100 / relevantMK.length,
        cpmkList,
        nilaiMK: calculateNilaiMK(cpmkList),
        kontribusiKeCPL: calculateMKContribution(cpmkList)
      });
    });
    
    breakdowns.push({
      cplKode: cpl.kode,
      cplDeskripsi: cpl.deskripsi,
      nilaiCPL: calculateCPLFromMK(mkList),
      mataKuliah: mkList
    });
  });
  
  return breakdowns;
}
```

### localStorage Structure

```typescript
// Key: 'cpl_nilai_mahasiswa'
// Value: JSON string of NilaiMahasiswa[]

interface LocalStorageNilai {
  version: string;  // '1.0'
  lastUpdate: string;  // ISO date
  data: NilaiMahasiswa[];
}

// Example:
localStorage.setItem('cpl_nilai_mahasiswa', JSON.stringify({
  version: '1.0',
  lastUpdate: '2025-11-27T10:30:00Z',
  data: [
    {
      id: 'uuid-1',
      mahasiswaId: '1',
      mkKode: 'INF101',
      semester: '2023/2024 Ganjil',
      tahunAjaran: '2023/2024',
      nilaiAkhir: 85,
      nilaiHuruf: 'A',
      nilaiCPMK: [
        { cpmkKode: 'CPMK1-1', nilai: 85, bobot: 20 },
        { cpmkKode: 'CPMK1-2', nilai: 90, bobot: 30 }
      ],
      tanggalInput: '2025-11-27T10:30:00Z',
      inputBy: 'user-1',
      source: 'manual'
    }
  ]
}));
```

---

## 6. Calculation Algorithms

### Weighted Average CPL Calculation

**Formula:**

```
Nilai CPL = Σ (Nilai CPMK × Bobot MK × Bobot CPMK) / Σ (Bobot MK × Bobot CPMK)

Where:
- Bobot MK = 100% / Jumlah MK yang berkontribusi ke CPL
- Bobot CPMK = Bobot CPMK dalam MK (%)
- Nilai CPMK = Nilai yang diinput (0-100)
```

**Example Calculation:**

```
CPL3: Mampu menerapkan pemikiran logis

MK1: Pemrograman Web (INF101)
  - Jumlah MK untuk CPL3 = 8
  - Bobot MK1 = 100% / 8 = 12.5%
  
  CPMK1-1: Nilai = 85, Bobot = 20%
  - Kontribusi ke CPL3 = 85 × 0.125 × 0.20 = 2.125
  
  CPMK1-2: Nilai = 90, Bobot = 30%
  - Kontribusi ke CPL3 = 90 × 0.125 × 0.30 = 3.375

MK2: Struktur Data (INF102)
  - Bobot MK2 = 12.5%
  
  CPMK2-1: Nilai = 78, Bobot = 25%
  - Kontribusi ke CPL3 = 78 × 0.125 × 0.25 = 2.4375
  
  ... (continue for all MK)

Total Kontribusi = Σ semua kontribusi CPMK
Total Bobot = Σ (Bobot MK × Bobot CPMK)

Nilai CPL3 = Total Kontribusi / Total Bobot
```

### Status Classification

```typescript
function getStatus(nilai: number): 'tercapai' | 'cukup' | 'belum_tercapai' {
  if (nilai >= 75) return 'tercapai';
  if (nilai >= 60) return 'cukup';
  return 'belum_tercapai';
}

// Color coding
const statusColors = {
  tercapai: 'green',         // #10b981
  cukup: 'yellow',           // #f59e0b
  belum_tercapai: 'red'      // #ef4444
};
```

### Grade Conversion

```typescript
function convertToGrade(nilai: number): string {
  if (nilai >= 85) return 'A';
  if (nilai >= 80) return 'A-';
  if (nilai >= 75) return 'B+';
  if (nilai >= 70) return 'B';
  if (nilai >= 65) return 'B-';
  if (nilai >= 60) return 'C+';
  if (nilai >= 55) return 'C';
  if (nilai >= 50) return 'C-';
  if (nilai >= 45) return 'D';
  return 'E';
}
```

---

## 7. Component Architecture

### Component Hierarchy

```
App (layout.js)
├── Navbar
│   ├── Logo
│   ├── ProdiName
│   └── UserMenu
│       ├── Profile
│       └── Logout
│
├── Sidebar
│   ├── MenuItem (Dashboard)
│   ├── MenuItem (Input Nilai)
│   ├── MenuItem (Laporan)
│   ├── MenuItem (Manajemen Data) ← NEW!
│   ├── MenuItem (CPL & Pemetaan)
│   └── MenuItem (Settings)
│
└── Main Content
    │
    ├── Page: Dashboard
    │   ├── TreeDiagram (CPL-MK-CPMK)
    │   ├── StatCards (4 cards)
    │   ├── RadarCPL (8 CPL)
    │   └── BarChart (Trend)
    │
    ├── Page: Input Nilai
    │   ├── MahasiswaSelector
    │   ├── MKSelector
    │   ├── MkGradeInput
    │   │   └── CPMKInputTable
    │   └── SaveButton
    │
    ├── Page: Laporan
    │   ├── FilterSection
    │   │   ├── MahasiswaDropdown
    │   │   └── SemesterFilter
    │   ├── GenerateButton
    │   ├── CPLTable (Expandable)
    │   │   └── CpmkBreakdownDisplay
    │   │       ├── MKCard (multiple)
    │   │       └── CPMKTable (per MK)
    │   ├── RadarCPL
    │   └── ExportButtons
    │
    ├── Page: Manajemen Data ← NEW!
    │   ├── TabNavigation (4 tabs)
    │   ├── Tab: Import Nilai
    │   │   ├── FilterSection (Prodi, Semester)
    │   │   ├── FileUpload (drag & drop)
    │   │   ├── PreviewTable
    │   │   ├── ImportButton
    │   │   └── ResultStats
    │   ├── Tab: Mahasiswa
    │   │   ├── FilterSection (Prodi)
    │   │   ├── RefreshButton
    │   │   ├── StatCards (3 cards)
    │   │   └── MahasiswaTable
    │   ├── Tab: Mata Kuliah
    │   │   ├── FilterSection (Prodi, Semester)
    │   │   ├── RefreshButton
    │   │   └── MKGrid
    │   │       └── MKCard (multiple)
    │   │           ├── MKInfo
    │   │           ├── Statistics
    │   │           └── ProgressBar
    │   └── Tab: CPL & CPMK
    │       ├── FilterSection (Prodi, Semester)
    │       ├── RefreshButton
    │       ├── SummaryCards (3 cards)
    │       ├── InfoBox (Calculation explanation)
    │       └── CPLTable
    │           └── DistributionBadges
    │
    ├── Page: CPL & Pemetaan
    │   ├── MatrixView (CPL × MK × CPMK)
    │   └── MappingTable
    │
    └── Page: Pengumuman
        └── AnnouncementList
```

### Key Component Props

```typescript
// Navbar.jsx
interface NavbarProps {
  user: User;
  prodiName: string;
  onLogout: () => void;
}

// Sidebar.jsx
interface SidebarProps {
  activeMenu: string;
  onNavigate: (path: string) => void;
}

// RadarCPL.jsx
interface RadarCPLProps {
  data: CPLResult[];
  width?: number;
  height?: number;
  showLegend?: boolean;
}

// CpmkBreakdownDisplay.jsx
interface CpmkBreakdownDisplayProps {
  breakdown: CPMKBreakdown;
  expanded: boolean;
  onToggle: () => void;
}

// MkGradeInput.jsx
interface MkGradeInputProps {
  mkKode: string;
  cpmkList: CPMK[];
  onSave: (nilai: NilaiCPMK[]) => void;
}
```

---

## 8. State Management

### React State Patterns

```typescript
// Dashboard Page State
const [selectedMahasiswa, setSelectedMahasiswa] = useState<string>('');
const [cplResults, setCplResults] = useState<CPLResult[]>([]);
const [expandedCPL, setExpandedCPL] = useState<string[]>([]);

// Manajemen Page State
const [activeTab, setActiveTab] = useState<'import' | 'mahasiswa' | 'mk' | 'cpl'>('import');
const [selectedProdi, setSelectedProdi] = useState<string>('INF');
const [selectedSemester, setSelectedSemester] = useState<number>(1);
const [refreshData, setRefreshData] = useState<number>(0);
const [uploadedFile, setUploadedFile] = useState<File | null>(null);
const [previewData, setPreviewData] = useState<ImportRecord[]>([]);

// Laporan Page State
const [laporanData, setLaporanData] = useState<LaporanData | null>(null);
const [expandedCPL, setExpandedCPL] = useState<Set<string>>(new Set());
const [loading, setLoading] = useState<boolean>(false);
```

### State Update Patterns

```typescript
// Refresh mechanism
const handleRefresh = () => {
  setRefreshData(prev => prev + 1);
};

useEffect(() => {
  // Re-fetch data when refreshData changes
  loadData();
}, [refreshData]);

// Toggle expansion
const toggleCPL = (cplKode: string) => {
  setExpandedCPL(prev => {
    const newSet = new Set(prev);
    if (newSet.has(cplKode)) {
      newSet.delete(cplKode);
    } else {
      newSet.add(cplKode);
    }
    return newSet;
  });
};

// File upload handling
const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    setUploadedFile(file);
    parseAndPreview(file);
  }
};
```

---

## 9. API & Functions Reference

### Data Integration Functions

```typescript
// src/utils/dataIntegration.ts

/**
 * Get combined nilai data from localStorage and mockData
 * Priority: localStorage > mockData
 */
export function getCombinedNilaiData(): NilaiMahasiswa[]

/**
 * Calculate CPL values for a mahasiswa in a specific semester
 * Using weighted average of CPMK contributions
 */
export function hitungNilaiCPLPerSemesterIntegrated(
  mahasiswaId: string,
  semester: number
): CPLResult[]

/**
 * Get detailed CPMK breakdown per CPL
 * Returns MK → CPMK hierarchy with all calculations
 */
export function hitungCPMKBreakdownPerCPL(
  mahasiswaId: string,
  semester: number
): CPMKBreakdown[]

/**
 * Save nilai to localStorage
 */
export function saveNilai(nilai: NilaiMahasiswa): void

/**
 * Load nilai from localStorage
 */
export function loadNilaiFromLocalStorage(): NilaiMahasiswa[]

/**
 * Clear all nilai from localStorage
 */
export function clearNilai(): void
```

### Mock Data Functions

```typescript
// src/data/mock.js

/**
 * Get mahasiswa by prodi
 */
export function getMahasiswaByProdi(prodiKode: string): Mahasiswa[]

/**
 * Get MK by prodi and semester
 */
export function getMKByProdiSemester(prodiKode: string, semester: number): MataKuliah[]

/**
 * Get CPMK for a specific MK
 */
export function getCPMKForMK(mkKode: string): CPMK[]

/**
 * Get CPL mappings for a CPMK
 */
export function getCPLMappings(cpmkKode: string): CPMKtoCPLMapping[]

/**
 * Get CPL data for a prodi
 */
export function getCPLByProdi(prodiKode: string): CPL[]
```

### Excel/CSV Parsing Functions

```typescript
// In manajemen/page.tsx

/**
 * Parse Excel file using xlsx library
 */
async function parseExcel(file: File): Promise<ImportRecord[]>

/**
 * Parse CSV file
 */
async function parseCSV(file: File): Promise<ImportRecord[]>

/**
 * Validate import data
 */
function validateImportData(data: ImportRecord[]): {
  valid: ImportRecord[];
  errors: ImportError[];
}

/**
 * Import data to localStorage
 */
async function importData(
  data: ImportRecord[],
  prodiKode: string,
  semester: number
): Promise<ImportResult>
```

---

## 10. Security

### Current Implementation (Development)

```typescript
// Authentication (Session Storage)
const loginUser = (credentials: LoginCredentials) => {
  const user = validateCredentials(credentials);
  if (user) {
    sessionStorage.setItem('user', JSON.stringify(user));
    return true;
  }
  return false;
};

// Check auth
const checkAuth = () => {
  const userStr = sessionStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Logout
const logout = () => {
  sessionStorage.removeItem('user');
  window.location.href = '/login';
};
```

### Production Requirements

```typescript
// 1. JWT Authentication
import jwt from 'jsonwebtoken';

const generateToken = (user: User) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
};

// 2. Password Hashing
import bcrypt from 'bcryptjs';

const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

// 3. API Route Protection
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// 4. CORS Configuration
// next.config.mjs
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGIN },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
        ],
      },
    ];
  },
};

// 5. Input Sanitization
import DOMPurify from 'isomorphic-dompurify';

const sanitizeInput = (input: string) => {
  return DOMPurify.sanitize(input);
};

// 6. Rate Limiting (API Routes)
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

### Security Checklist

- [ ] Implement JWT authentication
- [ ] Hash passwords with bcrypt
- [ ] Add CSRF protection
- [ ] Implement rate limiting
- [ ] Sanitize all user inputs
- [ ] Add XSS protection headers
- [ ] Use HTTPS in production
- [ ] Validate file uploads (type, size)
- [ ] Implement role-based access control (RBAC)
- [ ] Add audit logging
- [ ] Secure environment variables
- [ ] Add SQL injection prevention (prepared statements)

---

## 11. Performance

### Current Optimizations

```typescript
// 1. React.memo for expensive components
import { memo } from 'react';

export const RadarCPL = memo(({ data }) => {
  // Expensive chart rendering
}, (prevProps, nextProps) => {
  return prevProps.data === nextProps.data;
});

// 2. useMemo for expensive calculations
const cplResults = useMemo(() => {
  return hitungNilaiCPLPerSemesterIntegrated(mahasiswaId, semester);
}, [mahasiswaId, semester]);

// 3. useCallback for event handlers
const handleRefresh = useCallback(() => {
  setRefreshData(prev => prev + 1);
}, []);

// 4. Lazy loading components
const LaporanPage = lazy(() => import('./app/dashboard/laporan/page'));

// 5. Next.js automatic code splitting
// Already enabled by default

// 6. Image optimization
import Image from 'next/image';
<Image src="/logo.png" width={200} height={50} alt="Logo" />
```

### Future Optimizations

```typescript
// 1. React Query for server state
import { useQuery, useMutation } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['nilai', mahasiswaId],
  queryFn: () => fetchNilai(mahasiswaId),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// 2. Virtual scrolling for large tables
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: data.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
});

// 3. Debounce search inputs
import { useDebouncedValue } from '@mantine/hooks';

const [search, setSearch] = useState('');
const [debounced] = useDebouncedValue(search, 300);

// 4. Pagination for large datasets
const [page, setPage] = useState(1);
const pageSize = 20;
const paginatedData = data.slice((page - 1) * pageSize, page * pageSize);

// 5. Service Worker for offline support
// public/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('cpl-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/dashboard',
        '/static/css/main.css',
      ]);
    })
  );
});
```

### Performance Metrics

```bash
# Lighthouse scores (target)
Performance: > 90
Accessibility: > 95
Best Practices: > 90
SEO: > 90

# Core Web Vitals (target)
LCP (Largest Contentful Paint): < 2.5s
FID (First Input Delay): < 100ms
CLS (Cumulative Layout Shift): < 0.1
```

---

## 12. Testing

### Unit Tests (Jest + React Testing Library)

```typescript
// __tests__/utils/dataIntegration.test.ts
import { hitungNilaiCPLPerSemesterIntegrated } from '@/utils/dataIntegration';

describe('hitungNilaiCPLPerSemesterIntegrated', () => {
  test('should calculate CPL correctly', () => {
    const result = hitungNilaiCPLPerSemesterIntegrated('1', 1);
    
    expect(result).toHaveLength(8);
    expect(result[0]).toHaveProperty('cplKode');
    expect(result[0]).toHaveProperty('nilai');
    expect(result[0].nilai).toBeGreaterThanOrEqual(0);
    expect(result[0].nilai).toBeLessThanOrEqual(100);
  });
  
  test('should return correct status', () => {
    const result = hitungNilaiCPLPerSemesterIntegrated('1', 1);
    const cpl75 = result.find(r => r.nilai >= 75);
    
    expect(cpl75?.status).toBe('tercapai');
  });
});

// __tests__/components/RadarCPL.test.tsx
import { render, screen } from '@testing-library/react';
import RadarCPL from '@/components/RadarCPL';

describe('RadarCPL', () => {
  const mockData = [
    { cplKode: 'CPL1', nilai: 80 },
    { cplKode: 'CPL2', nilai: 75 },
  ];
  
  test('renders radar chart', () => {
    render(<RadarCPL data={mockData} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});
```

### Integration Tests (Playwright)

```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('user can login and view dashboard', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  
  // Fill login form
  await page.fill('input[type="email"]', 'kaprodi.informatika@unismuh.ac.id');
  await page.fill('input[type="password"]', 'kaprodi123');
  await page.click('button[type="submit"]');
  
  // Check redirect to dashboard
  await expect(page).toHaveURL(/.*dashboard/);
  
  // Check dashboard content
  await expect(page.locator('text=Dashboard CPL')).toBeVisible();
});

// e2e/import.spec.ts
test('user can import nilai from Excel', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard/manajemen');
  
  // Go to Import tab
  await page.click('text=Import Nilai');
  
  // Upload file
  await page.setInputFiles('input[type="file"]', 'contoh-import-informatika-sem1.xlsx');
  
  // Wait for preview
  await expect(page.locator('text=Preview Data')).toBeVisible();
  
  // Click import
  await page.click('button:has-text("Import Data")');
  
  // Check success message
  await expect(page.locator('text=Import berhasil')).toBeVisible();
});
```

### Test Commands

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui
```

---

## 13. Deployment

### Vercel Deployment (Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy (preview)
vercel

# 4. Deploy (production)
vercel --prod
```

### Environment Variables

```bash
# .env.local (development)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# .env.production (production)
NEXT_PUBLIC_APP_URL=https://cpl.unismuh.ac.id
NEXT_PUBLIC_API_URL=https://cpl.unismuh.ac.id/api
DATABASE_URL=postgresql://user:pass@host:5432/cpl
JWT_SECRET=your-production-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=no-reply@unismuh.ac.id
SMTP_PASS=your-smtp-password
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/cpl
      - JWT_SECRET=your-secret
    depends_on:
      - db
  
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=cpl
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

```bash
# Build and run
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f
```

### Production Checklist

- [ ] Set all environment variables
- [ ] Enable HTTPS/SSL
- [ ] Configure database backups
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Configure CDN for static assets
- [ ] Enable compression (gzip/brotli)
- [ ] Set up error logging
- [ ] Configure rate limiting
- [ ] Add health check endpoints
- [ ] Set up CI/CD pipeline
- [ ] Configure database migrations
- [ ] Add analytics (Google Analytics, Plausible)

---

## 📚 Resources & References

### Documentation
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Recharts](https://recharts.org/en-US/)
- [SheetJS (xlsx)](https://docs.sheetjs.com/)

### Tools
- [Next.js DevTools](https://nextjs.org/docs/app/building-your-application/optimizing/development-tools)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Vercel Analytics](https://vercel.com/analytics)

### GitHub Repository
- **Main Repository**: https://github.com/Nur-Hidayat-FTI22E/CPL_Sign.git
- **Branch**: FR_branch (Feature Release)
- **Contributors**: [See repository]

---

## 🔄 Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | Oktober 2024 | Initial release with basic CPL system |
| 1.5 | November 2024 | Added CPMK breakdown in Laporan |
| 2.0 | November 2025 | **Major update**: Import feature, Manajemen Data tabs, Full integration, 5 prodi support |

---

## 👥 Development Team

**Developer**: [Your Name]  
**Institution**: Universitas Muhammadiyah Makassar  
**Faculty**: Teknik  
**Contact**: [Contact Info]

---

## 📝 Notes

### Known Issues
- Export PDF/Excel fitur masih mockup (belum terimplementasi)
- Data masih menggunakan localStorage (belum database)
- Autentikasi menggunakan session storage (demo mode)

### Future Enhancements
- [ ] Backend API integration (Express/NestJS)
- [ ] Database integration (PostgreSQL)
- [ ] Real authentication (JWT)
- [ ] Email notifications
- [ ] Real-time collaboration
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Export implementasi (jsPDF, xlsx)
- [ ] Bulk operations
- [ ] Audit trail

---

**© 2025 Universitas Muhammadiyah Makassar**

*Dokumentasi ini akan diperbarui seiring pengembangan sistem.*

**Last Updated**: 27 November 2025  
**Version**: 2.0

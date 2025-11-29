/**
 * Integration layer: Menggabungkan data dari mockData (dummy) dengan localStorage (real input)
 * Prioritas: localStorage > mockData
 */

import { nilaiMahasiswaData, mataKuliahData, cpmkData, cpmkToCplMapping, cplData, mahasiswaData } from '@/data/mockData';
import { getAllNilai, getAllImportedMahasiswa, type NilaiMahasiswaStorage } from './nilaiStorage';

export interface IntegratedNilai {
  mahasiswaId: string;
  mkKode: string;
  nilaiAkhir: number;
  source: 'localStorage' | 'mockData';
  timestamp?: string;
}

export interface IntegratedMahasiswa {
  id: string;
  npm: string;
  nama: string;
  prodiKode: string;
  angkatan: string;
  source: 'localStorage' | 'mockData';
  hasNilai: boolean;
  semesterAktif?: number; // Optional untuk backward compatibility
}

/**
 * Get combined nilai: localStorage + mockData
 * localStorage data overrides mockData
 */
export function getCombinedNilaiData(): IntegratedNilai[] {
  const localStorageNilai = getAllNilai();
  const combined: IntegratedNilai[] = [];
  const processedKeys = new Set<string>();
  
  // First, add all localStorage data (highest priority)
  localStorageNilai.forEach((nilai) => {
    const key = `${nilai.mahasiswaId}-${nilai.mkKode}`;
    combined.push({
      mahasiswaId: nilai.mahasiswaId,
      mkKode: nilai.mkKode,
      nilaiAkhir: nilai.nilaiAkhir,
      source: 'localStorage',
      timestamp: nilai.timestamp,
    });
    processedKeys.add(key);
  });
  
  // Then add mockData that's not already in localStorage
  nilaiMahasiswaData.forEach((nilai) => {
    const key = `${nilai.mahasiswaId}-${nilai.mkKode}`;
    if (!processedKeys.has(key)) {
      combined.push({
        mahasiswaId: nilai.mahasiswaId,
        mkKode: nilai.mkKode,
        nilaiAkhir: nilai.nilaiAkhir,
        source: 'mockData',
      });
    }
  });
  
  return combined;
}

/**
 * Get integrated list of mahasiswa (mockData + localStorage import)
 * Priority: 1) localStorage imported mahasiswa (HIGHEST - has real names), 2) mockData, 3) extracted from nilai
 */
export function getIntegratedMahasiswaList(prodiKode?: string): IntegratedMahasiswa[] {
  const allNilai = getAllNilai();
  const importedMahasiswa = getAllImportedMahasiswa();
  const mahasiswaMap = new Map<string, IntegratedMahasiswa>();
  
  // PRIORITY 1: Add imported mahasiswa from localStorage (HIGHEST PRIORITY - has real names!)
  importedMahasiswa.forEach((mhs) => {
    if (!prodiKode || mhs.prodiKode === prodiKode) {
      mahasiswaMap.set(mhs.mahasiswaId, {
        id: mhs.mahasiswaId,
        npm: mhs.npm,
        nama: mhs.nama, // ✅ NAMA ASLI DARI IMPORT
        prodiKode: mhs.prodiKode,
        angkatan: mhs.angkatan || 'Unknown',
        source: 'localStorage',
        hasNilai: true,
        semesterAktif: undefined, // Will be calculated from nilai
      });
    }
  });
  
  // PRIORITY 2: Add mahasiswa from mockData (if not already in imported list)
  mahasiswaData.forEach((mhs) => {
    if (!mahasiswaMap.has(mhs.id) && (!prodiKode || mhs.prodiKode === prodiKode)) {
      mahasiswaMap.set(mhs.id, {
        id: mhs.id,
        npm: mhs.npm,
        nama: mhs.nama,
        prodiKode: mhs.prodiKode,
        angkatan: mhs.angkatan,
        source: 'mockData',
        hasNilai: true,
        semesterAktif: mhs.semesterAktif,
      });
    }
  });
  
  // PRIORITY 3: Extract unique mahasiswa IDs from nilai (FALLBACK - only if no mahasiswa record exists)
  const uniqueMahasiswaIds = new Set<string>();
  allNilai.forEach((nilai) => {
    uniqueMahasiswaIds.add(nilai.mahasiswaId);
  });
  
  // Only add mahasiswa from nilai if they don't exist in imported or mockData
  uniqueMahasiswaIds.forEach((mahasiswaId) => {
    if (!mahasiswaMap.has(mahasiswaId)) {
      // Parse mahasiswaId format: "MHS-{PRODI}-{NIM}"
      const parts = mahasiswaId.split('-');
      let extractedProdi = '';
      let extractedNPM = '';
      let extractedNama = 'Mahasiswa Import'; // ⚠️ Fallback name only - should have been saved!
      
      if (parts.length >= 3 && parts[0] === 'MHS') {
        extractedProdi = parts[1];
        extractedNPM = parts.slice(2).join('-');
      } else if (parts.length === 2) {
        extractedProdi = parts[0];
        extractedNPM = parts[1];
      } else {
        extractedNPM = mahasiswaId;
        const prodiMatch = mahasiswaId.match(/^([A-Z]{3})/);
        if (prodiMatch) {
          extractedProdi = prodiMatch[1];
        }
      }
      
      if (!prodiKode || extractedProdi === prodiKode) {
        let angkatan = 'Unknown';
        const angkatanMatch = extractedNPM.match(/10(\d{2})/);
        if (angkatanMatch) {
          angkatan = '20' + angkatanMatch[1];
        }
        
        mahasiswaMap.set(mahasiswaId, {
          id: mahasiswaId,
          npm: extractedNPM,
          nama: extractedNama,
          prodiKode: extractedProdi,
          angkatan: angkatan,
          source: 'localStorage',
          hasNilai: true,
        });
      }
    }
  });
  
  return Array.from(mahasiswaMap.values()).sort((a, b) => a.npm.localeCompare(b.npm));
}

/**
 * Get nilai for specific mahasiswa with integration
 */
export function getIntegratedNilaiByMahasiswa(mahasiswaId: string): IntegratedNilai[] {
  const allNilai = getCombinedNilaiData();
  return allNilai.filter((n) => n.mahasiswaId === mahasiswaId);
}

/**
 * Calculate CPL per semester with integrated data
 * Uses proper weighting: CPL = Σ(Nilai_MK × Bobot_MK × Bobot_CPMK) / Σ(Bobot_MK × Bobot_CPMK)
 */
export function hitungNilaiCPLPerSemesterIntegrated(
  mahasiswaId: string,
  semester: number,
  prodiKode: string
): { cplKode: string; nilai: number; jumlahMK: number; source: string }[] {
  
  // Get integrated nilai for this mahasiswa
  const nilaiMhs = getIntegratedNilaiByMahasiswa(mahasiswaId);
  
  // Filter MK for this semester and prodi
  const mkDiSemester = mataKuliahData.filter(
    (mk) => mk.semester === semester && mk.prodiKode === prodiKode
  );
  
  // Get nilai for MK in this semester
  const nilaiMKSemester = nilaiMhs.filter((n) =>
    mkDiSemester.some((mk) => mk.kode === n.mkKode)
  );
  
  if (nilaiMKSemester.length === 0) {
    return [];
  }
  
  // Step 1: Calculate bobot CPL → MK (across ALL semesters for consistency)
  const allMKProdi = mataKuliahData.filter((mk) => mk.prodiKode === prodiKode);
  const cplToMKCount: { [cplKode: string]: number } = {};
  
  allMKProdi.forEach((mk) => {
    if (mk.cplTerkait) {
      mk.cplTerkait.forEach((cplKode) => {
        cplToMKCount[cplKode] = (cplToMKCount[cplKode] || 0) + 1;
      });
    }
  });
  
  // Step 2: Calculate weighted CPL scores using CPMK weights
  const cplScores: { 
    [cplKode: string]: { 
      weightedSum: number;
      totalWeight: number;
      sources: string[];
      mkCount: number;
    } 
  } = {};
  
  nilaiMKSemester.forEach((nilaiMK) => {
    const mk = mkDiSemester.find((m) => m.kode === nilaiMK.mkKode);
    if (!mk || !mk.cplTerkait) return;
    
    // Calculate bobot MK for each CPL it contributes to
    const bobotMKBase = 100 / (cplToMKCount[mk.cplTerkait[0]] || 1);
    
    // Find CPMK for this MK
    const cpmkForMK = cpmkData.filter((c) => c.mkKode === mk.kode);
    const cpmkCount = cpmkForMK.length || 1;
    
    // Process each CPL that this MK contributes to
    mk.cplTerkait.forEach((cplKode) => {
      if (!cplScores[cplKode]) {
        cplScores[cplKode] = { 
          weightedSum: 0, 
          totalWeight: 0, 
          sources: [],
          mkCount: 0
        };
      }
      
      // Calculate bobot MK for THIS specific CPL
      const bobotMK = 100 / (cplToMKCount[cplKode] || 1);
      
      if (cpmkCount === 0) {
        // No CPMK: MK contributes directly with full bobot
        cplScores[cplKode].weightedSum += nilaiMK.nilaiAkhir * bobotMK;
        cplScores[cplKode].totalWeight += bobotMK;
      } else {
        // Has CPMK: distribute bobot across CPMKs
        // Each CPMK gets equal share of MK's bobot
        const bobotPerCPMK = bobotMK / cpmkCount;
        
        // Sum weighted contributions from all CPMK
        cplScores[cplKode].weightedSum += nilaiMK.nilaiAkhir * bobotMK;
        cplScores[cplKode].totalWeight += bobotMK;
      }
      
      cplScores[cplKode].sources.push(nilaiMK.source);
      cplScores[cplKode].mkCount++;
    });
  });
  
  // Step 3: Calculate final weighted average for each CPL
  return Object.entries(cplScores).map(([cplKode, data]) => {
    // Weighted average: Σ(Nilai × Bobot) / Σ(Bobot)
    const weightedAvg = data.totalWeight > 0 
      ? data.weightedSum / data.totalWeight 
      : 0;
    
    const hasLocalStorage = data.sources.includes('localStorage');
    
    return {
      cplKode,
      nilai: Math.round(weightedAvg * 10) / 10,
      jumlahMK: data.mkCount,
      source: hasLocalStorage ? 'localStorage' : 'mockData',
    };
  });
}

/**
 * Get all nilai for a mahasiswa grouped by semester
 */
export function getNilaiGroupedBySemester(mahasiswaId: string, prodiKode: string) {
  const nilaiMhs = getIntegratedNilaiByMahasiswa(mahasiswaId);
  const grouped: { 
    [semester: number]: {
      nilai: IntegratedNilai[];
      mataKuliah: any[];
      totalSKS: number;
      avgNilai: number;
    } 
  } = {};
  
  nilaiMhs.forEach((nilai) => {
    const mk = mataKuliahData.find((m) => m.kode === nilai.mkKode && m.prodiKode === prodiKode);
    if (mk) {
      if (!grouped[mk.semester]) {
        grouped[mk.semester] = {
          nilai: [],
          mataKuliah: [],
          totalSKS: 0,
          avgNilai: 0,
        };
      }
      grouped[mk.semester].nilai.push(nilai);
      grouped[mk.semester].mataKuliah.push(mk);
      grouped[mk.semester].totalSKS += mk.sks;
    }
  });
  
  // Calculate average for each semester
  Object.keys(grouped).forEach((sem) => {
    const semester = parseInt(sem);
    const nilaiValues = grouped[semester].nilai.map((n) => n.nilaiAkhir);
    grouped[semester].avgNilai = 
      nilaiValues.length > 0
        ? Math.round((nilaiValues.reduce((sum, val) => sum + val, 0) / nilaiValues.length) * 10) / 10
        : 0;
  });
  
  return grouped;
}

/**
 * Check if mahasiswa has any input nilai (from localStorage)
 */
export function hasInputNilai(mahasiswaId: string): boolean {
  const localStorageNilai = getAllNilai();
  return localStorageNilai.some((n) => n.mahasiswaId === mahasiswaId);
}

/**
 * Get summary statistics for integrated data
 */
export function getIntegratedSummary() {
  const allNilai = getCombinedNilaiData();
  const localStorageCount = allNilai.filter((n) => n.source === 'localStorage').length;
  const mockDataCount = allNilai.filter((n) => n.source === 'mockData').length;
  
  return {
    total: allNilai.length,
    fromLocalStorage: localStorageCount,
    fromMockData: mockDataCount,
    percentageReal: allNilai.length > 0 
      ? Math.round((localStorageCount / allNilai.length) * 100) 
      : 0,
  };
}

/**
 * Calculate CPMK breakdown with bobot for each CPL
 * Bobot calculation:
 * 1. CPL → MK: 100% / jumlah MK terkait CPL (across all semesters)
 * 2. MK → CPMK: bobot MK / jumlah CPMK dalam MK tersebut
 */
export function hitungCPMKBreakdownPerCPL(
  mahasiswaId: string,
  semester: number,
  prodiKode: string
): {
  cplKode: string;
  cplDeskripsi: string;
  nilaiCPL: number;
  totalMKTerkait: number;
  bobotMKPerCPL: number;
  mataKuliah: {
    mkKode: string;
    mkNama: string;
    nilaiMK: number;
    sks: number;
    semester: number;
    bobotMK: number;
    cpmkList: {
      cpmkKode: string;
      deskripsi: string;
      bobot: number;
      nilaiWeighted: number;
    }[];
  }[];
}[] {
  const nilaiMhs = getIntegratedNilaiByMahasiswa(mahasiswaId);
  const mkDiSemester = mataKuliahData.filter(
    (mk) => mk.semester === semester && mk.prodiKode === prodiKode
  );
  
  const nilaiMKSemester = nilaiMhs.filter((n) =>
    mkDiSemester.some((mk) => mk.kode === n.mkKode)
  );
  
  if (nilaiMKSemester.length === 0) {
    return [];
  }
  
  // Step 1: Calculate bobot CPL → MK
  // Count total MK for each CPL across ALL semesters
  const allMKProdi = mataKuliahData.filter((mk) => mk.prodiKode === prodiKode);
  const cplToMKCount: { [cplKode: string]: number } = {};
  
  allMKProdi.forEach((mk) => {
    if (mk.cplTerkait) {
      mk.cplTerkait.forEach((cplKode) => {
        cplToMKCount[cplKode] = (cplToMKCount[cplKode] || 0) + 1;
      });
    }
  });
  
  // Group by CPL
  const cplBreakdown: {
    [cplKode: string]: {
      mataKuliah: {
        mkKode: string;
        mkNama: string;
        nilaiMK: number;
        sks: number;
        semester: number;
        bobotMK: number;
        cpmkList: {
          cpmkKode: string;
          deskripsi: string;
          bobot: number;
          nilaiWeighted: number;
        }[];
      }[];
      nilaiTotal: number[];
      totalMKTerkait: number;
    };
  } = {};
  
  nilaiMKSemester.forEach((nilaiMK) => {
    const mk = mkDiSemester.find((m) => m.kode === nilaiMK.mkKode);
    if (!mk || !mk.cplTerkait) return;
    
    // Find CPMK for this MK
    const cpmkForMK = cpmkData.filter((c) => c.mkKode === mk.kode);
    
    // Process each CPL that this MK contributes to
    mk.cplTerkait.forEach((cplKode) => {
      if (!cplBreakdown[cplKode]) {
        cplBreakdown[cplKode] = { 
          mataKuliah: [], 
          nilaiTotal: [],
          totalMKTerkait: cplToMKCount[cplKode] || 1
        };
      }
      
      // Calculate bobot MK: 100% / total MK for this CPL
      const bobotMK = 100 / (cplToMKCount[cplKode] || 1);
      
      if (cpmkForMK.length === 0) {
        // If no CPMK defined, MK contributes directly
        cplBreakdown[cplKode].mataKuliah.push({
          mkKode: mk.kode,
          mkNama: mk.nama,
          nilaiMK: nilaiMK.nilaiAkhir,
          sks: mk.sks,
          semester: mk.semester,
          bobotMK: Math.round(bobotMK * 100) / 100,
          cpmkList: [{
            cpmkKode: `${mk.kode}-Direct`,
            deskripsi: 'Penilaian langsung dari MK (belum ada CPMK)',
            bobot: Math.round(bobotMK * 100) / 100,
            nilaiWeighted: Math.round((nilaiMK.nilaiAkhir * bobotMK / 100) * 100) / 100,
          }],
        });
        
        cplBreakdown[cplKode].nilaiTotal.push(nilaiMK.nilaiAkhir);
      } else {
        // Step 2: Calculate bobot CPMK: bobotMK / jumlah CPMK
        const bobotPerCPMK = bobotMK / cpmkForMK.length;
        
        const cpmkList = cpmkForMK.map((cpmk) => {
          const nilaiWeighted = (nilaiMK.nilaiAkhir * bobotPerCPMK) / 100;
          
          return {
            cpmkKode: cpmk.kode,
            deskripsi: cpmk.deskripsi,
            bobot: Math.round(bobotPerCPMK * 100) / 100,
            nilaiWeighted: Math.round(nilaiWeighted * 100) / 100,
          };
        });
        
        cplBreakdown[cplKode].mataKuliah.push({
          mkKode: mk.kode,
          mkNama: mk.nama,
          nilaiMK: nilaiMK.nilaiAkhir,
          sks: mk.sks,
          semester: mk.semester,
          bobotMK: Math.round(bobotMK * 100) / 100,
          cpmkList,
        });
        
        // MK contributes its raw score to CPL (weighted average calculated later)
        cplBreakdown[cplKode].nilaiTotal.push(nilaiMK.nilaiAkhir);
      }
    });
  });
  
  // Build final result
  const result = Object.entries(cplBreakdown).map(([cplKode, data]) => {
    const cplInfo = cplData.find((c) => c.kode === cplKode && c.prodiKode === prodiKode);
    const avgNilai = data.nilaiTotal.length > 0
      ? data.nilaiTotal.reduce((sum, n) => sum + n, 0) / data.nilaiTotal.length
      : 0;
    
    return {
      cplKode,
      cplDeskripsi: cplInfo?.deskripsi || '',
      nilaiCPL: Math.round(avgNilai * 10) / 10,
      totalMKTerkait: data.totalMKTerkait,
      bobotMKPerCPL: Math.round((100 / data.totalMKTerkait) * 100) / 100,
      mataKuliah: data.mataKuliah,
    };
  });
  
  return result.sort((a, b) => a.cplKode.localeCompare(b.cplKode));
}

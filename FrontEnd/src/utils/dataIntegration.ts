/**
 * Integration layer: Menggabungkan data dari mockData (dummy) dengan localStorage (real input)
 * Prioritas: localStorage > mockData
 */

import { nilaiMahasiswaData, mataKuliahData, cpmkData, cpmkToCplMapping, cplData } from '@/data/mockData';
import { getAllNilai, type NilaiMahasiswaStorage } from './nilaiStorage';

export interface IntegratedNilai {
  mahasiswaId: string;
  mkKode: string;
  nilaiAkhir: number;
  source: 'localStorage' | 'mockData';
  timestamp?: string;
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
 * Get nilai for specific mahasiswa with integration
 */
export function getIntegratedNilaiByMahasiswa(mahasiswaId: string): IntegratedNilai[] {
  const allNilai = getCombinedNilaiData();
  return allNilai.filter((n) => n.mahasiswaId === mahasiswaId);
}

/**
 * Calculate CPL per semester with integrated data
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
  
  // Group nilai by CPL
  const cplScores: { 
    [cplKode: string]: { 
      values: number[]; 
      sources: string[];
    } 
  } = {};
  
  nilaiMKSemester.forEach((nilaiMK) => {
    const mk = mkDiSemester.find((m) => m.kode === nilaiMK.mkKode);
    if (mk && mk.cplTerkait) {
      mk.cplTerkait.forEach((cplKode) => {
        if (!cplScores[cplKode]) {
          cplScores[cplKode] = { values: [], sources: [] };
        }
        cplScores[cplKode].values.push(nilaiMK.nilaiAkhir);
        cplScores[cplKode].sources.push(nilaiMK.source);
      });
    }
  });
  
  // Calculate average for each CPL
  return Object.entries(cplScores).map(([cplKode, data]) => {
    const avg = data.values.reduce((sum, val) => sum + val, 0) / data.values.length;
    const hasLocalStorage = data.sources.includes('localStorage');
    
    return {
      cplKode,
      nilai: Math.round(avg * 10) / 10,
      jumlahMK: data.values.length,
      source: hasLocalStorage ? 'mixed' : 'mockData',
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

/**
 * Utility untuk manage penyimpanan nilai mahasiswa di localStorage
 * Integrates dengan mockData dan menyediakan data real-time untuk dashboard & laporan
 */

export interface NilaiMahasiswaStorage {
  mahasiswaId: string;
  mkKode: string;
  nilaiAkhir: number;
  timestamp: string; // ISO string
}

export interface MahasiswaImportStorage {
  mahasiswaId: string;
  npm: string;
  nama: string;
  prodiKode: string;
  angkatan?: string;
  timestamp: string;
}

const STORAGE_KEY = 'kkp_nilai_mahasiswa';
const MAHASISWA_STORAGE_KEY = 'kkp_mahasiswa_import';

/**
 * Get all nilai from localStorage
 */
export function getAllNilai(): NilaiMahasiswaStorage[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading nilai from localStorage:', error);
    return [];
  }
}

/**
 * Save or update nilai for a mahasiswa-MK combination
 */
export function saveNilai(mahasiswaId: string, mkKode: string, nilaiAkhir: number): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const allNilai = getAllNilai();
    
    // Check if nilai already exists for this mahasiswa-MK
    const existingIndex = allNilai.findIndex(
      (n) => n.mahasiswaId === mahasiswaId && n.mkKode === mkKode
    );
    
    const nilaiData: NilaiMahasiswaStorage = {
      mahasiswaId,
      mkKode,
      nilaiAkhir,
      timestamp: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      // Update existing nilai
      allNilai[existingIndex] = nilaiData;
    } else {
      // Add new nilai
      allNilai.push(nilaiData);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allNilai));
    return true;
  } catch (error) {
    console.error('Error saving nilai to localStorage:', error);
    return false;
  }
}

/**
 * Get nilai for a specific mahasiswa
 */
export function getNilaiByMahasiswa(mahasiswaId: string): NilaiMahasiswaStorage[] {
  const allNilai = getAllNilai();
  return allNilai.filter((n) => n.mahasiswaId === mahasiswaId);
}

/**
 * Get nilai for a specific mahasiswa and MK
 */
export function getNilaiByMahasiswaMK(mahasiswaId: string, mkKode: string): NilaiMahasiswaStorage | null {
  const allNilai = getAllNilai();
  return allNilai.find((n) => n.mahasiswaId === mahasiswaId && n.mkKode === mkKode) || null;
}

/**
 * Delete nilai for a specific mahasiswa-MK combination
 */
export function deleteNilai(mahasiswaId: string, mkKode: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const allNilai = getAllNilai();
    const filtered = allNilai.filter(
      (n) => !(n.mahasiswaId === mahasiswaId && n.mkKode === mkKode)
    );
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting nilai from localStorage:', error);
    return false;
  }
}

/**
 * Clear all nilai data
 */
export function clearAllNilai(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing nilai from localStorage:', error);
    return false;
  }
}

/**
 * Get statistics for a mahasiswa
 */
export function getMahasiswaStatistics(mahasiswaId: string) {
  const nilaiList = getNilaiByMahasiswa(mahasiswaId);
  
  if (nilaiList.length === 0) {
    return {
      totalMK: 0,
      avgNilai: 0,
      highestNilai: 0,
      lowestNilai: 0,
    };
  }
  
  const nilaiValues = nilaiList.map((n) => n.nilaiAkhir);
  const total = nilaiValues.reduce((sum, val) => sum + val, 0);
  
  return {
    totalMK: nilaiList.length,
    avgNilai: Math.round((total / nilaiList.length) * 10) / 10,
    highestNilai: Math.max(...nilaiValues),
    lowestNilai: Math.min(...nilaiValues),
  };
}

/**
 * Batch save nilai from import (Excel/CSV)
 * Returns statistics of success and failed saves
 */
export function batchSaveNilai(nilaiList: NilaiMahasiswaStorage[]): {
  success: number;
  failed: number;
  total: number;
  errors: string[];
} {
  if (typeof window === 'undefined') {
    return { success: 0, failed: nilaiList.length, total: nilaiList.length, errors: ['Window is undefined'] };
  }
  
  const stats = {
    success: 0,
    failed: 0,
    total: nilaiList.length,
    errors: [] as string[],
  };
  
  try {
    const allNilai = getAllNilai();
    const updatedNilai = [...allNilai];
    
    nilaiList.forEach((nilai, index) => {
      try {
        // Validate data
        if (!nilai.mahasiswaId || !nilai.mkKode || nilai.nilaiAkhir === undefined) {
          stats.failed++;
          stats.errors.push(`Row ${index + 1}: Missing required fields`);
          return;
        }
        
        if (nilai.nilaiAkhir < 0 || nilai.nilaiAkhir > 100) {
          stats.failed++;
          stats.errors.push(`Row ${index + 1}: Invalid nilai (must be 0-100)`);
          return;
        }
        
        // Check if nilai already exists
        const existingIndex = updatedNilai.findIndex(
          (n) => n.mahasiswaId === nilai.mahasiswaId && n.mkKode === nilai.mkKode
        );
        
        const nilaiData: NilaiMahasiswaStorage = {
          mahasiswaId: nilai.mahasiswaId,
          mkKode: nilai.mkKode,
          nilaiAkhir: nilai.nilaiAkhir,
          timestamp: nilai.timestamp || new Date().toISOString(),
        };
        
        if (existingIndex >= 0) {
          // Update existing nilai
          updatedNilai[existingIndex] = nilaiData;
        } else {
          // Add new nilai
          updatedNilai.push(nilaiData);
        }
        
        stats.success++;
      } catch (error) {
        stats.failed++;
        stats.errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
    
    // Save all at once
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNilai));
    
    // Trigger storage event untuk update komponen lain
    window.dispatchEvent(new Event('storage'));
    
    return stats;
  } catch (error) {
    return {
      success: 0,
      failed: nilaiList.length,
      total: nilaiList.length,
      errors: [error instanceof Error ? error.message : 'Unknown error during batch save'],
    };
  }
}

/**
 * Get total count of nilai in localStorage
 */
export function getTotalNilaiCount(): number {
  const allNilai = getAllNilai();
  return allNilai.length;
}

/**
 * Get count of nilai per prodi
 */
export function getNilaiCountByProdi(): { [prodiKode: string]: number } {
  const allNilai = getAllNilai();
  const countByProdi: { [prodiKode: string]: number } = {};
  
  allNilai.forEach((nilai) => {
    // Extract prodi from mahasiswaId (assuming format like "INF-xxx" or similar)
    const prodiMatch = nilai.mahasiswaId.match(/^([A-Z]+)/);
    if (prodiMatch) {
      const prodi = prodiMatch[1];
      countByProdi[prodi] = (countByProdi[prodi] || 0) + 1;
    }
  });
  
  return countByProdi;
}

/**
 * Export all nilai to JSON
 */
export function exportNilaiToJSON(): string {
  const allNilai = getAllNilai();
  return JSON.stringify(allNilai, null, 2);
}

/**
 * Import nilai from JSON
 */
export function importNilaiFromJSON(jsonString: string): {
  success: boolean;
  count: number;
  error?: string;
} {
  try {
    const data = JSON.parse(jsonString);
    
    if (!Array.isArray(data)) {
      return { success: false, count: 0, error: 'Invalid JSON format: expected array' };
    }
    
    const stats = batchSaveNilai(data);
    
    return {
      success: stats.success > 0,
      count: stats.success,
      error: stats.failed > 0 ? `${stats.failed} items failed` : undefined,
    };
  } catch (error) {
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all imported mahasiswa from localStorage
 */
export function getAllImportedMahasiswa(): MahasiswaImportStorage[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(MAHASISWA_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading mahasiswa from localStorage:', error);
    return [];
  }
}

/**
 * Save mahasiswa data from import
 */
export function saveMahasiswaImport(mahasiswaData: MahasiswaImportStorage): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const allMahasiswa = getAllImportedMahasiswa();
    
    // Check if mahasiswa already exists
    const existingIndex = allMahasiswa.findIndex(
      (m) => m.mahasiswaId === mahasiswaData.mahasiswaId
    );
    
    if (existingIndex >= 0) {
      // Update existing
      allMahasiswa[existingIndex] = {
        ...mahasiswaData,
        timestamp: new Date().toISOString(),
      };
    } else {
      // Add new
      allMahasiswa.push({
        ...mahasiswaData,
        timestamp: new Date().toISOString(),
      });
    }
    
    localStorage.setItem(MAHASISWA_STORAGE_KEY, JSON.stringify(allMahasiswa));
    return true;
  } catch (error) {
    console.error('Error saving mahasiswa:', error);
    return false;
  }
}

/**
 * Batch save mahasiswa from import (efficient for bulk operations)
 */
export function batchSaveMahasiswa(mahasiswaList: MahasiswaImportStorage[]): {
  success: number;
  failed: number;
  total: number;
  errors: string[];
} {
  if (typeof window === 'undefined') {
    return { success: 0, failed: mahasiswaList.length, total: mahasiswaList.length, errors: ['Window is undefined'] };
  }
  
  const stats = {
    success: 0,
    failed: 0,
    total: mahasiswaList.length,
    errors: [] as string[],
  };
  
  try {
    const allMahasiswa = getAllImportedMahasiswa();
    const mahasiswaMap = new Map<string, MahasiswaImportStorage>();
    
    // Create map from existing data
    allMahasiswa.forEach(mhs => {
      mahasiswaMap.set(mhs.mahasiswaId, mhs);
    });
    
    // Process batch
    mahasiswaList.forEach((mhsData, index) => {
      try {
        // Validate required fields
        if (!mhsData.mahasiswaId || !mhsData.npm || !mhsData.nama || !mhsData.prodiKode) {
          throw new Error('Missing required fields (mahasiswaId, npm, nama, or prodiKode)');
        }
        
        // Update or add to map
        mahasiswaMap.set(mhsData.mahasiswaId, {
          ...mhsData,
          timestamp: new Date().toISOString(),
        });
        
        stats.success++;
      } catch (error) {
        stats.failed++;
        stats.errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
    
    // Save all at once
    const updatedMahasiswa = Array.from(mahasiswaMap.values());
    localStorage.setItem(MAHASISWA_STORAGE_KEY, JSON.stringify(updatedMahasiswa));
    
    // Trigger storage event
    window.dispatchEvent(new Event('storage'));
    
    return stats;
  } catch (error) {
    return {
      success: 0,
      failed: mahasiswaList.length,
      total: mahasiswaList.length,
      errors: [error instanceof Error ? error.message : 'Unknown error during batch save'],
    };
  }
}

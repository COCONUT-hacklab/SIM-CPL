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

const STORAGE_KEY = 'kkp_nilai_mahasiswa';

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

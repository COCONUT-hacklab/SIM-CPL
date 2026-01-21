// ============================ SIMCPL API CLIENT ============================
// File: src/lib/simcplApi.ts

// ============================ TYPES ============================

export type Prodi = {
  id_prodi: number;
  kode_prodi: string;
  nama_prodi: string;
};

export type MK = {
  id_mk: string;
  id_prodi: number;
  kode_mk: string;
  nama_mk: string;
  sks: number;
  semester: number;
};

export type MahasiswaSummary = {
  id_mhs: string;       // (string/uuid atau numeric string)
  nim: string;
  nama: string;
  angkatan?: number | null;
  status?: string | null;
  // Extended fields from backend
  semester_max?: number;
  total_nilai?: number;
  dari_import?: number;
};

export type ImportMatkulItem = {
  kode: string;      // kode MK
  nama: string;      // nama MK
  sks: number;       // SKS
};

export type ImportMahasiswaItem = {
  nim: string;
  nama: string;
  // key dinamis: kode_mk -> nilai (number)
  nilaiMap: Record<string, number>;
};

export type ImportNilaiRequest = {
  prodiKode: string;                 // contoh: "INF"
  semester: number;                  // 1..8
  tahunAjaran: string;               // contoh: "2024/2025"
  matkulList: ImportMatkulItem[];    // daftar kode MK yang dipakai di file
  importData: ImportMahasiswaItem[]; // row mahasiswa + nilai per MK
};

// ============================ INTERNAL HELPERS ============================

function normalizeBaseUrl(raw: unknown): string {
  // pastikan string (bukan function / object)
  const s = typeof raw === 'string' ? raw : '';

  // default backend local
  const fallback = 'http://localhost:8001/api';

  const base = (s || fallback).trim();

  // hilangkan trailing slash
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

// PENTING: ini HARUS string. Jangan pakai wrapper function.
export const API_BASE: string = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_SIMCPL_API_BASE,
);

// join "API_BASE" dan path endpoint secara aman
function apiUrl(path: string): string {
  if (!path.startsWith('/')) path = `/${path}`;
  return `${API_BASE}${path}`;
}

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `API error ${res.status} ${res.statusText} @ ${input}\n${body}`,
    );
  }
  return (await res.json()) as T;
}

// ============================ ENDPOINTS: MASTER ============================

// GET /api/prodi
export async function fetchProdiList(signal?: AbortSignal): Promise<Prodi[]> {
  return fetchJson<Prodi[]>(apiUrl('/prodi'), { method: 'GET', signal });
}

// GET /api/prodi/:id_prodi/mk?semester=1
export async function fetchMKByProdiSemester(
  idProdi: number,
  semester?: number,
  signal?: AbortSignal,
): Promise<MK[]> {
  const q = semester ? `?semester=${encodeURIComponent(String(semester))}` : '';
  return fetchJson<MK[]>(
    apiUrl(`/prodi/${encodeURIComponent(String(idProdi))}/mk${q}`),
    { method: 'GET',
      signal },
  );
}

// GET /api/prodi/:id_prodi/mahasiswa-nilai
// List mahasiswa yang sudah punya nilai (tanpa filter semester untuk mendapat semua semester)
export async function fetchMahasiswaSummary(
  idProdi: number,
  signal?: AbortSignal,
): Promise<MahasiswaSummary[]> {
  return fetchJson<MahasiswaSummary[]>(
    apiUrl(`/prodi/${encodeURIComponent(String(idProdi))}/mahasiswa-nilai`),
    { method: 'GET', signal },
  );
}

// ============================ ENDPOINTS: IMPORT NILAI ============================

// POST /api/nilai-mk/import
export async function importNilai(
  payload: ImportNilaiRequest,
  signal?: AbortSignal,
): Promise<any> {
  return fetchJson<any>(apiUrl('/nilai-mk/import'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
}

// ============================ ENDPOINTS: ADMIN (BOBOT) ============================

// POST /api/prodi/:id_prodi/recalc-bobot
export async function recalcBobotProdi(
  idProdi: number,
  signal?: AbortSignal,
): Promise<{ status: string; message?: string }> {
  return fetchJson(apiUrl(`/prodi/${encodeURIComponent(String(idProdi))}/recalc-bobot`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
  });
}

// ============================ TYPES: CPL ============================

export type CPL = {
  id_cpl: number;
  kode_cpl: string;
  deskripsi: string;
};

export type NilaiCPLItem = {
  kode_cpl: string;
  nilai_angka: number;
};

export type NilaiCPLByMahasiswaResponse = {
  nim: string;
  nama: string;
  semester: number;
  cpl: NilaiCPLItem[];
};

// ============================ ENDPOINTS: CPL ============================

// GET /api/prodi/:id_prodi/cpl
export async function fetchCPLByProdi(
  idProdi: number,
  signal?: AbortSignal,
): Promise<CPL[]> {
  return fetchJson<CPL[]>(
    apiUrl(`/prodi/${encodeURIComponent(String(idProdi))}/cpl`),
    { method: 'GET', signal },
  );
}

// GET /api/mahasiswa/:nim/cpl?semester=X
// This endpoint returns the CPL scores for a specific student and semester
export async function fetchNilaiCPLByMahasiswa(
  nim: string,
  semester: number,
  signal?: AbortSignal,
): Promise<NilaiCPLByMahasiswaResponse> {
  const q = `?semester=${encodeURIComponent(String(semester))}`;
  return fetchJson<NilaiCPLByMahasiswaResponse>(
    apiUrl(`/mahasiswa/${encodeURIComponent(nim)}/cpl${q}`),
    { method: 'GET', signal },
  );
}

export async function fetchAngkatanList(idProdi: number, signal?: AbortSignal): Promise<number[]> {
  return fetchJson<number[]>(apiUrl(`/prodi/${idProdi}/angkatan`), { method: 'GET', signal });
}
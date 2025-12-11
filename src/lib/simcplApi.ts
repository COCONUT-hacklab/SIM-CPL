// src/lib/simcplApi.ts

export const API_BASE =
  process.env.NEXT_PUBLIC_SIMCPL_API_BASE ?? 'http://localhost:8001/api';

export type Prodi = {
  id_prodi: number;
  kode_prodi: string;
  nama_prodi: string;
  jenjang: string;
};

export type MK = {
  id_mk: number;
  id_prodi: number;
  kode_mk: string;
  nama_mk: string;
  sks: number;
  semester: number;
};

export type MahasiswaSummary = {
  id_mhs: number;
  nim: string;
  nama: string;
  angkatan: number;
  semester_max: number;
  total_nilai: number;
  dari_import: number;
};

export type ImportMatkulItem = {
  kode: string;
  nama: string;
  sks: number;
};

export type ImportMahasiswaItem = {
  nim: string;
  nama: string;
  nilaiMap: Record<string, number>;
};

export type ImportNilaiRequest = {
  prodiKode: string;
  semester: number;
  tahunAjaran: string;
  matkulList: ImportMatkulItem[];
  importData: ImportMahasiswaItem[];
};

export type ImportNilaiResponse = {
  status?: string;
  summary?: any;
  [key: string]: any;
};

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let text = '';
    try {
      text = await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function fetchProdiList(signal?: AbortSignal): Promise<Prodi[]> {
  const res = await fetch(`${API_BASE}/prodi`, { signal });
  return handleJson<Prodi[]>(res);
}

export async function fetchMKByProdiSemester(
  idProdi: number,
  semester: number,
  signal?: AbortSignal
): Promise<MK[]> {
  const res = await fetch(
    `${API_BASE}/prodi/${idProdi}/mk?semester=${semester}`,
    { signal }
  );
  return handleJson<MK[]>(res);
}

export async function fetchMahasiswaSummary(
  idProdi: number,
  signal?: AbortSignal
): Promise<MahasiswaSummary[]> {
  const res = await fetch(`${API_BASE}/prodi/${idProdi}/mahasiswa-nilai`, {
    signal,
  });

  // kalau backend entah kenapa balikin null/{} kita paksa jadi []
  try {
    const data = await handleJson<any>(res);
    return Array.isArray(data) ? (data as MahasiswaSummary[]) : [];
  } catch {
    return [];
  }
}

export async function importNilai(
  body: ImportNilaiRequest,
  signal?: AbortSignal
): Promise<ImportNilaiResponse> {
  const res = await fetch(`${API_BASE}/nilai-mk/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  return handleJson<ImportNilaiResponse>(res);
}



export async function recalcBobotProdi(idProdi: number): Promise<void> {
  const res = await fetch(`${API_BASE}/prodi/${idProdi}/recalc-bobot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Gagal menghitung ulang bobot (status ${res.status}): ${text || res.statusText}`,
    );
  }
}
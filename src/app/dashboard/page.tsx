'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  cplData,
  mataKuliahData,
  cpmkData,
  cpmkToCplMapping,
} from '@/data/mockData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

// ============================ API CONFIG ============================

const API_BASE =
  process.env.NEXT_PUBLIC_SIMCPL_API_BASE ?? 'http://localhost:8001/api';

// ============================ TYPES ============================

type Prodi = {
  id_prodi: number;
  kode_prodi: string;
  nama_prodi: string;
};

type MahasiswaRow = {
  id: string;      // id_mhs (string)
  npm: string;     // NIM
  nama: string;
  angkatan?: number | null;
  source: 'db' | 'mockData' | 'localStorage';
};

type CplScore = {
  kode: string;
  deskripsi: string;
  nilai: number;
  jumlahMK: number;
  status: 'Tercapai' | 'Cukup' | 'Belum Tercapai';
  source: string;
  isRealData: boolean;
};

type MappingNode = {
  cpl: {
    kode: string;
    deskripsi: string;
  };
  mkCount: number;
  mataKuliah: {
    kode: string;
    nama: string;
    sks: number;
    dosen?: string;
    cpmkCount: number;
    cpmkList: {
      kode: string;
      deskripsi: string;
      bobot: number;
    }[];
  }[];
  totalCPMK: number;
};

type RadarPoint = {
  subject: string;
  value: number;
  fullMark: number;
};

// ============================ HELPER: BUILD MAPPING (CPL–MK–CPMK) DARI MOCK ============================

function buildMappingFromMock(
  prodiKode: string,
  semester: number,
): MappingNode[] {
 return[];
}

// ============================ KOMPONEN UTAMA ============================

export default function DashboardPage() {
  const router = useRouter();

  // ---------- state filter ----------
  const [prodiList, setProdiList] = useState<Prodi[]>([]);
  const [selectedProdi, setSelectedProdi] = useState<string>(''); // kode_prodi
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedMahasiswa, setSelectedMahasiswa] = useState<string>('');

  // ---------- state data ----------
  const [filteredMahasiswa, setFilteredMahasiswa] = useState<MahasiswaRow[]>([]);
  const [cplScores, setCplScores] = useState<CplScore[]>([]);
  const [mappingData, setMappingData] = useState<MappingNode[]>([]);

  // ---------- state misc ----------
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadingProdi, setLoadingProdi] = useState(false);
  const [loadingMahasiswa, setLoadingMahasiswa] = useState(false);
  const [loadingCPL, setLoadingCPL] = useState(false);
  const [errorProdi, setErrorProdi] = useState<string | null>(null);
  const [errorMahasiswa, setErrorMahasiswa] = useState<string | null>(null);
  const [errorCPL, setErrorCPL] = useState<string | null>(null);

  // ============================ LISTEN NILAI IMPORT (REFRESH) ============================

  useEffect(() => {
    const handleNilaiUpdate = (event: any) => {
      console.log('📊 Dashboard: Data nilai diupdate', event.detail);
      setRefreshKey((prev) => prev + 1);
    };

    window.addEventListener('nilaiUpdated', handleNilaiUpdate);
    return () => {
      window.removeEventListener('nilaiUpdated', handleNilaiUpdate);
    };
  }, []);

  // ============================ CHECK AUTH ============================

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData = sessionStorage.getItem('user');
      if (!userData) {
        router.push('/login');
      }
    }
  }, [router]);

  // ============================ FETCH PRODI DARI BACKEND ============================

  useEffect(() => {
    const controller = new AbortController();

    async function loadProdi() {
      try {
        setLoadingProdi(true);
        setErrorProdi(null);

        const res = await fetch(`${API_BASE}/prodi`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Gagal load prodi: ${res.status}`);

        const data: Prodi[] = await res.json();
        setProdiList(data);

        // set default prodi kalau belum ada
        if (!selectedProdi && data.length > 0) {
          setSelectedProdi(data[0].kode_prodi);
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.error('Error load prodi:', err);
        setErrorProdi(err?.message || 'Gagal mengambil data prodi');
      } finally {
        setLoadingProdi(false);
      }
    }

    loadProdi();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================ FETCH MAHASISWA PER PRODI + SEMESTER ============================

  useEffect(() => {
    if (!selectedProdi) {
      setFilteredMahasiswa([]);
      setSelectedMahasiswa('');
      return;
    }

    const controller = new AbortController();

    async function loadMahasiswa() {
      try {
        setLoadingMahasiswa(true);
        setErrorMahasiswa(null);

        const prodiObj = prodiList.find(
          (p) => p.kode_prodi === selectedProdi,
        );
        if (!prodiObj) {
          setFilteredMahasiswa([]);
          setSelectedMahasiswa('');
          return;
        }

        const res = await fetch(
          `${API_BASE}/prodi/${prodiObj.id_prodi}/mahasiswa-nilai?semester=${selectedSemester}`,
          { signal: controller.signal },
        );
        if (!res.ok)
          throw new Error(`Gagal load mahasiswa: ${res.status}`);

        const rows: any[] = await res.json();

        const list: MahasiswaRow[] = rows.map((row, idx) => ({
          id: String(row.id_mhs ?? row.nim ?? idx),
          npm: row.nim,
          nama: row.nama,
          angkatan: row.angkatan ?? null,
          source: 'db',
        }));

        setFilteredMahasiswa(list);

        if (list.length === 0) {
          setSelectedMahasiswa('');
          return;
        }

        // pertahankan pilihan kalau masih ada
        const currentExists = list.find((m) => m.id === selectedMahasiswa);
        if (!currentExists) {
          setSelectedMahasiswa(list[0].id);
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.error('Error load mahasiswa dashboard:', err);
        setErrorMahasiswa(
          err?.message ||
            'Gagal mengambil mahasiswa yang sudah punya nilai',
        );
        setFilteredMahasiswa([]);
        setSelectedMahasiswa('');
      } finally {
        setLoadingMahasiswa(false);
      }
    }

    loadMahasiswa();
    return () => controller.abort();
  }, [selectedProdi, selectedSemester, refreshKey, prodiList, selectedMahasiswa]);

  // ============================ FETCH NILAI CPL PER MAHASISWA ============================

  useEffect(() => {
    if (!selectedMahasiswa) {
      setCplScores([]);
      return;
    }

    const controller = new AbortController();

    async function loadCPL() {
      try {
        setLoadingCPL(true);
        setErrorCPL(null);

        const mhs = filteredMahasiswa.find(
          (m) => m.id === selectedMahasiswa,
        );
        if (!mhs) {
          setCplScores([]);
          return;
        }

        // EXPECTED ENDPOINT:
        // GET /mahasiswa/:id_mhs/cpl?semester=1
        const res = await fetch(
          `${API_BASE}/mahasiswa/${mhs.id}/cpl?semester=${selectedSemester}`,
          { signal: controller.signal },
        );
        if (!res.ok)
          throw new Error(`Gagal load nilai CPL: ${res.status}`);

        const rows: any[] = await res.json();

        const scores: CplScore[] = rows.map((row) => {
          const nilai = Number(row.nilai_angka ?? 0);
          let status: CplScore['status'];
          if (nilai >= 75) status = 'Tercapai';
          else if (nilai >= 60) status = 'Cukup';
          else status = 'Belum Tercapai';

          const src = row.sumber ?? 'db';

          return {
            kode: row.kode_cpl,
            deskripsi: row.deskripsi,
            nilai,
            jumlahMK: Number(row.jumlah_mk ?? 0),
            status,
            source: src,
            isRealData: src !== 'mockData',
          };
        });

        setCplScores(scores);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.error('Error load nilai CPL dashboard:', err);
        setErrorCPL(err?.message || 'Gagal mengambil nilai CPL');
        setCplScores([]);
      } finally {
        setLoadingCPL(false);
      }
    }

    loadCPL();
    return () => controller.abort();
  }, [selectedMahasiswa, selectedSemester, refreshKey, filteredMahasiswa]);

  // ============================ BUILD MAPPING (MASIH DARI MOCK) ============================

  useEffect(() => {
    const selectedProdiData = prodiList.find(
      (p) => p.kode_prodi === selectedProdi,
    );
    const prodiKode = selectedProdiData?.kode_prodi || 'ARS';

    const mapping = buildMappingFromMock(prodiKode, selectedSemester);
    setMappingData(mapping);
  }, [prodiList, selectedProdi, selectedSemester]);

  // ============================ DERIVED DATA ============================

  const selectedProdiData = prodiList.find(
    (p) => p.kode_prodi === selectedProdi,
  );
  const selectedMhs = filteredMahasiswa.find(
    (m) => m.id === selectedMahasiswa,
  );

  const tercapai = cplScores.filter((c) => c.nilai >= 75).length;
  const rataRata =
    cplScores.length > 0
      ? Math.round(
          (cplScores.reduce((sum, c) => sum + c.nilai, 0) /
            cplScores.length) *
            10,
        ) / 10
      : 0;

  const radarChartData: RadarPoint[] = cplScores.map((c) => ({
    subject: c.kode,
    value: c.nilai,
    fullMark: 100,
  }));

  // ============================ RENDER ============================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Dashboard Sistem CPL
        </h1>
        <p className="text-gray-600">
          Pantau capaian pembelajaran lulusan mahasiswa per semester
        </p>
      </div>

      {/* Cascading Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-blue-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pilih Prodi */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Pilih Program Studi
            </label>
            <select
              value={selectedProdi}
              onChange={(e) => {
                setSelectedProdi(e.target.value);
                setSelectedMahasiswa('');
              }}
              className="w-full px-4 py-2.5 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
            >
              {loadingProdi && <option>Memuat prodi...</option>}
              {!loadingProdi && prodiList.length === 0 && (
                <option>Tidak ada data prodi</option>
              )}
              {prodiList.map((prodi) => (
                <option key={prodi.id_prodi} value={prodi.kode_prodi}>
                  {prodi.nama_prodi}
                </option>
              ))}
            </select>
            {errorProdi && (
              <p className="mt-1 text-xs text-red-600">{errorProdi}</p>
            )}
          </div>

          {/* Pilih Semester */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Pilih Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(Number(e.target.value))}
              className="w-full px-4 py-2.5 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          {/* Pilih Mahasiswa */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Pilih Mahasiswa
            </label>
            <select
              value={selectedMahasiswa}
              onChange={(e) => setSelectedMahasiswa(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
              disabled={filteredMahasiswa.length === 0}
            >
              {loadingMahasiswa ? (
                <option>Memuat mahasiswa...</option>
              ) : filteredMahasiswa.length === 0 ? (
                <option>Tidak ada mahasiswa</option>
              ) : (
                filteredMahasiswa.map((mhs) => (
                  <option key={mhs.id} value={mhs.id}>
                    {mhs.npm} - {mhs.nama}
                  </option>
                ))
              )}
            </select>
            {errorMahasiswa && (
              <p className="mt-1 text-xs text-red-600">{errorMahasiswa}</p>
            )}
          </div>
        </div>

        {/* Info pilihan saat ini */}
        {selectedMhs && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600 font-medium">Prodi:</span>
                <p className="font-bold text-blue-700">
                  {selectedProdiData?.nama_prodi}
                </p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">NIM:</span>
                <p className="font-bold text-blue-700">{selectedMhs.npm}</p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Angkatan:</span>
                <p className="font-bold text-blue-700">
                  {selectedMhs.angkatan ?? '-'}
                </p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Source:</span>
                <p className="font-bold text-blue-700">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                    📊 Database
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">CPL Tercapai</p>
              <h3 className="text-4xl font-bold mt-2">
                {tercapai}/{cplScores.length}
              </h3>
              <p className="text-blue-100 text-sm mt-1">≥ 75 poin</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">
                Rata-rata CPL
              </p>
              <h3 className="text-4xl font-bold mt-2">
                {loadingCPL && selectedMahasiswa ? '...' : rataRata}
              </h3>
              <p className="text-indigo-100 text-sm mt-1">dari 100 poin</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-sm font-medium">
                Status Semester {selectedSemester}
              </p>
              <h3 className="text-2xl font-bold mt-2">
                {rataRata >= 75
                  ? 'Sangat Baik'
                  : rataRata >= 60
                  ? 'Baik'
                  : 'Perlu Perbaikan'}
              </h3>
              <p className="text-cyan-100 text-sm mt-1">
                {cplScores.filter((c) => c.nilai > 0).length} CPL terdata
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MAPPING CPL–MK–CPMK + RADAR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Tree CPL–MK–CPMK */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-blue-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Hubungan (CPL - MK - CPMK)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Semester {selectedSemester} •{' '}
            {selectedProdiData?.nama_prodi ?? '-'}
          </p>

          <div className="max-h-[320px] overflow-y-auto pr-2">
            {mappingData.map((item, idx) => (
              <div key={idx} className="mb-6 last:mb-0">
                {/* CPL Node */}
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        item.mkCount > 0 ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    ></div>
                    {item.mkCount > 0 && (
                      <div className="w-0.5 h-full bg-blue-300 mt-1"></div>
                    )}
                  </div>

                  <div className="flex-1 pb-2">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-3 shadow-md">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm">
                          {item.cpl.kode}
                        </span>
                        <div className="flex gap-1">
                          <span className="px-2 py-0.5 bg-white bg-opacity-30 text-xs rounded-full">
                            {item.mkCount} MK
                          </span>
                          <span className="px-2 py-0.5 bg-white bg-opacity-30 text-xs rounded-full">
                            {item.totalCPMK} CPMK
                          </span>
                        </div>
                      </div>
                      <p className="text-xs opacity-90 line-clamp-2">
                        {item.cpl.deskripsi}
                      </p>
                    </div>

                    {/* MK Nodes */}
                    {item.mataKuliah.length > 0 && (
                      <div className="mt-3 space-y-3">
                        {item.mataKuliah.map((mk, mkIdx) => (
                          <div key={mkIdx} className="flex items-start gap-3">
                            <div className="flex flex-col items-center pt-2">
                              <div
                                className={`w-2.5 h-2.5 rounded-full ${
                                  mk.cpmkCount > 0
                                    ? 'bg-green-500'
                                    : 'bg-gray-300'
                                }`}
                              ></div>
                              {mk.cpmkCount > 0 && (
                                <div className="w-0.5 h-full bg-green-300 mt-1"></div>
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-2.5">
                                <div className="flex items-start gap-2 mb-1">
                                  <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap">
                                    {mk.kode}
                                  </span>
                                  <div className="flex-1">
                                    <p className="text-xs font-semibold text-gray-800 leading-tight">
                                      {mk.nama}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {mk.sks} SKS
                                      {mk.dosen ? ` • ${mk.dosen}` : ''}
                                    </p>
                                  </div>
                                  {mk.cpmkCount > 0 && (
                                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">
                                      {mk.cpmkCount} CPMK
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* CPMK Nodes */}
                              {mk.cpmkList.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {mk.cpmkList.map((cpmk, cpmkIdx) => (
                                    <div
                                      key={cpmkIdx}
                                      className="flex items-start gap-3"
                                    >
                                      <div className="flex flex-col items-center pt-1.5">
                                        <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                                      </div>

                                      <div className="flex-1 bg-purple-50 border border-purple-200 rounded-md p-2">
                                        <div className="flex items-start gap-2">
                                          <div className="w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                            {cpmkIdx + 1}
                                          </div>
                                          <p className="text-xs text-gray-700 flex-1 leading-tight">
                                            {cpmk.deskripsi}
                                          </p>
                                          <span className="bg-purple-500 text-white px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap">
                                            {cpmk.bobot}%
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {item.mataKuliah.length === 0 && (
                      <div className="mt-3 ml-6 text-xs text-gray-400 italic">
                        Tidak ada MK terkait di semester ini
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-blue-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Profil CPL Mahasiswa
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Diagram visualisasi CPL mahasiswa berdasarkan data yang tersedia
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarChartData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" stroke="#6b7280" />
              <PolarRadiusAxis domain={[0, 100]} stroke="#6b7280" />
              <Radar
                name="Nilai CPL"
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.5}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABEL DETAIL CPL */}
      <div className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden">
        <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="text-lg font-bold text-gray-800">
            Detail Capaian Pembelajaran Lulusan
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Semester {selectedSemester} - {selectedProdiData?.nama_prodi ?? '-'}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Kode CPL
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Deskripsi
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Jumlah MK
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Nilai
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {errorCPL && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-sm text-red-600 text-center"
                  >
                    {errorCPL}
                  </td>
                </tr>
              )}

              {!errorCPL && cplScores.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-sm text-gray-500 text-center"
                  >
                    {selectedMahasiswa
                      ? 'Belum ada nilai CPL untuk mahasiswa & semester ini.'
                      : 'Silakan pilih mahasiswa terlebih dahulu.'}
                  </td>
                </tr>
              )}

              {!errorCPL &&
                cplScores.map((cpl, idx) => (
                  <tr key={idx} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-700">
                      {cpl.kode}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {cpl.deskripsi}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        {cpl.jumlahMK} MK
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
                        {cpl.nilai.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          cpl.status === 'Tercapai'
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : cpl.status === 'Cukup'
                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                            : 'bg-red-100 text-red-700 border border-red-300'
                        }`}
                      >
                        {cpl.status}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

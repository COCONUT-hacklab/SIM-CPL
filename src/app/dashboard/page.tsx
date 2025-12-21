'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchNilaiCPLByMahasiswa,
} from '@/lib/simcplApi';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';

// ============================ API CONFIG ============================
const API_BASE = process.env.NEXT_PUBLIC_SIMCPL_API_BASE ?? 'http://localhost:8001/api';

// ============================ TYPES ============================
type Prodi = {
  id_prodi: number;
  kode_prodi: string;
  nama_prodi: string;
};

type MahasiswaRow = {
  id: string;      
  npm: string;     
  nama: string;
  angkatan?: number | null;
  source: 'db' | 'Mock';
};

type CplScore = {
  kode: string;
  nilai: number;
  status: 'Tercapai' | 'Cukup' | 'Belum Tercapai';
};

type CPMKItem = {
  id_cpmk: number;
  kode_cpmk: string;
  deskripsi: string;
  bobot_cpmk: number | null;
};

type MappingNode = {
  cpl: {
    kode: string;
    deskripsi: string;
  };
  mkCount: number;
  mataKuliah: {
    id_mk: number;
    kode: string;
    nama: string;
    sks: number;
    cpmkCount: number;
  }[];
  totalCPMK: number;
};

// ============================ KOMPONEN UTAMA ============================

export default function DashboardPage() {
  const router = useRouter();

  // ---------- state filter ----------
  const [prodiList, setProdiList] = useState<Prodi[]>([]);
  const [selectedProdi, setSelectedProdi] = useState<string>(''); 
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedMahasiswa, setSelectedMahasiswa] = useState<string>('');

  // ---------- state data ----------
  const [filteredMahasiswa, setFilteredMahasiswa] = useState<MahasiswaRow[]>([]);
  const [cplScores, setCplScores] = useState<CplScore[]>([]);
  const [mappingData, setMappingData] = useState<MappingNode[]>([]);
  
  // ---------- state misc ----------
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadingMahasiswa, setLoadingMahasiswa] = useState(false);
  const [loadingCPL, setLoadingCPL] = useState(false);

  // ---------- state for MK Accordion (CPMK) ----------
  const [expandedMKIds, setExpandedMKIds] = useState<number[]>([]);
  const [cpmkByMK, setCpmkByMK] = useState<Record<number, CPMKItem[]>>({});
  const [loadingCPMKFor, setLoadingCPMKFor] = useState<number | null>(null);

  // ============================ FETCH PRODI ============================
  useEffect(() => {
    async function loadProdi() {
      try {
        const res = await fetch(`${API_BASE}/prodi`);
        if (!res.ok) throw new Error(`Gagal load prodi`);
        const data: Prodi[] = await res.json();
        setProdiList(data);
        if (data.length > 0 && !selectedProdi) setSelectedProdi(data[0].kode_prodi);
      } catch (err) {
        console.error('Error prodi:', err);
      }
    }
    loadProdi();
  }, []);

  // ============================ FETCH MAHASISWA ============================
  useEffect(() => {
    if (!selectedProdi) return;
    async function loadMahasiswa() {
      try {
        setLoadingMahasiswa(true);
        const prodiObj = prodiList.find(p => p.kode_prodi === selectedProdi);
        if (!prodiObj) return;

        const res = await fetch(`${API_BASE}/prodi/${prodiObj.id_prodi}/mahasiswa-nilai?semester=${selectedSemester}`);
        const rows = await res.json();
        const list: MahasiswaRow[] = rows.map((r: any) => ({
          id: String(r.id_mhs),
          npm: r.nim,
          nama: r.nama,
          angkatan: r.angkatan,
          source: 'db',
        }));
        setFilteredMahasiswa(list);
        if (list.length > 0) setSelectedMahasiswa(list[0].id);
        else setSelectedMahasiswa('');
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMahasiswa(false);
      }
    }
    loadMahasiswa();
  }, [selectedProdi, selectedSemester, refreshKey, prodiList]);

  // ============================ FETCH CPL & MAPPING ============================
  useEffect(() => {
    const prodiObj = prodiList.find(p => p.kode_prodi === selectedProdi);
    if (!prodiObj) {
      setMappingData([]);
      return;
    }

    // Reset states on change
    setMappingData([]);
    setCplScores([]);
    setExpandedMKIds([]);

    async function loadCPLData() {
      try {
        setLoadingCPL(true);
        const mappingRes = await fetch(`${API_BASE}/prodi/${prodiObj?.id_prodi}/cpl-mapping?semester=${selectedSemester}`);
        const mappingBackend = await mappingRes.json();

        let scores: CplScore[] = [];
        if (selectedMahasiswa) {
          const mhs = filteredMahasiswa.find(m => m.id === selectedMahasiswa);
          if (mhs) {
            const res = await fetchNilaiCPLByMahasiswa(mhs.npm, selectedSemester);
            scores = (res.cpl || []).map((row) => ({
              kode: row.kode_cpl,
              nilai: row.nilai_angka,
              status: row.nilai_angka >= 70 ? 'Tercapai' : row.nilai_angka >= 50 ? 'Cukup' : 'Belum Tercapai'
            }));
          }
        }

        const finalMapping: MappingNode[] = mappingBackend.map((b: any) => ({
          cpl: { kode: b.kode_cpl, deskripsi: b.deskripsi },
          mkCount: b.mk_list?.length || 0,
          mataKuliah: (b.mk_list || []).map((m: any) => ({
            id_mk: m.id_mk,
            kode: m.kode_mk,
            nama: m.nama_mk,
            sks: m.sks,
            cpmkCount: m.cpmk_count
          })),
          totalCPMK: (b.mk_list || []).reduce((acc: number, m: any) => acc + m.cpmk_count, 0)
        }));

        setMappingData(finalMapping);
        setCplScores(scores);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCPL(false);
      }
    }
    loadCPLData();
  }, [selectedProdi, selectedMahasiswa, selectedSemester, refreshKey, prodiList]);

  // ============================ TOGGLE MK & FETCH CPMK ============================
  const toggleMKAccordion = async (idMK: number) => {
    if (expandedMKIds.includes(idMK)) {
      setExpandedMKIds(prev => prev.filter(id => id !== idMK));
      return;
    }
    setExpandedMKIds(prev => [...prev, idMK]);

    if (!cpmkByMK[idMK]) {
      setLoadingCPMKFor(idMK);
      try {
        const res = await fetch(`${API_BASE}/mk/${idMK}/cpmk`);
        const data = await res.json();
        setCpmkByMK(prev => ({ ...prev, [idMK]: data }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCPMKFor(null);
      }
    }
  };

  // ============================ DERIVED DATA ============================
  const selectedMhs = filteredMahasiswa.find(m => m.id === selectedMahasiswa);
  const prodiInfo = prodiList.find(p => p.kode_prodi === selectedProdi);
  
  const radarData = mappingData.map(m => {
    const s = cplScores.find(sc => sc.kode === m.cpl.kode);
    return { subject: m.cpl.kode, value: s?.nilai || 0, fullMark: 100 };
  });

  const rataRata = cplScores.length > 0
    ? Math.round((cplScores.reduce((sum, c) => sum + c.nilai, 0) / cplScores.length) * 10) / 10
    : 0;

  return (
    <div className="min-h-screen bg-[#f8faff] p-6">
      {/* 1. FILTER HEADER */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="flex items-center text-sm font-semibold text-blue-800 mb-2">
              <span className="mr-2">🏢</span> Pilih Program Studi
            </label>
            <select
              value={selectedProdi}
              onChange={(e) => { setSelectedProdi(e.target.value); setSelectedMahasiswa(''); }}
              className="w-full p-3 border-2 border-blue-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {prodiList.map(p => <option key={p.id_prodi} value={p.kode_prodi}>{p.nama_prodi}</option>)}
            </select>
          </div>
          <div>
            <label className="flex items-center text-sm font-semibold text-blue-800 mb-2">
              <span className="mr-2">📅</span> Pilih Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(Number(e.target.value))}
              className="w-full p-3 border-2 border-blue-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>
          <div>
            <label className="flex items-center text-sm font-semibold text-blue-800 mb-2">
              <span className="mr-2">👤</span> Pilih Mahasiswa
            </label>
            <select
              value={selectedMahasiswa}
              onChange={(e) => setSelectedMahasiswa(e.target.value)}
              className="w-full p-3 border-2 border-blue-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={filteredMahasiswa.length === 0}
            >
              {filteredMahasiswa.map(m => <option key={m.id} value={m.id}>{m.npm} - {m.nama}</option>)}
              {filteredMahasiswa.length === 0 && <option value="">Tidak ada mahasiswa</option>}
            </select>
          </div>
        </div>

        {/* 2. STUDENT INFO CARD */}
        {selectedMhs && (
          <div className="mt-6 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500 font-medium">Prodi:</p>
                <p className="font-bold text-blue-700">{prodiInfo?.nama_prodi}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">NIM:</p>
                <p className="font-bold text-blue-700">{selectedMhs.npm}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Angkatan:</p>
                <p className="font-bold text-blue-700">{selectedMhs.angkatan}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Source:</p>
                <div className="flex items-center">
                  <span className="mr-1">📂</span>
                  <span className="font-bold text-gray-700">Database</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 3. HUBUNGAN CPL-MK-CPMK (TIMELINE) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-1">
            <div className="w-4 h-4 rounded-full bg-blue-100 mr-2" />
            <h3 className="text-lg font-bold text-gray-800">Hubungan (CPL - MK - CPMK)</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6">Semester {selectedSemester} • {prodiInfo?.nama_prodi}</p>

          <div className="space-y-6 overflow-y-auto max-h-[600px] pr-2">
            {mappingData.map((item) => {
              const isMissingData = item.mkCount === 0;
              return (
                <div key={item.cpl.kode} className="relative pl-6 border-l-2 border-blue-100">
                  <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white shadow-sm ${isMissingData ? 'bg-red-500' : 'bg-blue-500'}`} />
                  
                  {/* CPL Card - RED IF NO MK */}
                  <div className={`text-white p-4 rounded-xl shadow-md mb-4 transition-colors ${isMissingData ? 'bg-red-500' : 'bg-blue-600'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold">{item.cpl.kode}</span>
                      <div className="flex gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${isMissingData ? 'bg-white/30' : 'bg-white/20'}`}>{item.mkCount} MK</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${isMissingData ? 'bg-white/30' : 'bg-white/20'}`}>{item.totalCPMK} CPMK</span>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed opacity-90">{item.cpl.deskripsi}</p>
                    {isMissingData && <p className="text-[10px] mt-2 font-bold italic text-red-100">! CPL ini tidak memiliki Mata Kuliah di semester {selectedSemester}</p>}
                  </div>

                  {/* MK List */}
                  <div className="space-y-3">
                    {item.mataKuliah.map((mk) => (
                      <div key={mk.id_mk} className="relative pl-6">
                        <div className="absolute -left-[30px] top-5 w-3 h-3 rounded-full bg-gray-200 border-2 border-white" />
                        <div 
                          onClick={() => toggleMKAccordion(mk.id_mk)}
                          className={`group p-4 rounded-xl border-2 transition-all cursor-pointer ${
                            expandedMKIds.includes(mk.id_mk) ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-50/30 border-emerald-100 hover:border-emerald-200'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">{mk.kode}</span>
                              <h4 className="text-sm font-bold text-gray-800">{mk.nama}</h4>
                            </div>
                            {mk.cpmkCount > 0 && <span className={`text-[10px] transition-transform ${expandedMKIds.includes(mk.id_mk) ? 'rotate-180' : ''}`}>▼</span>}
                          </div>
                          {expandedMKIds.includes(mk.id_mk) && (
                            <div className="mt-4 pt-4 border-t border-emerald-200/50 space-y-3">
                              {loadingCPMKFor === mk.id_mk ? <p className="text-[10px] italic">Loading...</p> :
                               (cpmkByMK[mk.id_mk] || []).map((cpmk) => (
                                <div key={cpmk.id_cpmk} className="bg-white p-3 rounded-lg border border-emerald-100 shadow-sm">
                                  <p className="text-[10px] font-bold text-emerald-700 mb-1">{cpmk.kode_cpmk}</p>
                                  <p className="text-[11px] text-gray-600 leading-normal">{cpmk.deskripsi}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. RADAR CHART */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
          <h3 className="text-lg font-bold text-gray-800 self-start mb-6">Profil Visualisasi CPL</h3>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} axisLine={false} tick={false} />
              <Radar name="Skor CPL" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. DETAIL TABLE - RED ROWS IF MISSING */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-blue-50 border-b border-blue-100">
          <h3 className="text-lg font-bold text-gray-800">Tabel Rincian Capaian CPL</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 font-bold text-gray-700">Kode</th>
                <th className="px-6 py-3 font-bold text-gray-700">Deskripsi</th>
                <th className="px-6 py-3 font-bold text-gray-700 text-center">MK</th>
                <th className="px-6 py-3 font-bold text-gray-700 text-center">Nilai</th>
                <th className="px-6 py-3 font-bold text-gray-700 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mappingData.map((item, idx) => {
                const isMissingData = item.mkCount === 0;
                const score = cplScores.find(s => s.kode === item.cpl.kode);
                const val = score?.nilai ?? 0;
                return (
                  <tr key={idx} className={`hover:bg-gray-50 ${isMissingData ? 'bg-red-50' : ''}`}>
                    <td className={`px-6 py-4 font-bold ${isMissingData ? 'text-red-600' : 'text-blue-600'}`}>{item.cpl.kode}</td>
                    <td className={`px-6 py-4 ${isMissingData ? 'text-red-500' : 'text-gray-600'}`}>{item.cpl.deskripsi}</td>
                    <td className="px-6 py-2 text-center">
                      <span className={`px-5 py-1 rounded text-xs ${isMissingData ? 'bg-red-200 text-red-800' : 'bg-gray-100 text-gray-700'}`}>{item.mkCount} MK</span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold">{isMissingData ? '-' : val}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-10 py-1 rounded-full text-[10px] font-bold ${
                        isMissingData ? 'bg-red-100 text-red-600 border border-red-300' :
                        val > 69 ? 'bg-green-100 text-green-700' : 
                        val > 49? 'bg-yellow-100 text-yellow-700' :
                        val < 50 ? 'bg-red-100 text-red-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {isMissingData ? 'Tidak Ada MK' : (score?.status ?? 'Belum Ada Nilai')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
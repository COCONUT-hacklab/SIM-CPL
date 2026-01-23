'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// API Base URL
const API_BASE =   process.env.NEXT_PUBLIC_API_URL
 || 'http://localhost:8001/api';

// ===================== TYPES =====================
type Prodi = {
  id_prodi: number;
  kode_prodi: string;
  nama_prodi: string;
};

type MahasiswaSummary = {
  id_mhs: string;
  nim: string;
  nama: string;
  angkatan: number;
  semester_max?: number;
  total_nilai?: number;
  dari_import?: number;
};

type NilaiCPLItem = {
  id_cpl: number;
  kode_cpl: string;
  deskripsi: string;
  nilai_angka: number;
  semester_eval: number;
};

type CPLStatItem = {
  id_cpl: number;
  kode_cpl: string;
  deskripsi: string;
  jumlah_mahasiswa: number;
  rata_nilai: number;
  min_nilai: number;
  max_nilai: number;
  kategori_tinggi: number;
  kategori_sedang: number;
  kategori_rendah: number;
};

type ViewMode = 'mahasiswa' | 'semester' | 'prodi';
type MahasiswaViewTab = 'keseluruhan' | 'persemester';

// ===================== HELPER COMPONENTS =====================

// Custom Tooltip untuk Grafik Tren
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 border border-blue-100 shadow-xl rounded-xl min-w-[200px]">
        <div className="border-b border-gray-100 pb-2 mb-2">
          <p className="font-bold text-gray-800 text-sm">{label}</p>
          <p className="text-blue-600 font-black text-lg">
            Rata-rata: {data['Rata-rata CPL']}
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-emerald-500 text-xs mt-0.5">▲</span>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Terkuat</p>
              <p className="text-xs font-bold text-emerald-700">{data.terkuat}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-rose-500 text-xs mt-0.5">▼</span>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Terlemah</p>
              <p className="text-xs font-bold text-rose-700">{data.terlemah}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// ===================== MAIN COMPONENT =====================

export default function LaporanPage() {
  // API data state
  const [prodiList, setProdiList] = useState<Prodi[]>([]);
  const [mahasiswaList, setMahasiswaList] = useState<MahasiswaSummary[]>([]);

  // Selection state
  const [selectedProdi, setSelectedProdi] = useState<Prodi | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedMahasiswa, setSelectedMahasiswa] = useState<MahasiswaSummary | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('mahasiswa');
  const [mahasiswaViewTab, setMahasiswaViewTab] = useState<MahasiswaViewTab>('keseluruhan');

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: 'kode' | 'nilai'; direction: 'asc' | 'desc' }>({
    key: 'kode',
    direction: 'asc'
  });

  // Data state
  const [laporanData, setLaporanData] = useState<any>(null);
  const [expandedCPL, setExpandedCPL] = useState<string | null>(null);

  // Loading state
  const [loadingProdi, setLoadingProdi] = useState(false);
  const [loadingMahasiswa, setLoadingMahasiswa] = useState(false);
  const [loadingLaporan, setLoadingLaporan] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Listen to nilai updates
  useEffect(() => {
    const handleNilaiUpdate = (event: any) => {
      console.log('📋 Laporan: Data nilai diupdate', event.detail);
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('nilaiUpdated', handleNilaiUpdate);
    return () => {
      window.removeEventListener('nilaiUpdated', handleNilaiUpdate);
    };
  }, []);

  // Handle click outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch prodi
  useEffect(() => {
    const controller = new AbortController();
    setLoadingProdi(true);

    fetch(`${API_BASE}/prodi`, { signal: controller.signal })
      .then(res => res.json())
      .then((data: Prodi[]) => {
        const safeData = Array.isArray(data) ? data : [];
        setProdiList(safeData);
        if (safeData.length > 0 && !selectedProdi) {
          setSelectedProdi(safeData[0]);
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Error fetching prodi:', err);
        }
      })
      .finally(() => setLoadingProdi(false));

    return () => controller.abort();
  }, []);

  // Fetch mahasiswa when prodi changes
  useEffect(() => {
    if (!selectedProdi) {
      setMahasiswaList([]);
      return;
    }

    const controller = new AbortController();
    setLoadingMahasiswa(true);
    setSearchTerm('');
    setSelectedMahasiswa(null);

    fetch(`${API_BASE}/prodi/${selectedProdi.id_prodi}/mahasiswa-nilai`, { signal: controller.signal })
      .then(res => res.json())
      .then((data: MahasiswaSummary[]) => {
        setMahasiswaList(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Error fetching mahasiswa:', err);
          setMahasiswaList([]);
        }
      })
      .finally(() => setLoadingMahasiswa(false));

    return () => controller.abort();
  }, [selectedProdi, refreshKey]);

  // Generate laporan trigger
  useEffect(() => {
    if (viewMode === 'mahasiswa' && selectedMahasiswa && selectedProdi) {
      generateLaporanMahasiswa();
    } else if (viewMode === 'semester' && selectedProdi) {
      generateLaporanSemester();
    } else if (viewMode === 'prodi' && selectedProdi) {
      generateLaporanProdi();
    }
  }, [viewMode, selectedMahasiswa, selectedProdi, selectedSemester, refreshKey]);

  // Filter Mahasiswa Logic
  const filteredMahasiswaList = useMemo(() => {
    const list = mahasiswaList || [];
    if (!searchTerm) return list;
    const lower = searchTerm.toLowerCase();
    return list.filter(m => 
      (m.nama || '').toLowerCase().includes(lower) || 
      (m.nim || '').includes(lower)
    );
  }, [mahasiswaList, searchTerm]);

  // Sorting Logic for CPL Table
  const sortedCPLData = useMemo(() => {
    const dataCPL = laporanData?.cplOverallData || laporanData?.cplScores || [];
    if (!Array.isArray(dataCPL)) return [];

    let sorted = [...dataCPL];

    sorted.sort((a: any, b: any) => {
      const kodeA = a.kode || a.kode_cpl || a.cplKode || '';
      const kodeB = b.kode || b.kode_cpl || b.cplKode || '';
      const nilaiA = a.avgNilai ?? a.nilai_angka ?? 0;
      const nilaiB = b.avgNilai ?? b.nilai_angka ?? 0;

      if (sortConfig.key === 'kode') {
        const numA = parseInt(kodeA.replace(/\D/g, '')) || 0;
        const numB = parseInt(kodeB.replace(/\D/g, '')) || 0;
        if (numA < numB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (numA > numB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      } else {
        if (nilaiA < nilaiB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (nilaiA > nilaiB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }
    });

    return sorted;
  }, [laporanData, sortConfig]);

  const handleSort = (key: 'kode' | 'nilai') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // ===================== GENERATE REPORT LOGIC =====================

  const generateLaporanMahasiswa = async () => {
    if (!selectedMahasiswa || !selectedProdi) return;

    setLoadingLaporan(true);

    try {
      // 1. Fetch CPL history per semester
      const semesterRequests = [];
      for (let sem = 1; sem <= 8; sem++) {
        semesterRequests.push(
          fetch(`${API_BASE}/mahasiswa/${selectedMahasiswa.nim}/cpl?semester=${sem}`)
            .then(res => res.ok ? res.json() : { cpl: [] })
            .catch(() => ({ cpl: [] }))
        );
      }

      // 2. Fetch CPL Mapping & ALL Grades (Removed semester filter for grades)
      const [semesterResults, mappingRes, nilaiMKRes] = await Promise.all([
        Promise.all(semesterRequests),
        fetch(`${API_BASE}/prodi/${selectedProdi.id_prodi}/cpl-mapping?semester=${selectedSemester}`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => []),
        // [PERBAIKAN] Ambil SEMUA nilai tanpa filter semester agar mapping selalu ketemu
        // meskipun mahasiswa mengambil MK di semester berbeda (SP/Mengulang)
        fetch(`${API_BASE}/mahasiswa/${selectedMahasiswa.nim}/nilai-mk`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => [])
      ]);

      type NilaiMKItem = { id_mk: string; kode_mk: string; nama_mk: string; sks: number; nilai_angka: number };
      
      // [PERBAIKAN] Handle format respon API (Array vs Object)
      let nilaiMKList: NilaiMKItem[] = [];
      if (Array.isArray(nilaiMKRes)) {
        nilaiMKList = nilaiMKRes;
      } else if (nilaiMKRes && Array.isArray(nilaiMKRes.nilai_mk)) {
        nilaiMKList = nilaiMKRes.nilai_mk;
      }
      
      // Map Nilai by UUID and Fallback to Code
      const nilaiMKMapById: { [id_mk: string]: number } = {};
      const nilaiMKMapByKode: { [kode: string]: number } = {};
      
      nilaiMKList.forEach(n => {
        if(n.id_mk) nilaiMKMapById[n.id_mk] = n.nilai_angka;
        if(n.kode_mk) nilaiMKMapByKode[n.kode_mk.toLowerCase().trim()] = n.nilai_angka;
      });

      // Trend Data
      type TrendItem = { semester: string; 'Rata-rata CPL': number; terkuat: string; terlemah: string; };
      const trendData: TrendItem[] = [];
      const overallCPLAchievement: { [key: string]: { total: number; count: number; deskripsi: string } } = {};

      semesterResults.forEach((result, idx) => {
        const sem = idx + 1;
        const cplList: NilaiCPLItem[] = result.cpl || [];

        if (cplList.length > 0) {
          const avgCPL = cplList.reduce((sum, c) => sum + c.nilai_angka, 0) / cplList.length;

          const sortedByNilai = [...cplList].sort((a, b) => b.nilai_angka - a.nilai_angka);
          const strongest = sortedByNilai[0];
          const validForWeakest = cplList.filter(c => c.nilai_angka > 0).sort((a, b) => a.nilai_angka - b.nilai_angka);
          const weakest = validForWeakest.length > 0 ? validForWeakest[0] : null;

          trendData.push({
            semester: `Sem ${sem}`,
            'Rata-rata CPL': Math.round(avgCPL * 10) / 10,
            terkuat: strongest ? `${strongest.kode_cpl} (${strongest.nilai_angka})` : '-',
            terlemah: weakest ? `${weakest.kode_cpl} (${weakest.nilai_angka})` : '-'
          });

          cplList.forEach(cpl => {
            if (!overallCPLAchievement[cpl.kode_cpl]) {
              overallCPLAchievement[cpl.kode_cpl] = { total: 0, count: 0, deskripsi: cpl.deskripsi };
            }
            overallCPLAchievement[cpl.kode_cpl].total += cpl.nilai_angka;
            overallCPLAchievement[cpl.kode_cpl].count += 1;
          });
        }
      });

      const cplOverallData = Object.entries(overallCPLAchievement).map(([kode, data]) => ({
        kode,
        avgNilai: data.count > 0 ? Math.round((data.total / data.count) * 10) / 10 : 0,
        deskripsi: data.deskripsi,
        jumlahSemester: data.count,
      }));

      const currentSemesterResult = semesterResults[selectedSemester - 1];
      const cplScores: NilaiCPLItem[] = currentSemesterResult?.cpl || [];

      // Build CPMK Breakdown
      type CPLMappingBackend = {
        id_cpl: number; kode_cpl: string; deskripsi: string;
        mk_list: { id_mk: string; kode_mk: string; nama_mk: string; sks: number; semester: number; cpmk_count: number; }[];
      };
      const mappingData: CPLMappingBackend[] = mappingRes || [];

      const cpmkBreakdown = await Promise.all(
        mappingData.map(async (cplMap) => {
          const cplScore = cplScores.find(c => c.kode_cpl === cplMap.kode_cpl);
          
          const mkList = cplMap.mk_list || [];

          const mkWithCpmk = await Promise.all(
            mkList.map(async (mk) => {
              const cpmkRes = await fetch(`${API_BASE}/mk/${mk.id_mk}/cpmk`).catch(() => null);
              
              type CPMKBackend = { 
                id: string; 
                kode_cpmk: string; 
                deskripsi: string; 
                bobot: number | null;
              };
              
              const cpmkList: CPMKBackend[] = cpmkRes?.ok ? await cpmkRes.json() : [];

              const bobotMK = mkList.length > 0
                ? Math.round(100 / mkList.length * 100) / 100
                : 0;

              let nilai = 0;
              // [LOGIC] Prioritaskan pencarian ID, lalu Kode
              if (nilaiMKMapById[mk.id_mk] !== undefined) {
                nilai = nilaiMKMapById[mk.id_mk];
              } else {
                 nilai = nilaiMKMapByKode[mk.kode_mk.toLowerCase().trim()] ?? 0;
              }

              return {
                mkKode: mk.kode_mk,
                mkNama: mk.nama_mk,
                sks: mk.sks,
                bobotMK,
                nilaiMK: nilai,
                cpmkList: cpmkList.map((cpmk) => ({
                  cpmkKode: cpmk.kode_cpmk,
                  deskripsi: cpmk.deskripsi,
                  bobot: (cpmk.bobot !== null && cpmk.bobot !== undefined)
                    ? Math.round(cpmk.bobot * 100)
                    : (cpmkList.length > 0 ? Math.round(bobotMK / cpmkList.length * 100) / 100 : 0),
                  nilaiWeighted: 0,
                })),
              };
            })
          );

          return {
            cplKode: cplMap.kode_cpl,
            cplDeskripsi: cplMap.deskripsi,
            nilaiCPL: cplScore?.nilai_angka ?? 0,
            totalMKTerkait: mkList.length,
            bobotMKPerCPL: mkList.length > 0
              ? Math.round(100 / mkList.length * 100) / 100
              : 0,
            mataKuliah: mkWithCpmk,
          };
        })
      );

      const radarData = cplOverallData.map((cpl) => ({
        subject: cpl.kode,
        value: cpl.avgNilai,
        fullMark: 100,
      }));

      setLaporanData({
        mahasiswa: selectedMahasiswa,
        cplScores: cplScores.map(c => ({
          cplKode: c.kode_cpl,
          cplDeskripsi: c.deskripsi,
          nilai: c.nilai_angka,
        })),
        cpmkBreakdown,
        nilaiPerSemester: {},
        trendData,
        cplOverallData,
        radarData,
        avgCPL: cplScores.length > 0
          ? Math.round((cplScores.reduce((sum, c) => sum + c.nilai_angka, 0) / cplScores.length) * 10) / 10
          : 0,
      });
    } catch (err) {
      console.error('Error generating laporan mahasiswa:', err);
    } finally {
      setLoadingLaporan(false);
    }
  };

  const generateLaporanSemester = async () => {
    if (!selectedProdi) return;

    setLoadingLaporan(true);
    try {
      const [statsRes, mkRes] = await Promise.all([
        fetch(`${API_BASE}/prodi/${selectedProdi.id_prodi}/cpl-stats?semester=${selectedSemester}`),
        fetch(`${API_BASE}/prodi/${selectedProdi.id_prodi}/mk?semester=${selectedSemester}`),
      ]);

      if (!statsRes.ok) throw new Error('Failed to fetch CPL stats');
      const cplStats: CPLStatItem[] = await statsRes.json();

      type MKItem = {
        id_mk: string; kode_mk: string; nama_mk: string; sks: number; semester: number; cpl_terkait?: string[];
      };
      const mkList: MKItem[] = mkRes.ok ? await mkRes.json() : [];

      setLaporanData({
        semester: selectedSemester,
        mataKuliah: mkList.map(mk => ({
          kode: mk.kode_mk,
          nama: mk.nama_mk,
          sks: mk.sks,
          cplTerkait: mk.cpl_terkait ?? [],
        })),
        avgCPL: cplStats.map(s => ({
          kode: s.kode_cpl,
          avgNilai: Math.round(s.rata_nilai * 10) / 10,
          jumlahMahasiswa: s.jumlah_mahasiswa,
          deskripsi: s.deskripsi,
        })),
        totalMahasiswa: mahasiswaList.length,
        totalSKS: mkList.reduce((sum, mk) => sum + mk.sks, 0),
      });
    } catch (err) {
      console.error('Error generating laporan semester:', err);
    } finally {
      setLoadingLaporan(false);
    }
  };

  const generateLaporanProdi = async () => {
    if (!selectedProdi) return;
    setLoadingLaporan(true);
    try {
      const [statsRes, prodiStatsRes] = await Promise.all([
        fetch(`${API_BASE}/prodi/${selectedProdi.id_prodi}/cpl-stats`),
        fetch(`${API_BASE}/prodi/${selectedProdi.id_prodi}/stats`),
      ]);

      const cplStats: CPLStatItem[] = statsRes.ok ? await statsRes.json() : [];
      let prodiStats = prodiStatsRes.ok ? await prodiStatsRes.json() : {
        prodi: selectedProdi,
        total_mahasiswa: 0,
        total_mk: 0,
        total_cpl: 0,
        total_nilai_mk: 0,
        distribusi_angkatan: [],
        distribusi_status: []
      };

      const distribusiAngkatan = (prodiStats.distribusi_angkatan || []).map((a: any) => ({
        angkatan: `${a.angkatan}`,
        jumlah: a.jumlah,
      }));

      setLaporanData({
        prodi: selectedProdi,
        totalMahasiswa: prodiStats.total_mahasiswa || 0,
        totalMK: prodiStats.total_mk || 0,
        totalCPL: prodiStats.total_cpl || 0,
        avgCPL: cplStats.map(s => ({
          kode: s.kode_cpl,
          avgNilai: Math.round((s.rata_nilai || 0) * 10) / 10,
          deskripsi: s.deskripsi || '',
        })),
        distribusiSemester: distribusiAngkatan,
        distribusiStatus: prodiStats.distribusi_status || [],
        totalNilai: prodiStats.total_nilai_mk || 0,
      });
    } catch (err) {
      console.error('Error generating laporan prodi:', err);
    } finally {
      setLoadingLaporan(false);
    }
  };

  // ===================== EXPORT HANDLERS =====================

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!laporanData) return alert("Silakan tampilkan data terlebih dahulu!");
    const fileName = `Laporan_CPL_${viewMode}_${selectedMahasiswa?.nim || 'Prodi'}`;

    if (format === 'excel') {
      const dataToExport = sortedCPLData.map((item: any) => ({
        'Kode CPL': item.kode || item.kode_cpl,
        'Deskripsi': item.deskripsi,
        'Nilai Angka': item.nilai_angka || item.avgNilai,
        'Status': (item.nilai_angka || item.avgNilai) >= 70 ? 'Tercapai' : 'Kurang'
      }));
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Capaian CPL");
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } 
    else if (format === 'pdf') {
      const reportElement = document.getElementById('report-container');
      if (!reportElement) return alert("Elemen laporan tidak ditemukan!");
      const html2pdf = (await import('html2pdf.js')).default;
      const opt: any = {
        margin: [10, 10,10,10],
        filename: `${fileName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      try {
        setLoadingLaporan(true);
        await html2pdf().set(opt).from(reportElement).save();
      } catch (err) {
        console.error("Gagal membuat PDF:", err);
      } finally {
        setLoadingLaporan(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
          Laporan CPL
        </h1>
        <p className="text-gray-600">
          Laporan lengkap capaian pembelajaran lulusan dengan visualisasi data
        </p>
      </div>

      {/* View Mode Selector */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setViewMode('mahasiswa')} className={`px-6 py-2.5 rounded-lg font-medium transition-all ${viewMode === 'mahasiswa' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Per Mahasiswa</button>
          <button onClick={() => setViewMode('semester')} className={`px-6 py-2.5 rounded-lg font-medium transition-all ${viewMode === 'semester' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Per Semester</button>
          <button onClick={() => setViewMode('prodi')} className={`px-6 py-2.5 rounded-lg font-medium transition-all ${viewMode === 'prodi' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Per Prodi</button>
          <div className="ml-auto flex gap-2">
            <button onClick={() => handleExport('pdf')} className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">PDF</button>
            <button onClick={() => handleExport('excel')} className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">Excel</button>
          </div>
        </div>
      </div>

      {/* Filters based on view mode */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Program Studi</label>
            <select
              value={selectedProdi?.id_prodi ?? ''}
              onChange={(e) => {
                const prodi = prodiList.find(p => p.id_prodi === Number(e.target.value));
                setSelectedProdi(prodi ?? null);
                setSelectedMahasiswa(null);
                setSearchTerm('');
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              disabled={loadingProdi}
            >
              {loadingProdi ? <option>Loading...</option> : prodiList.map((prodi) => (<option key={prodi.id_prodi} value={prodi.id_prodi}>{prodi.nama_prodi}</option>))}
            </select>
          </div>

          {((viewMode === 'mahasiswa' && mahasiswaViewTab === 'persemester') || viewMode === 'semester') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (<option key={sem} value={sem}>Semester {sem}</option>))}
              </select>
            </div>
          )}

          {/* FITUR SEARCH */}
          {viewMode === 'mahasiswa' && (
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cari Mahasiswa</label>
              <input
                type="text"
                placeholder="Ketik NIM atau Nama..."
                value={searchTerm || (selectedMahasiswa ? `${selectedMahasiswa.nim} - ${selectedMahasiswa.nama}` : '')}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedMahasiswa(null);
                  setShowDropdown(true);
                }}
                onFocus={() => {
                  setSearchTerm(''); 
                  setShowDropdown(true);
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                // Gunakan optional chaining dan OR empty array
                disabled={loadingMahasiswa || (mahasiswaList || []).length === 0}
              />
              {showDropdown && searchTerm && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredMahasiswaList.length > 0 ? (
                    filteredMahasiswaList.map((mhs) => (
                      <button
                        key={mhs.nim}
                        onClick={() => {
                          setSelectedMahasiswa(mhs);
                          setSearchTerm(`${mhs.nim} - ${mhs.nama}`);
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 border-b border-gray-50 last:border-0"
                      >
                        <span className="font-bold text-blue-600">{mhs.nim}</span> - {mhs.nama}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-400 italic text-center">Tidak ada mahasiswa ditemukan</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Laporan Content */}
      {viewMode === 'mahasiswa' && laporanData && laporanData.mahasiswa && (
        <div id="report-container" className="space-y-6">
          {/* Student Info Card */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div><p className="text-blue-100 text-sm">Nama Mahasiswa</p><p className="font-bold text-lg">{laporanData.mahasiswa.nama}</p></div>
              <div><p className="text-blue-100 text-sm">NIM</p><p className="font-bold text-lg">{laporanData.mahasiswa.nim}</p></div>
              <div><p className="text-blue-100 text-sm">Angkatan</p><p className="font-bold text-lg">{laporanData.mahasiswa.angkatan || 'N/A'}</p></div>
              <div><p className="text-blue-100 text-sm">Rata-rata CPL Keseluruhan</p><p className="font-bold text-2xl">{laporanData.cplOverallData && laporanData.cplOverallData.length > 0 ? Math.round((laporanData.cplOverallData.reduce((sum: number, c: any) => sum + c.avgNilai, 0) / laporanData.cplOverallData.length) * 10) / 10 : laporanData.avgCPL}</p></div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button onClick={() => setMahasiswaViewTab('keseluruhan')} className={`flex-1 px-6 py-4 font-medium transition-all ${mahasiswaViewTab === 'keseluruhan' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>Capaian Keseluruhan (Sem 1-8)</button>
              <button onClick={() => setMahasiswaViewTab('persemester')} className={`flex-1 px-6 py-4 font-medium transition-all ${mahasiswaViewTab === 'persemester' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>Detail Per Semester</button>
            </div>
          </div>

          {/* Content based on tab selection */}
          {mahasiswaViewTab === 'keseluruhan' ? (
            <div className="space-y-6">
              {/* 1. TREN PERKEMBANGAN CPL */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">📈 Tren Capaian CPL Lintas Semester</h3>
                    <p className="text-xs text-gray-500">Grafik perkembangan rata-rata seluruh CPL dari semester 1 s/d aktif</p>
                  </div>
                  <div className="px-4 py-2 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="text-xs text-blue-600 font-bold">Status: {laporanData.avgCPL >= 70 ? 'Stabil' : 'Perlu Pendampingan'}</span>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={laporanData.trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="semester" fontSize={11} tick={{fill: '#64748b'}} />
                      <YAxis domain={[0, 100]} fontSize={11} tick={{fill: '#64748b'}} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }} />
                      <Line type="monotone" dataKey="Rata-rata CPL" stroke="#2563eb" strokeWidth={3} dot={{ fill: '#2563eb', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2. ANALISIS PROFIL LULUSAN */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 flex flex-col items-center">
                  <h4 className="text-sm font-bold text-gray-700 mb-6 self-start">Visualisasi Profil Kompetensi</h4>
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={laporanData.radarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Skor CPL" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-700 mb-4">Analisis Capaian CPL</h4>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                      <div className="flex items-center text-green-700 mb-2">
                        <span className="text-xs font-bold uppercase">Kompetensi Terkuat</span>
                      </div>
                      {laporanData.cplOverallData && laporanData.cplOverallData.length > 0 ? (
                        <div>
                          <p className="text-lg font-bold text-green-800">{laporanData.cplOverallData.sort((a: any, b: any) => b.avgNilai - a.avgNilai)[0].kode}</p>
                          <p className="text-[11px] text-green-600">Mahasiswa sangat unggul pada aspek ini dengan nilai rata-rata {laporanData.cplOverallData[0].avgNilai}</p>
                        </div>
                      ) : <p className="text-xs text-gray-400">Data tidak tersedia</p>}
                    </div>

                    <div className="p-5 bg-red-50 rounded-xl border border-red-100">
                      <div className="flex items-center text-red-700 mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider">Hambatan Utama Terdeteksi</span>
                      </div>
                      {laporanData.cplOverallData && laporanData.cplOverallData.length > 0 ? (
                        (() => {
                          const lowestCPL = [...laporanData.cplOverallData].sort((a, b) => a.avgNilai - b.avgNilai)[0];
                          const inhibitors = (laporanData.cpmkBreakdown || [])
                            .filter((b: any) => b.cplKode === lowestCPL.kode)
                            .flatMap((b: any) => b.mataKuliah)
                            .filter((mk: any) => mk.nilaiMK < 60);
                          return (
                            <div className="space-y-3">
                              <div><p className="text-xl font-black text-red-800">{lowestCPL.kode}</p><p className="text-[11px] text-red-600 font-medium leading-relaxed">{lowestCPL.deskripsi}</p></div>
                              <div className="mt-4 pt-3 border-t border-red-200/50">
                                <p className="text-[10px] font-bold text-red-700 uppercase mb-2">Faktor Penghambat Spesifik:</p>
                                {inhibitors.length > 0 ? (
                                  <div className="space-y-2">
                                    {inhibitors.map((mk: any, i: number) => (
                                      <div key={i} className="bg-white/60 p-2.5 rounded-lg border border-red-100">
                                        <div className="flex justify-between items-start mb-1"><span className="text-[10px] font-bold text-gray-800">{mk.mkKode} - {mk.mkNama}</span><span className="text-[10px] font-black text-red-600">{mk.nilaiMK}</span></div>
                                        <p className="text-[9px] text-gray-500 leading-tight">Rendahnya pencapaian pada MK ini secara signifikan menarik turun rata-rata {lowestCPL.kode}.</p>
                                      </div>
                                    ))}
                                  </div>
                                ) : <p className="text-[10px] italic text-red-500">Hambatan terakumulasi dari nilai rata-rata yang belum mencapai target di beberapa semester sebelumnya.</p>}
                              </div>
                            </div>
                          );
                        })()
                      ) : <p className="text-xs text-gray-400">Data analisis belum tersedia.</p>}
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-500 uppercase font-bold">Tercapai</p><p className="text-xl font-bold text-green-600">{(laporanData.cplOverallData || []).filter((c: any) => c.avgNilai >= 70).length}</p></div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-500 uppercase font-bold">Cukup</p><p className="text-xl font-bold text-yellow-500">{(laporanData.cplOverallData || []).filter((c: any) => c.avgNilai >= 50 && c.avgNilai < 70).length}</p></div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-500 uppercase font-bold">Kurang</p><p className="text-xl font-bold text-red-500">{(laporanData.cplOverallData || []).filter((c: any) => c.avgNilai < 50).length}</p></div>
                  </div>
                </div>
              </div>

              {/* 3. TABEL DETAIL CAPAIAN KESELURUHAN */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">Rincian Nilai CPL (Sem 1-8)</h3>
                  <p className="text-xs text-gray-400 italic">Klik judul kolom untuk mengurutkan</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 font-bold text-gray-600 uppercase text-[10px] cursor-pointer hover:bg-gray-50 transition-colors group select-none" onClick={() => handleSort('kode')}>
                          <div className="flex items-center gap-1">Kode<span className={`text-gray-400 text-xs ${sortConfig.key === 'kode' ? 'text-blue-600 font-bold' : 'opacity-30 group-hover:opacity-100'}`}>{sortConfig.key === 'kode' && sortConfig.direction === 'desc' ? '▼' : '▲'}</span></div>
                        </th>
                        <th className="px-6 py-4 font-bold text-gray-600 uppercase text-[10px]">Deskripsi Capaian</th>
                        <th className="px-6 py-4 font-bold text-gray-600 uppercase text-[10px] text-center cursor-pointer hover:bg-gray-50 transition-colors group select-none" onClick={() => handleSort('nilai')}>
                          <div className="flex items-center justify-center gap-1">Rata-rata<span className={`text-gray-400 text-xs ${sortConfig.key === 'nilai' ? 'text-blue-600 font-bold' : 'opacity-30 group-hover:opacity-100'}`}>{sortConfig.key === 'nilai' && sortConfig.direction === 'desc' ? '▼' : '▲'}</span></div>
                        </th>
                        <th className="px-6 py-4 font-bold text-gray-600 uppercase text-[10px] text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sortedCPLData.map((cpl: any, idx: number) => (
                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4 font-bold text-blue-600">{cpl.kode || cpl.kode_cpl || cpl.cplKode}</td>
                          <td className="px-6 py-4 text-gray-600 text-xs leading-relaxed">{cpl.deskripsi}</td>
                          <td className="px-6 py-4 text-center"><span className="font-bold text-gray-800">{cpl.avgNilai || cpl.nilai_angka}</span></td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-4 py-1 rounded-full text-[10px] font-bold ${(cpl.avgNilai || cpl.nilai_angka) >= 70 ? 'bg-green-100 text-green-700' : (cpl.avgNilai || cpl.nilai_angka) >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                              {(cpl.avgNilai || cpl.nilai_angka) >= 70 ? 'Tercapai' : (cpl.avgNilai || cpl.nilai_angka) >= 50 ? 'Cukup' : 'Belum Tercapai'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* PANEL STATUS GUIDE */}
              <div className="mb-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50/80 border border-green-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2"><span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-bold">✓</span><h4 className="font-bold text-green-800 text-sm">Tercapai (Nilai ≥ 70)</h4></div>
                  <p className="text-xs text-green-700 leading-relaxed font-medium">Mahasiswa menguasai indikator CPL dengan baik.</p>
                  <p className="text-[10px] text-green-600 mt-1 italic">Indikator: Rata-rata nilai mata kuliah pendukung CPL stabil di atas standar mutu.</p>
                </div>
                <div className="bg-yellow-50/80 border border-yellow-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2"><span className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 text-xs font-bold">!</span><h4 className="font-bold text-yellow-800 text-sm">Cukup (50 - &lt;70)</h4></div>
                  <p className="text-xs text-yellow-700 leading-relaxed font-medium">Mahasiswa memenuhi kriteria minimal, namun pemahaman masih parsial.</p>
                  <p className="text-[10px] text-yellow-600 mt-1 italic">Indikator: Terdapat mata kuliah dengan nilai C atau BC yang menurunkan agregat CPL.</p>
                </div>
                <div className="bg-red-50/80 border border-red-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2"><span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold">✕</span><h4 className="font-bold text-red-800 text-sm">Belum Tercapai (&lt; 50)</h4></div>
                  <p className="text-xs text-red-700 leading-relaxed font-medium">Kompetensi gagal dipenuhi. Memerlukan remedial atau perbaikan segera.</p>
                  <p className="text-[10px] text-red-600 mt-1 italic">Penyebab: Nilai mata kuliah utama rendah (D/E) atau belum mengambil mata kuliah kunci.</p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-sm text-gray-700"><span className="font-semibold">Semester {selectedSemester} Terpilih</span> - Menampilkan detail CPL dan CPMK untuk semester ini</p>
                </div>
              </div>

              {/* [FITUR BARU] CPL Scores Table with CPMK Breakdown (Fix Empty State) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-blue-50">
                  <h3 className="text-lg font-semibold text-gray-800">Detail CPL Semester {selectedSemester}</h3>
                  <p className="text-sm text-gray-600 mt-1">Klik pada baris CPL untuk melihat breakdown CPMK dan bobot</p>
                </div>
                <div className="overflow-x-auto">
                  {laporanData.cpmkBreakdown && laporanData.cpmkBreakdown.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {laporanData.cpmkBreakdown.map((cpl: any, idx: number) => {
                        // Check if CPL has MK
                        const hasMK = cpl.mataKuliah && cpl.mataKuliah.length > 0;
                        
                        return (
                          <div key={idx} className={`border-b border-gray-200 last:border-b-0 ${!hasMK ? 'bg-gray-50/50' : 'bg-white'}`}>
                            {/* CPL Header */}
                            <div 
                              className={`flex items-center justify-between px-6 py-4 cursor-pointer transition-colors ${!hasMK ? 'opacity-70 hover:opacity-100 hover:bg-gray-100' : 'hover:bg-gray-50'}`} 
                              onClick={() => setExpandedCPL(expandedCPL === cpl.cplKode ? null : cpl.cplKode)}
                            >
                              <div className="flex items-center space-x-4 flex-1">
                                <div className="flex items-center space-x-2">
                                  <svg className={`w-5 h-5 text-gray-500 transition-transform ${expandedCPL === cpl.cplKode ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                  <span className="font-semibold text-blue-600">{cpl.cplKode}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-gray-700 flex-1">{cpl.cplDeskripsi}</span>
                                  {!hasMK && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1 bg-gray-200 w-fit px-2 py-0.5 rounded">Tidak ada MK Semester {selectedSemester}</span>}
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold ${!hasMK ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-800'}`}>{cpl.nilaiCPL}</span>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${!hasMK ? 'bg-gray-200 text-gray-500' : cpl.nilaiCPL >= 70 ? 'bg-green-100 text-green-800' : cpl.nilaiCPL >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{!hasMK ? 'N/A' : cpl.nilaiCPL >= 70 ? 'Tercapai' : cpl.nilaiCPL >= 50 ? 'Cukup' : 'Belum Tercapai'}</span>
                              </div>
                            </div>

                            {/* CPMK Breakdown Body */}
                            {expandedCPL === cpl.cplKode && (
                              <div className="bg-gray-50 px-6 py-4 space-y-4 animate-in slide-in-from-top-1">
                                {!hasMK ? (
                                  // EMPTY STATE BREAKDOWN
                                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-center">
                                    <div className="text-3xl mb-2 opacity-30">🔕</div>
                                    <p className="font-bold text-gray-600">Tidak ada Mata Kuliah terkait</p>
                                    <p className="text-sm text-gray-500 max-w-md mt-1">
                                      CPL {cpl.cplKode} tidak dibebankan pada mata kuliah manapun di Semester {selectedSemester}. 
                                      Silakan cek semester lain untuk melihat kontribusi nilai.
                                    </p>
                                  </div>
                                ) : (
                                  // NORMAL BREAKDOWN
                                  <>
                                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2"><div className="w-1 h-6 bg-blue-500 rounded"></div><h4 className="font-semibold text-gray-800">Breakdown Mata Kuliah & CPMK untuk {cpl.cplKode}</h4></div>
                                        <span className="text-sm font-semibold text-blue-600">Total: {cpl.totalMKTerkait} MK Terkait</span>
                                      </div>
                                      <div className="text-sm text-gray-600"><p>• Bobot per MK: <span className="font-semibold text-gray-800">{cpl.bobotMKPerCPL}%</span> (100% ÷ {cpl.totalMKTerkait} MK)</p><p>• MK di semester ini: <span className="font-semibold text-gray-800">{cpl.mataKuliah.length}</span></p></div>
                                    </div>
                                    {cpl.mataKuliah.map((mk: any, mkIdx: number) => (
                                      <div key={mkIdx} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                        <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-3 border-b border-green-200">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div><div><span className="font-semibold text-gray-800">{mk.mkKode}</span><span className="text-gray-600 ml-2">- {mk.mkNama}</span></div></div>
                                            <div className="flex items-center space-x-4"><span className="text-sm text-gray-600">{mk.sks} SKS</span><span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-200 text-green-800">Bobot: {mk.bobotMK}%</span><span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-600 text-white">Nilai: {mk.nilaiMK}</span></div>
                                          </div>
                                        </div>
                                        <div className="p-4">
                                          <div className="text-xs text-gray-600 mb-3 bg-purple-50 px-3 py-2 rounded"><strong>Perhitungan CPMK:</strong> {mk.bobotMK}% (bobot MK) ÷ {mk.cpmkList.length} CPMK = {mk.cpmkList[0]?.bobot}% per CPMK</div>
                                          
                                          {mk.cpmkList.length > 0 ? (
                                            <table className="w-full">
                                              <thead><tr className="text-xs text-gray-500 border-b border-gray-200"><th className="pb-2 text-left font-medium">CPMK</th><th className="pb-2 text-left font-medium">Deskripsi</th><th className="pb-2 text-center font-medium">Bobot (%)</th></tr></thead>
                                              <tbody className="divide-y divide-gray-100">
                                                {mk.cpmkList.map((cpmk: any, cpmkIdx: number) => (
                                                  <tr key={cpmkIdx} className="text-sm"><td className="py-2 pr-4"><div className="flex items-center space-x-2"><div className="w-2 h-2 rounded-full bg-purple-400"></div><span className="font-medium text-purple-600">{cpmk.cpmkKode.length > 20 ? cpmk.cpmkKode.substring(0, 20) + '...' : cpmk.cpmkKode}</span></div></td><td className="py-2 text-gray-700">{cpmk.deskripsi}</td><td className="py-2 text-center"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">{cpmk.bobot}%</span></td></tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          ) : (
                                            <div className="text-center py-2 text-gray-400 text-xs italic bg-gray-50 rounded border border-dashed border-gray-200">
                                              ⚠️ Belum ada CPMK yang didefinisikan untuk MK ini.
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : <div className="p-8 text-center text-gray-500"><p>Belum ada data CPMK untuk semester ini</p></div>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Semester & Prodi Views */}
      {viewMode === 'semester' && laporanData && (
        <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-200"><p className="text-gray-600 text-sm">Total Mahasiswa</p><p className="text-3xl font-bold text-blue-600">{laporanData.totalMahasiswa}</p></div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-green-200"><p className="text-gray-600 text-sm">Mata Kuliah</p><p className="text-3xl font-bold text-green-600">{laporanData?.mataKuliah?.length || 0}</p></div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-purple-200"><p className="text-gray-600 text-sm">Total SKS</p><p className="text-3xl font-bold text-purple-600">{laporanData?.totalSKS || 0}</p></div>
           </div>
           <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
             <h3 className="text-lg font-semibold text-gray-800 mb-4">Rata-rata Capaian CPL Semester {selectedSemester}</h3>
             <ResponsiveContainer width="100%" height={350}><BarChart data={laporanData?.avgCPL || []}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="kode" stroke="#6b7280" /><YAxis domain={[0, 100]} stroke="#6b7280" /><Tooltip /><Bar dataKey="avgNilai" fill="#2563eb" radius={[8, 8, 0, 0]} name="Rata-rata Nilai" /></BarChart></ResponsiveContainer>
           </div>
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-6 border-b border-gray-200 bg-blue-50"><h3 className="text-lg font-semibold text-gray-800">Daftar Mata Kuliah Semester {selectedSemester}</h3></div>
             <table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode MK</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mata Kuliah</th><th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">SKS</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPL Terkait</th></tr></thead><tbody className="divide-y divide-gray-200">{laporanData?.mataKuliah?.map((mk: any, idx: number) => (<tr key={idx} className="hover:bg-gray-50"><td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{mk.kode}</td><td className="px-6 py-4 text-sm text-gray-700">{mk.nama}</td><td className="px-6 py-4 whitespace-nowrap text-center"><span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-800 text-sm font-medium">{mk.sks}</span></td><td className="px-6 py-4 text-sm text-gray-700">{mk.cplTerkait.join(', ')}</td></tr>))}</tbody></table>
           </div>
        </div>
      )}

      {viewMode === 'prodi' && laporanData && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white"><h2 className="text-2xl font-bold mb-4">{laporanData?.prodi?.nama_prodi || 'Program Studi'}</h2><div className="grid grid-cols-1 md:grid-cols-4 gap-4"><div><p className="text-blue-100 text-sm">Total Mahasiswa</p><p className="text-3xl font-bold">{laporanData?.totalMahasiswa || 0}</p></div><div><p className="text-blue-100 text-sm">Total Mata Kuliah</p><p className="text-3xl font-bold">{laporanData?.totalMK || 0}</p></div><div><p className="text-blue-100 text-sm">Data Nilai Tersimpan</p><p className="text-3xl font-bold">{laporanData?.totalNilai || 0}</p></div><div><p className="text-blue-100 text-sm">Kode Prodi</p><p className="text-lg font-semibold">{laporanData?.prodi?.kode_prodi || '-'}</p></div></div></div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"><h3 className="text-lg font-semibold text-gray-800 mb-4">Distribusi Mahasiswa per Angkatan</h3><ResponsiveContainer width="100%" height={300}><BarChart data={laporanData?.distribusiSemester || []}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="angkatan" stroke="#6b7280" /><YAxis stroke="#6b7280" /><Tooltip /><Bar dataKey="jumlah" fill="#2563eb" radius={[8, 8, 0, 0]} name="Jumlah Mahasiswa" /></BarChart></ResponsiveContainer></div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"><h3 className="text-lg font-semibold text-gray-800 mb-4">Rata-rata Capaian CPL Keseluruhan</h3><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><ResponsiveContainer width="100%" height={350}><BarChart data={Array.isArray(laporanData?.avgCPL) ? laporanData.avgCPL : []}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="kode" stroke="#6b7280" /><YAxis domain={[0, 100]} stroke="#6b7280" /><Tooltip /><Bar dataKey="avgNilai" fill="#2563eb" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer><ResponsiveContainer width="100%" height={350}><RadarChart data={Array.isArray(laporanData?.avgCPL) ? laporanData.avgCPL.map((cpl: any) => ({ subject: cpl.kode, value: cpl.avgNilai, fullMark: 100, })) : []}><PolarGrid stroke="#e5e7eb" /><PolarAngleAxis dataKey="subject" stroke="#6b7280" /><PolarRadiusAxis domain={[0, 100]} stroke="#6b7280" /><Radar name="Rata-rata CPL" dataKey="value" stroke="#2563eb" fill="#2563eb" fillOpacity={0.6} /><Tooltip /></RadarChart></ResponsiveContainer></div></div>
        </div>
      )}
    </div>
  );
}
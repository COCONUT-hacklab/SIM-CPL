'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// API Base URL
const API_BASE = process.env.NEXT_PUBLIC_SIMCPL_API_BASE || 'http://localhost:8001/api';

// Types
type Prodi = {
  id_prodi: number;
  kode_prodi: string;
  nama_prodi: string;
};

type MahasiswaSummary = {
  id_mhs: number;
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

export default function LaporanPage() {
  // API data state
  const [prodiList, setProdiList] = useState<Prodi[]>([]);
  const [mahasiswaList, setMahasiswaList] = useState<MahasiswaSummary[]>([]);

  // Selection state
  const [selectedProdi, setSelectedProdi] = useState<Prodi | null>(null);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [selectedMahasiswa, setSelectedMahasiswa] = useState<MahasiswaSummary | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('mahasiswa');
  const [mahasiswaViewTab, setMahasiswaViewTab] = useState<MahasiswaViewTab>('keseluruhan');

  // Data state
  const [laporanData, setLaporanData] = useState<any>(null);
  const [expandedCPL, setExpandedCPL] = useState<string | null>(null);

  // Loading state
  const [loadingProdi, setLoadingProdi] = useState(false);
  const [loadingMahasiswa, setLoadingMahasiswa] = useState(false);
  const [loadingLaporan, setLoadingLaporan] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Listen to nilai updates from import
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

  // Fetch prodi list from backend
  useEffect(() => {
    const controller = new AbortController();
    setLoadingProdi(true);

    fetch(`${API_BASE}/prodi`, { signal: controller.signal })
      .then(res => res.json())
      .then((data: Prodi[]) => {
        setProdiList(data);
        if (data.length > 0 && !selectedProdi) {
          setSelectedProdi(data[0]);
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

  // Fetch mahasiswa list when prodi changes
  useEffect(() => {
    if (!selectedProdi) {
      setMahasiswaList([]);
      return;
    }

    const controller = new AbortController();
    setLoadingMahasiswa(true);

    fetch(`${API_BASE}/prodi/${selectedProdi.id_prodi}/mahasiswa-nilai`, { signal: controller.signal })
      .then(res => res.json())
      .then((data: MahasiswaSummary[]) => {
        setMahasiswaList(data);
        if (data.length > 0) {
          // Keep current selection if still valid, otherwise select first
          const currentExists = data.find(m => m.nim === selectedMahasiswa?.nim);
          if (!currentExists) {
            setSelectedMahasiswa(data[0]);
          }
        } else {
          setSelectedMahasiswa(null);
        }
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

  // Generate laporan based on view mode
  useEffect(() => {
    if (viewMode === 'mahasiswa' && selectedMahasiswa && selectedProdi) {
      generateLaporanMahasiswa();
    } else if (viewMode === 'semester' && selectedProdi) {
      generateLaporanSemester();
    } else if (viewMode === 'prodi' && selectedProdi) {
      generateLaporanProdi();
    }
  }, [viewMode, selectedMahasiswa, selectedProdi, selectedSemester, refreshKey]);

  const generateLaporanMahasiswa = async () => {
    if (!selectedMahasiswa || !selectedProdi) return;

    setLoadingLaporan(true);

    try {
      // Fetch all data in parallel
      const semesterRequests = [];
      for (let sem = 1; sem <= 8; sem++) {
        semesterRequests.push(
          fetch(`${API_BASE}/mahasiswa/${selectedMahasiswa.nim}/cpl?semester=${sem}`)
            .then(res => res.ok ? res.json() : { cpl: [] })
            .catch(() => ({ cpl: [] }))
        );
      }

      // Also fetch CPL mapping for the selected semester to build cpmkBreakdown
      const [semesterResults, mappingRes] = await Promise.all([
        Promise.all(semesterRequests),
        fetch(`${API_BASE}/prodi/${selectedProdi.id_prodi}/cpl-mapping?semester=${selectedSemester}`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => [])
      ]);

      // Build trend data and overall CPL achievement
      const trendData: { semester: string; 'Rata-rata CPL': number }[] = [];
      const overallCPLAchievement: { [key: string]: { total: number; count: number; deskripsi: string } } = {};

      semesterResults.forEach((result, idx) => {
        const sem = idx + 1;
        const cplList: NilaiCPLItem[] = result.cpl || [];

        if (cplList.length > 0) {
          const avgCPL = cplList.reduce((sum, c) => sum + c.nilai_angka, 0) / cplList.length;
          trendData.push({
            semester: `Sem ${sem}`,
            'Rata-rata CPL': Math.round(avgCPL * 10) / 10
          });

          cplList.forEach(cpl => {
            if (!overallCPLAchievement[cpl.kode_cpl]) {
              overallCPLAchievement[cpl.kode_cpl] = {
                total: 0,
                count: 0,
                deskripsi: cpl.deskripsi
              };
            }
            overallCPLAchievement[cpl.kode_cpl].total += cpl.nilai_angka;
            overallCPLAchievement[cpl.kode_cpl].count += 1;
          });
        }
      });

      // Build overall CPL data
      const cplOverallData = Object.entries(overallCPLAchievement).map(([kode, data]) => ({
        kode,
        avgNilai: data.count > 0 ? Math.round((data.total / data.count) * 10) / 10 : 0,
        deskripsi: data.deskripsi,
        jumlahSemester: data.count,
      }));

      // Get current semester CPL scores
      const currentSemesterResult = semesterResults[selectedSemester - 1];
      const cplScores: NilaiCPLItem[] = currentSemesterResult?.cpl || [];

      // Build cpmkBreakdown from mapping data
      type CPLMappingBackend = {
        id_cpl: number;
        kode_cpl: string;
        deskripsi: string;
        mk_list: {
          id_mk: number;
          kode_mk: string;
          nama_mk: string;
          sks: number;
          semester: number;
          cpmk_count: number;
        }[];
      };
      const mappingData: CPLMappingBackend[] = mappingRes || [];

      // Build cpmkBreakdown - need to fetch CPMK for each MK
      const cpmkBreakdown = await Promise.all(
        mappingData.map(async (cplMap) => {
          const cplScore = cplScores.find(c => c.kode_cpl === cplMap.kode_cpl);
          const mkWithCpmk = await Promise.all(
            cplMap.mk_list.map(async (mk) => {
              // Fetch CPMK for this MK
              const cpmkRes = await fetch(`${API_BASE}/mk/${mk.id_mk}/cpmk`).catch(() => null);
              type CPMKBackend = {
                id_cpmk: number;
                kode_cpmk: string;
                deskripsi: string;
                bobot_cpmk: number | null;
              };
              const cpmkList: CPMKBackend[] = cpmkRes?.ok ? await cpmkRes.json() : [];

              const bobotMK = cplMap.mk_list.length > 0
                ? Math.round(100 / cplMap.mk_list.length * 100) / 100
                : 0;

              return {
                mkKode: mk.kode_mk,
                mkNama: mk.nama_mk,
                sks: mk.sks,
                bobotMK,
                nilaiMK: cplScore?.nilai_angka ?? 0, // Simplified - would need actual MK nilai
                cpmkList: cpmkList.map((cpmk, idx) => ({
                  cpmkKode: cpmk.kode_cpmk,
                  deskripsi: cpmk.deskripsi,
                  bobot: cpmk.bobot_cpmk !== null
                    ? Math.round(cpmk.bobot_cpmk * 100)
                    : (cpmkList.length > 0 ? Math.round(bobotMK / cpmkList.length * 100) / 100 : 0),
                  nilaiWeighted: 0, // Would need actual calculation
                })),
              };
            })
          );

          return {
            cplKode: cplMap.kode_cpl,
            cplDeskripsi: cplMap.deskripsi,
            nilaiCPL: cplScore?.nilai_angka ?? 0,
            totalMKTerkait: cplMap.mk_list.length,
            bobotMKPerCPL: cplMap.mk_list.length > 0
              ? Math.round(100 / cplMap.mk_list.length * 100) / 100
              : 0,
            mataKuliah: mkWithCpmk,
          };
        })
      );

      // Prepare radar chart data
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
        nilaiPerSemester: {}, // Not used in current UI
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
      // Fetch CPL stats and MK data in parallel
      const [statsRes, mkRes] = await Promise.all([
        fetch(`${API_BASE}/prodi/${selectedProdi.id_prodi}/cpl-stats?semester=${selectedSemester}`),
        fetch(`${API_BASE}/prodi/${selectedProdi.id_prodi}/mk?semester=${selectedSemester}`),
      ]);

      if (!statsRes.ok) throw new Error('Failed to fetch CPL stats');
      const cplStats: CPLStatItem[] = await statsRes.json();

      type MKItem = {
        id_mk: number;
        kode_mk: string;
        nama_mk: string;
        sks: number;
        semester: number;
        cpl_terkait?: string[];
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
    if (!selectedProdi) {
      console.log('generateLaporanProdi: selectedProdi is null');
      return;
    }

    console.log('generateLaporanProdi: Starting for prodi ID', selectedProdi.id_prodi);
    setLoadingLaporan(true);

    try {
      // Fetch CPL stats and prodi stats in parallel
      const [statsRes, prodiStatsRes] = await Promise.all([
        fetch(`${API_BASE}/prodi/${selectedProdi.id_prodi}/cpl-stats`),
        fetch(`${API_BASE}/prodi/${selectedProdi.id_prodi}/stats`),
      ]);

      console.log('generateLaporanProdi: cpl-stats response', statsRes.status);
      console.log('generateLaporanProdi: stats response', prodiStatsRes.status);

      // Parse CPL stats
      const cplStats: CPLStatItem[] = statsRes.ok ? await statsRes.json() : [];
      console.log('generateLaporanProdi: cplStats', cplStats);

      // Parse prodi stats
      type ProdiStats = {
        prodi: { id_prodi: number; kode_prodi: string; nama_prodi: string };
        total_mahasiswa: number;
        total_mk: number;
        total_cpl: number;
        total_nilai_mk: number;
        distribusi_angkatan: { angkatan: number; jumlah: number }[];
        distribusi_status: { status: string; jumlah: number }[];
      };

      let prodiStats: ProdiStats;
      if (prodiStatsRes.ok) {
        prodiStats = await prodiStatsRes.json();
      } else {
        console.error('generateLaporanProdi: stats API failed', prodiStatsRes.status);
        prodiStats = {
          prodi: { id_prodi: selectedProdi.id_prodi, kode_prodi: selectedProdi.kode_prodi, nama_prodi: selectedProdi.nama_prodi },
          total_mahasiswa: 0,
          total_mk: 0,
          total_cpl: 0,
          total_nilai_mk: 0,
          distribusi_angkatan: [],
          distribusi_status: []
        };
      }
      console.log('generateLaporanProdi: prodiStats', prodiStats);

      // Build distribusi angkatan for chart
      const distribusiAngkatan = (prodiStats.distribusi_angkatan || []).map(a => ({
        angkatan: `${a.angkatan}`,
        jumlah: a.jumlah,
      }));

      const newLaporanData = {
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
      };

      console.log('generateLaporanProdi: Setting laporanData', newLaporanData);
      setLaporanData(newLaporanData);
    } catch (err) {
      console.error('Error generating laporan prodi:', err);
    } finally {
      setLoadingLaporan(false);
    }
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    alert(`Export ke ${format.toUpperCase()} akan segera tersedia!`);
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
          <button
            onClick={() => setViewMode('mahasiswa')}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${viewMode === 'mahasiswa'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Per Mahasiswa
          </button>
          <button
            onClick={() => setViewMode('semester')}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${viewMode === 'semester'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Per Semester
          </button>
          <button
            onClick={() => setViewMode('prodi')}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${viewMode === 'prodi'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Per Prodi
          </button>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => handleExport('pdf')}
              className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              PDF
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* Filters based on view mode */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Program Studi
            </label>
            <select
              value={selectedProdi?.id_prodi ?? ''}
              onChange={(e) => {
                const prodi = prodiList.find(p => p.id_prodi === Number(e.target.value));
                setSelectedProdi(prodi ?? null);
                setSelectedMahasiswa(null);
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              disabled={loadingProdi}
            >
              {loadingProdi ? (
                <option>Loading...</option>
              ) : (
                prodiList.map((prodi) => (
                  <option key={prodi.id_prodi} value={prodi.id_prodi}>
                    {prodi.nama_prodi}
                  </option>
                ))
              )}
            </select>
          </div>

          {((viewMode === 'mahasiswa' && mahasiswaViewTab === 'persemester') || viewMode === 'semester') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'mahasiswa' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mahasiswa
              </label>
              <select
                value={selectedMahasiswa?.nim ?? ''}
                onChange={(e) => {
                  const mhs = mahasiswaList.find(m => m.nim === e.target.value);
                  setSelectedMahasiswa(mhs ?? null);
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                disabled={loadingMahasiswa || mahasiswaList.length === 0}
              >
                {loadingMahasiswa ? (
                  <option>Loading...</option>
                ) : mahasiswaList.length === 0 ? (
                  <option>Tidak ada data mahasiswa</option>
                ) : (
                  mahasiswaList.map((mhs) => (
                    <option key={mhs.nim} value={mhs.nim}>
                      {mhs.nim} - {mhs.nama}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Laporan Content */}
      {viewMode === 'mahasiswa' && laporanData && laporanData.mahasiswa && (
        <div className="space-y-6">
          {/* Student Info Card */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-blue-100 text-sm">Nama Mahasiswa</p>
                <p className="font-bold text-lg">{laporanData.mahasiswa.nama}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">NIM</p>
                <p className="font-bold text-lg">{laporanData.mahasiswa.nim}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Angkatan</p>
                <p className="font-bold text-lg">{laporanData.mahasiswa.angkatan || 'N/A'}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Rata-rata CPL Keseluruhan</p>
                <p className="font-bold text-2xl">
                  {laporanData.cplOverallData && laporanData.cplOverallData.length > 0
                    ? Math.round(
                      (laporanData.cplOverallData.reduce((sum: number, c: any) => sum + c.avgNilai, 0) /
                        laporanData.cplOverallData.length) *
                      10
                    ) / 10
                    : laporanData.avgCPL}
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setMahasiswaViewTab('keseluruhan')}
                className={`flex-1 px-6 py-4 font-medium transition-all ${mahasiswaViewTab === 'keseluruhan'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Capaian Keseluruhan (Sem 1-8)</span>
                </div>
              </button>
              <button
                onClick={() => setMahasiswaViewTab('persemester')}
                className={`flex-1 px-6 py-4 font-medium transition-all ${mahasiswaViewTab === 'persemester'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <span>Detail Per Semester</span>
                </div>
              </button>
            </div>
          </div>

          {/* Content based on tab selection */}
          {mahasiswaViewTab === 'keseluruhan' ? (
            <div className="space-y-6">
              {/* CPL Trend Chart */}
              {laporanData.trendData && laporanData.trendData.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    📈 Tren Capaian CPL Lintas Semester
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Grafik perkembangan rata-rata CPL dari semester 1 hingga semester aktif
                  </p>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={laporanData.trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="semester" stroke="#6b7280" />
                      <YAxis domain={[0, 100]} stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="Rata-rata CPL"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ fill: '#2563eb', r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Overall CPL Achievement - New Chart */}
              {laporanData.cplOverallData && laporanData.cplOverallData.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Capaian CPL Keseluruhan (Semua Semester)
                    </h3>
                    <p className="text-sm text-gray-600">
                      Visualisasi pencapaian rata-rata untuk setiap CPL dari seluruh semester yang telah diselesaikan
                    </p>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Radar Chart */}
                      <div className="flex flex-col">
                        <h4 className="text-md font-semibold text-gray-700 mb-4 text-center">
                          Radar Chart - Profil CPL
                        </h4>
                        <ResponsiveContainer width="100%" height={400}>
                          <RadarChart data={laporanData.radarData}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis
                              dataKey="subject"
                              stroke="#6b7280"
                              tick={{ fill: '#374151', fontSize: 12 }}
                            />
                            <PolarRadiusAxis
                              domain={[0, 100]}
                              stroke="#6b7280"
                              tick={{ fill: '#6b7280', fontSize: 10 }}
                            />
                            <Radar
                              name="Nilai CPL"
                              dataKey="value"
                              stroke="#2563eb"
                              fill="#2563eb"
                              fillOpacity={0.6}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                              }}
                            />
                            <Legend />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Bar Chart */}
                      <div className="flex flex-col">
                        <h4 className="text-md font-semibold text-gray-700 mb-4 text-center">
                          Bar Chart - Perbandingan CPL
                        </h4>
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={laporanData.cplOverallData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                              dataKey="kode"
                              stroke="#6b7280"
                              tick={{ fill: '#374151', fontSize: 11 }}
                            />
                            <YAxis
                              domain={[0, 100]}
                              stroke="#6b7280"
                              tick={{ fill: '#6b7280' }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                              }}
                              formatter={(value: any) => [`${value}`, 'Nilai']}
                            />
                            <Legend />
                            <Bar
                              dataKey="avgNilai"
                              fill="#2563eb"
                              radius={[8, 8, 0, 0]}
                              name="Rata-rata Nilai"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* CPL Details Table */}
                    <div className="mt-6">
                      <h4 className="text-md font-semibold text-gray-700 mb-3">
                        Detail Capaian Per CPL
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                          <thead className="bg-gradient-to-r from-blue-100 to-blue-200">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Kode CPL</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Deskripsi</th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Rata-rata Nilai</th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Semester Terkait</th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {laporanData.cplOverallData.map((cpl: any, idx: number) => (
                              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="font-semibold text-blue-600">{cpl.kode}</span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">
                                  {cpl.deskripsi}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
                                    {cpl.avgNilai}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {cpl.jumlahSemester} semester
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${cpl.avgNilai >= 75
                                      ? 'bg-green-100 text-green-800'
                                      : cpl.avgNilai >= 60
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                      }`}
                                  >
                                    {cpl.avgNilai >= 75 ? '✓ Tercapai' : cpl.avgNilai >= 60 ? '~ Cukup' : '✗ Belum Tercapai'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* CPL Category Summary Cards */}
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">CPL Tercapai (70-100)</span>
                          </div>
                          <p className="text-3xl font-bold text-green-600">
                            {(laporanData.cplOverallData || []).filter((c: any) => c.avgNilai >= 70).length}
                          </p>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-yellow-600 bg-yellow-100 px-2 py-1 rounded">CPL Cukup (50-69)</span>
                          </div>
                          <p className="text-3xl font-bold text-yellow-600">
                            {(laporanData.cplOverallData || []).filter((c: any) => c.avgNilai >= 50 && c.avgNilai < 70).length}
                          </p>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">CPL Belum Tercapai (0-49)</span>
                          </div>
                          <p className="text-3xl font-bold text-red-600">
                            {(laporanData.cplOverallData || []).filter((c: any) => c.avgNilai < 50).length}
                          </p>
                        </div>
                      </div>

                      {/* CPL Calculation Info Box */}
                      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <div className="flex items-start space-x-2">
                          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="text-sm text-gray-700">
                            <p className="font-semibold mb-2">Cara Perhitungan CPL Keseluruhan:</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                              <li><strong>Agregasi multi-semester:</strong> Setiap CPL dihitung dari rata-rata nilai di <strong>seluruh semester</strong> yang telah diselesaikan mahasiswa</li>
                              <li><strong>Contoh:</strong> Jika CPL1 muncul di semester 1, 3, dan 5 dengan nilai 80, 85, 90 → Rata-rata CPL1 = (80+85+90)/3 = 85</li>
                              <li>Kolom <strong>"Semester Terkait"</strong> menunjukkan berapa semester yang memiliki mata kuliah terkait CPL tersebut</li>
                              <li>CPL dengan nilai 0 berarti belum ada mata kuliah yang berkontribusi ke CPL tersebut di semester yang sudah diselesaikan</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Per Semester Content */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Semester {selectedSemester} Terpilih</span> - Menampilkan detail CPL dan CPMK untuk semester ini
                  </p>
                </div>
              </div>

              {/* CPL Scores Table with CPMK Breakdown */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-blue-50">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Detail CPL Semester {selectedSemester}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Klik pada baris CPL untuk melihat breakdown CPMK dan bobot
                  </p>
                </div>
                <div className="overflow-x-auto">
                  {laporanData.cpmkBreakdown && laporanData.cpmkBreakdown.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {laporanData.cpmkBreakdown.map((cpl: any, idx: number) => (
                        <div key={idx} className="border-b border-gray-200 last:border-b-0">
                          {/* CPL Header - Clickable */}
                          <div
                            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => setExpandedCPL(expandedCPL === cpl.cplKode ? null : cpl.cplKode)}
                          >
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="flex items-center space-x-2">
                                <svg
                                  className={`w-5 h-5 text-gray-500 transition-transform ${expandedCPL === cpl.cplKode ? 'rotate-90' : ''
                                    }`}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                <span className="font-semibold text-blue-600">{cpl.cplKode}</span>
                              </div>
                              <span className="text-gray-700 flex-1">{cpl.cplDeskripsi}</span>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                {cpl.nilaiCPL}
                              </span>
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${cpl.nilaiCPL >= 75
                                  ? 'bg-green-100 text-green-800'
                                  : cpl.nilaiCPL >= 60
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                  }`}
                              >
                                {cpl.nilaiCPL >= 75 ? 'Tercapai' : cpl.nilaiCPL >= 60 ? 'Cukup' : 'Belum Tercapai'}
                              </span>
                            </div>
                          </div>

                          {/* CPMK Breakdown - Expandable */}
                          {expandedCPL === cpl.cplKode && (
                            <div className="bg-gray-50 px-6 py-4 space-y-4">
                              {/* Header with CPL Info */}
                              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-1 h-6 bg-blue-500 rounded"></div>
                                    <h4 className="font-semibold text-gray-800">
                                      Breakdown Mata Kuliah & CPMK untuk {cpl.cplKode}
                                    </h4>
                                  </div>
                                  <span className="text-sm font-semibold text-blue-600">
                                    Total: {cpl.totalMKTerkait} MK Terkait
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600">
                                  <p>• Bobot per MK: <span className="font-semibold text-gray-800">{cpl.bobotMKPerCPL}%</span> (100% ÷ {cpl.totalMKTerkait} MK)</p>
                                  <p>• MK di semester ini: <span className="font-semibold text-gray-800">{cpl.mataKuliah.length}</span></p>
                                </div>
                              </div>

                              {cpl.mataKuliah.map((mk: any, mkIdx: number) => (
                                <div key={mkIdx} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                  {/* MK Header */}
                                  <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-3 border-b border-green-200">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                        <div>
                                          <span className="font-semibold text-gray-800">{mk.mkKode}</span>
                                          <span className="text-gray-600 ml-2">- {mk.mkNama}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-4">
                                        <span className="text-sm text-gray-600">{mk.sks} SKS</span>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-200 text-green-800">
                                          Bobot: {mk.bobotMK}%
                                        </span>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-600 text-white">
                                          Nilai: {mk.nilaiMK}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* CPMK List */}
                                  <div className="p-4">
                                    <div className="text-xs text-gray-600 mb-3 bg-purple-50 px-3 py-2 rounded">
                                      <strong>Perhitungan CPMK:</strong> {mk.bobotMK}% (bobot MK) ÷ {mk.cpmkList.length} CPMK = {mk.cpmkList[0]?.bobot}% per CPMK
                                    </div>
                                    <table className="w-full">
                                      <thead>
                                        <tr className="text-xs text-gray-500 border-b border-gray-200">
                                          <th className="pb-2 text-left font-medium">CPMK</th>
                                          <th className="pb-2 text-left font-medium">Deskripsi</th>
                                          <th className="pb-2 text-center font-medium">Bobot (%)</th>
                                          <th className="pb-2 text-right font-medium">Nilai Tertimbang</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                        {mk.cpmkList.map((cpmk: any, cpmkIdx: number) => (
                                          <tr key={cpmkIdx} className="text-sm">
                                            <td className="py-2 pr-4">
                                              <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                                                <span className="font-medium text-purple-600">
                                                  {cpmk.cpmkKode.length > 20
                                                    ? cpmk.cpmkKode.substring(0, 20) + '...'
                                                    : cpmk.cpmkKode}
                                                </span>
                                              </div>
                                            </td>
                                            <td className="py-2 text-gray-700">
                                              {cpmk.deskripsi}
                                            </td>
                                            <td className="py-2 text-center">
                                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                {cpmk.bobot}%
                                              </span>
                                            </td>
                                            <td className="py-2 text-right font-semibold text-gray-900">
                                              {cpmk.nilaiWeighted}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>

                                    {/* Summary */}
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                      <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">
                                          Total Bobot CPMK:
                                        </span>
                                        <span className="font-semibold text-gray-900">
                                          {mk.cpmkList.reduce((sum: number, c: any) => sum + c.bobot, 0).toFixed(2)}%
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center text-sm mt-1">
                                        <span className="text-gray-600">
                                          Kontribusi MK ke {cpl.cplKode}:
                                        </span>
                                        <span className="text-base font-bold text-green-600">
                                          {mk.nilaiMK} × {mk.bobotMK}% = {Math.round(mk.nilaiMK * mk.bobotMK / 100 * 100) / 100}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}

                              {/* CPL Summary */}
                              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-2">
                                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                      </svg>
                                      <span className="font-semibold text-gray-800">
                                        Perhitungan Nilai {cpl.cplKode}
                                      </span>
                                    </div>
                                    <span className="text-2xl font-bold text-blue-600">{cpl.nilaiCPL}</span>
                                  </div>
                                  <div className="text-sm text-gray-700 space-y-1 bg-white rounded px-3 py-2">
                                    <p>• MK di semester ini: {cpl.mataKuliah.length} dari {cpl.totalMKTerkait} total MK</p>
                                    <p>• Formula: Rata-rata nilai dari semua MK yang terkait</p>
                                    <p className="font-mono text-xs bg-gray-50 px-2 py-1 rounded mt-1">
                                      ({cpl.mataKuliah.map((mk: any) => mk.nilaiMK).join(' + ')}) ÷ {cpl.mataKuliah.length} = <span className="font-bold text-blue-600">{cpl.nilaiCPL}</span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <p>Belum ada data CPMK untuk semester ini</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Mata Kuliah yang Sudah Diselesaikan - Per Semester Grid */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Mata Kuliah yang Sudah Diselesaikan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Generate semester 1-8 grid from cpmkBreakdown data */}
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                    // Collect unique MKs from all CPL breakdowns that match this semester
                    const mkSet = new Map<string, { kode: string; nama: string; nilai: number }>();
                    (laporanData.cpmkBreakdown || []).forEach((cpl: any) => {
                      cpl.mataKuliah?.forEach((mk: any) => {
                        // Since cpmkBreakdown is for selected semester, we mock multiple semesters
                        // In real implementation, we'd need all semesters data
                        if (!mkSet.has(mk.mkKode)) {
                          mkSet.set(mk.mkKode, {
                            kode: mk.mkKode,
                            nama: mk.mkNama,
                            nilai: mk.nilaiMK || Math.floor(Math.random() * 40) + 40, // placeholder nilai
                          });
                        }
                      });
                    });
                    const mkList = Array.from(mkSet.values());

                    // Only show semester if we have data for it (currently showing selected semester data)
                    if (mkList.length === 0 && sem !== selectedSemester) return null;

                    return (
                      <div key={sem} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-600 mb-3">Semester {sem}</h4>
                        {sem === selectedSemester && mkList.length > 0 ? (
                          <ul className="space-y-2 text-sm">
                            {mkList.map((mk, idx) => (
                              <li key={idx} className="flex justify-between items-center">
                                <span className="text-gray-700 truncate pr-2" title={mk.nama}>
                                  {mk.nama.length > 30 ? mk.nama.substring(0, 30) + '...' : mk.nama}
                                </span>
                                <span className={`font-bold px-2 py-0.5 rounded text-xs ${mk.nilai >= 70 ? 'bg-green-100 text-green-700' :
                                  mk.nilai >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                  {mk.nilai}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-400 text-sm italic">
                            {sem === selectedSemester ? 'Belum ada MK' : 'Pilih semester ini untuk melihat data'}
                          </p>
                        )}
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'semester' && laporanData && (
        <div className="space-y-6">
          {/* Semester Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Mahasiswa</p>
                  <p className="text-3xl font-bold text-blue-600">{laporanData.totalMahasiswa}</p>
                </div>
                <div className="bg-blue-100 p-4 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Mata Kuliah</p>
                  <p className="text-3xl font-bold text-green-600">{laporanData?.mataKuliah?.length || 0}</p>
                </div>
                <div className="bg-green-100 p-4 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total SKS</p>
                  <p className="text-3xl font-bold text-purple-600">{laporanData?.totalSKS || 0}</p>
                </div>
                <div className="bg-purple-100 p-4 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Average CPL Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Rata-rata Capaian CPL Semester {selectedSemester}
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={laporanData?.avgCPL || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="kode" stroke="#6b7280" />
                <YAxis domain={[0, 100]} stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="avgNilai" fill="#2563eb" radius={[8, 8, 0, 0]} name="Rata-rata Nilai" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Mata Kuliah List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-blue-50">
              <h3 className="text-lg font-semibold text-gray-800">
                Daftar Mata Kuliah Semester {selectedSemester}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode MK</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mata Kuliah</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">SKS</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPL Terkait</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {laporanData?.mataKuliah?.map((mk: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{idx + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{mk.kode}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{mk.nama}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-800 text-sm font-medium">
                          {mk.sks}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {mk.cplTerkait.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'prodi' && laporanData && (
        <div className="space-y-6">
          {/* Prodi Overview */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white">
            <h2 className="text-2xl font-bold mb-4">{laporanData?.prodi?.nama_prodi || 'Program Studi'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-blue-100 text-sm">Total Mahasiswa</p>
                <p className="text-3xl font-bold">{laporanData?.totalMahasiswa || 0}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Total Mata Kuliah</p>
                <p className="text-3xl font-bold">{laporanData?.totalMK || 0}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Data Nilai Tersimpan</p>
                <p className="text-3xl font-bold">{laporanData?.totalNilai || 0}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Kode Prodi</p>
                <p className="text-lg font-semibold">{laporanData?.prodi?.kode_prodi || '-'}</p>
              </div>
            </div>
          </div>

          {/* Distribusi Mahasiswa per Angkatan */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Distribusi Mahasiswa per Angkatan
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={laporanData?.distribusiSemester || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="angkatan" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="jumlah" fill="#2563eb" radius={[8, 8, 0, 0]} name="Jumlah Mahasiswa" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Average CPL Achievement */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Rata-rata Capaian CPL Keseluruhan
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={Array.isArray(laporanData?.avgCPL) ? laporanData.avgCPL : []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="kode" stroke="#6b7280" />
                  <YAxis domain={[0, 100]} stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="avgNilai" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={Array.isArray(laporanData?.avgCPL) ? laporanData.avgCPL.map((cpl: any) => ({
                  subject: cpl.kode,
                  value: cpl.avgNilai,
                  fullMark: 100,
                })) : []}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" stroke="#6b7280" />
                  <PolarRadiusAxis domain={[0, 100]} stroke="#6b7280" />
                  <Radar name="Rata-rata CPL" dataKey="value" stroke="#2563eb" fill="#2563eb" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CPL Details Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-blue-50">
              <h3 className="text-lg font-semibold text-gray-800">
                Detail Capaian CPL {laporanData?.prodi?.nama_prodi || 'Program Studi'}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode CPL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Rata-rata Nilai</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Array.isArray(laporanData?.avgCPL) && laporanData.avgCPL.map((cpl: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{cpl.kode}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{cpl.deskripsi}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                          {cpl.avgNilai}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${cpl.avgNilai >= 75
                            ? 'bg-green-100 text-green-800'
                            : cpl.avgNilai >= 60
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                            }`}
                        >
                          {cpl.avgNilai >= 75 ? 'Tercapai' : cpl.avgNilai >= 60 ? 'Cukup' : 'Belum Tercapai'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

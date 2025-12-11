'use client';

import { useEffect, useMemo, useState, ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import {
  Prodi,
  MK,
  MahasiswaSummary,
  ImportMatkulItem,
  ImportMahasiswaItem,
  ImportNilaiRequest,
  fetchProdiList,
  fetchMKByProdiSemester,
  fetchMahasiswaSummary,
  importNilai,
} from '@/lib/simcplApi';

type MahasiswaRow = {
  id: string;
  npm: string;
  nama: string;
  prodiKode: string;
  angkatan: string | number;
  semesterAktif: number;
  totalNilai: number;
  nilaiDariImport: number;
};

type LocalNilai = {
  nim: string;
  mkKode: string;
  nilaiAkhir: number;
};

type CPLStat = {
  id_cpl: number;
  kode_cpl: string;
  deskripsi: string;
  jumlah_mahasiswa: number;
  rata_nilai: number;
  min_nilai: number;
  max_nilai: number;
};

type CPMK = {
  id_cpmk: number;
  id_mk: number;
  kode_cpmk: string;
  deskripsi: string;
  bobot_cpmk: number | null;
};


// ===================== API CONFIG =====================

const API_BASE =
  process.env.NEXT_PUBLIC_SIMCPL_API_BASE ?? 'http://localhost:8001/api';

const DEFAULT_TAHUN_AJARAN = '2024/2025';

// ===================== PAGE COMPONENT =====================

export default function ManajemenDataPage() {
  const [activeTab, setActiveTab] = useState<'import' | 'mahasiswa' | 'matakuliah' | 'cpl'>(
    'import'
  );

  // filter
  const [prodiList, setProdiList] = useState<Prodi[]>([]);
  const [selectedProdiKode, setSelectedProdiKode] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<number>(1);

  const selectedProdi = useMemo(
    () => prodiList.find((p) => p.kode_prodi === selectedProdiKode) ?? null,
    [prodiList, selectedProdiKode]
  );

  // data MK
  const [mkList, setMkList] = useState<MK[]>([]);

  // mahasiswa summary dari backend
  const [mahasiswaSummary, setMahasiswaSummary] = useState<MahasiswaSummary[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

    // ==== CPL & CPMK ====
  const [cplStats, setCplStats] = useState<CPLStat[]>([]);
  const [isLoadingCPL, setIsLoadingCPL] = useState(false);
  const [cplError, setCplError] = useState<string | null>(null);

  const [cpmkByMK, setCpmkByMK] = useState<Record<number, CPMK[]>>({});
  const [expandedMKIds, setExpandedMKIds] = useState<number[]>([]);
  const [loadingCPMKFor, setLoadingCPMKFor] = useState<number | null>(null);
  const [cpmkError, setCpmkError] = useState<string | null>(null);


  // file & import-preview
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>(
    'idle'
  );
  const [importMessage, setImportMessage] = useState('');
  const [importStats, setImportStats] = useState({ success: 0, failed: 0, total: 0 });

  // preview in-memory
  const [mahasiswaWithNilai, setMahasiswaWithNilai] = useState<MahasiswaRow[]>([]);
  const [localNilai, setLocalNilai] = useState<LocalNilai[]>([]);

  // ========== EFFECT: LOAD PRODI ==========

  useEffect(() => {
    const controller = new AbortController();
    fetchProdiList(controller.signal)
      .then((data) => {
        setProdiList(data);
        if (!selectedProdiKode && data.length > 0) {
          setSelectedProdiKode(data[0].kode_prodi);
        }
      })
      .catch((err) => {
        console.error('Gagal load prodi:', err);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========== EFFECT: LOAD MK UNTUK PRODI+SEMESTER ==========

  useEffect(() => {
    if (!selectedProdi) {
      setMkList([]);
      return;
    }
    const controller = new AbortController();
    fetchMKByProdiSemester(selectedProdi.id_prodi, selectedSemester, controller.signal)
      .then(setMkList)
      .catch((err) => {
        console.error('Gagal load MK:', err);
        setMkList([]);
      });
    return () => controller.abort();
  }, [selectedProdi, selectedSemester]);

  // ========== EFFECT: LOAD MAHASISWA SUMMARY ==========

  useEffect(() => {
    if (!selectedProdi) {
      setMahasiswaSummary([]);
      return;
    }
    const controller = new AbortController();
    fetchMahasiswaSummary(selectedProdi.id_prodi, controller.signal)
      .then(setMahasiswaSummary)
      .catch((err) => {
        console.error('Gagal load mahasiswa summary:', err);
        setMahasiswaSummary([]);
      });
    return () => controller.abort();
  }, [selectedProdi, refreshKey]);

    // ====================== FETCH CPL STATS UNTUK TAB CPL ======================

  useEffect(() => {
    if (activeTab !== 'cpl') return;
    if (!selectedProdi) {
      setCplStats([]);
      return;
    }

    const controller = new AbortController();

    const fetchCPL = async () => {
      setIsLoadingCPL(true);
      setCplError(null);

      try {
        const res = await fetch(
          `${API_BASE}/prodi/${selectedProdi.id_prodi}/cpl-stats?semester=${selectedSemester}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`Gagal load CPL: ${res.status}`);
        const data: CPLStat[] = await res.json();
        setCplStats(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.error('Gagal load CPL stats:', err);
        setCplError(err?.message || 'Gagal mengambil data CPL');
        setCplStats([]);
      } finally {
        setIsLoadingCPL(false);
      }
    };

    fetchCPL();

    return () => controller.abort();
  }, [activeTab, selectedProdi, selectedSemester]);


  // ====================== FILE HANDLING ======================

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/vnd.ms-excel',
    ];
    const validExtensions = ['.xlsx', '.csv'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      setImportStatus('error');
      setImportMessage('File harus .xlsx atau .csv');
      setSelectedFile(null);
      setImportData([]);
      return;
    }

    setSelectedFile(file);
    setImportData([]);
    setImportStatus('idle');
    setImportMessage('');
    setImportStats({ success: 0, failed: 0, total: 0 });
    setMahasiswaWithNilai([]);
    setLocalNilai([]);
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      if (cols.length === 0) continue;
      const row: any = {};
      headers.forEach((h, idx) => {
        row[h] = (cols[idx] ?? '').trim();
      });
      if (row['nim'] && row['nama']) {
        data.push(row);
      }
    }

    return data;
  };

  const parseExcel = (buffer: ArrayBuffer): any[] => {
    try {
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      if (json.length < 2) return [];

      const headers = json[0].map((h) => String(h).trim().toLowerCase());
      const data: any[] = [];

      for (let i = 1; i < json.length; i++) {
        const rowVals = json[i];
        if (!rowVals || rowVals.length === 0) continue;
        const row: any = {};
        headers.forEach((h, idx) => {
          row[h] = rowVals[idx] != null ? String(rowVals[idx]).trim() : '';
        });
        if (row['nim'] && row['nama']) {
          data.push(row);
        }
      }

      return data;
    } catch (err) {
      console.error('Error parse Excel:', err);
      return [];
    }
  };

  const handlePreviewFile = async () => {
    if (!selectedFile) return;

    setImportStatus('processing');
    setImportMessage('Memproses file...');

    try {
      let data: any[] = [];
      if (selectedFile.name.toLowerCase().endsWith('.csv')) {
        const text = await selectedFile.text();
        data = parseCSV(text);
      } else {
        const buf = await selectedFile.arrayBuffer();
        data = parseExcel(buf);
      }

      if (data.length === 0) {
        setImportStatus('error');
        setImportMessage(
          'Tidak ada baris valid. Pastikan ada kolom NIM, Nama, dan nilai mata kuliah.'
        );
        setImportData([]);
        return;
      }

      setImportData(data);
      setImportStatus('idle');
      setImportMessage(`Berhasil memuat ${data.length} baris. Klik Import untuk melanjutkan.`);
    } catch (err) {
      console.error(err);
      setImportStatus('error');
      setImportMessage('Gagal membaca file.');
      setImportData([]);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImportData([]);
    setImportStatus('idle');
    setImportMessage('');
    setImportStats({ success: 0, failed: 0, total: 0 });
    setMahasiswaWithNilai([]);
    setLocalNilai([]);
  };

  // ====================== IMPORT -> POST KE BACKEND ======================

  const handleImportData = async () => {
    if (!selectedProdi || !selectedProdiKode || importData.length === 0) return;

    if (mkList.length === 0) {
      setImportStatus('error');
      setImportMessage(
        `Tidak ada mata kuliah untuk ${selectedProdi.nama_prodi} Semester ${selectedSemester}`
      );
      return;
    }

    setImportStatus('processing');
    setImportMessage('Mengirim data ke server...');

    const matkulList: ImportMatkulItem[] = mkList.map((mk) => ({
      kode: mk.kode_mk,
      nama: mk.nama_mk,
      sks: mk.sks,
    }));

    const importMahasiswa: ImportMahasiswaItem[] = [];
    const localMhsRows: MahasiswaRow[] = [];
    const localNilaiRows: LocalNilai[] = [];
    let processedRows = 0;

    for (const row of importData) {
      try {
        const nim = String(row['nim'] ?? '').trim();
        const nama = String(row['nama'] ?? '').trim();
        if (!nim || !nama) continue;

        const nilaiMap: Record<string, number> = {};
        let mkCount = 0;

        mkList.forEach((mk) => {
          const kodeLower = mk.kode_mk.toLowerCase();
          const key = Object.keys(row).find((k) => k.toLowerCase() === kodeLower);
          if (!key) return;

          const raw = row[key];
          const num = parseFloat(String(raw).replace(',', '.'));
          if (isNaN(num) || num < 0 || num > 100) return;

          nilaiMap[mk.kode_mk] = num;
          mkCount += 1;
          localNilaiRows.push({ nim, mkKode: mk.kode_mk, nilaiAkhir: num });
        });

        if (Object.keys(nilaiMap).length === 0) continue;

        importMahasiswa.push({ nim, nama, nilaiMap });

        let angkatan: string | number = 'Unknown';
        const match = nim.match(/(\d{2})$/);
        if (match) angkatan = `20${match[1]}`;

        localMhsRows.push({
          id: nim,
          npm: nim,
          nama,
          prodiKode: selectedProdiKode,
          angkatan,
          semesterAktif: selectedSemester,
          totalNilai: mkCount,
          nilaiDariImport: mkCount,
        });

        processedRows++;
      } catch (err) {
        console.error('Error process row:', err);
      }
    }

    if (importMahasiswa.length === 0) {
      setImportStatus('error');
      setImportMessage('Tidak ada baris dengan nilai mata kuliah valid.');
      return;
    }

    const payload: ImportNilaiRequest = {
      prodiKode: selectedProdiKode,
      semester: selectedSemester,
      tahunAjaran: DEFAULT_TAHUN_AJARAN,
      matkulList,
      importData: importMahasiswa,
    };

    try {
      const controller = new AbortController();
      const res = await importNilai(payload, controller.signal);

      console.log('Import response:', res);

      setMahasiswaWithNilai(localMhsRows);
      setLocalNilai(localNilaiRows);
      setImportStats({
        success: localNilaiRows.length,
        failed: 0,
        total: localNilaiRows.length,
      });
      setImportStatus('success');
      setImportMessage(
        `Import berhasil. ${localNilaiRows.length} nilai dikirim untuk ${processedRows} mahasiswa.`
      );
      // trigger refresh summary dari DB
      setRefreshKey((x) => x + 1);
    } catch (err: any) {
      console.error(err);
      setImportStatus('error');
      setImportMessage(`Gagal import ke server: ${err?.message ?? 'unknown error'}`);
    }
  };


  const toggleMKExpansion = async (mk: MK) => {
    const mkId = mk.id_mk;
    const isExpanded = expandedMKIds.includes(mkId);

    // kalau sudah expanded -> collapse saja
    if (isExpanded) {
      setExpandedMKIds((prev) => prev.filter((id) => id !== mkId));
      return;
    }

    // expand row
    setExpandedMKIds((prev) => [...prev, mkId]);

    // kalau CPMK sudah ada di cache, tidak perlu fetch ulang
    if (cpmkByMK[mkId]) return;

    try {
      setLoadingCPMKFor(mkId);
      setCpmkError(null);

      const res = await fetch(`${API_BASE}/mk/${mkId}/cpmk`);
      if (!res.ok) throw new Error(`Gagal load CPMK MK ${mk.kode_mk}: ${res.status}`);

      const data: CPMK[] = await res.json();
      setCpmkByMK((prev) => ({
        ...prev,
        [mkId]: Array.isArray(data) ? data : [],
      }));
    } catch (err: any) {
      console.error('Gagal load CPMK:', err);
      setCpmkError(err?.message || 'Gagal mengambil data CPMK');
    } finally {
      setLoadingCPMKFor(null);
    }
  };

  // ====================== MK STATISTICS (local, only last import) ======================

  const mkStatistics = useMemo(() => {
    if (!mkList.length || !localNilai.length) return [];

    return mkList.map((mk) => {
      const nilaiMK = localNilai.filter((n) => n.mkKode === mk.kode_mk);
      const arr = nilaiMK.map((n) => n.nilaiAkhir);
      const count = arr.length;
      const avg =
        count > 0 ? Math.round((arr.reduce((s, v) => s + v, 0) / count) * 10) / 10 : 0;
      const min = count > 0 ? Math.min(...arr) : 0;
      const max = count > 0 ? Math.max(...arr) : 0;

      return {
        kode: mk.kode_mk,
        nama: mk.nama_mk,
        sks: mk.sks,
        semester: mk.semester,
        jumlahMahasiswa: count,
        avgNilai: avg,
        minNilai: min,
        maxNilai: max,
        nilaiDariImport: count,
      };
    });
  }, [mkList, localNilai]);


  // ====================== RENDER ======================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Manajemen Data</h1>
        <p className="text-gray-600">Kelola data mahasiswa, mata kuliah, dan CPL</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'import'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Import Nilai
          </button>
          <button
            onClick={() => setActiveTab('mahasiswa')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'mahasiswa'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Mahasiswa
          </button>
          <button
            onClick={() => setActiveTab('matakuliah')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'matakuliah'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Mata Kuliah
          </button>
          <button
            onClick={() => setActiveTab('cpl')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'cpl'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            CPL & CPMK
          </button>
        </div>

        <div className="p-6">
          {/* ================= TAB IMPORT ================= */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              {/* Filter Section */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  Filter Target Import
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Program Studi
                    </label>
                    <select
                      value={selectedProdiKode}
                      onChange={(e) => setSelectedProdiKode(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      {prodiList.map((prodi) => (
                        <option key={prodi.id_prodi} value={prodi.kode_prodi}>
                          {prodi.nama_prodi}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Semester
                    </label>
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* MK Info */}
                <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-semibold text-gray-800">
                      Mata Kuliah di Semester {selectedSemester}:
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mkList.length === 0 && (
                      <span className="text-xs text-gray-500">
                        Tidak ada mata kuliah untuk kombinasi ini.
                      </span>
                    )}
                    {mkList.map((mk) => (
                      <span
                        key={mk.kode_mk}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {mk.kode_mk} - {mk.nama_mk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Upload Section */}
              <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8">
                <div className="text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <div className="mt-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        {selectedFile ? selectedFile.name : 'Upload file nilai'}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        Excel (.xlsx) atau CSV (.csv) - max 10MB
                      </span>
                      <input
                        id="file-upload"
                        type="file"
                        accept=".csv,.xlsx"
                        onChange={handleFileSelect}
                        className="sr-only"
                      />
                      <span className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Pilih File
                      </span>
                    </label>
                  </div>
                  <p className="mt-4 text-xs text-gray-500">
                    Format file harus memiliki kolom: <strong>NIM, Nama</strong>, dan kolom
                    untuk setiap <strong>kode/nama MK</strong>
                  </p>
                </div>

                {selectedFile && (
                  <div className="mt-6 flex justify-center space-x-3">
                    <button
                      onClick={handlePreviewFile}
                      disabled={importStatus === 'processing'}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {importStatus === 'processing' ? 'Memproses...' : 'Preview Data'}
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>

              {/* Status Message */}
              {importMessage && (
                <div
                  className={`p-4 rounded-lg ${
                    importStatus === 'error'
                      ? 'bg-red-50 border border-red-200 text-red-800'
                      : importStatus === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : 'bg-blue-50 border border-blue-200 text-blue-800'
                  }`}
                >
                  <div className="flex items-center">
                    {importStatus === 'error' && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                    {importStatus === 'success' && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                    <span className="text-sm font-medium whitespace-pre-line">
                      {importMessage}
                    </span>
                  </div>
                  {importStatus === 'success' && (
                    <div className="mt-2 text-sm">
                      <p>Total data diproses: {importStats.total}</p>
                      <p className="text-green-700">✓ Berhasil: {importStats.success}</p>
                      <p className="text-red-700">✗ Gagal: {importStats.failed}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Preview Table */}
              {importData.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Preview Data ({importData.length} mahasiswa)
                    </h3>
                    <button
                      onClick={handleImportData}
                      disabled={importStatus === 'processing' || importStatus === 'success'}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {importStatus === 'processing'
                        ? 'Mengimpor...'
                        : importStatus === 'success'
                        ? 'Import Selesai'
                        : 'Import ke Sistem'}
                    </button>
                  </div>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            No
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            NIM
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Nama
                          </th>
                          {Object.keys(importData[0])
                            .filter((key) => key !== 'nim' && key !== 'nama')
                            .map((key) => (
                              <th
                                key={key}
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                              >
                                {key}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {importData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{idx + 1}</td>
                            <td className="px-4 py-3 text-sm font-medium">{row.nim}</td>
                            <td className="px-4 py-3 text-sm">{row.nama}</td>
                            {Object.keys(row)
                              .filter((key) => key !== 'nim' && key !== 'nama')
                              .map((key) => (
                                <td key={key} className="px-4 py-3 text-sm text-center">
                                  {row[key] && !isNaN(parseFloat(row[key])) ? (
                                    <span
                                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                        parseFloat(row[key]) >= 75
                                          ? 'bg-green-100 text-green-800'
                                          : parseFloat(row[key]) >= 60
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {row[key]}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Petunjuk Import Nilai
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  <li>Pilih Program Studi dan Semester target</li>
                  <li>
                    Siapkan file CSV/TXT dengan format:
                    <ul className="list-disc list-inside ml-6 mt-1 text-xs">
                      <li>
                        Kolom pertama: <strong>NIM</strong> (nomor induk mahasiswa)
                      </li>
                      <li>
                        Kolom kedua: <strong>Nama</strong> (nama mahasiswa)
                      </li>
                      <li>
                        Kolom selanjutnya: <strong>Kode atau Nama MK</strong> dengan nilai
                        (0-100)
                      </li>
                    </ul>
                  </li>
                  <li>Upload file dan klik &quot;Preview Data&quot; untuk melihat data</li>
                  <li>Jika data sudah sesuai, klik &quot;Import ke Sistem&quot;</li>
                  <li>
                    Sistem backend akan menyimpan nilai; halaman ini menampilkan rekap import
                    terakhir.
                  </li>
                </ol>
              </div>
            </div>
          )}

         {/* ================= TAB MAHASISWA ================= */}
{activeTab === 'mahasiswa' && (
  <div>
    <div className="flex justify-between items-center mb-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">
          Data Mahasiswa yang Sudah Dinilai
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Menampilkan mahasiswa yang memiliki nilai pada Prodi{' '}
          <span className="font-medium">
            {selectedProdi ? selectedProdi.nama_prodi : '-'}
          </span>
          . Data ini langsung dibaca dari database (bukan mock / state lokal).
        </p>
      </div>
      <div className="flex items-center space-x-3">
        <select
          value={selectedProdiKode}
          onChange={(e) => setSelectedProdiKode(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm"
        >
          {prodiList.map((prodi) => (
            <option key={prodi.id_prodi} value={prodi.kode_prodi}>
              {prodi.nama_prodi}
            </option>
          ))}
        </select>
        <button
          onClick={() => setRefreshKey((prev) => prev + 1)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>
    </div>

    {mahasiswaSummary && mahasiswaSummary.length > 0 ? (
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                No
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                NIM
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Nama
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Prodi
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Angkatan
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Semester
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Total Nilai
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Dari Import
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mahasiswaSummary.map((mhs, idx) => (
              <tr key={mhs.id_mhs} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600">{idx + 1}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {mhs.nim}
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">{mhs.nama}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {selectedProdi?.nama_prodi ?? '-'}
                </td>
                <td className="px-4 py-3 text-sm text-center text-gray-600">
                  {mhs.angkatan}
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Sem {mhs.semester_max}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900">
                  {mhs.total_nilai}
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {mhs.dari_import}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      mhs.dari_import > 0
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {mhs.dari_import > 0 ? 'Ada data import' : 'Nilai lama / manual'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Belum Ada Data Mahasiswa
        </h3>
        <p className="text-gray-600 mb-4">
          Belum ada mahasiswa yang memiliki nilai untuk prodi ini, atau data belum
          terimport. Coba lakukan import atau klik Refresh setelah import.
        </p>
        <button
          onClick={() => setActiveTab('import')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Pergi ke Import Nilai
        </button>
      </div>
    )}
  </div>
)}


          {/* ================= TAB MATA KULIAH ================= */}
          {activeTab === 'matakuliah' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Statistik Mata Kuliah
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Nilai rata-rata dan statistik per mata kuliah dari hasil import terakhir
                    (bukan dari mock/localStorage).
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={selectedProdiKode}
                    onChange={(e) => setSelectedProdiKode(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  >
                    {prodiList.map((prodi) => (
                      <option key={prodi.id_prodi} value={prodi.kode_prodi}>
                        {prodi.nama_prodi}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setRefreshKey((prev) => prev + 1)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>

              {mkStatistics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mkStatistics.map((mk) => (
                    <div
                      key={mk.kode}
                      className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {mk.kode}
                          </span>
                          <h4 className="font-semibold text-gray-800 mt-2 text-sm leading-tight">
                            {mk.nama}
                          </h4>
                        </div>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded font-medium">
                          {mk.sks} SKS
                        </span>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600">Dosen:</span>
                          <span className="font-medium text-gray-800">{mk.dosen}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600">Semester:</span>
                          <span className="font-medium text-gray-800">{mk.semester}</span>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Mahasiswa:</span>
                          <span className="text-sm font-bold text-gray-900">
                            {mk.jumlahMahasiswa} orang
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Rata-rata:</span>
                          <span
                            className={`text-lg font-bold ${
                              mk.avgNilai >= 75
                                ? 'text-green-600'
                                : mk.avgNilai >= 60
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {mk.avgNilai > 0 ? mk.avgNilai : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600">Min - Max:</span>
                          <span className="font-medium text-gray-800">
                            {mk.minNilai > 0 ? `${mk.minNilai} - ${mk.maxNilai}` : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Data Import:</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {mk.nilaiDariImport} nilai
                          </span>
                        </div>
                      </div>

                      {mk.jumlahMahasiswa > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                mk.avgNilai >= 75
                                  ? 'bg-green-500'
                                  : mk.avgNilai >= 60
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${(mk.avgNilai / 100) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Belum Ada Data Nilai
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Import file nilai terlebih dahulu untuk melihat statistik mata kuliah
                  </p>
                  <button
                    onClick={() => setActiveTab('import')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Pergi ke Import Nilai
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cpl' && (
  <div className="space-y-8">
    
    {/* ================= KPI SUMMARY ================= */}
    <div className="grid grid-cols-3 gap-4">
      {/* Tercapai */}
      <div className="p-4 rounded-xl bg-green-50 border border-green-200">
        <p className="text-sm text-green-700 font-semibold">Tercapai (70–100)</p>
        <p className="text-3xl font-bold text-green-800 mt-1">
          {cplStats.filter(c => c.rata_nilai >= 70).length}
        </p>
      </div>

      {/* Cukup */}
      <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
        <p className="text-sm text-yellow-700 font-semibold">Cukup (50–69)</p>
        <p className="text-3xl font-bold text-yellow-700 mt-1">
          {cplStats.filter(c => c.rata_nilai >= 50 && c.rata_nilai < 70).length}
        </p>
      </div>

      {/* Belum Tercapai */}
      <div className="p-4 rounded-xl bg-red-50 border border-red-200">
        <p className="text-sm text-red-700 font-semibold">Belum Tercapai (&lt; 50)</p>
        <p className="text-3xl font-bold text-red-700 mt-1">
          {cplStats.filter(c => c.rata_nilai < 50).length}
        </p>
      </div>
    </div>

    {/* ================= TABLE CPL ================= */}
    <div className="bg-white border rounded-xl p-4">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Kode CPL</th>
            <th className="px-3 py-2 text-left font-medium">Deskripsi</th>
            <th className="px-3 py-2 text-center font-medium">Mahasiswa</th>
            <th className="px-3 py-2 text-center font-medium">Rata-rata</th>
            <th className="px-3 py-2 text-center font-medium">Min – Max</th>
            <th className="px-3 py-2 text-center font-medium">Distribusi</th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {cplStats.map((cpl) => (
            <tr key={cpl.id_cpl} className="hover:bg-gray-50">
              
              <td className="px-3 py-3 font-semibold">{cpl.kode_cpl}</td>

              <td className="px-3 py-3">{cpl.deskripsi}</td>

              <td className="px-3 py-3 text-center">
                <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                  {cpl.jumlah_mahasiswa} mhs
                </span>
              </td>

              {/* RATANILAI */}
              <td className="px-3 py-3 text-center font-bold"
                style={{
                  color:
                    cpl.rata_nilai >= 70
                      ? "#15803d"         // hijau
                      : cpl.rata_nilai >= 50
                      ? "#ca8a04"         // kuning
                      : "#dc2626"         // merah
                }}
              >
                {cpl.rata_nilai.toFixed(1)}
              </td>

              {/* MIN - MAX */}
              <td className="px-3 py-3 text-center text-gray-700">
                {cpl.min_nilai.toFixed(1)} – {cpl.max_nilai.toFixed(1)}
              </td>

              {/* DISTRIBUSI */}
              <td className="px-3 py-3 text-center space-x-2">
                <span className="px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-semibold">
                  +{cpl.kategori_tinggi}
                </span>
                <span className="px-2 py-1 rounded-md bg-yellow-50 text-yellow-700 text-xs font-semibold">
                  ~{cpl.kategori_sedang}
                </span>
                <span className="px-2 py-1 rounded-md bg-red-50 text-red-700 text-xs font-semibold">
                  ×{cpl.kategori_rendah}
                </span>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* ================= CPMK LIST ================= */}
    <div className="bg-white border rounded-xl p-4">
      <h4 className="text-sm font-semibold mb-3">
        Struktur CPMK per Mata Kuliah (Semester {selectedSemester})
      </h4>

      {mkList.map((mk) => (
        <div key={mk.id_mk} className="border-b last:border-0 py-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-semibold">{mk.kode_mk}</div>
              <div className="text-gray-600 text-sm">{mk.nama_mk}</div>
            </div>

            <button
              className="text-sm px-3 py-1 rounded-md border hover:bg-gray-50"
              onClick={() => toggleMKExpansion(mk)}
            >
              {expandedMKIds.includes(mk.id_mk) ? "Tutup CPMK" : "Lihat CPMK"}
            </button>
          </div>

          {expandedMKIds.includes(mk.id_mk) && (
            <div className="mt-3 ml-3 pl-3 border-l">
              {(cpmkByMK[mk.id_mk] || []).map((cp) => (
                <div key={cp.id_cpmk} className="py-2">
                  <div className="font-semibold">{cp.kode_cpmk}</div>
                  <div className="text-gray-700 text-sm">{cp.deskripsi}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Bobot: {cp.bobot_cpmk ?? "-"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>

  </div>
)}


        </div>
      </div>
    </div>
  );
}



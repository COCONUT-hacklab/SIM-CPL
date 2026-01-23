'use client';

import { useEffect, useMemo, useState, ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import {
  Prodi,
  MK,
  ImportMatkulItem,
  ImportMahasiswaItem,
  fetchProdiList,
  fetchMKByProdiSemester,
  importNilai,
} from '@/lib/simcplApi';

// ===================== TYPES =====================
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
  id_cpl: number; // CPL ID tetap number (uint64 di backend)
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

type CPMK = {
  id_cpmk: number; // CPMK ID biasanya tetap number (auto increment)
  id_mk: string;   // [FIX] Ubah ke string agar cocok dengan UUID MK
  kode_cpmk: string;
  deskripsi: string;
  bobot_cpmk: number | null;
};

// ===================== API CONFIG =====================
const API_BASE =   process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8001/api';
const DEFAULT_TAHUN_AJARAN = '2024/2025';

export default function ManajemenDataPage() {
  const [activeTab, setActiveTab] = useState<'import' | 'mahasiswa' | 'matakuliah' | 'cpl'>('import');

  // Filter State
  const [prodiList, setProdiList] = useState<Prodi[]>([]);
  const [selectedProdiKode, setSelectedProdiKode] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<number>(1);

  const selectedProdi = useMemo(
    () => prodiList.find((p) => p.kode_prodi === selectedProdiKode) ?? null,
    [prodiList, selectedProdiKode]
  );

  // Data Global (Database)
  const [mkList, setMkList] = useState<MK[]>([]);
  const [cplStats, setCplStats] = useState<CPLStat[]>([]);
  const [isLoadingCPL, setIsLoadingCPL] = useState(false);
  
  // [FIX] Record key ubah ke string untuk mengakomodasi UUID MK
  const [cpmkByMK, setCpmkByMK] = useState<Record<string, CPMK[]>>({});

  // Data Lokal (Hanya Hasil Import Terakhir)
  const [mahasiswaWithNilai, setMahasiswaWithNilai] = useState<MahasiswaRow[]>([]);
  const [localNilai, setLocalNilai] = useState<LocalNilai[]>([]);

  // State File & Status UI
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  
  // [FIX] State untuk menyimpan ID MK yang sedang dibuka (string array)
  const [expandedMKIds, setExpandedMKIds] = useState<string[]>([]);
  // [FIX] Loading state juga menggunakan string atau null
  const [loadingCPMKFor, setLoadingCPMKFor] = useState<string | null>(null);

  // ===================== EFFECT: LOAD MASTER DATA =====================
  
  // 1. Load Prodi saat halaman dibuka
  useEffect(() => {
    fetchProdiList()
      .then((data) => {
        setProdiList(data);
        if (data.length > 0) setSelectedProdiKode(data[0].kode_prodi);
      })
      .catch((err) => console.error('Gagal load prodi:', err));
  }, []);

  // 2. Load MK setiap kali Prodi/Semester berubah
  useEffect(() => {
    if (!selectedProdi) {
      setMkList([]);
      return;
    }
    // Mengambil daftar MK resmi dari database
    fetchMKByProdiSemester(selectedProdi.id_prodi, selectedSemester)
      .then(setMkList)
      .catch(() => setMkList([]));
    
    // Reset data CPL saat filter berubah
    setCplStats([]);
  }, [selectedProdi, selectedSemester]);

  // 3. Load CPL Stats (Database) hanya saat tab CPL aktif
  useEffect(() => {
    if (activeTab !== 'cpl' || !selectedProdi) return;

    async function fetchCPL() {
      setIsLoadingCPL(true);
      try {
        const res = await fetch(`${API_BASE}/prodi/${selectedProdi?.id_prodi}/cpl-stats?semester=${selectedSemester}`);
        const data = await res.json();
        setCplStats(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error load CPL:', err);
      } finally {
        setIsLoadingCPL(false);
      }
    }
    fetchCPL();
  }, [activeTab, selectedProdi, selectedSemester]);

  // ===================== LOGIKA IMPORT FILE =====================

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportStatus('idle');
      setImportMessage('');
      setImportData([]);
    }
  };

  const handlePreviewFile = async () => {
    if (!selectedFile) return;
    setImportStatus('processing');
    try {
      const buf = await selectedFile.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet) as any[];
      
      if (json.length === 0) throw new Error("File kosong atau format tidak dikenali.");
      
      setImportData(json);
      setImportStatus('idle');
      setImportMessage(`Berhasil membaca ${json.length} baris data.`);
    } catch (err: any) {
      setImportStatus('error');
      setImportMessage(err.message || "Gagal membaca file.");
    }
  };

  // ===================== LOGIKA KIRIM DATA KE BACKEND =====================

  const handleImportData = async () => {
    if (!selectedProdi || importData.length === 0) return;

    setImportStatus('processing');
    setImportMessage('Sedang mengirim data ke server...');

    const matkulPayload: ImportMatkulItem[] = mkList.map(mk => ({
      kode: mk.kode_mk,
      nama: mk.nama_mk,
      sks: mk.sks,
    }));

    const importMahasiswa: ImportMahasiswaItem[] = [];
    const localMhsRows: MahasiswaRow[] = [];
    const localGrades: LocalNilai[] = [];

    importData.forEach((row, idx) => {
      // Case insensitive key matching
      const keys = Object.keys(row);
      const getKey = (target: string) => keys.find(k => k.toLowerCase() === target.toLowerCase());
      
      const nim = String(row[getKey('nim') || ''] || '').trim();
      const nama = String(row[getKey('nama') || ''] || '').trim();

      if (!nim) return;

      const nilaiMap: Record<string, number> = {};
      let countMK = 0;

      mkList.forEach(mk => {
        const colKey = getKey(mk.kode_mk);
        if (colKey) {
          const rawVal = String(row[colKey]).replace(',', '.');
          const val = parseFloat(rawVal);
          
          if (!isNaN(val)) {
            nilaiMap[mk.kode_mk] = val;
            localGrades.push({ nim, mkKode: mk.kode_mk, nilaiAkhir: val });
            countMK++;
          }
        }
      });

      if (countMK > 0) {
        importMahasiswa.push({ nim, nama, nilaiMap });
        
        localMhsRows.push({
          id: nim,
          npm: nim,
          nama: nama || `Mahasiswa ${nim}`,
          prodiKode: selectedProdiKode,
          angkatan: nim.length > 2 ? `20${nim.slice(-2)}` : 'Unknown', // Logic Angkatan dari NIM
          semesterAktif: selectedSemester,
          totalNilai: countMK,
          nilaiDariImport: countMK
        });
      }
    });

    try {
      await importNilai({
        prodiKode: selectedProdiKode,
        semester: selectedSemester,
        tahunAjaran: DEFAULT_TAHUN_AJARAN,
        matkulList: matkulPayload,
        importData: importMahasiswa,
      });

      setMahasiswaWithNilai(localMhsRows);
      setLocalNilai(localGrades);
      setImportStatus('success');
      setImportMessage(`Sukses! ${localMhsRows.length} mahasiswa & ${localGrades.length} nilai berhasil disimpan.`);
      
    } catch (err: any) {
      setImportStatus('error');
      setImportMessage(`Gagal Import: ${err.message || 'Server error'}`);
    }
  };

  // ===================== LOGIKA CPMK ACCORDION =====================
  
  // [FIX] Terima parameter string (UUID)
  const toggleCPMK = async (idMK: string) => {
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
        setCpmkByMK(prev => ({ ...prev, [idMK]: Array.isArray(data) ? data : [] }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCPMKFor(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faff] p-8 text-gray-800">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-blue-900">Manajemen Data & Import</h1>
        <p className="text-gray-500 mt-2">Kelola input nilai masal dan validasi kurikulum semester {selectedSemester}.</p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex bg-white rounded-t-2xl border-b border-gray-200 shadow-sm overflow-hidden">
        {['import', 'mahasiswa', 'matakuliah', 'cpl'].map(t => (
          <button 
            key={t} 
            onClick={() => setActiveTab(t as any)} 
            className={`px-8 py-5 font-bold text-sm tracking-wide capitalize transition-all duration-200 
              ${activeTab === t ? 'bg-blue-600 text-white shadow-inner' : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'}`}
          >
            {t === 'cpl' ? 'CPL & CPMK' : t}
          </button>
        ))}
      </div>

      <div className="bg-white p-8 rounded-b-2xl shadow-lg border border-t-0 border-gray-100 min-h-[600px]">
        
        {/* ======================= TAB 1: IMPORT ======================= */}
        {activeTab === 'import' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Filter Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
              <div>
                <label className="block text-xs font-bold text-blue-800 uppercase mb-2">Program Studi</label>
                <select 
                  value={selectedProdiKode} 
                  onChange={e => setSelectedProdiKode(e.target.value)} 
                  className="w-full p-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-shadow"
                >
                  {prodiList.map(p => <option key={p.id_prodi} value={p.kode_prodi}>{p.nama_prodi}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-800 uppercase mb-2">Semester Target</label>
                <select 
                  value={selectedSemester} 
                  onChange={e => setSelectedSemester(Number(e.target.value))} 
                  className="w-full p-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-shadow"
                >
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>

            {/* List MK Semester (Fitur Baru) */}
            <div className="bg-white border-2 border-blue-50 p-6 rounded-2xl shadow-sm">
              <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                <span>📚</span> Mata Kuliah Terdaftar di Semester {selectedSemester}
              </h4>
              <div className="flex flex-wrap gap-2">
                {mkList.length > 0 ? mkList.map(mk => (
                  <div key={mk.id_mk} className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 font-semibold flex items-center gap-2">
                    <span className="uppercase">{mk.kode_mk}</span>
                    <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
                    <span className="opacity-75">{mk.nama_mk}</span>
                  </div>
                )) : <p className="text-sm text-gray-400 italic">Tidak ada mata kuliah ditemukan.</p>}
              </div>
            </div>

            {/* Petunjuk Import (Fitur Baru) */}
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
              <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">ℹ️ Petunjuk Import Nilai</h4>
              <ul className="text-sm text-blue-700 space-y-2 list-disc pl-5">
                <li>Gunakan file format <strong>.xlsx</strong> (Excel) atau <strong>.csv</strong>.</li>
                <li>File wajib memiliki kolom header <strong>NIM</strong> dan <strong>Nama</strong>.</li>
                <li>Gunakan <strong>Kode Mata Kuliah</strong> (contoh di atas) sebagai header kolom untuk nilai.</li>
                <li>Pastikan nilai angka berada dalam rentang <strong>0 - 100</strong>.</li>
                <li>Sistem otomatis mendeteksi kolom yang sesuai dengan Kode MK yang ada.</li>
              </ul>
            </div>

            {/* Upload Box */}
            <div className="border-4 border-dashed border-gray-200 bg-gray-50/30 p-12 rounded-3xl text-center transition-colors hover:border-blue-300 hover:bg-blue-50/10">
              <input type="file" id="fileImport" onChange={handleFileSelect} className="hidden" accept=".xlsx, .csv" />
              <label htmlFor="fileImport" className="cursor-pointer flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm">📂</div>
                <p className="font-bold text-lg text-gray-700">{selectedFile ? selectedFile.name : "Klik untuk pilih file Excel / CSV"}</p>
                <p className="text-xs text-gray-400 mt-2">Mendukung format .xlsx dan .csv</p>
              </label>
              
              {selectedFile && (
                <div className="mt-8 flex justify-center gap-4">
                  <button onClick={handlePreviewFile} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-md transition-all">Buka Preview</button>
                  <button onClick={() => {setSelectedFile(null); setImportData([]);}} className="bg-gray-400 hover:bg-gray-500 text-white px-8 py-2.5 rounded-xl font-bold shadow-md transition-all">Reset</button>
                </div>
              )}
            </div>

            {/* Status Message */}
            {importStatus !== 'idle' && (
              <div className={`p-5 rounded-xl border-l-4 shadow-sm ${importStatus === 'success' ? 'bg-green-50 border-green-500 text-green-800' : importStatus === 'error' ? 'bg-red-50 border-red-500 text-red-800' : 'bg-blue-50 border-blue-500 text-blue-800'}`}>
                <p className="font-bold flex items-center">
                  {importStatus === 'processing' && <span className="animate-spin mr-2">⏳</span>}
                  {importStatus === 'success' && <span className="mr-2">✅</span>}
                  {importStatus === 'error' && <span className="mr-2">⚠️</span>}
                  {importMessage}
                </p>
              </div>
            )}

            {/* Table Preview */}
            {importData.length > 0 && (
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-bold text-gray-700">Preview Data ({importData.length} Baris)</h3>
                  <button onClick={handleImportData} disabled={importStatus === 'processing'} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg font-bold shadow-md flex items-center gap-2">
                    🚀 Proses Import
                  </button>
                </div>
                <div className="max-h-[400px] overflow-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-white sticky top-0 shadow-sm z-10">
                      <tr>{Object.keys(importData[0]).map(k => <th key={k} className="p-3 border-b font-bold text-gray-500 uppercase bg-gray-50">{k}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y">
                      {importData.slice(0, 100).map((r, i) => (
                        <tr key={i} className="hover:bg-blue-50/50">
                          {Object.values(r).map((v: any, j) => <td key={j} className="p-3 text-gray-600">{v}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 2: MAHASISWA ======================= */}
        {activeTab === 'mahasiswa' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="text-xl font-bold text-blue-900">Hasil Import Terakhir</h3>
                <p className="text-sm text-gray-500">Data mahasiswa yang berhasil diproses pada sesi ini.</p>
              </div>
              <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-bold border border-emerald-200">
                {mahasiswaWithNilai.length} Data
              </span>
            </div>

            {mahasiswaWithNilai.length > 0 ? (
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs">
                    <tr>
                      <th className="p-4 text-center w-16">No.</th>
                      <th className="p-4 text-left">NIM</th>
                      <th className="p-4 text-left">Nama</th>
                      <th className="p-4 text-center">Angkatan</th>
                      <th className="p-4 text-center">Semester</th>
                      <th className="p-4 text-center">Jml Mata Kuliah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mahasiswaWithNilai.map((m, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                        <td className="p-4 text-center text-gray-400 font-bold">{idx + 1}</td>
                        <td className="p-4 font-mono font-bold text-blue-600">{m.npm}</td>
                        <td className="p-4 font-medium uppercase text-gray-700">{m.nama}</td>
                        <td className="p-4 text-center">
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded font-bold">{m.angkatan}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold">Sem {m.semesterAktif}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-md text-xs font-bold">{m.totalNilai} MK</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                <div className="text-4xl mb-2 opacity-30">📭</div>
                <p className="text-gray-400 font-medium">Belum ada data impor di sesi ini.</p>
                <button onClick={() => setActiveTab('import')} className="mt-4 text-blue-600 font-bold hover:underline">Mulai Import Data &rarr;</button>
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 3: MATA KULIAH ======================= */}
        {activeTab === 'matakuliah' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {mkList.map(mk => {
              const stats = localNilai.filter(n => n.mkKode === mk.kode_mk);
              const hasData = stats.length > 0;
              const avg = hasData ? (stats.reduce((a, b) => a + b.nilaiAkhir, 0) / stats.length).toFixed(1) : "0";
              
              return (
                <div key={mk.id_mk} className={`relative p-6 rounded-2xl border-2 transition-all duration-200 hover:shadow-md ${hasData ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100 bg-white opacity-70 grayscale'}`}>
                  {hasData && <div className="absolute top-4 right-4 w-3 h-3 bg-emerald-500 rounded-full shadow-sm animate-pulse"></div>}
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-white border border-gray-200 px-3 py-1 rounded-lg text-xs font-bold text-gray-600 shadow-sm">{mk.kode_mk}</span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">{mk.sks} SKS</span>
                  </div>
                  
                  <h4 className="font-bold text-gray-800 text-lg mb-6 leading-tight min-h-[3.5rem]">{mk.nama_mk}</h4>
                  
                  <div className="border-t border-gray-200/50 pt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Rata-rata</p>
                      <p className={`text-2xl font-black ${hasData ? 'text-emerald-600' : 'text-gray-300'}`}>{hasData ? avg : "-"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Jml Mahasiswa</p>
                      <p className={`text-xl font-bold ${hasData ? 'text-gray-700' : 'text-gray-300'}`}>{stats.length}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {mkList.length === 0 && <div className="col-span-full text-center py-20 text-gray-400">Tidak ada mata kuliah terdaftar untuk semester ini.</div>}
          </div>
        )}

        {/* ======================= TAB 4: CPL & CPMK ======================= */}
        {activeTab === 'cpl' && (
          <div className="space-y-12 animate-in fade-in duration-300">
            {/* KPI Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Tercapai (≥70)', count: cplStats.filter(c => c.rata_nilai >= 70).length, color: 'emerald' },
                { label: 'Cukup (50-70)', count: cplStats.filter(c => c.rata_nilai >= 50 && c.rata_nilai < 70).length, color: 'amber' },
                { label: 'Kurang (<50)', count: cplStats.filter(c => c.rata_nilai < 50).length, color: 'rose' }
              ].map((stat, i) => (
                <div key={i} className={`bg-${stat.color}-50 p-6 rounded-2xl border border-${stat.color}-100 text-center shadow-sm`}>
                  <p className={`text-xs font-black text-${stat.color}-600 uppercase tracking-widest mb-2`}>{stat.label}</p>
                  <h4 className={`text-5xl font-black text-${stat.color}-700`}>{stat.count}</h4>
                  <p className={`text-xs font-medium text-${stat.color}-800 mt-2 opacity-60`}>Capaian Pembelajaran</p>
                </div>
              ))}
            </div>

            {/* CPL Database Table */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-bold text-gray-700">Statistik CPL (Database)</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-white border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-left font-extrabold text-gray-600 uppercase text-xs">Kode</th>
                    <th className="p-4 text-left font-extrabold text-gray-600 uppercase text-xs w-1/2">Deskripsi Kurikulum</th>
                    <th className="p-4 text-center font-extrabold text-gray-600 uppercase text-xs">Nilai Rata-rata</th>
                    <th className="p-4 text-center font-extrabold text-gray-600 uppercase text-xs">Jml Mhs Terdata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoadingCPL ? 
                    <tr><td colSpan={4} className="p-10 text-center text-gray-400 italic">Sedang memuat data dari database...</td></tr> :
                   cplStats.map(c => (
                    <tr key={c.id_cpl} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-black text-blue-700">{c.kode_cpl}</td>
                      <td className="p-4 text-gray-600 text-xs leading-relaxed">{c.deskripsi}</td>
                      <td className="p-4 text-center">
                        <span className={`text-lg font-bold ${c.rata_nilai >= 70 ? 'text-emerald-600' : c.rata_nilai >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {c.rata_nilai.toFixed(1)}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{c.jumlah_mahasiswa} Mhs</span>
                      </td>
                    </tr>
                  ))}
                  {!isLoadingCPL && cplStats.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">Belum ada data CPL yang terhitung untuk semester ini.</td></tr>}
                </tbody>
              </table>
            </div>

            {/* CPMK Accordion */}
            <div className="space-y-4">
              <h3 className="font-bold text-blue-900 border-l-4 border-blue-600 pl-3 text-lg">Detail Struktur Mata Kuliah & CPMK</h3>
              {mkList.map(mk => (
                <div key={mk.id_mk} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all bg-white">
                  <button 
                    onClick={() => toggleCPMK(mk.id_mk)} 
                    className="w-full flex justify-between items-center p-5 bg-white hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded border border-blue-200">{mk.kode_mk}</span>
                      <span className="font-bold text-gray-800 text-sm">{mk.nama_mk}</span>
                    </div>
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-transform duration-200 ${expandedMKIds.includes(mk.id_mk) ? 'rotate-180 bg-blue-100 text-blue-600' : ''}`}>
                      ▼
                    </span>
                  </button>
                  
                  {expandedMKIds.includes(mk.id_mk) && (
                    <div className="p-6 bg-gray-50/50 space-y-3 border-t border-gray-100 animate-in slide-in-from-top-1">
                      {loadingCPMKFor === mk.id_mk ? <p className="text-xs text-gray-400 italic py-2">Mengambil data CPMK...</p> :
                       (cpmkByMK[mk.id_mk] || []).length > 0 ? (cpmkByMK[mk.id_mk] || []).map(cp => (
                        <div key={cp.id_cpmk} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm flex gap-4 items-start">
                          <div className="mt-1 min-w-[60px] text-center">
                            <span className="block text-xs font-black text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded">{cp.kode_cpmk}</span>
                            <span className="block text-[10px] text-gray-400 mt-1 font-mono">{(cp.bobot_cpmk ?? 0) * 100}%</span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{cp.deskripsi}</p>
                        </div>
                      )) : 
                        <div className="flex items-center gap-2 text-gray-400 text-xs italic p-2">
                          <span></span> Belum ada CPMK yang didefinisikan.
                        </div>
                      }
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
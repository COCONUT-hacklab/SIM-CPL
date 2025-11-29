'use client';

import { useState, useEffect } from 'react';
import { prodiData, mahasiswaData, mataKuliahData, cplData } from '@/data/mockData';
import { saveNilai, getAllNilai, batchSaveNilai, batchSaveMahasiswa, type NilaiMahasiswaStorage, type MahasiswaImportStorage, getAllImportedMahasiswa } from '@/utils/nilaiStorage';
import { getCombinedNilaiData, hitungNilaiCPLPerSemesterIntegrated, getIntegratedMahasiswaList } from '@/utils/dataIntegration';
import * as XLSX from 'xlsx';

export default function ManajemenPage() {
  const [activeTab, setActiveTab] = useState('import');
  const [selectedProdi, setSelectedProdi] = useState('INF');
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [importStats, setImportStats] = useState({ success: 0, failed: 0, total: 0 });
  const [refreshKey, setRefreshKey] = useState(0); // Key untuk force refresh (konsisten dengan Dashboard & Laporan)

  // Listen to nilai updates and storage changes
  useEffect(() => {
    const handleNilaiUpdate = (event: any) => {
      console.log('📋 Manajemen: Data nilai diupdate', event.detail);
      setRefreshKey(prev => prev + 1);
    };

    const handleStorageChange = () => {
      console.log('💾 Manajemen: LocalStorage berubah');
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('nilaiUpdated', handleNilaiUpdate);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('nilaiUpdated', handleNilaiUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Get mahasiswa yang sudah punya nilai (dari localStorage + mockData)
  const getMahasiswaWithNilai = () => {
    const allNilai = getCombinedNilaiData();
    const uniqueMahasiswaIds = [...new Set(allNilai.map(n => n.mahasiswaId))];
    const integratedMahasiswa = getIntegratedMahasiswaList(selectedProdi);
    const importedMahasiswa = getAllImportedMahasiswa();
    
    return uniqueMahasiswaIds.map(id => {
      // Try to find from integrated list first, then imported, then mockData
      const mhs = integratedMahasiswa.find(m => m.id === id) || 
                  importedMahasiswa.find(m => m.mahasiswaId === id) ||
                  mahasiswaData.find(m => m.id === id);
      
      const nilaiCount = allNilai.filter(n => n.mahasiswaId === id).length;
      const localStorageCount = allNilai.filter(n => n.mahasiswaId === id && n.source === 'localStorage').length;
      
      // Extract info from ID if mahasiswa not found
      let npm = id.replace('MHS-', '').replace(`${selectedProdi}-`, '');
      let nama = 'Mahasiswa Import';
      let angkatan = 'Unknown';
      
      if (mhs) {
        npm = 'npm' in mhs ? mhs.npm : npm;
        nama = mhs.nama;
        angkatan = ('angkatan' in mhs && mhs.angkatan) ? mhs.angkatan : angkatan;
      } else {
        // Extract angkatan from NIM
        const angkatanMatch = npm.match(/10(\d{2})/);
        if (angkatanMatch) {
          angkatan = '20' + angkatanMatch[1];
        }
      }
      
      return {
        id,
        npm,
        nama,
        prodiKode: mhs ? ('prodiKode' in mhs ? mhs.prodiKode : selectedProdi) : selectedProdi,
        angkatan,
        semesterAktif: 'semesterAktif' in (mhs || {}) ? (mhs as any).semesterAktif : selectedSemester,
        totalNilai: nilaiCount,
        nilaiDariImport: localStorageCount,
        lastUpdate: allNilai.find(n => n.mahasiswaId === id && n.timestamp)?.timestamp
      };
    }).filter(m => m.prodiKode === selectedProdi);
  };

  // Get statistik nilai per MK
  const getMKStatistics = () => {
    const allNilai = getCombinedNilaiData();
    const mkList = mataKuliahData.filter(mk => mk.prodiKode === selectedProdi && mk.semester === selectedSemester);
    
    return mkList.map(mk => {
      const nilaiMK = allNilai.filter(n => n.mkKode === mk.kode);
      const nilaiArray = nilaiMK.map(n => n.nilaiAkhir);
      const avgNilai = nilaiArray.length > 0 
        ? Math.round((nilaiArray.reduce((sum, val) => sum + val, 0) / nilaiArray.length) * 10) / 10 
        : 0;
      const minNilai = nilaiArray.length > 0 ? Math.min(...nilaiArray) : 0;
      const maxNilai = nilaiArray.length > 0 ? Math.max(...nilaiArray) : 0;
      
      return {
        ...mk,
        jumlahMahasiswa: nilaiMK.length,
        avgNilai,
        minNilai,
        maxNilai,
        nilaiDariImport: nilaiMK.filter(n => n.source === 'localStorage').length
      };
    });
  };

  // Get statistik CPL
  const getCPLStatistics = () => {
    const mahasiswaList = getMahasiswaWithNilai();
    const cplList = cplData.filter(c => c.prodiKode === selectedProdi);
    
    return cplList.map(cpl => {
      const nilaiCPL: number[] = [];
      
      mahasiswaList.forEach(mhs => {
        const cplScores = hitungNilaiCPLPerSemesterIntegrated(mhs.id, selectedSemester, selectedProdi);
        const cplScore = cplScores.find(c => c.cplKode === cpl.kode);
        if (cplScore) {
          nilaiCPL.push(cplScore.nilai);
        }
      });
      
      const avgNilai = nilaiCPL.length > 0
        ? Math.round((nilaiCPL.reduce((sum, val) => sum + val, 0) / nilaiCPL.length) * 10) / 10
        : 0;
      
      return {
        ...cpl,
        jumlahMahasiswa: nilaiCPL.length,
        avgNilai,
        minNilai: nilaiCPL.length > 0 ? Math.min(...nilaiCPL) : 0,
        maxNilai: nilaiCPL.length > 0 ? Math.max(...nilaiCPL) : 0,
        tercapai: nilaiCPL.filter(n => n >= 75).length,
        cukup: nilaiCPL.filter(n => n >= 60 && n < 75).length,
        belumTercapai: nilaiCPL.filter(n => n < 60).length
      };
    });
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'application/vnd.ms-excel'];
      const validExtensions = ['.xlsx', '.csv'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        setImportStatus('error');
        setImportMessage('Format file tidak didukung. Hanya file .xlsx dan .csv yang diperbolehkan.');
        return;
      }

      setSelectedFile(file);
      setImportData([]);
      setImportStatus('idle');
      setImportMessage('');
    }
  };

  // Parse CSV file
  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });

      // Validate required fields
      if (row.nim && row.nama) {
        data.push(row);
      }
    }

    return data;
  };

  // Parse Excel file using XLSX library
  const parseExcel = (arrayBuffer: ArrayBuffer): any[] => {
    try {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
      
      if (jsonData.length < 2) return [];

      // Get headers (first row)
      const headers = jsonData[0].map((h: any) => String(h).trim().toLowerCase());
      const data: any[] = [];

      // Process data rows
      for (let i = 1; i < jsonData.length; i++) {
        const row: any = {};
        headers.forEach((header, idx) => {
          row[header] = jsonData[i][idx] ? String(jsonData[i][idx]).trim() : '';
        });

        // Validate required fields
        if (row.nim && row.nama) {
          data.push(row);
        }
      }

      return data;
    } catch (error) {
      console.error('Error parsing Excel:', error);
      return [];
    }
  };

  // Preview imported data
  const handlePreviewFile = async () => {
    if (!selectedFile) return;

    setImportStatus('processing');
    setImportMessage('Memproses file...');

    try {
      let data: any[] = [];

      if (selectedFile.name.endsWith('.csv')) {
        // Handle CSV files
        const text = await selectedFile.text();
        data = parseCSV(text);
      } else if (selectedFile.name.endsWith('.xlsx')) {
        // Handle Excel files
        const arrayBuffer = await selectedFile.arrayBuffer();
        data = parseExcel(arrayBuffer);
      }

      if (data.length === 0) {
        setImportStatus('error');
        setImportMessage('File tidak memiliki data yang valid. Pastikan format: NIM, Nama, dan nilai mata kuliah');
        return;
      }

      setImportData(data);
      setImportStatus('idle');
      setImportMessage(`Berhasil memuat ${data.length} baris data. Silakan review dan klik Import`);
    } catch (error) {
      setImportStatus('error');
      setImportMessage('Gagal membaca file. Pastikan format file benar (.xlsx atau .csv)');
    }
  };

  // Import data to localStorage dengan batch save (lebih efisien)
  const handleImportData = () => {
    if (importData.length === 0) return;

    setImportStatus('processing');
    setImportMessage('Mengimpor data...');

    // Get MK for selected prodi and semester
    const mkList = mataKuliahData.filter(
      mk => mk.prodiKode === selectedProdi && mk.semester === selectedSemester
    );

    if (mkList.length === 0) {
      setImportStatus('error');
      setImportMessage(`Tidak ada mata kuliah untuk ${prodiData.find(p => p.kode === selectedProdi)?.nama} Semester ${selectedSemester}`);
      return;
    }

    // Prepare batch data for nilai and mahasiswa
    const batchNilaiData: NilaiMahasiswaStorage[] = [];
    const batchMahasiswaData: MahasiswaImportStorage[] = [];
    const mahasiswaSet = new Set<string>(); // Track unique mahasiswa
    let processedRows = 0;

    // Process each row
    importData.forEach((row) => {
      try {
        // Extract NIM and Nama with case-insensitive matching
        let nim = '';
        let nama = '';
        
        // Find NIM column (case-insensitive)
        for (const key of Object.keys(row)) {
          const keyLower = key.toLowerCase();
          if (keyLower === 'nim' || keyLower === 'npm' || keyLower === 'no' || keyLower === 'nomor') {
            nim = row[key];
            break;
          }
        }
        
        // Find Nama column (case-insensitive)
        for (const key of Object.keys(row)) {
          const keyLower = key.toLowerCase();
          if (keyLower === 'nama' || keyLower === 'name' || keyLower === 'mahasiswa' || keyLower === 'student') {
            nama = row[key];
            break;
          }
        }
        
        // Skip if NIM or Nama not found
        if (!nim || !nama) {
          console.warn('Skipping row: missing NIM or Nama', row);
          return;
        }
        
        // Find or create mahasiswa ID based on NIM
        const mahasiswa = mahasiswaData.find(m => m.npm === nim);
        const mahasiswaId = mahasiswa?.id || `MHS-${selectedProdi}-${nim}`;

        // Collect mahasiswa data for batch save (only once per mahasiswa)
        if (!mahasiswaSet.has(mahasiswaId)) {
          mahasiswaSet.add(mahasiswaId);
          
          // Extract angkatan from NIM (format: 105231001001 where 23 = 2023)
          let angkatan = 'Unknown';
          const angkatanMatch = nim?.match(/10(\d{2})/);
          if (angkatanMatch) {
            angkatan = '20' + angkatanMatch[1];
          }
          
          console.log('💾 Saving mahasiswa:', { mahasiswaId, npm: nim, nama, prodiKode: selectedProdi, angkatan });
          
          batchMahasiswaData.push({
            mahasiswaId,
            npm: nim,
            nama: nama, // ✅ NAMA DARI EXCEL/CSV
            prodiKode: selectedProdi,
            angkatan,
            timestamp: new Date().toISOString(),
          });
        }

        // Import nilai for each MK column
        mkList.forEach((mk) => {
          const mkKodeClean = mk.kode.toLowerCase().replace(/[^a-z0-9]/g, '');
          const headerVariants = [
            mk.kode.toLowerCase(),
            mkKodeClean,
            mk.nama.toLowerCase(),
            mk.nama.toLowerCase().replace(/\s+/g, ''),
            `mk${mk.semester}`
          ];

          // Find matching column
          let nilaiAkhir: number | null = null;
          for (const header of Object.keys(row)) {
            const headerLower = header.toLowerCase();
            if (headerVariants.some(variant => 
              headerLower.includes(variant) || 
              variant.includes(headerLower) ||
              headerLower === mk.kode.toLowerCase()
            )) {
              const nilai = parseFloat(row[header]);
              if (!isNaN(nilai) && nilai >= 0 && nilai <= 100) {
                nilaiAkhir = nilai;
                break;
              }
            }
          }

          // Add to batch if found
          if (nilaiAkhir !== null) {
            batchNilaiData.push({
              mahasiswaId,
              mkKode: mk.kode,
              nilaiAkhir,
              timestamp: new Date().toISOString()
            });
          }
        });
        
        processedRows++;
      } catch (error) {
        console.error('Error processing row:', error);
      }
    });

    // Batch save mahasiswa data first
    console.log('📝 Batch mahasiswa data to save:', batchMahasiswaData.length, 'mahasiswa');
    const mahasiswaStats = batchSaveMahasiswa(batchMahasiswaData);
    console.log('✅ Mahasiswa save stats:', mahasiswaStats);
    console.log('💾 Mahasiswa saved:', batchMahasiswaData.map(m => ({ id: m.mahasiswaId, nama: m.nama })));

    // Batch save all nilai data
    const stats = batchSaveNilai(batchNilaiData);
    console.log('✅ Nilai save stats:', stats);

    setImportStats({
      success: stats.success,
      failed: stats.failed,
      total: stats.total
    });

    if (stats.success > 0) {
      setImportStatus('success');
      setImportMessage(
        `✅ Import berhasil!\n` +
        `📊 ${stats.success} nilai berhasil disimpan\n` +
        `📁 ${processedRows} mahasiswa diproses\n` +
        `${stats.failed > 0 ? `⚠️ ${stats.failed} nilai gagal (lihat console)` : ''}`
      );
      
      // Log errors if any
      if (stats.errors.length > 0) {
        console.error('Import errors:', stats.errors);
      }
      
      // Trigger refresh untuk update semua tab dan komponen lain
      setRefreshKey(prev => prev + 1);
      
      // Dispatch custom event untuk update dashboard dan laporan
      window.dispatchEvent(new CustomEvent('nilaiUpdated', {
        detail: {
          count: stats.success,
          prodi: selectedProdi,
          semester: selectedSemester,
          timestamp: new Date().toISOString()
        }
      }));
    } else {
      setImportStatus('error');
      setImportMessage(
        `❌ Import gagal!\n` +
        `Tidak ada data yang berhasil disimpan.\n` +
        `Pastikan format file sudah benar dan sesuai dengan template.`
      );
    }
  };

  // Reset import
  const handleReset = () => {
    setSelectedFile(null);
    setImportData([]);
    setImportStatus('idle');
    setImportMessage('');
    setImportStats({ success: 0, failed: 0, total: 0 });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Manajemen Data</h1>
        <p className="text-gray-600">
          Kelola data mahasiswa, mata kuliah, dan CPL
        </p>
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
          {activeTab === 'import' && (
            <div className="space-y-6">
              {/* Filter Section */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filter Target Import
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Program Studi
                    </label>
                    <select
                      value={selectedProdi}
                      onChange={(e) => setSelectedProdi(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      {prodiData.map((prodi) => (
                        <option key={prodi.kode} value={prodi.kode}>
                          {prodi.nama}
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
                    <span className="font-semibold text-gray-800">Mata Kuliah di Semester {selectedSemester}:</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mataKuliahData
                      .filter(mk => mk.prodiKode === selectedProdi && mk.semester === selectedSemester)
                      .map(mk => (
                        <span key={mk.kode} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {mk.kode} - {mk.nama}
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              {/* Upload Section */}
              <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8">
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
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
                    Format file harus memiliki kolom: <strong>NIM, Nama</strong>, dan kolom untuk setiap <strong>kode/nama MK</strong>
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
                <div className={`p-4 rounded-lg ${
                  importStatus === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
                  importStatus === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
                  'bg-blue-50 border border-blue-200 text-blue-800'
                }`}>
                  <div className="flex items-center">
                    {importStatus === 'error' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {importStatus === 'success' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <span className="text-sm font-medium">{importMessage}</span>
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
                      {importStatus === 'processing' ? 'Mengimpor...' : importStatus === 'success' ? 'Import Selesai' : 'Import ke Sistem'}
                    </button>
                  </div>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIM</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                          {Object.keys(importData[0])
                            .filter(key => key !== 'nim' && key !== 'nama')
                            .map(key => (
                              <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
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
                              .filter(key => key !== 'nim' && key !== 'nama')
                              .map(key => (
                                <td key={key} className="px-4 py-3 text-sm text-center">
                                  {row[key] && !isNaN(parseFloat(row[key])) ? (
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                      parseFloat(row[key]) >= 75 ? 'bg-green-100 text-green-800' :
                                      parseFloat(row[key]) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Petunjuk Import Nilai
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  <li>Pilih Program Studi dan Semester target</li>
                  <li>Siapkan file CSV/TXT dengan format:
                    <ul className="list-disc list-inside ml-6 mt-1 text-xs">
                      <li>Kolom pertama: <strong>NIM</strong> (nomor induk mahasiswa)</li>
                      <li>Kolom kedua: <strong>Nama</strong> (nama mahasiswa)</li>
                      <li>Kolom selanjutnya: <strong>Kode atau Nama MK</strong> dengan nilai (0-100)</li>
                    </ul>
                  </li>
                  <li>Upload file dan klik "Preview Data" untuk melihat data yang akan diimpor</li>
                  <li>Jika data sudah sesuai, klik "Import ke Sistem"</li>
                  <li>Sistem akan otomatis menghitung CPL dan CPMK berdasarkan bobot yang sudah ditentukan</li>
                </ol>
                <div className="mt-4 p-3 bg-white rounded border border-blue-300">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Contoh format file:</p>
                  <pre className="text-xs text-gray-700 overflow-x-auto">
NIM,Nama,INF105,INF104,INF106
2024001,Ahmad Fauzi,85,90,78
2024002,Siti Aisyah,92,88,95
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mahasiswa' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Data Mahasiswa yang Sudah Dinilai
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Menampilkan mahasiswa yang sudah memiliki nilai untuk Prodi {prodiData.find(p => p.kode === selectedProdi)?.nama}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={selectedProdi}
                    onChange={(e) => setSelectedProdi(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  >
                    {prodiData.map((prodi) => (
                      <option key={prodi.kode} value={prodi.kode}>
                        {prodi.nama}
                      </option>
                    ))}
                  </select>
                  <button 
                    onClick={() => setRefreshKey(prev => prev + 1)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>
              
              {getMahasiswaWithNilai().length > 0 ? (
                <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIM</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prodi</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Angkatan</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Semester</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Nilai</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Dari Import</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {getMahasiswaWithNilai().map((mhs, idx) => (
                        <tr key={mhs.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600">{idx + 1}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{mhs.npm}</td>
                          <td className="px-4 py-3 text-sm text-gray-800">{mhs.nama}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {prodiData.find(p => p.kode === mhs.prodiKode)?.nama}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-600">{mhs.angkatan}</td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Sem {mhs.semesterAktif}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900">{mhs.totalNilai}</td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {mhs.nilaiDariImport}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {mhs.nilaiDariImport > 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Terimport
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                Mock Data
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Belum Ada Data Mahasiswa</h3>
                  <p className="text-gray-600 mb-4">
                    Import file nilai untuk menambahkan data mahasiswa
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

          {activeTab === 'matakuliah' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Statistik Mata Kuliah
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Nilai rata-rata dan statistik per mata kuliah dari hasil import
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={selectedProdi}
                    onChange={(e) => setSelectedProdi(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  >
                    {prodiData.map((prodi) => (
                      <option key={prodi.kode} value={prodi.kode}>
                        {prodi.nama}
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
                    onClick={() => setRefreshKey(prev => prev + 1)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>
              
              {getMKStatistics().length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getMKStatistics().map((mk) => (
                    <div key={mk.kode} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">{mk.kode}</span>
                          <h4 className="font-semibold text-gray-800 mt-2 text-sm leading-tight">{mk.nama}</h4>
                        </div>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded font-medium">{mk.sks} SKS</span>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600">Dosen:</span>
                          <span className="font-medium text-gray-800">{mk.dosen.split(',')[0]}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600">Semester:</span>
                          <span className="font-medium text-gray-800">{mk.semester}</span>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Mahasiswa:</span>
                          <span className="text-sm font-bold text-gray-900">{mk.jumlahMahasiswa} orang</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Rata-rata:</span>
                          <span className={`text-lg font-bold ${
                            mk.avgNilai >= 75 ? 'text-green-600' :
                            mk.avgNilai >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
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
                                mk.avgNilai >= 75 ? 'bg-green-500' :
                                mk.avgNilai >= 60 ? 'bg-yellow-500' :
                                'bg-red-500'
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Belum Ada Data Nilai</h3>
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
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Capaian Pembelajaran Lulusan (CPL)
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Statistik capaian CPL hasil kalkulasi otomatis dari nilai yang diimport
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={selectedProdi}
                    onChange={(e) => setSelectedProdi(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  >
                    {prodiData.map((prodi) => (
                      <option key={prodi.kode} value={prodi.kode}>
                        {prodi.nama}
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
                    onClick={() => setRefreshKey(prev => prev + 1)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>
              
              {getCPLStatistics().filter(cpl => cpl.jumlahMahasiswa > 0).length > 0 ? (
                <div className="space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-700 font-medium">Tercapai (≥75)</p>
                          <p className="text-3xl font-bold text-green-700 mt-1">
                            {getCPLStatistics().reduce((sum, cpl) => sum + cpl.tercapai, 0)}
                          </p>
                        </div>
                        <div className="bg-green-200 p-3 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-5 border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-yellow-700 font-medium">Cukup (60-74)</p>
                          <p className="text-3xl font-bold text-yellow-700 mt-1">
                            {getCPLStatistics().reduce((sum, cpl) => sum + cpl.cukup, 0)}
                          </p>
                        </div>
                        <div className="bg-yellow-200 p-3 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-5 border border-red-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-red-700 font-medium">Belum Tercapai (&lt;60)</p>
                          <p className="text-3xl font-bold text-red-700 mt-1">
                            {getCPLStatistics().reduce((sum, cpl) => sum + cpl.belumTercapai, 0)}
                          </p>
                        </div>
                        <div className="bg-red-200 p-3 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* CPL Details */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode CPL</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Mahasiswa</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Rata-rata</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Min - Max</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Distribusi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {getCPLStatistics().filter(cpl => cpl.jumlahMahasiswa > 0).map((cpl) => (
                            <tr key={cpl.kode} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-semibold text-blue-600 text-sm">{cpl.kode}</span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-800 max-w-md">
                                {cpl.deskripsi}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {cpl.jumlahMahasiswa} mhs
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`text-lg font-bold ${
                                  cpl.avgNilai >= 75 ? 'text-green-600' :
                                  cpl.avgNilai >= 60 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {cpl.avgNilai}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                                {cpl.minNilai} - {cpl.maxNilai}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center justify-center space-x-2 text-xs">
                                  <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-800 font-medium">
                                    ✓ {cpl.tercapai}
                                  </span>
                                  <span className="inline-flex items-center px-2 py-1 rounded bg-yellow-100 text-yellow-800 font-medium">
                                    ~ {cpl.cukup}
                                  </span>
                                  <span className="inline-flex items-center px-2 py-1 rounded bg-red-100 text-red-800 font-medium">
                                    ✗ {cpl.belumTercapai}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Informasi Kalkulasi CPL:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Nilai CPL dihitung otomatis dari rata-rata MK yang terkait dengan CPL tersebut</li>
                          <li>Setiap MK memiliki CPMK dengan bobot yang dibagi rata</li>
                          <li>Data diupdate real-time setelah import nilai berhasil</li>
                          <li>Klik tombol Refresh untuk memperbarui statistik terbaru</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Belum Ada Data CPL</h3>
                  <p className="text-gray-600 mb-4">
                    Import file nilai terlebih dahulu untuk melihat capaian CPL
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
        </div>
      </div>
    </div>
  );
}

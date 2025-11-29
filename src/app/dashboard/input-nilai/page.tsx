'use client';

import { useState, useEffect } from 'react';
import { prodiData, mahasiswaData, mataKuliahData, cpmkData, cpmkToCplMapping } from '@/data/mockData';
import { saveNilai, getNilaiByMahasiswaMK } from '@/utils/nilaiStorage';
import { getIntegratedMahasiswaList } from '@/utils/dataIntegration';
import { useRouter } from 'next/navigation';

export default function InputNilaiPage() {
  const router = useRouter();
  const [selectedProdi, setSelectedProdi] = useState('ARS');
  const [selectedSemester, setSelectedSemester] = useState(3);
  const [selectedMahasiswa, setSelectedMahasiswa] = useState('');
  const [filteredMahasiswa, setFilteredMahasiswa] = useState<any[]>([]);
  const [mkList, setMkList] = useState<any[]>([]);
  const [selectedMK, setSelectedMK] = useState<any>(null);
  const [nilaiMK, setNilaiMK] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [calculatedCPMK, setCalculatedCPMK] = useState<any[]>([]);
  const [calculatedCPL, setCalculatedCPL] = useState<any[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Key untuk force refresh

  // Listen to nilai updates from import
  useEffect(() => {
    const handleNilaiUpdate = (event: any) => {
      console.log('📝 Input Nilai: Data nilai diupdate', event.detail);
      setRefreshKey(prev => prev + 1);
    };

    const handleStorageChange = () => {
      console.log('💾 Input Nilai: LocalStorage berubah');
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('nilaiUpdated', handleNilaiUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('nilaiUpdated', handleNilaiUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Filter mahasiswa by prodi (integrated: mockData + localStorage)
  useEffect(() => {
    const integratedMahasiswa = getIntegratedMahasiswaList(selectedProdi);
    setFilteredMahasiswa(integratedMahasiswa);
    
    if (integratedMahasiswa.length > 0) {
      // Keep current selection if still valid, otherwise select first
      const currentExists = integratedMahasiswa.find(m => m.id === selectedMahasiswa);
      if (!currentExists || !selectedMahasiswa) {
        setSelectedMahasiswa(integratedMahasiswa[0].id);
      }
    }
  }, [selectedProdi, refreshKey]); // Add refreshKey to refresh mahasiswa list on import

  // Get MK list for selected prodi and semester
  useEffect(() => {
    const mkFiltered = mataKuliahData.filter(
      (mk) => mk.prodiKode === selectedProdi && mk.semester === selectedSemester
    );
    setMkList(mkFiltered);
  }, [selectedProdi, selectedSemester]);

  // Check if nilai already exists when MK is selected
  useEffect(() => {
    if (selectedMK && selectedMahasiswa) {
      const existingNilai = getNilaiByMahasiswaMK(selectedMahasiswa, selectedMK.kode);
      if (existingNilai) {
        setNilaiMK(existingNilai.nilaiAkhir.toString());
      }
    }
  }, [selectedMK, selectedMahasiswa]);

  // Calculate CPMK from nilai MK
  const handleCalculate = () => {
    if (!selectedMK || !nilaiMK) return;

    const nilai = parseFloat(nilaiMK);
    if (isNaN(nilai) || nilai < 0 || nilai > 100) {
      alert('Masukkan nilai antara 0-100');
      return;
    }

    // Get CPMK for this MK
    const cpmkList = cpmkData.filter((c) => c.mkKode === selectedMK.kode);

    // Calculate nilai CPMK (breakdown otomatis berdasarkan bobot)
    const cpmkResults = cpmkList.map((cpmk) => {
      const nilaiCPMK = nilai * (cpmk.bobot / 100);
      return {
        kode: cpmk.kode,
        deskripsi: cpmk.deskripsi,
        bobot: cpmk.bobot,
        nilai: Math.round(nilaiCPMK * 10) / 10,
      };
    });

    setCalculatedCPMK(cpmkResults);

    // Calculate CPL contribution from this MK
    const cplScoresMap: { [key: string]: { totalNilai: number; count: number } } = {};

    cpmkResults.forEach((cpmk) => {
      const mappings = cpmkToCplMapping.filter((m) => m.cpmkKode === cpmk.kode);

      mappings.forEach((mapping) => {
        if (!cplScoresMap[mapping.cplKode]) {
          cplScoresMap[mapping.cplKode] = { totalNilai: 0, count: 0 };
        }
        cplScoresMap[mapping.cplKode].totalNilai += cpmk.nilai * (mapping.bobot / 100);
        cplScoresMap[mapping.cplKode].count += 1;
      });
    });

    const cplResults = Object.entries(cplScoresMap).map(([cplKode, data]) => ({
      kode: cplKode,
      nilai: Math.round((data.totalNilai / data.count) * 10) / 10,
    }));

    setCalculatedCPL(cplResults);
    setShowResult(true);
  };

  // Save nilai
  const handleSave = () => {
    if (!selectedMK || !selectedMahasiswa || !nilaiMK) return;
    
    const nilai = parseFloat(nilaiMK);
    const success = saveNilai(selectedMahasiswa, selectedMK.kode, nilai);
    
    if (success) {
      setSaveSuccess(true);
      
      // Dispatch custom event untuk notify komponen lain (Dashboard, Laporan, Manajemen)
      window.dispatchEvent(new CustomEvent('nilaiUpdated', {
        detail: {
          mahasiswaId: selectedMahasiswa,
          mkKode: selectedMK.kode,
          nilaiAkhir: nilai,
          source: 'input-nilai',
          timestamp: new Date().toISOString()
        }
      }));
      
      console.log('✅ Nilai saved and event dispatched:', {
        mahasiswa: selectedMahasiswa,
        mk: selectedMK.kode,
        nilai: nilai
      });
      
      // Show success message for 2 seconds
      setTimeout(() => {
        setSaveSuccess(false);
        setSelectedMK(null);
        setNilaiMK('');
        setShowResult(false);
        setCalculatedCPMK([]);
        setCalculatedCPL([]);
      }, 2000);
    } else {
      alert('Gagal menyimpan nilai. Silakan coba lagi.');
    }
  };

  const selectedMhs = filteredMahasiswa.find((m) => m.id === selectedMahasiswa);
  const selectedProdiData = prodiData.find((p) => p.kode === selectedProdi);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      {/* Success Notification */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="font-semibold">Nilai Berhasil Disimpan!</p>
              <p className="text-sm">Data akan ditampilkan di Dashboard & Laporan</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Input Nilai Mahasiswa
        </h1>
        <p className="text-gray-600">
          Input nilai mata kuliah, sistem otomatis menghitung CPMK dan CPL
        </p>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-0.293 0.707l-6.414 6.414a1 1 0 00-0.293 0.707V17l-4 4v-6.586a1 1 0 00-0.293-0.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter Data
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Program Studi</label>
            <select
              value={selectedProdi}
              onChange={(e) => {
                setSelectedProdi(e.target.value);
                setSelectedMahasiswa('');
                setSelectedMK(null);
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {prodiData.map((prodi) => (
                <option key={prodi.kode} value={prodi.kode}>{prodi.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(Number(e.target.value));
                setSelectedMK(null);
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mahasiswa</label>
            <select
              value={selectedMahasiswa}
              onChange={(e) => {
                setSelectedMahasiswa(e.target.value);
                setSelectedMK(null);
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={filteredMahasiswa.length === 0}
            >
              {filteredMahasiswa.length === 0 ? (
                <option>Tidak ada mahasiswa</option>
              ) : (
                filteredMahasiswa.map((mhs) => (
                  <option key={mhs.id} value={mhs.id}>{mhs.npm} - {mhs.nama}</option>
                ))
              )}
            </select>
          </div>
        </div>

        {selectedMhs && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Prodi:</span>
                <p className="font-semibold text-gray-800">{selectedProdiData?.nama}</p>
              </div>
              <div>
                <span className="text-gray-600">Nim:</span>
                <p className="font-semibold text-gray-800">{selectedMhs.npm}</p>
              </div>
              <div>
                <span className="text-gray-600">Nama:</span>
                <p className="font-semibold text-gray-800">{selectedMhs.nama}</p>
              </div>
              <div>
                <span className="text-gray-600">Semester Aktif:</span>
                <p className="font-semibold text-gray-800">Semester {selectedMhs.semesterAktif}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MK List */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Pilih Mata Kuliah (Semester {selectedSemester})
        </h3>

        {mkList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Tidak ada mata kuliah di semester ini</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mkList.map((mk) => (
              <button
                key={mk.kode}
                onClick={() => {
                  setSelectedMK(mk);
                  setNilaiMK('');
                  setShowResult(false);
                }}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedMK?.kode === mk.kode
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">{mk.nama}</h4>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{mk.sks} SKS</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Kode: {mk.kode}</p>
                <p className="text-xs text-gray-500">Dosen: {mk.dosen}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {mk.cplTerkait.map((cpl: string) => (
                    <span key={cpl} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">{cpl}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input Nilai Section */}
      {selectedMK && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Input Nilai: {selectedMK.nama}
          </h3>

          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nilai Mata Kuliah (0-100)</label>
            <div className="flex gap-4">
              <input
                type="number"
                value={nilaiMK}
                onChange={(e) => setNilaiMK(e.target.value)}
                min="0"
                max="100"
                step="0.1"
                placeholder="Masukkan nilai"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleCalculate}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
              >
                Hitung
              </button>
            </div>
          </div>

          {/* Results */}
          {showResult && (
            <div className="mt-6 space-y-6">
              {/* CPMK Results */}
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h4 className="font-semibold text-gray-800 mb-3">Breakdown Nilai CPMK (Otomatis)</h4>
                <div className="space-y-2">
                  {calculatedCPMK.map((cpmk) => (
                    <div key={cpmk.kode} className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{cpmk.deskripsi}</p>
                        <p className="text-xs text-gray-500">Bobot: {cpmk.bobot}%</p>
                      </div>
                      <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 font-semibold rounded-lg">
                        {cpmk.nilai}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CPL Results */}
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <h4 className="font-semibold text-gray-800 mb-3">Kontribusi ke CPL</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {calculatedCPL.map((cpl) => (
                    <div key={cpl.kode} className="p-3 bg-white rounded-lg text-center">
                      <p className="text-xs text-gray-600 mb-1">{cpl.kode}</p>
                      <p className="text-xl font-bold text-green-600">{cpl.nilai}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg"
                >
                  Simpan Nilai
                </button>
                <button
                  onClick={() => {
                    setSelectedMK(null);
                    setNilaiMK('');
                    setShowResult(false);
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

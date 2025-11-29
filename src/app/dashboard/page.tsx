'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { prodiData, mahasiswaData, cplData, mataKuliahData, cpmkData, cpmkToCplMapping } from '@/data/mockData';
import { hitungNilaiCPLPerSemesterIntegrated, hasInputNilai, getIntegratedMahasiswaList } from '@/utils/dataIntegration';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const [selectedProdi, setSelectedProdi] = useState('ARS');
  const [selectedSemester, setSelectedSemester] = useState(2);
  const [selectedMahasiswa, setSelectedMahasiswa] = useState('');
  const [filteredMahasiswa, setFilteredMahasiswa] = useState<any[]>([]);
  const [cplScores, setCplScores] = useState<any[]>([]);
  const [mappingData, setMappingData] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Key untuk force refresh

  // Listen to nilai updates from import
  useEffect(() => {
    const handleNilaiUpdate = (event: any) => {
      console.log('📊 Dashboard: Data nilai diupdate', event.detail);
      setRefreshKey(prev => prev + 1);
    };

    const handleStorageChange = () => {
      console.log('💾 Dashboard: LocalStorage berubah');
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('nilaiUpdated', handleNilaiUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('nilaiUpdated', handleNilaiUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Check auth
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData = sessionStorage.getItem('user');
      if (!userData) {
        router.push('/login');
      }
    }
  }, [router]);

  // Filter mahasiswa by prodi (integrated: mockData + localStorage)
  useEffect(() => {
    const integratedMahasiswa = getIntegratedMahasiswaList(selectedProdi);
    setFilteredMahasiswa(integratedMahasiswa);
    
    if (integratedMahasiswa.length > 0) {
      // Keep current selection if still valid, otherwise select first
      const currentExists = integratedMahasiswa.find(m => m.id === selectedMahasiswa);
      if (!currentExists) {
        setSelectedMahasiswa(integratedMahasiswa[0].id);
      }
    }
  }, [selectedProdi, refreshKey]); // Add refreshKey to refresh mahasiswa list on import

  // Calculate CPL scores when mahasiswa or semester changes
  useEffect(() => {
    if (!selectedMahasiswa) return;

    const scores = hitungNilaiCPLPerSemesterIntegrated(selectedMahasiswa, selectedSemester, selectedProdi);
    
    // Get CPL details for selected prodi
    const prodiCPL = cplData.filter(c => c.prodiKode === selectedProdi);
    const detailedScores = prodiCPL.map(cpl => {
      const score = scores.find(s => s.cplKode === cpl.kode);
      const nilai = score ? score.nilai : 0;
      const isRealData = score && score.source !== 'mockData';
      
      return {
        kode: cpl.kode,
        deskripsi: cpl.deskripsi,
        nilai: nilai,
        jumlahMK: score ? score.jumlahMK : 0,
        status: nilai >= 75 ? 'Tercapai' : nilai >= 60 ? 'Cukup' : 'Belum Tercapai',
        source: score ? score.source : 'none',
        isRealData: isRealData,
      };
    });

    setCplScores(detailedScores);
  }, [selectedMahasiswa, selectedSemester, selectedProdi, refreshKey]); // Add refreshKey to dependencies

  // Generate CPL-MK-CPMK Mapping Data
  useEffect(() => {
    // Get CPL for selected prodi
    const prodiCPL = cplData.filter(c => c.prodiKode === selectedProdi);
    
    // Get MK for selected semester and prodi
    const mkSemester = mataKuliahData.filter(
      mk => mk.prodiKode === selectedProdi && mk.semester === selectedSemester
    );

    // Build mapping structure
    const mapping = prodiCPL.map(cpl => {
      // Find MK that are related to this CPL
      const relatedMK = mkSemester.filter(mk => 
        mk.cplTerkait.includes(cpl.kode)
      );

      // For each MK, get its CPMK
      const mkWithCPMK = relatedMK.map(mk => {
        const mkCPMK = cpmkData.filter(c => c.mkKode === mk.kode);
        
        // Get CPMK that map to this CPL
        const relevantCPMK = mkCPMK.filter(cpmk => 
          cpmkToCplMapping.some(m => 
            m.cpmkKode === cpmk.kode && m.cplKode === cpl.kode
          )
        );

        return {
          ...mk,
          cpmkCount: relevantCPMK.length,
          cpmkList: relevantCPMK
        };
      });

      return {
        cpl: cpl,
        mkCount: mkWithCPMK.length,
        mataKuliah: mkWithCPMK,
        totalCPMK: mkWithCPMK.reduce((sum, mk) => sum + mk.cpmkCount, 0)
      };
    });

    setMappingData(mapping);
  }, [selectedProdi, selectedSemester]);

  // Get selected mahasiswa from integrated list
  const selectedMhs = filteredMahasiswa.find(m => m.id === selectedMahasiswa);
  const selectedProdiData = prodiData.find(p => p.kode === selectedProdi);

  // Summary statistics
  const tercapai = cplScores.filter(c => c.nilai >= 75).length;
  const rataRata = cplScores.length > 0 
    ? Math.round((cplScores.reduce((sum, c) => sum + c.nilai, 0) / cplScores.length) * 10) / 10 
    : 0;

  // Chart data
  const barChartData = cplScores.map(c => ({
    name: c.kode,
    Nilai: c.nilai,
  }));

  const radarChartData = cplScores.map(c => ({
    subject: c.kode,
    value: c.nilai,
    fullMark: 100,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Sistem CPL</h1>
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
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
              {prodiData.map((prodi) => (
                <option key={prodi.kode} value={prodi.kode}>
                  {prodi.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Pilih Semester */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Pilih Mahasiswa
            </label>
            <select
              value={selectedMahasiswa}
              onChange={(e) => setSelectedMahasiswa(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
              disabled={filteredMahasiswa.length === 0}
            >
              {filteredMahasiswa.length === 0 ? (
                <option>Tidak ada mahasiswa</option>
              ) : (
                filteredMahasiswa.map((mhs) => (
                  <option key={mhs.id} value={mhs.id}>
                    {mhs.npm} - {mhs.nama}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Selected Info */}
        {selectedMhs && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600 font-medium">Prodi:</span>
                <p className="font-bold text-blue-700">{selectedProdiData?.nama}</p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">NIM:</span>
                <p className="font-bold text-blue-700">{selectedMhs.npm}</p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Angkatan:</span>
                <p className="font-bold text-blue-700">{selectedMhs.angkatan}</p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Source:</span>
                <p className="font-bold text-blue-700">
                  {selectedMhs.source === 'localStorage' ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                      📊 Import
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                      📁 Mock
                    </span>
                  )}
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
              <h3 className="text-4xl font-bold mt-2">{tercapai}/{cplScores.length}</h3>
              <p className="text-blue-100 text-sm mt-1">≥ 75 poin</p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Rata-rata CPL</p>
              <h3 className="text-4xl font-bold mt-2">{rataRata}</h3>
              <p className="text-indigo-100 text-sm mt-1">dari 100 poin</p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-sm font-medium">Status Semester {selectedSemester}</p>
              <h3 className="text-2xl font-bold mt-2">
                {rataRata >= 75 ? 'Sangat Baik' : rataRata >= 60 ? 'Baik' : 'Perlu Perbaikan'}
              </h3>
              <p className="text-cyan-100 text-sm mt-1">{cplScores.filter(c => c.nilai > 0).length} CPL terdata</p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* CPL-MK-CPMK Tree Diagram */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-blue-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-2"></span>
            Hubungan (CPL - MK - CPMK)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Semester {selectedSemester} • {selectedProdiData?.nama}
          </p>
          
          <div className="max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
            {mappingData && mappingData.map((item: any, idx: number) => (
              <div key={idx} className="mb-6 last:mb-0">
                {/* CPL Node (Root) */}
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${item.mkCount > 0 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                    {item.mkCount > 0 && <div className="w-0.5 h-full bg-blue-300 mt-1"></div>}
                  </div>
                  
                  <div className="flex-1 pb-2">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm">{item.cpl.kode}</span>
                        <div className="flex gap-1">
                          <span className="px-2 py-0.5 bg-white bg-opacity-30 text-xs rounded-full">
                            {item.mkCount} MK
                          </span>
                          <span className="px-2 py-0.5 bg-white bg-opacity-30 text-xs rounded-full">
                            {item.totalCPMK} CPMK
                          </span>
                        </div>
                      </div>
                      <p className="text-xs opacity-90 line-clamp-2">{item.cpl.deskripsi}</p>
                    </div>

                    {/* MK Nodes (Children) */}
                    {item.mataKuliah.length > 0 && (
                      <div className="mt-3 space-y-3">
                        {item.mataKuliah.map((mk: any, mkIdx: number) => (
                          <div key={mkIdx} className="flex items-start gap-3">
                            <div className="flex flex-col items-center pt-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${mk.cpmkCount > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              {mk.cpmkCount > 0 && <div className="w-0.5 h-full bg-green-300 mt-1"></div>}
                            </div>
                            
                            <div className="flex-1">
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-2.5 hover:border-green-400 transition-colors">
                                <div className="flex items-start gap-2 mb-1">
                                  <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap">
                                    {mk.kode}
                                  </span>
                                  <div className="flex-1">
                                    <p className="text-xs font-semibold text-gray-800 leading-tight">{mk.nama}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{mk.sks} SKS • {mk.dosen}</p>
                                  </div>
                                  {mk.cpmkCount > 0 && (
                                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">
                                      {mk.cpmkCount} CPMK
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* CPMK Nodes (Grandchildren) */}
                              {mk.cpmkList.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {mk.cpmkList.map((cpmk: any, cpmkIdx: number) => (
                                    <div key={cpmkIdx} className="flex items-start gap-3">
                                      <div className="flex flex-col items-center pt-1.5">
                                        <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                                      </div>
                                      
                                      <div className="flex-1 bg-purple-50 border border-purple-200 rounded-md p-2 hover:bg-purple-100 transition-colors">
                                        <div className="flex items-start gap-2">
                                          <div className="w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                            {cpmkIdx + 1}
                                          </div>
                                          <p className="text-xs text-gray-700 flex-1 leading-tight">{cpmk.deskripsi}</p>
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

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-2">Legenda:</p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs text-gray-600">CPL</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-600">Mata Kuliah</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                <span className="text-xs text-gray-600">CPMK</span>
              </div>
            </div>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-blue-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-indigo-100 text-indigo-600 p-2 rounded-lg mr-2"></span>
            Profil CPL Mahasiswa
          </h3>
          <p className="text-sm text-gray-600 mb-4"> Diagram visualisasi CPL mahasiswa berdasarkan data yang tersedia</p> <br /> <br />
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarChartData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" stroke="#6b7280" />
              <PolarRadiusAxis domain={[0, 100]} stroke="#6b7280" />
              <Radar name="Nilai CPL" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #3b82f6', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CPL Table */}
      <div className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden">
        <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="text-lg font-bold text-gray-800">Detail Capaian Pembelajaran Lulusan</h3>
          <p className="text-sm text-gray-600 mt-1">Semester {selectedSemester} - {selectedProdiData?.nama}</p>
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
              {cplScores.map((cpl, idx) => (
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
                      {cpl.nilai}
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

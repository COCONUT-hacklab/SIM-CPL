'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE =   process.env.NEXT_PUBLIC_API_URL
 || 'http://localhost:8001/api';

// --- TIPE DATA YANG SUDAH DIPERBAIKI ---
type Prodi = { 
  id_prodi: number; 
  kode_prodi: string; 
  nama_prodi: string 
};

type MahasiswaSummary = { 
  id_mhs: number; 
  nim: string; 
  nama: string; 
  angkatan: number; 
  semester_max: number; 
  total_nilai: number 
};

type MK = { 
  id_mk: string;      // Sesuai handler_master.go (json:"id_mk")
  kode_mk: string; 
  nama_mk: string; 
  sks: number; 
  semester: number; 
  cpl_terkait: string[] 
};

type CPMK = { 
  id: string;         // Sesuai cpmk.go (json:"id")
  kode_cpmk: string; 
  deskripsi: string; 
  bobot: number | null; // Sesuai cpmk.go (json:"bobot")
};

export default function InputNilaiPage() {
  const router = useRouter();

  // --- STATE ---
  const [prodiList, setProdiList] = useState<Prodi[]>([]);
  const [mahasiswaList, setMahasiswaList] = useState<MahasiswaSummary[]>([]);
  const [mkList, setMkList] = useState<MK[]>([]);
  const [cpmkList, setCpmkList] = useState<CPMK[]>([]);

  const [selectedProdi, setSelectedProdi] = useState<Prodi | null>(null);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [selectedMahasiswa, setSelectedMahasiswa] = useState<MahasiswaSummary | null>(null);
  const [selectedMK, setSelectedMK] = useState<MK | null>(null);

  const [loadingProdi, setLoadingProdi] = useState(true);
  const [loadingMahasiswa, setLoadingMahasiswa] = useState(false);
  const [loadingMK, setLoadingMK] = useState(false);
  const [loadingCPMK, setLoadingCPMK] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nilaiMK, setNilaiMK] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [calculatedCPMK, setCalculatedCPMK] = useState<any[]>([]);
  const [calculatedCPL, setCalculatedCPL] = useState<any[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // --- EFFECTS ---

  // Listen update
  useEffect(() => {
    const handleNilaiUpdate = (event: any) => {
      setRefreshKey(prev => prev + 1);
    };
    window.addEventListener('nilaiUpdated', handleNilaiUpdate);
    return () => window.removeEventListener('nilaiUpdated', handleNilaiUpdate);
  }, []);

  // 1. Load Prodi
  useEffect(() => {
    const controller = new AbortController();
    setLoadingProdi(true);
    fetch(`${API_BASE}/prodi`, { signal: controller.signal })
      .then(res => res.json())
      .then((data: Prodi[]) => {
        setProdiList(data);
        if (data.length > 0 && !selectedProdi) setSelectedProdi(data[0]);
      })
      .catch(err => { if (err.name !== 'AbortError') console.error(err); })
      .finally(() => setLoadingProdi(false));
    return () => controller.abort();
  }, []);

  // 2. Load Mahasiswa
  useEffect(() => {
    if (!selectedProdi) { setMahasiswaList([]); return; }
    const controller = new AbortController();
    setLoadingMahasiswa(true);
    fetch(`${API_BASE}/prodi/${selectedProdi.id_prodi}/mahasiswa-nilai`, { signal: controller.signal })
      .then(res => res.json())
      .then((data: MahasiswaSummary[]) => {
        setMahasiswaList(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          const currentExists = data.find(m => m.nim === selectedMahasiswa?.nim);
          if (!currentExists) setSelectedMahasiswa(data[0]);
        } else setSelectedMahasiswa(null);
      })
      .catch(err => { if (err.name !== 'AbortError') setMahasiswaList([]); })
      .finally(() => setLoadingMahasiswa(false));
    return () => controller.abort();
  }, [selectedProdi, refreshKey]);

  // 3. Load MK
  useEffect(() => {
    if (!selectedProdi) { setMkList([]); return; }
    const controller = new AbortController();
    setLoadingMK(true);
    fetch(`${API_BASE}/prodi/${selectedProdi.id_prodi}/mk?semester=${selectedSemester}`, { signal: controller.signal })
      .then(res => res.json())
      .then((data: MK[]) => {
        setMkList(Array.isArray(data) ? data : []);
        setSelectedMK(null);
      })
      .catch(err => { if (err.name !== 'AbortError') setMkList([]); })
      .finally(() => setLoadingMK(false));
    return () => controller.abort();
  }, [selectedProdi, selectedSemester]);

  // 4. Load CPMK (Fix ID MK)
  useEffect(() => {
    // Gunakan id_mk string UUID
    if (!selectedMK || !selectedMK.id_mk) { setCpmkList([]); return; }
    
    const controller = new AbortController();
    setLoadingCPMK(true);
    fetch(`${API_BASE}/mk/${selectedMK.id_mk}/cpmk`, { signal: controller.signal })
      .then(res => res.json())
      .then((data: CPMK[]) => {
        setCpmkList(Array.isArray(data) ? data : []);
      })
      .catch(err => { if (err.name !== 'AbortError') setCpmkList([]); })
      .finally(() => setLoadingCPMK(false));
    return () => controller.abort();
  }, [selectedMK]);

  // --- HANDLERS ---

  const handleCalculate = () => {
    if (!selectedMK || !nilaiMK) return;

    const nilai = parseFloat(nilaiMK);
    if (isNaN(nilai) || nilai < 0 || nilai > 100) {
      alert('Masukkan nilai antara 0-100');
      return;
    }

    // 1. Hitung Kontribusi CPMK (Nilai * Bobot%)
    const cpmkResults = cpmkList.map((cpmk) => {
      const rawBobot = cpmk.bobot ?? 0;
      // Normalisasi bobot: jika desimal (0.2) jadi persen (20), jika > 1 anggap persen
      const bobotPersen = rawBobot <= 1 && rawBobot > 0 ? rawBobot * 100 : rawBobot;
      
      const effectiveBobot = (cpmk.bobot !== null)
        ? bobotPersen
        : (cpmkList.length > 0 ? 100 / cpmkList.length : 0);

      // Rumus: Nilai MK * (Bobot / 100)
      const nilaiKontribusi = nilai * (effectiveBobot / 100);
      
      return {
        id: cpmk.id,
        kode: cpmk.kode_cpmk,
        deskripsi: cpmk.deskripsi,
        bobot: Math.round(effectiveBobot * 10) / 10,
        nilai: Math.round(nilaiKontribusi * 100) / 100, // Menampilkan nilai hasil kali bobot
      };
    });

    setCalculatedCPMK(cpmkResults);

    // 2. Ambil List CPL (Hanya Kode)
    const cplResults = (selectedMK.cpl_terkait || []).map(cplKode => ({
      kode: cplKode,
    }));

    setCalculatedCPL(cplResults);
    setShowResult(true);
  };

  const handleSave = async () => {
    if (!selectedMK || !selectedMahasiswa || !nilaiMK || !selectedProdi) return;
    const nilai = parseFloat(nilaiMK);
    setSaving(true);
    
    try {
      const response = await fetch(`${API_BASE}/nilai-mk/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prodiKode: selectedProdi.kode_prodi,
          semester: selectedSemester,
          tahunAjaran: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
          matkulList: [{
            kode: selectedMK.kode_mk,
            nama: selectedMK.nama_mk,
            sks: selectedMK.sks
          }],
          importData: [{
            nim: selectedMahasiswa.nim,
            nama: selectedMahasiswa.nama,
            nilaiMap: { [selectedMK.kode_mk]: nilai }
          }]
        })
      });

      if (response.ok) {
        setSaveSuccess(true);
        window.dispatchEvent(new CustomEvent('nilaiUpdated', {
          detail: { 
            mahasiswaNim: selectedMahasiswa.nim, 
            mkKode: selectedMK.kode_mk, 
            nilaiAkhir: nilai, 
            source: 'input-nilai', 
            timestamp: new Date().toISOString() 
          }
        }));
        
        setTimeout(() => {
          setSaveSuccess(false); 
          setSelectedMK(null); 
          setNilaiMK(''); 
          setShowResult(false); 
          setCalculatedCPMK([]); 
          setCalculatedCPL([]); 
          setRefreshKey(prev => prev + 1);
        }, 2000);
      } else {
        const errData = await response.json();
        alert(`Gagal menyimpan nilai: ${errData.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Gagal menyimpan nilai. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      {saveSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <div><p className="font-semibold">Nilai Berhasil Disimpan!</p><p className="text-sm">Data akan ditampilkan di Dashboard & Laporan</p></div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Input Nilai Mahasiswa
        </h1>
        <p className="text-gray-600">Input nilai mata kuliah, sistem otomatis menghitung CPMK dan CPL</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-0.293 0.707l-6.414 6.414a1 1 0 00-0.293 0.707V17l-4 4v-6.586a1 1 0 00-0.293-0.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          Filter Data
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Program Studi</label>
            <select value={selectedProdi?.id_prodi || ''} onChange={(e) => { const prodi = prodiList.find(p => p.id_prodi === Number(e.target.value)); setSelectedProdi(prodi || null); setSelectedMahasiswa(null); setSelectedMK(null); }} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" disabled={loadingProdi}>
              {loadingProdi ? <option>Loading...</option> : prodiList.map((prodi) => (<option key={prodi.id_prodi} value={prodi.id_prodi}>{prodi.nama_prodi}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
            <select value={selectedSemester} onChange={(e) => { setSelectedSemester(Number(e.target.value)); setSelectedMK(null); }} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (<option key={sem} value={sem}>Semester {sem}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mahasiswa</label>
            <select value={selectedMahasiswa?.nim || ''} onChange={(e) => { const mhs = mahasiswaList.find(m => m.nim === e.target.value); setSelectedMahasiswa(mhs || null); setSelectedMK(null); }} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" disabled={loadingMahasiswa || mahasiswaList.length === 0}>
              {loadingMahasiswa ? <option>Loading...</option> : mahasiswaList.length === 0 ? <option>Tidak ada mahasiswa</option> : mahasiswaList.map((mhs) => (<option key={mhs.nim} value={mhs.nim}>{mhs.nim} - {mhs.nama}</option>))}
            </select>
          </div>
        </div>
        {selectedMahasiswa && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-gray-600">Prodi:</span><p className="font-semibold text-gray-800">{selectedProdi?.nama_prodi}</p></div>
              <div><span className="text-gray-600">Nim:</span><p className="font-semibold text-gray-800">{selectedMahasiswa.nim}</p></div>
              <div><span className="text-gray-600">Nama:</span><p className="font-semibold text-gray-800">{selectedMahasiswa.nama}</p></div>
              <div><span className="text-gray-600">Angkatan:</span><p className="font-semibold text-gray-800">{selectedMahasiswa.angkatan}</p></div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Pilih Mata Kuliah (Semester {selectedSemester})</h3>
        {loadingMK ? <div className="text-center py-8 text-gray-500 italic">Memuat mata kuliah...</div> : mkList.length === 0 ? <div className="text-center py-8 text-gray-500"><p>Tidak ada mata kuliah di semester ini</p></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mkList.map((mk) => (
              <button key={mk.id_mk} onClick={() => { setSelectedMK(mk); setNilaiMK(''); setShowResult(false); }} className={`p-4 rounded-lg border-2 transition-all text-left ${selectedMK?.id_mk === mk.id_mk ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300'}`}>
                <div className="flex items-start justify-between mb-2"><h4 className="font-semibold text-gray-800">{mk.nama_mk}</h4><span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{mk.sks} SKS</span></div>
                <p className="text-sm text-gray-600 mb-2">Kode: {mk.kode_mk}</p>
                <div className="mt-2 flex flex-wrap gap-1">{(mk.cpl_terkait || []).map((cpl: string) => (<span key={cpl} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">{cpl}</span>))}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedMK && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Input Nilai: {selectedMK.nama_mk}</h3>
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nilai Mata Kuliah (0-100)</label>
            <div className="flex gap-4">
              <input type="number" value={nilaiMK} onChange={(e) => setNilaiMK(e.target.value)} min="0" max="100" step="0.1" placeholder="Masukkan nilai" className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              <button onClick={handleCalculate} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md">Hitung</button>
            </div>
          </div>

          {showResult && (
            <div className="mt-6 space-y-6">
              {/* CPMK Results (Weighted Contribution) */}
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h4 className="font-semibold text-gray-800 mb-3">Breakdown Nilai CPMK (Berdasarkan Bobot)</h4>
                {loadingCPMK ? <p className="text-gray-500 italic">Memuat CPMK...</p> : (
                  <div className="space-y-2">
                    {calculatedCPMK.length > 0 ? calculatedCPMK.map((cpmk) => (
                      <div key={cpmk.kode} className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{cpmk.deskripsi}</p>
                          <p className="text-xs text-gray-500">Bobot: {cpmk.bobot}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 uppercase mb-1">Kontribusi</p>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 font-bold rounded-lg text-lg">
                            {cpmk.nilai}
                          </span>
                        </div>
                      </div>
                    )) : <p className="text-sm text-gray-500 italic">Mata kuliah ini belum memiliki CPMK.</p>}
                  </div>
                )}
              </div>

              {/* CPL Results (Tags Only) */}
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <h4 className="font-semibold text-gray-800 mb-3">CPL Terkait</h4>
                {calculatedCPL.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {calculatedCPL.map((cpl) => (
                      <div key={cpl.kode} className="px-4 py-2 bg-white border border-green-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <span className="font-bold text-green-700">{cpl.kode}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-500 italic">Tidak ada CPL yang terkait langsung.</p>}
              </div>

              <div className="flex gap-4">
                <button onClick={handleSave} disabled={saving} className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan Nilai'}</button>
                <button onClick={() => { setSelectedMK(null); setNilaiMK(''); setShowResult(false); }} disabled={saving} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50">Batal</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
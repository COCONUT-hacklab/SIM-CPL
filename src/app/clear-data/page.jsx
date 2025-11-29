'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClearDataPage() {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [data, setData] = useState({ nilai: null, mahasiswa: null });

  useEffect(() => {
    // Load current data
    const nilaiData = localStorage.getItem('kkp_nilai_mahasiswa');
    const mahasiswaData = localStorage.getItem('kkp_mahasiswa_import');
    
    setData({
      nilai: nilaiData ? JSON.parse(nilaiData) : null,
      mahasiswa: mahasiswaData ? JSON.parse(mahasiswaData) : null
    });
  }, []);

  const clearAll = () => {
    localStorage.removeItem('kkp_nilai_mahasiswa');
    localStorage.removeItem('kkp_mahasiswa_import');
    localStorage.clear();
    
    setStatus('✅ Semua data berhasil dihapus!');
    setData({ nilai: null, mahasiswa: null });
    
    // Dispatch storage event
    window.dispatchEvent(new Event('storage'));
    
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  };

  const clearNilai = () => {
    localStorage.removeItem('kkp_nilai_mahasiswa');
    setStatus('✅ Data nilai berhasil dihapus!');
    
    const mahasiswaData = localStorage.getItem('kkp_mahasiswa_import');
    setData({
      nilai: null,
      mahasiswa: mahasiswaData ? JSON.parse(mahasiswaData) : null
    });
    
    window.dispatchEvent(new Event('storage'));
  };

  const clearMahasiswa = () => {
    localStorage.removeItem('kkp_mahasiswa_import');
    setStatus('✅ Data mahasiswa berhasil dihapus!');
    
    const nilaiData = localStorage.getItem('kkp_nilai_mahasiswa');
    setData({
      nilai: nilaiData ? JSON.parse(nilaiData) : null,
      mahasiswa: null
    });
    
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            🗑️ Bersihkan Data localStorage
          </h1>

          {status && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-medium">{status}</p>
            </div>
          )}

          <div className="space-y-4 mb-8">
            <button
              onClick={clearAll}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-lg transition-colors"
            >
              🗑️ Hapus SEMUA Data
            </button>

            <button
              onClick={clearNilai}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-lg transition-colors"
            >
              📊 Hapus Data Nilai Saja
            </button>

            <button
              onClick={clearMahasiswa}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 px-6 rounded-lg transition-colors"
            >
              👥 Hapus Data Mahasiswa Saja
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg transition-colors"
            >
              ← Kembali ke Dashboard
            </button>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-bold text-gray-700 mb-4">📊 Data Saat Ini</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-gray-700 mb-2">📊 NILAI (kkp_nilai_mahasiswa):</h3>
                {data.nilai ? (
                  <div>
                    <p className="text-sm text-gray-600">
                      Total: <span className="font-bold">{data.nilai.length} records</span>
                    </p>
                    <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(data.nilai.slice(0, 2), null, 2)}
                      {data.nilai.length > 2 && '\n... dan ' + (data.nilai.length - 2) + ' lainnya'}
                    </pre>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Empty</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-gray-700 mb-2">👥 MAHASISWA (kkp_mahasiswa_import):</h3>
                {data.mahasiswa ? (
                  <div>
                    <p className="text-sm text-gray-600">
                      Total: <span className="font-bold">{data.mahasiswa.length} records</span>
                    </p>
                    <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(data.mahasiswa.slice(0, 2), null, 2)}
                      {data.mahasiswa.length > 2 && '\n... dan ' + (data.mahasiswa.length - 2) + ' lainnya'}
                    </pre>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Empty</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

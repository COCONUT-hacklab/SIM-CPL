'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, RefreshCw, Trash2, AlertTriangle, CheckCircle2, Sliders, FileSignature, UserCheck } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // State Konfigurasi (Tanpa KPI Sasaran Mutu)
  const [config, setConfig] = useState({
    // Parameter Nilai Evaluasi
    batasTercapai: 70,
    batasCukup: 50,
    
    // Periode Default Dashboard
    semesterAktif: '1',
    tahunAjaran: '2024/2025',
    
    // Identitas Penandatangan (Data untuk Template Laporan)
    namaDekan: '',
    nipDekan: '',
    namaKaprodi: '',
    nipKaprodi: '',
  });

  // Load Config saat pertama kali buka
  useEffect(() => {
    const savedConfig = localStorage.getItem('simcpl_config');
    if (savedConfig) {
      // Merge dengan config default untuk menghindari error jika ada field baru
      setConfig(prev => ({ ...prev, ...JSON.parse(savedConfig) }));
    }
  }, []);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('simcpl_config', JSON.stringify(config));
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      window.dispatchEvent(new Event('configUpdated'));
    }, 800);
  };

  const handleClearCache = () => {
    if (confirm('PERINGATAN: Ini akan menghapus semua data sesi login dan cache browser Anda. Anda akan diminta login ulang. Lanjutkan?')) {
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-6 pb-24">
      
      {/* Header Page */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Sliders className="h-8 w-8 text-blue-600" />
          Konfigurasi Sistem
        </h1>
        <p className="text-slate-500 mt-2">Pusat kendali parameter evaluasi OBE dan data administrasi laporan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. PARAMETER EVALUASI (CORE OBE) */}
        <Card className="border-blue-100 shadow-sm h-fit">
          <CardHeader className="bg-blue-50/50 pb-4 border-b border-blue-50">
            <CardTitle className="text-blue-900 flex items-center gap-2">
               <UserCheck className="h-5 w-5" /> Standar Kelulusan CPL
            </CardTitle>
            <CardDescription>Tentukan ambang batas nilai (threshold) untuk status capaian mahasiswa.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-emerald-700 font-bold">Batas "Tercapai" (≥)</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={config.batasTercapai}
                    onChange={(e) => setConfig({...config, batasTercapai: Number(e.target.value)})}
                    className="border-emerald-200 focus:ring-emerald-500 font-bold text-lg text-emerald-800" 
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-emerald-600">Poin</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Mahasiswa dengan nilai di atas <strong>{config.batasTercapai}</strong> dikategorikan berhasil.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-amber-700 font-bold">Batas "Cukup" (≥)</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={config.batasCukup}
                    onChange={(e) => setConfig({...config, batasCukup: Number(e.target.value)})}
                    className="border-amber-200 focus:ring-amber-500 font-bold text-lg text-amber-800" 
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-amber-600">Poin</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Nilai antara <strong>{config.batasCukup} - {config.batasTercapai - 1}</strong> masuk kategori peringatan (Cukup).
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-200">
               <p className="text-xs font-semibold text-slate-700 mb-1">Simulasi Status:</p>
               <div className="flex gap-2 text-[10px]">
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded border border-emerald-200">
                     Nilai {config.batasTercapai} → <strong>Tercapai</strong>
                  </span>
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded border border-red-200">
                     Nilai {config.batasCukup - 1} → <strong>Gagal</strong>
                  </span>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. IDENTITAS PELAPORAN (ADMINISTRASI) */}
        <Card className="border-indigo-100 shadow-sm h-fit">
          <CardHeader className="bg-indigo-50/50 pb-4 border-b border-indigo-50">
            <CardTitle className="text-indigo-900 flex items-center gap-2">
               <FileSignature className="h-5 w-5" /> Identitas Penandatangan
            </CardTitle>
            <CardDescription>Data ini akan otomatis muncul di bagian tanda tangan laporan PDF.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            
            {/* Input Data Pejabat */}
            <div className="space-y-4">
              <div className="space-y-2">
                 <Label className="text-slate-700 font-semibold text-xs uppercase tracking-wider">1. Dekan Fakultas Teknik</Label>
                 <div className="grid grid-cols-1 gap-3">
                    <Input 
                       placeholder="Nama Lengkap & Gelar (Cth: Dr. Ir. Fulan, M.T.)" 
                       value={config.namaDekan}
                       onChange={(e) => setConfig({...config, namaDekan: e.target.value})}
                       className="bg-white"
                    />
                    <Input 
                       placeholder="NIP / NIDN / NBM" 
                       value={config.nipDekan}
                       onChange={(e) => setConfig({...config, nipDekan: e.target.value})}
                       className="bg-white"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <Label className="text-slate-700 font-semibold text-xs uppercase tracking-wider">2. Ketua Program Studi</Label>
                 <div className="grid grid-cols-1 gap-3">
                    <Input 
                       placeholder="Nama Lengkap & Gelar" 
                       value={config.namaKaprodi}
                       onChange={(e) => setConfig({...config, namaKaprodi: e.target.value})}
                       className="bg-white"
                    />
                    <Input 
                       placeholder="NIP / NIDN / NBM" 
                       value={config.nipKaprodi}
                       onChange={(e) => setConfig({...config, nipKaprodi: e.target.value})}
                       className="bg-white"
                    />
                 </div>
              </div>
            </div>

            {/* Preview Tanda Tangan Sederhana */}
            {(config.namaDekan || config.namaKaprodi) && (
              <div className="mt-4 p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <p className="text-[10px] text-gray-400 text-center mb-4 uppercase tracking-widest">Preview Tampilan di Laporan</p>
                <div className="flex justify-between text-center text-xs text-gray-800 gap-8">
                  <div className="flex-1">
                    <p className="mb-8">Mengetahui,<br/>Dekan Fakultas Teknik</p>
                    <p className="font-bold underline">{config.namaDekan || '(Nama Dekan Belum Diisi)'}</p>
                    <p>NBM. {config.nipDekan || '...'}</p>
                  </div>
                  <div className="flex-1">
                    <p className="mb-8">Makassar, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}<br/>Ketua Program Studi</p>
                    <p className="font-bold underline">{config.namaKaprodi || '(Nama Kaprodi Belum Diisi)'}</p>
                    <p>NBM. {config.nipKaprodi || '...'}</p>
                  </div>
                </div>
              </div>
            )}

          </CardContent>
        </Card>

        {/* 3. PERIODE (GENERAL) */}
        <Card className="border-slate-200 shadow-sm h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Periode Default Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Tahun Ajaran</Label>
              <Select defaultValue={config.tahunAjaran} onValueChange={(v) => setConfig({...config, tahunAjaran: v})}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024/2025">2024/2025</SelectItem>
                  <SelectItem value="2025/2026">2025/2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Semester</Label>
              <Select defaultValue={config.semesterAktif} onValueChange={(v) => setConfig({...config, semesterAktif: v})}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Ganjil</SelectItem>
                  <SelectItem value="2">Genap</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 4. DANGER ZONE */}
        <Card className="border-red-100 shadow-sm h-fit">
          <CardHeader className="bg-red-50/50 pb-3">
             <CardTitle className="text-base text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Pemeliharaan Sistem
             </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex items-center justify-between gap-4">
             <p className="text-xs text-slate-500">
                Gunakan tombol ini jika terjadi error pada tampilan atau data tidak sinkron.
             </p>
             <Button variant="outline" size="sm" onClick={handleClearCache} className="text-red-600 hover:bg-red-50 border-red-200 whitespace-nowrap">
                <Trash2 className="h-3 w-3 mr-2" /> Reset & Logout
             </Button>
          </CardContent>
        </Card>

      </div>

      {/* FLOATING ACTION BAR */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2 pointer-events-none">
         {success && (
            <div className="bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-in slide-in-from-right-10 fade-in duration-300">
              <CheckCircle2 className="h-5 w-5" />
              <span>Pengaturan berhasil disimpan!</span>
            </div>
         )}
         <Button 
            size="lg" 
            onClick={handleSave} 
            disabled={loading}
            className="pointer-events-auto rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 h-14 px-8 text-lg font-bold transition-all hover:scale-105 active:scale-95"
         >
            {loading ? <RefreshCw className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
         </Button>
      </div>

    </div>
  );
}
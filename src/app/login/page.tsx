'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, Lock, User, GraduationCap, Building2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // [CLEANUP] Bersihkan sesi saat halaman login dimuat
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.cookie = "simcpl_token=; path=/; max-age=0";
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulasi delay jaringan
    await new Promise(resolve => setTimeout(resolve, 800));

    // LOGIC LOGIN MOCKUP (KAPRODI)
    if (formData.username === "kaprodi" && formData.password === "kaprodi123") {
      const mockToken = "secure-mock-token-kaprodi-access-granted";
      const mockUserData = {
        id_user: 99,
        nama: "Kaprodi Teknik",
        email: "kaprodi@unismuh.ac.id",
        role: "kaprodi",
        id_prodi: 1 
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUserData));
        document.cookie = `simcpl_token=${mockToken}; path=/; max-age=86400; SameSite=Lax`;
      }

      router.push('/dashboard');
    } else {
      setError('Username atau password tidak valid.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      
      {/* === BAGIAN KIRI: BRANDING KAMPUS (Hanya muncul di Desktop) === */}
      <div className="hidden lg:flex flex-col justify-between bg-blue-900 relative overflow-hidden text-white p-12">
        {/* Background Pattern Abstrak */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        
        {/* Header Kiri */}
        <div className="relative z-10 flex items-center gap-3">
           {/* Placeholder Logo - Ganti dengan Image jika ada logo Unismuh */}
           <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/20">
              <Building2 className="h-6 w-6 text-white" />
           </div>
           <span className="font-semibold tracking-wider text-blue-100">FAKULTAS TEKNIK</span>
        </div>

        {/* Konten Utama Kiri */}
        <div className="relative z-10 space-y-4 max-w-lg">
           <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
             Sistem Informasi <br/>
             <span className="text-blue-300">CPL & OBE</span>
           </h1>
           <p className="text-lg text-blue-200 leading-relaxed font-light">
             Platform terintegrasi untuk evaluasi, pemantauan, dan pengukuran Capaian Pembelajaran Lulusan Universitas Muhammadiyah Makassar.
           </p>
        </div>

        {/* Footer Kiri */}
        <div className="relative z-10 flex items-center gap-4 text-sm text-blue-300/80">
           <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span>Academic Portal</span>
           </div>
           <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
           <span>&copy; 2025 Coconut Hacklab</span>
        </div>
      </div>

      {/* === BAGIAN KANAN: FORM LOGIN === */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="w-full max-w-md space-y-8">
          
          {/* Header Mobile (Logo Kampus) */}
          <div className="text-center lg:text-left">
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
              Login Pengguna
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Silakan masukkan kredensial akun akademik Anda.
            </p>
          </div>

          {/* Alert Error */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md animate-in slide-in-from-top-2">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-5">
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-700 font-semibold">Username / NIDN</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input 
                    id="username" 
                    name="username" 
                    type="text" 
                    required 
                    className="pl-10 h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500" 
                    placeholder="Masukkan username Anda"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                   <Label htmlFor="password" className="text-slate-700 font-semibold">Password</Label>
                   <Link href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                     Lupa password?
                   </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    required 
                    className="pl-10 h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500" 
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 bg-blue-700 hover:bg-blue-800 text-white font-bold text-base shadow-md transition-all hover:-translate-y-0.5"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Memverifikasi...</span>
                </div>
              ) : (
                "Masuk ke Sistem"
              )}
            </Button>
          </form>

          {/* Footer Mobile/Form */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-slate-50 px-2 text-slate-500">
                  Butuh bantuan? Hubungi Admin Prodi
                </span>
              </div>
            </div>
             <div className="mt-6 text-center">
                <Link href="/" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
                  ← Kembali ke Halaman Utama
                </Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
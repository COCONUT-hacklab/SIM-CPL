import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">UM</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Universitas Muhammadiyah Makassar</h1>
              <p className="text-sm text-gray-600">Sistem Management CPL - Fakultas Teknik</p>
            </div>
          </div>
          <Link 
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              Sistem Management 
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Capaian<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Pembelajaran Lulusan
              </span>
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              Platform digital terintegrasi untuk mengelola, memantau, dan mengevaluasi Capaian Pembelajaran Lulusan (CPL) 
              di 5 Program Studi Fakultas Teknik Universitas Muhammadiyah Makassar
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/login"
                className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all font-semibold"
              >
                Mulai Sekarang
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a 
                href="#features"
                className="inline-flex items-center bg-white hover:bg-gray-50 text-gray-800 text-lg px-8 py-4 rounded-lg shadow-md hover:shadow-lg transition-all font-semibold border border-gray-200"
              >
                Pelajari Lebih Lanjut
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">5</div>
              <div className="text-gray-600 text-sm">Program Studi</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">8</div>
              <div className="text-gray-600 text-sm">CPL per Prodi</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">144+</div>
              <div className="text-gray-600 text-sm">Total SKS</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">69</div>
              <div className="text-gray-600 text-sm">Mata Kuliah</div>
            </div>
          </div>
        </div>
      </section>

      {/* Program Studi Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Program Studi yang Didukung
              </h2>
              <p className="text-gray-600 text-lg">
                Sistem Management CPL melayani 5 Program Studi di Fakultas Teknik
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Informatika */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 hover:border-blue-400 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Teknik Informatika</h3>
                <p className="text-gray-700 text-sm mb-3">S1 Teknik Informatika (INF)</p>
                <div className="flex items-center text-sm text-gray-600 space-x-4">
                  <span>📚 69 MK</span>
                  <span>⏱️ 144 SKS</span>
                </div>
              </div>

              {/* Arsitektur */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200 hover:border-green-400 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Arsitektur</h3>
                <p className="text-gray-700 text-sm mb-3">S1 Arsitektur (ARS)</p>
                <div className="flex items-center text-sm text-gray-600 space-x-4">
                  <span>📚 50+ MK</span>
                  <span>⏱️ 145 SKS</span>
                </div>
              </div>

              {/* PWK */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200 hover:border-purple-400 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">PWK</h3>
                <p className="text-gray-700 text-sm mb-3">S1 Perencanaan Wilayah Kota</p>
                <div className="flex items-center text-sm text-gray-600 space-x-4">
                  <span>📚 50+ MK</span>
                  <span>⏱️ 144 SKS</span>
                </div>
              </div>

              {/* Sipil */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200 hover:border-orange-400 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Teknik Sipil</h3>
                <p className="text-gray-700 text-sm mb-3">S1 Teknik Sipil (SIP)</p>
                <div className="flex items-center text-sm text-gray-600 space-x-4">
                  <span>📚 50+ MK</span>
                  <span>⏱️ 144 SKS</span>
                </div>
              </div>

              {/* Elektro */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border-2 border-yellow-200 hover:border-yellow-400 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Teknik Elektro</h3>
                <p className="text-gray-700 text-sm mb-3">S1 Teknik Elektro (ELK)</p>
                <div className="flex items-center text-sm text-gray-600 space-x-4">
                  <span>📚 50+ MK</span>
                  <span>⏱️ 144 SKS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Fitur Unggulan Sistem
              </h2>
              <p className="text-gray-600 text-lg">
                Solusi lengkap untuk pengelolaan CPL yang efisien dan terintegrasi
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Dashboard Tree Diagram</h3>
                <p className="text-gray-600 text-sm">Visualisasi hierarki CPL [next] Mata Kuliah [next] CPMK yang interaktif dan mudah dipahami</p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Import Excel/CSV</h3>
                <p className="text-gray-600 text-sm">Upload nilai mahasiswa secara batch dari file Excel atau CSV dengan validasi otomatis</p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Input Nilai Manual</h3>
                <p className="text-gray-600 text-sm">Form input nilai per CPMK dengan kalkulasi otomatis dan distribusi ke CPL terkait</p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Laporan CPMK Breakdown</h3>
                <p className="text-gray-600 text-sm">Laporan detail dengan breakdown CPMK, bobot, dan kontribusi ke setiap CPL</p>
              </div>

              {/* Feature 5 */}
              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Manajemen Data</h3>
                <p className="text-gray-600 text-sm">4 tab terintegrasi: Import, Mahasiswa, Mata Kuliah, dan monitoring CPL & CPMK</p>
              </div>

              {/* Feature 6 */}
              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Visualisasi Radar Chart</h3>
                <p className="text-gray-600 text-sm">Grafik radar untuk overview 8 CPL dengan interpretasi status pencapaian</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Cara Kerja Sistem
              </h2>
              <p className="text-gray-600 text-lg">
                Proses kalkulasi CPL yang akurat dengan metode weighted average
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
                  <div className="text-4xl font-bold mb-3">01</div>
                  <h3 className="text-xl font-bold mb-3">Input Nilai MK</h3>
                  <p className="text-blue-100 text-sm">
                    Input nilai MK (Mata Kuliah) per-semester untuk masing-masing program studi.
                  </p>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
                  <div className="text-4xl font-bold mb-3">02</div>
                  <h3 className="text-xl font-bold mb-3">Kalkulasi Otomatis</h3>
                  <p className="text-green-100 text-sm">
                    Sistem menghitung kontribusi setiap CPMK ke CPL menggunakan weighted average dengan bobot MK dan CPMK.
                  </p>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <svg className="w-8 h-8 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
                <div className="text-4xl font-bold mb-3">03</div>
                <h3 className="text-xl font-bold mb-3">Laporan & Analisis</h3>
                <p className="text-purple-100 text-sm">
                  Dapatkan laporan lengkap dengan visualisasi, breakdown detail, dan status pencapaian CPL per mahasiswa.
                </p>
              </div>
            </div>

            {/* Formula */}
            <div className="mt-12 bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-3"> Formula Kalkulasi:</h4>
              <div className="bg-white rounded-lg p-4 font-mono text-sm text-gray-700 border border-gray-200">
                <div className="mb-2">Nilai MK = Σ (Nilai CPMK × Bobot CPMK)</div>
                <div className="mb-2">Bobot MK = 100% / Jumlah MK per CPL</div>
                <div>Nilai CPL = Σ (Nilai CPMK × Bobot MK × Bobot CPMK) / Σ (Bobot MK × Bobot CPMK)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Keuntungan Menggunakan Sistem
              </h2>
              <p className="text-gray-600 text-lg">
                Solusi yang memberikan nilai tambah untuk semua stakeholder
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Benefit 1 */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Efisiensi Waktu</h3>
                    <p className="text-gray-600 text-sm">Proses input dan kalkulasi nilai yang cepat, hemat waktu hingga 80% dibanding manual</p>
                  </div>
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Akurasi Tinggi</h3>
                    <p className="text-gray-600 text-sm">Kalkulasi otomatis meminimalkan human error, hasil lebih akurat dan konsisten</p>
                  </div>
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Monitoring Real-time</h3>
                    <p className="text-gray-600 text-sm">Pantau pencapaian CPL mahasiswa secara real-time dengan visualisasi yang jelas</p>
                  </div>
                </div>
              </div>

              {/* Benefit 4 */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Compliance SNPT</h3>
                    <p className="text-gray-600 text-sm">Sesuai dengan Standar Nasional Pendidikan Tinggi dan sistem OBE (Outcome-Based Education)</p>
                  </div>
                </div>
              </div>

              {/* Benefit 5 */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Kolaboratif</h3>
                    <p className="text-gray-600 text-sm">Mendukung kolaborasi antara kaprodi, dosen, dan admin dalam satu platform</p>
                  </div>
                </div>
              </div>

              {/* Benefit 6 */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Export Laporan</h3>
                    <p className="text-gray-600 text-sm">Ekspor laporan ke format PDF atau Excel untuk dokumentasi dan presentasi</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Siap Memulai?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Kelola CPL dengan lebih efisien menggunakan sistem terintegrasi kami
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/login"
                className="inline-flex items-center bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all font-semibold"
              >
                Login Sekarang
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a 
                href="https://github.com/COCONUT-hacklab/SIM-CPL"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-blue-700 hover:bg-blue-800 text-white text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all font-semibold"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                GitHub Repository
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* About */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">UM</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Sistem Management CPL</h3>
                  <p className="text-gray-400 text-sm">UNISMUH Makassar</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Platform digital terintegrasi untuk mengelola Capaian Pembelajaran Lulusan di 5 Program Studi Fakultas Teknik.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="https://github.com/COCONUT-hacklab/SIM-CPL" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/></svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/login" className="text-gray-400 hover:text-white transition-colors text-sm">Login</Link></li>
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm">Fitur</a></li>
                <li><a href="https://github.com/COCONUT-hacklab/SIM-CPL" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-sm">GitHub</a></li>
                <li><a href="https://unismuh.ac.id" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-sm">UNISMUH</a></li>
              </ul>
            </div>

            {/* Program Studi */}
            <div>
              <h3 className="font-bold mb-4">Program Studi</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Teknik Informatika</li>
                <li>Arsitektur</li>
                <li>Perencanaan Wilayah Kota</li>
                <li>Teknik Sipil</li>
                <li>Teknik Elektro</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 text-sm mb-2">
              © 2025 Universitas Muhammadiyah Makassar. All rights reserved.
            </p>
            <p className="text-gray-500 text-xs">
              Sistem Capaian Pembelajaran Lulusan v1.2 | Crafted with ❤️ by <a href="https://coconut.or.id/" target="_blank" rel="noopener noreferrer">COCONUTLab</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

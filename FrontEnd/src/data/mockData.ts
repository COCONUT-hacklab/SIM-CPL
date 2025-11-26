// ===== PRODI (PROGRAM STUDI) =====
export interface Prodi {
  kode: string;
  nama: string;
  fakultas: string;
  kaprodi: string;
}

export const prodiData: Prodi[] = [
  { kode: 'INF', nama: 'Teknik Informatika', fakultas: 'Teknik', kaprodi: 'Dr. Ahmad Informatika, M.Kom' },
  { kode: 'ARS', nama: 'Arsitektur', fakultas: 'Teknik', kaprodi: 'Dr. Budi Arsitektur, M.Arch' },
  { kode: 'PWK', nama: 'Perencanaan Wilayah dan Kota', fakultas: 'Teknik', kaprodi: 'Dr. Ir. Citra PWK, M.T' },
  { kode: 'SIP', nama: 'Teknik Sipil', fakultas: 'Teknik', kaprodi: 'Dr. Ir. Dedi Sipil, M.T' },
  { kode: 'ELK', nama: 'Teknik Elektro', fakultas: 'Teknik', kaprodi: 'Dr. Ir. Eka Elektro, M.T' },
];

// ===== DATA MAHASISWA =====
export interface Mahasiswa {
  id: string;
  npm: string;
  nama: string;
  prodiKode: string;
  angkatan: string;
  semesterAktif: number;
}

export const mahasiswaData: Mahasiswa[] = [
  // Teknik Informatika
  { id: '1', npm: '105231001001', nama: 'Ahmad Fauzi', prodiKode: 'INF', angkatan: '2021', semesterAktif: 7 },
  { id: '2', npm: '105231001002', nama: 'Siti Aisyah', prodiKode: 'INF', angkatan: '2022', semesterAktif: 5 },
  
  // Arsitektur
  { id: '3', npm: '105232101001', nama: 'Budi Santoso', prodiKode: 'ARS', angkatan: '2023', semesterAktif: 3 },
  { id: '4', npm: '105232101002', nama: 'Citra Dewi', prodiKode: 'ARS', angkatan: '2022', semesterAktif: 5 },
  { id: '5', npm: '105232101003', nama: 'Dedi Prasetyo', prodiKode: 'ARS', angkatan: '2022', semesterAktif: 6 },
  
  // PWK
  { id: '6', npm: '105233001001', nama: 'Eka Putri', prodiKode: 'PWK', angkatan: '2021', semesterAktif: 7 },
  { id: '7', npm: '105233001002', nama: 'Fahri Rahman', prodiKode: 'PWK', angkatan: '2022', semesterAktif: 5 },
  
  // Teknik Sipil
  { id: '8', npm: '105232201001', nama: 'Gita Sari', prodiKode: 'SIP', angkatan: '2021', semesterAktif: 7 },
  { id: '9', npm: '105232201002', nama: 'Hendra Wijaya', prodiKode: 'SIP', angkatan: '2022', semesterAktif: 5 },
  
  // Teknik Elektro
  { id: '10', npm: '105232301001', nama: 'Indah Permata', prodiKode: 'ELK', angkatan: '2021', semesterAktif: 7 },
  { id: '11', npm: '105232301002', nama: 'Joko Susilo', prodiKode: 'ELK', angkatan: '2022', semesterAktif: 5 },
];

// ===== CPL (CAPAIAN PEMBELAJARAN LULUSAN) =====
export interface CPL {
  kode: string;
  prodiKode: string;
  deskripsi: string;
  kategori: 'sikap' | 'pengetahuan' | 'keterampilan_umum' | 'keterampilan_khusus';
}

// CPL ARSITEKTUR (8 CPL)
export const cplData: CPL[] = [
  {
    kode: 'CPL1',
    prodiKode: 'ARS',
    deskripsi: 'Lulusan mampu menunjukkan integritas, etika profesi, nilai-nilai keislaman, tanggung jawab sosial, dan komitmen terhadap keberlanjutan dalam setiap praktik arsitektur',
    kategori: 'sikap'
  },
  {
    kode: 'CPL2',
    prodiKode: 'ARS',
    deskripsi: 'Lulusan mampu merancang bangunan, interior, tapak, dan ruang luar secara kreatif, humanis, inklusif, dan berkelanjutan, dengan mensintesis teori, konsep, konteks, nilai Islami, serta kebutuhan pengguna',
    kategori: 'keterampilan_khusus'
  },
  {
    kode: 'CPL3',
    prodiKode: 'ARS',
    deskripsi: 'Lulusan mampu menganalisis dan mengevaluasi sistem struktur beton, baja, dan konstruksi bangunan lainnya, serta menghasilkan solusi struktur dan ruang melalui penerapan mekanika bangunan',
    kategori: 'keterampilan_khusus'
  },
  {
    kode: 'CPL4',
    prodiKode: 'ARS',
    deskripsi: 'Lulusan mampu mengkaji dan mengevaluasi sejarah arsitektur dunia, arsitektur Islam, dan perkembangan arsitektur kontemporer, serta mengintegrasikan wawasan tersebut dalam desain',
    kategori: 'pengetahuan'
  },
  {
    kode: 'CPL5',
    prodiKode: 'ARS',
    deskripsi: 'Lulusan mampu menghasilkan komunikasi visual arsitektur dalam bentuk gambar 2D, 3D, simulasi, dan presentasi profesional',
    kategori: 'keterampilan_umum'
  },
  {
    kode: 'CPL6',
    prodiKode: 'ARS',
    deskripsi: 'Lulusan mampu merancang dan mengevaluasi struktur, konstruksi, material, dan detail bangunan berdasarkan kaidah teknis, aspek estetika, keamanan, topografi, dan teknologi',
    kategori: 'keterampilan_khusus'
  },
  {
    kode: 'CPL7',
    prodiKode: 'ARS',
    deskripsi: 'Lulusan mampu merancang dan mengevaluasi sistem utilitas dan kenyamanan bangunan (termal, penghawaan, pencahayaan, akustik) dengan mempertimbangkan iklim tropis',
    kategori: 'keterampilan_khusus'
  },
  {
    kode: 'CPL8',
    prodiKode: 'ARS',
    deskripsi: 'Lulusan mampu menghasilkan gambar kerja, laporan teknis-ilmiah, serta model digital berbasis BIM secara profesional',
    kategori: 'keterampilan_khusus'
  },
  
  // CPL TEKNIK INFORMATIKA (8 CPL)
  {
    kode: 'CPL1',
    prodiKode: 'INF',
    deskripsi: 'Mampu menunjukkan integritas, etika profesi, nilai-nilai keislaman, tanggung jawab sosial dalam pengembangan sistem informasi',
    kategori: 'sikap'
  },
  {
    kode: 'CPL2',
    prodiKode: 'INF',
    deskripsi: 'Mampu merancang, membangun, dan mengelola aplikasi berbasis komputer menggunakan metodologi rekayasa perangkat lunak',
    kategori: 'keterampilan_khusus'
  },
  {
    kode: 'CPL3',
    prodiKode: 'INF',
    deskripsi: 'Mampu menganalisis, merancang, dan mengimplementasikan basis data serta sistem manajemen database',
    kategori: 'keterampilan_khusus'
  },
  {
    kode: 'CPL4',
    prodiKode: 'INF',
    deskripsi: 'Mampu menguasai konsep algoritma, struktur data, dan pemrograman berorientasi objek',
    kategori: 'pengetahuan'
  },
  {
    kode: 'CPL5',
    prodiKode: 'INF',
    deskripsi: 'Mampu merancang dan mengimplementasikan jaringan komputer serta infrastruktur sistem',
    kategori: 'keterampilan_khusus'
  },
  {
    kode: 'CPL6',
    prodiKode: 'INF',
    deskripsi: 'Mampu mengembangkan aplikasi web dan mobile menggunakan framework modern',
    kategori: 'keterampilan_khusus'
  },
  {
    kode: 'CPL7',
    prodiKode: 'INF',
    deskripsi: 'Mampu menerapkan keamanan siber, kriptografi, dan pengelolaan resiko sistem informasi',
    kategori: 'keterampilan_khusus'
  },
  {
    kode: 'CPL8',
    prodiKode: 'INF',
    deskripsi: 'Mampu menggunakan teknologi AI/ML, Big Data, dan Cloud Computing dalam solusi sistem informasi',
    kategori: 'keterampilan_umum'
  },
  
  // CPL TEKNIK SIPIL (contoh 8 CPL)
  { kode: 'CPL1', prodiKode: 'SIP', deskripsi: 'Mampu menerapkan etika profesi dan nilai keislaman dalam praktik teknik sipil', kategori: 'sikap' },
  { kode: 'CPL2', prodiKode: 'SIP', deskripsi: 'Mampu merancang struktur bangunan sipil yang aman dan ekonomis', kategori: 'keterampilan_khusus' },
  { kode: 'CPL3', prodiKode: 'SIP', deskripsi: 'Mampu menganalisis dan merancang sistem transportasi', kategori: 'keterampilan_khusus' },
  { kode: 'CPL4', prodiKode: 'SIP', deskripsi: 'Mampu menguasai konsep mekanika tanah dan pondasi', kategori: 'pengetahuan' },
  { kode: 'CPL5', prodiKode: 'SIP', deskripsi: 'Mampu menggunakan software teknik sipil (AutoCAD, SAP2000, Civil3D)', kategori: 'keterampilan_umum' },
  { kode: 'CPL6', prodiKode: 'SIP', deskripsi: 'Mampu merencanakan dan mengelola proyek konstruksi', kategori: 'keterampilan_khusus' },
  { kode: 'CPL7', prodiKode: 'SIP', deskripsi: 'Mampu merancang sistem hidrologi dan sumber daya air', kategori: 'keterampilan_khusus' },
  { kode: 'CPL8', prodiKode: 'SIP', deskripsi: 'Mampu membuat laporan teknis dan dokumentasi proyek', kategori: 'keterampilan_umum' },
  // CPL TEKNIK ELEKTRO (contoh 8 CPL)
  { kode: 'CPL1', prodiKode: 'ELK', deskripsi: 'Mampu menerapkan etika profesi dan nilai keislaman dalam bidang elektro', kategori: 'sikap' },
  { kode: 'CPL2', prodiKode: 'ELK', deskripsi: 'Mampu merancang sistem tenaga listrik', kategori: 'keterampilan_khusus' },
  { kode: 'CPL3', prodiKode: 'ELK', deskripsi: 'Mampu menganalisis dan merancang sistem kontrol', kategori: 'keterampilan_khusus' },
  { kode: 'CPL4', prodiKode: 'ELK', deskripsi: 'Mampu menguasai elektronika daya dan konversi energi', kategori: 'pengetahuan' },
  { kode: 'CPL5', prodiKode: 'ELK', deskripsi: 'Mampu menggunakan software simulasi (MATLAB, PSCAD)', kategori: 'keterampilan_umum' },
  { kode: 'CPL6', prodiKode: 'ELK', deskripsi: 'Mampu merancang sistem telekomunikasi dan jaringan', kategori: 'keterampilan_khusus' },
  { kode: 'CPL7', prodiKode: 'ELK', deskripsi: 'Mampu mengembangkan sistem embedded dan IoT', kategori: 'keterampilan_khusus' },
  { kode: 'CPL8', prodiKode: 'ELK', deskripsi: 'Mampu membuat dokumentasi teknis dan presentasi', kategori: 'keterampilan_umum' },
  // CPL TEKNIK MESIN (contoh 8 CPL)
  { kode: 'CPL1', prodiKode: 'MES', deskripsi: 'Mampu menerapkan etika profesi dan nilai keislaman dalam teknik mesin', kategori: 'sikap' },
  { kode: 'CPL2', prodiKode: 'MES', deskripsi: 'Mampu merancang sistem mekanis dan termal', kategori: 'keterampilan_khusus' },
  { kode: 'CPL3', prodiKode: 'MES', deskripsi: 'Mampu menganalisis kekuatan material dan struktur mesin', kategori: 'keterampilan_khusus' },
  { kode: 'CPL4', prodiKode: 'MES', deskripsi: 'Mampu menguasai proses manufaktur dan produksi', kategori: 'pengetahuan' },
  { kode: 'CPL5', prodiKode: 'MES', deskripsi: 'Mampu menggunakan CAD/CAM (SolidWorks, CATIA)', kategori: 'keterampilan_umum' },
  { kode: 'CPL6', prodiKode: 'MES', deskripsi: 'Mampu merancang sistem konversi energi', kategori: 'keterampilan_khusus' },
  { kode: 'CPL7', prodiKode: 'MES', deskripsi: 'Mampu melakukan maintenance dan troubleshooting mesin', kategori: 'keterampilan_khusus' },
  { kode: 'CPL8', prodiKode: 'MES', deskripsi: 'Mampu membuat laporan teknis dan gambar teknik', kategori: 'keterampilan_umum' },
  // CPL TEKNIK INDUSTRI (contoh 8 CPL)
  { kode: 'CPL1', prodiKode: 'IND', deskripsi: 'Mampu menerapkan etika profesi dan nilai keislaman dalam teknik industri', kategori: 'sikap' },
  { kode: 'CPL2', prodiKode: 'IND', deskripsi: 'Mampu merancang sistem produksi dan operasi', kategori: 'keterampilan_khusus' },
  { kode: 'CPL3', prodiKode: 'IND', deskripsi: 'Mampu menganalisis dan mengoptimalkan proses industri', kategori: 'keterampilan_khusus' },
  { kode: 'CPL4', prodiKode: 'IND', deskripsi: 'Mampu menguasai manajemen kualitas dan supply chain', kategori: 'pengetahuan' },
  { kode: 'CPL5', prodiKode: 'IND', deskripsi: 'Mampu menggunakan software simulasi (Arena, FlexSim)', kategori: 'keterampilan_umum' },
  { kode: 'CPL6', prodiKode: 'IND', deskripsi: 'Mampu merancang tata letak pabrik dan ergonomi', kategori: 'keterampilan_khusus' },
  { kode: 'CPL7', prodiKode: 'IND', deskripsi: 'Mampu melakukan analisis biaya dan kelayakan proyek', kategori: 'keterampilan_khusus' },
  { kode: 'CPL8', prodiKode: 'IND', deskripsi: 'Mampu membuat laporan analisis dan rekomendasi', kategori: 'keterampilan_umum' },
];

// ===== CPMK (CAPAIAN PEMBELAJARAN MATA KULIAH) =====
export interface CPMK {
  kode: string;
  mkKode: string;
  deskripsi: string;
  bobot: number; // dalam persen (total per MK = 100%)
}

export const cpmkData: CPMK[] = [
  // SEMESTER I - Pancasila (ARS101)
  { kode: 'CPMK-ARS101-1', mkKode: 'ARS101', deskripsi: 'Memahami nilai-nilai Pancasila', bobot: 20 },
  { kode: 'CPMK-ARS101-2', mkKode: 'ARS101', deskripsi: 'Menerapkan Pancasila dalam kehidupan', bobot: 20 },
  { kode: 'CPMK-ARS101-3', mkKode: 'ARS101', deskripsi: 'Menganalisis tantangan implementasi Pancasila', bobot: 30 },
  { kode: 'CPMK-ARS101-4', mkKode: 'ARS101', deskripsi: 'Mengevaluasi penerapan Pancasila di masyarakat', bobot: 20 },
  { kode: 'CPMK-ARS101-5', mkKode: 'ARS101', deskripsi: 'Mengintegrasikan nilai Pancasila dalam profesi', bobot: 10 },
  
  // SEMESTER II - Studio Perancangan 1 (ARS205) - CONTOH LENGKAP
  { kode: 'CPMK-ARS205-1', mkKode: 'ARS205', deskripsi: 'Memahami prinsip dasar perancangan arsitektur', bobot: 20 },
  { kode: 'CPMK-ARS205-2', mkKode: 'ARS205', deskripsi: 'Menganalisis kebutuhan dan konteks tapak', bobot: 20 },
  { kode: 'CPMK-ARS205-3', mkKode: 'ARS205', deskripsi: 'Mengembangkan konsep desain yang kreatif', bobot: 30 },
  { kode: 'CPMK-ARS205-4', mkKode: 'ARS205', deskripsi: 'Menghasilkan gambar presentasi 2D dan 3D', bobot: 20 },
  { kode: 'CPMK-ARS205-5', mkKode: 'ARS205', deskripsi: 'Mempresentasikan desain secara profesional', bobot: 10 },
  
  // SEMESTER II - Struktur & Konstruksi 1 (ARS204)
  { kode: 'CPMK-ARS204-1', mkKode: 'ARS204', deskripsi: 'Memahami prinsip dasar struktur beton', bobot: 20 },
  { kode: 'CPMK-ARS204-2', mkKode: 'ARS204', deskripsi: 'Menganalisis beban struktur bangunan', bobot: 25 },
  { kode: 'CPMK-ARS204-3', mkKode: 'ARS204', deskripsi: 'Merancang elemen struktur beton sederhana', bobot: 30 },
  { kode: 'CPMK-ARS204-4', mkKode: 'ARS204', deskripsi: 'Mengevaluasi kekuatan dan keamanan struktur', bobot: 15 },
  { kode: 'CPMK-ARS204-5', mkKode: 'ARS204', deskripsi: 'Menggambar detail konstruksi beton', bobot: 10 },
  
  // SEMESTER III - Studio Perancangan 2 (ARS301)
  { kode: 'CPMK-ARS301-1', mkKode: 'ARS301', deskripsi: 'Menganalisis konteks sosial-budaya desain', bobot: 20 },
  { kode: 'CPMK-ARS301-2', mkKode: 'ARS301', deskripsi: 'Merancang bangunan residensial kompleks', bobot: 25 },
  { kode: 'CPMK-ARS301-3', mkKode: 'ARS301', deskripsi: 'Mengintegrasikan aspek struktur dan utilitas', bobot: 25 },
  { kode: 'CPMK-ARS301-4', mkKode: 'ARS301', deskripsi: 'Menghasilkan visualisasi 3D yang menarik', bobot: 20 },
  { kode: 'CPMK-ARS301-5', mkKode: 'ARS301', deskripsi: 'Mempresentasikan portofolio desain', bobot: 10 },
  
  // SEMESTER III - Struktur & Konstruksi 2 (ARS302)
  { kode: 'CPMK-ARS302-1', mkKode: 'ARS302', deskripsi: 'Memahami sistem struktur rangka beton', bobot: 20 },
  { kode: 'CPMK-ARS302-2', mkKode: 'ARS302', deskripsi: 'Menganalisis struktur bangunan bertingkat', bobot: 25 },
  { kode: 'CPMK-ARS302-3', mkKode: 'ARS302', deskripsi: 'Merancang balok dan kolom beton bertulang', bobot: 30 },
  { kode: 'CPMK-ARS302-4', mkKode: 'ARS302', deskripsi: 'Menghitung kebutuhan tulangan beton', bobot: 15 },
  { kode: 'CPMK-ARS302-5', mkKode: 'ARS302', deskripsi: 'Membuat gambar detail struktur beton', bobot: 10 },
  
  // SEMESTER V - Studio Perancangan 4 (ARS501)
  { kode: 'CPMK-ARS501-1', mkKode: 'ARS501', deskripsi: 'Menganalisis isu urban dan konteks kota', bobot: 20 },
  { kode: 'CPMK-ARS501-2', mkKode: 'ARS501', deskripsi: 'Merancang bangunan komersial atau publik', bobot: 25 },
  { kode: 'CPMK-ARS501-3', mkKode: 'ARS501', deskripsi: 'Mengintegrasikan teknologi hijau', bobot: 25 },
  { kode: 'CPMK-ARS501-4', mkKode: 'ARS501', deskripsi: 'Menghasilkan model BIM dan render fotorealistik', bobot: 20 },
  { kode: 'CPMK-ARS501-5', mkKode: 'ARS501', deskripsi: 'Melakukan presentasi desain yang komprehensif', bobot: 10 },
  
  // SEMESTER VI - Arsitektur Hijau (ARS603)
  { kode: 'CPMK-ARS603-1', mkKode: 'ARS603', deskripsi: 'Memahami prinsip arsitektur berkelanjutan', bobot: 20 },
  { kode: 'CPMK-ARS603-2', mkKode: 'ARS603', deskripsi: 'Menganalisis dampak lingkungan bangunan', bobot: 20 },
  { kode: 'CPMK-ARS603-3', mkKode: 'ARS603', deskripsi: 'Merancang bangunan hemat energi', bobot: 30 },
  { kode: 'CPMK-ARS603-4', mkKode: 'ARS603', deskripsi: 'Menerapkan material ramah lingkungan', bobot: 20 },
  { kode: 'CPMK-ARS603-5', mkKode: 'ARS603', deskripsi: 'Mengevaluasi kinerja energi bangunan', bobot: 10 },
  
  // SEMESTER VIII - Tugas Akhir (ARS801)
  { kode: 'CPMK-ARS801-1', mkKode: 'ARS801', deskripsi: 'Merumuskan permasalahan desain secara komprehensif', bobot: 20 },
  { kode: 'CPMK-ARS801-2', mkKode: 'ARS801', deskripsi: 'Mengembangkan metodologi perancangan', bobot: 20 },
  { kode: 'CPMK-ARS801-3', mkKode: 'ARS801', deskripsi: 'Merancang bangunan dengan kompleksitas tinggi', bobot: 30 },
  { kode: 'CPMK-ARS801-4', mkKode: 'ARS801', deskripsi: 'Menghasilkan gambar kerja dan dokumen lengkap', bobot: 20 },
  { kode: 'CPMK-ARS801-5', mkKode: 'ARS801', deskripsi: 'Mempertahankan desain di hadapan dewan penguji', bobot: 10 },
  
  // CPMK INFORMATIKA - SEMESTER I
  // INF105 - Algoritma & Pemrograman
  { kode: 'CPMK-INF105-1', mkKode: 'INF105', deskripsi: 'Memahami konsep algoritma dan flowchart', bobot: 20 },
  { kode: 'CPMK-INF105-2', mkKode: 'INF105', deskripsi: 'Menulis pseudocode untuk menyelesaikan masalah', bobot: 25 },
  { kode: 'CPMK-INF105-3', mkKode: 'INF105', deskripsi: 'Mengimplementasikan algoritma dalam bahasa pemrograman', bobot: 30 },
  { kode: 'CPMK-INF105-4', mkKode: 'INF105', deskripsi: 'Menganalisis kompleksitas algoritma', bobot: 15 },
  { kode: 'CPMK-INF105-5', mkKode: 'INF105', deskripsi: 'Menerapkan struktur kontrol dan perulangan', bobot: 10 },
  
  // INF104 - Matematika Diskrit
  { kode: 'CPMK-INF104-1', mkKode: 'INF104', deskripsi: 'Memahami logika proposisi dan predikat', bobot: 20 },
  { kode: 'CPMK-INF104-2', mkKode: 'INF104', deskripsi: 'Menerapkan teori himpunan dan relasi', bobot: 25 },
  { kode: 'CPMK-INF104-3', mkKode: 'INF104', deskripsi: 'Menganalisis graf dan pohon', bobot: 25 },
  { kode: 'CPMK-INF104-4', mkKode: 'INF104', deskripsi: 'Menyelesaikan masalah kombinatorik', bobot: 20 },
  { kode: 'CPMK-INF104-5', mkKode: 'INF104', deskripsi: 'Membuktikan teorema matematika diskrit', bobot: 10 },
  
  // INF106 - Pengantar Teknologi Informasi
  { kode: 'CPMK-INF106-1', mkKode: 'INF106', deskripsi: 'Memahami konsep sistem informasi', bobot: 20 },
  { kode: 'CPMK-INF106-2', mkKode: 'INF106', deskripsi: 'Mengidentifikasi komponen hardware dan software', bobot: 25 },
  { kode: 'CPMK-INF106-3', mkKode: 'INF106', deskripsi: 'Memahami arsitektur komputer dasar', bobot: 25 },
  { kode: 'CPMK-INF106-4', mkKode: 'INF106', deskripsi: 'Menggunakan sistem operasi dan aplikasi produktivitas', bobot: 20 },
  { kode: 'CPMK-INF106-5', mkKode: 'INF106', deskripsi: 'Memahami etika dan keamanan IT', bobot: 10 },
  
  // CPMK INFORMATIKA - SEMESTER II
  // INF202 - Struktur Data
  { kode: 'CPMK-INF202-1', mkKode: 'INF202', deskripsi: 'Memahami konsep Array, Stack, Queue', bobot: 25 },
  { kode: 'CPMK-INF202-2', mkKode: 'INF202', deskripsi: 'Mengimplementasikan Linked List', bobot: 20 },
  { kode: 'CPMK-INF202-3', mkKode: 'INF202', deskripsi: 'Menerapkan Tree dan Graph', bobot: 25 },
  { kode: 'CPMK-INF202-4', mkKode: 'INF202', deskripsi: 'Menganalisis kompleksitas struktur data', bobot: 20 },
  { kode: 'CPMK-INF202-5', mkKode: 'INF202', deskripsi: 'Memilih struktur data yang efisien', bobot: 10 },
  
  // INF203 - Pemrograman Berorientasi Objek
  { kode: 'CPMK-INF203-1', mkKode: 'INF203', deskripsi: 'Memahami konsep OOP (Class, Object)', bobot: 20 },
  { kode: 'CPMK-INF203-2', mkKode: 'INF203', deskripsi: 'Menerapkan Encapsulation dan Abstraction', bobot: 25 },
  { kode: 'CPMK-INF203-3', mkKode: 'INF203', deskripsi: 'Mengimplementasikan Inheritance dan Polymorphism', bobot: 30 },
  { kode: 'CPMK-INF203-4', mkKode: 'INF203', deskripsi: 'Menggunakan Interface dan Abstract Class', bobot: 15 },
  { kode: 'CPMK-INF203-5', mkKode: 'INF203', deskripsi: 'Mendesain aplikasi berbasis OOP', bobot: 10 },
  
  // INF207 - Pemrograman Web
  { kode: 'CPMK-INF207-1', mkKode: 'INF207', deskripsi: 'Memahami HTML, CSS, JavaScript', bobot: 25 },
  { kode: 'CPMK-INF207-2', mkKode: 'INF207', deskripsi: 'Membuat halaman web responsif', bobot: 20 },
  { kode: 'CPMK-INF207-3', mkKode: 'INF207', deskripsi: 'Mengimplementasikan form dan validasi', bobot: 25 },
  { kode: 'CPMK-INF207-4', mkKode: 'INF207', deskripsi: 'Menggunakan framework CSS (Bootstrap/Tailwind)', bobot: 20 },
  { kode: 'CPMK-INF207-5', mkKode: 'INF207', deskripsi: 'Menghubungkan frontend dengan backend', bobot: 10 },
  
  // Contoh CPMK untuk MK-MK lainnya (simplified untuk demo)
  { kode: 'CPMK-ARS108-1', mkKode: 'ARS108', deskripsi: 'Memahami konsep gaya dan momen', bobot: 25 },
  { kode: 'CPMK-ARS108-2', mkKode: 'ARS108', deskripsi: 'Menganalisis struktur statis tertentu', bobot: 25 },
  { kode: 'CPMK-ARS108-3', mkKode: 'ARS108', deskripsi: 'Menghitung reaksi perletakan', bobot: 25 },
  { kode: 'CPMK-ARS108-4', mkKode: 'ARS108', deskripsi: 'Membuat diagram gaya normal, geser, momen', bobot: 15 },
  { kode: 'CPMK-ARS108-5', mkKode: 'ARS108', deskripsi: 'Mengaplikasikan mekanika teknik dalam desain', bobot: 10 },
];

// ===== MAPPING CPMK KE CPL =====
export interface CPMKtoCPLMapping {
  cpmkKode: string;
  cplKode: string;
  bobot: number; // kontribusi CPMK terhadap CPL (dalam persen)
}

export const cpmkToCplMapping: CPMKtoCPLMapping[] = [
  // Studio Perancangan 1 (ARS205) → CPL2 (Perancangan), CPL5 (Komunikasi Visual)
  { cpmkKode: 'CPMK-ARS205-1', cplKode: 'CPL2', bobot: 25 },
  { cpmkKode: 'CPMK-ARS205-2', cplKode: 'CPL2', bobot: 20 },
  { cpmkKode: 'CPMK-ARS205-3', cplKode: 'CPL2', bobot: 30 },
  { cpmkKode: 'CPMK-ARS205-4', cplKode: 'CPL5', bobot: 40 },
  { cpmkKode: 'CPMK-ARS205-5', cplKode: 'CPL5', bobot: 35 },
  
  // Struktur & Konstruksi 1 (ARS204) → CPL3 (Analisis Struktur), CPL6 (Konstruksi)
  { cpmkKode: 'CPMK-ARS204-1', cplKode: 'CPL3', bobot: 30 },
  { cpmkKode: 'CPMK-ARS204-2', cplKode: 'CPL3', bobot: 35 },
  { cpmkKode: 'CPMK-ARS204-3', cplKode: 'CPL6', bobot: 40 },
  { cpmkKode: 'CPMK-ARS204-4', cplKode: 'CPL3', bobot: 20 },
  { cpmkKode: 'CPMK-ARS204-5', cplKode: 'CPL6', bobot: 25 },
  
  // Studio Perancangan 2 (ARS301) → CPL2, CPL5
  { cpmkKode: 'CPMK-ARS301-1', cplKode: 'CPL2', bobot: 20 },
  { cpmkKode: 'CPMK-ARS301-2', cplKode: 'CPL2', bobot: 30 },
  { cpmkKode: 'CPMK-ARS301-3', cplKode: 'CPL2', bobot: 25 },
  { cpmkKode: 'CPMK-ARS301-4', cplKode: 'CPL5', bobot: 45 },
  { cpmkKode: 'CPMK-ARS301-5', cplKode: 'CPL5', bobot: 30 },
  
  // Struktur & Konstruksi 2 (ARS302) → CPL3, CPL6
  { cpmkKode: 'CPMK-ARS302-1', cplKode: 'CPL3', bobot: 30 },
  { cpmkKode: 'CPMK-ARS302-2', cplKode: 'CPL3', bobot: 35 },
  { cpmkKode: 'CPMK-ARS302-3', cplKode: 'CPL6', bobot: 40 },
  { cpmkKode: 'CPMK-ARS302-4', cplKode: 'CPL6', bobot: 25 },
  { cpmkKode: 'CPMK-ARS302-5', cplKode: 'CPL6', bobot: 20 },
  
  // Studio Perancangan 4 (ARS501) → CPL2, CPL5
  { cpmkKode: 'CPMK-ARS501-1', cplKode: 'CPL2', bobot: 20 },
  { cpmkKode: 'CPMK-ARS501-2', cplKode: 'CPL2', bobot: 35 },
  { cpmkKode: 'CPMK-ARS501-3', cplKode: 'CPL2', bobot: 25 },
  { cpmkKode: 'CPMK-ARS501-4', cplKode: 'CPL5', bobot: 40 },
  { cpmkKode: 'CPMK-ARS501-5', cplKode: 'CPL5', bobot: 35 },
  
  // Arsitektur Hijau (ARS603) → CPL1 (Etika), CPL2 (Perancangan), CPL7 (Utilitas)
  { cpmkKode: 'CPMK-ARS603-1', cplKode: 'CPL1', bobot: 30 },
  { cpmkKode: 'CPMK-ARS603-2', cplKode: 'CPL7', bobot: 25 },
  { cpmkKode: 'CPMK-ARS603-3', cplKode: 'CPL2', bobot: 35 },
  { cpmkKode: 'CPMK-ARS603-4', cplKode: 'CPL7', bobot: 30 },
  { cpmkKode: 'CPMK-ARS603-5', cplKode: 'CPL7', bobot: 25 },
  
  // Tugas Akhir (ARS801) → Semua CPL (CPL1-8)
  { cpmkKode: 'CPMK-ARS801-1', cplKode: 'CPL1', bobot: 15 },
  { cpmkKode: 'CPMK-ARS801-1', cplKode: 'CPL4', bobot: 20 },
  { cpmkKode: 'CPMK-ARS801-2', cplKode: 'CPL2', bobot: 25 },
  { cpmkKode: 'CPMK-ARS801-3', cplKode: 'CPL2', bobot: 40 },
  { cpmkKode: 'CPMK-ARS801-3', cplKode: 'CPL3', bobot: 30 },
  { cpmkKode: 'CPMK-ARS801-3', cplKode: 'CPL6', bobot: 35 },
  { cpmkKode: 'CPMK-ARS801-3', cplKode: 'CPL7', bobot: 25 },
  { cpmkKode: 'CPMK-ARS801-4', cplKode: 'CPL5', bobot: 40 },
  { cpmkKode: 'CPMK-ARS801-4', cplKode: 'CPL8', bobot: 50 },
  { cpmkKode: 'CPMK-ARS801-5', cplKode: 'CPL5', bobot: 35 },
  
  // Mekanika Teknik (ARS108) → CPL3, CPL6
  { cpmkKode: 'CPMK-ARS108-1', cplKode: 'CPL3', bobot: 30 },
  { cpmkKode: 'CPMK-ARS108-2', cplKode: 'CPL3', bobot: 35 },
  { cpmkKode: 'CPMK-ARS108-3', cplKode: 'CPL3', bobot: 25 },
  { cpmkKode: 'CPMK-ARS108-4', cplKode: 'CPL6', bobot: 20 },
  { cpmkKode: 'CPMK-ARS108-5', cplKode: 'CPL6', bobot: 25 },
  
  // Pancasila (ARS101) → CPL1 (Sikap dan Etika)
  { cpmkKode: 'CPMK-ARS101-1', cplKode: 'CPL1', bobot: 25 },
  { cpmkKode: 'CPMK-ARS101-2', cplKode: 'CPL1', bobot: 30 },
  { cpmkKode: 'CPMK-ARS101-3', cplKode: 'CPL1', bobot: 20 },
  { cpmkKode: 'CPMK-ARS101-4', cplKode: 'CPL1', bobot: 15 },
  { cpmkKode: 'CPMK-ARS101-5', cplKode: 'CPL1', bobot: 10 },
  
  // INFORMATIKA - Algoritma & Pemrograman (INF105) → CPL4 (Algoritma & Struktur Data)
  { cpmkKode: 'CPMK-INF105-1', cplKode: 'CPL4', bobot: 20 },
  { cpmkKode: 'CPMK-INF105-2', cplKode: 'CPL4', bobot: 25 },
  { cpmkKode: 'CPMK-INF105-3', cplKode: 'CPL4', bobot: 30 },
  { cpmkKode: 'CPMK-INF105-4', cplKode: 'CPL4', bobot: 15 },
  { cpmkKode: 'CPMK-INF105-5', cplKode: 'CPL4', bobot: 10 },
  
  // INFORMATIKA - Matematika Diskrit (INF104) → CPL4
  { cpmkKode: 'CPMK-INF104-1', cplKode: 'CPL4', bobot: 20 },
  { cpmkKode: 'CPMK-INF104-2', cplKode: 'CPL4', bobot: 25 },
  { cpmkKode: 'CPMK-INF104-3', cplKode: 'CPL4', bobot: 25 },
  { cpmkKode: 'CPMK-INF104-4', cplKode: 'CPL4', bobot: 20 },
  { cpmkKode: 'CPMK-INF104-5', cplKode: 'CPL4', bobot: 10 },
  
  // INFORMATIKA - Pengantar Teknologi Informasi (INF106) → CPL2 (Pengembangan Sistem)
  { cpmkKode: 'CPMK-INF106-1', cplKode: 'CPL2', bobot: 20 },
  { cpmkKode: 'CPMK-INF106-2', cplKode: 'CPL2', bobot: 25 },
  { cpmkKode: 'CPMK-INF106-3', cplKode: 'CPL2', bobot: 25 },
  { cpmkKode: 'CPMK-INF106-4', cplKode: 'CPL2', bobot: 20 },
  { cpmkKode: 'CPMK-INF106-5', cplKode: 'CPL1', bobot: 10 },
  
  // INFORMATIKA - Struktur Data (INF202) → CPL4
  { cpmkKode: 'CPMK-INF202-1', cplKode: 'CPL4', bobot: 25 },
  { cpmkKode: 'CPMK-INF202-2', cplKode: 'CPL4', bobot: 20 },
  { cpmkKode: 'CPMK-INF202-3', cplKode: 'CPL4', bobot: 25 },
  { cpmkKode: 'CPMK-INF202-4', cplKode: 'CPL4', bobot: 20 },
  { cpmkKode: 'CPMK-INF202-5', cplKode: 'CPL4', bobot: 10 },
  
  // INFORMATIKA - Pemrograman Berorientasi Objek (INF203) → CPL2, CPL4
  { cpmkKode: 'CPMK-INF203-1', cplKode: 'CPL4', bobot: 20 },
  { cpmkKode: 'CPMK-INF203-2', cplKode: 'CPL4', bobot: 25 },
  { cpmkKode: 'CPMK-INF203-3', cplKode: 'CPL2', bobot: 30 },
  { cpmkKode: 'CPMK-INF203-4', cplKode: 'CPL2', bobot: 15 },
  { cpmkKode: 'CPMK-INF203-5', cplKode: 'CPL2', bobot: 10 },
  
  // INFORMATIKA - Pemrograman Web (INF207) → CPL6 (Web & Mobile Development)
  { cpmkKode: 'CPMK-INF207-1', cplKode: 'CPL6', bobot: 25 },
  { cpmkKode: 'CPMK-INF207-2', cplKode: 'CPL6', bobot: 20 },
  { cpmkKode: 'CPMK-INF207-3', cplKode: 'CPL6', bobot: 25 },
  { cpmkKode: 'CPMK-INF207-4', cplKode: 'CPL6', bobot: 20 },
  { cpmkKode: 'CPMK-INF207-5', cplKode: 'CPL6', bobot: 10 },
];

// ===== MATA KULIAH =====
export interface MataKuliah {
  kode: string;
  nama: string;
  sks: number;
  semester: number;
  prodiKode: string;
  dosen: string;
  cplTerkait: string[]; // Array kode CPL yang terkait
}

// MATA KULIAH ARSITEKTUR (145 SKS total, 8 semester)
export const mataKuliahData: MataKuliah[] = [
  // ===== SEMESTER I (20 SKS, 10 MK) =====
  { kode: 'ARS101', nama: 'Pancasila', sks: 2, semester: 1, prodiKode: 'ARS', dosen: 'Drs. Hamzah, M.Pd', cplTerkait: ['CPL1'] },
  { kode: 'ARS102', nama: 'Bahasa Indonesia', sks: 2, semester: 1, prodiKode: 'ARS', dosen: 'Dr. Siti Nurhaliza, M.Hum', cplTerkait: ['CPL5', 'CPL8'] },
  { kode: 'ARS103', nama: 'Pendidikan Agama Islam', sks: 2, semester: 1, prodiKode: 'ARS', dosen: 'Prof. Dr. Abdul Malik, M.Ag', cplTerkait: ['CPL1'] },
  { kode: 'ARS104', nama: 'Bahasa Inggris Teknik', sks: 2, semester: 1, prodiKode: 'ARS', dosen: 'Dr. Fatimah Zahra, M.A', cplTerkait: ['CPL5'] },
  { kode: 'ARS105', nama: 'Teknik Presentasi', sks: 2, semester: 1, prodiKode: 'ARS', dosen: 'Ir. Ridwan Hasan, M.Ds', cplTerkait: ['CPL5'] },
  { kode: 'ARS106', nama: 'Perkembangan Arsitektur 1', sks: 2, semester: 1, prodiKode: 'ARS', dosen: 'Dr. Nurhayati, S.T., M.Arch', cplTerkait: ['CPL4'] },
  { kode: 'ARS107', nama: 'Pengantar Arsitektur 1', sks: 2, semester: 1, prodiKode: 'ARS', dosen: 'Ir. Ahmad Kadir, M.Arch', cplTerkait: ['CPL2', 'CPL4'] },
  { kode: 'ARS108', nama: 'Mekanika Teknik', sks: 2, semester: 1, prodiKode: 'ARS', dosen: 'Dr. Ir. Bambang Suryanto', cplTerkait: ['CPL3', 'CPL6'] },
  { kode: 'ARS109', nama: 'Matematika Teknik', sks: 2, semester: 1, prodiKode: 'ARS', dosen: 'Dr. Hendra Wijaya, M.Si', cplTerkait: ['CPL3'] },
  { kode: 'ARS110', nama: 'ISBD', sks: 2, semester: 1, prodiKode: 'ARS', dosen: 'Dr. Aminah Rahman, M.Sos', cplTerkait: ['CPL1'] },
  
  // ===== SEMESTER II (20 SKS, 9 MK) =====
  { kode: 'ARS201', nama: 'Pendidikan Kewarganegaraan', sks: 2, semester: 2, prodiKode: 'ARS', dosen: 'Drs. Ibrahim Mahmud, M.Pd', cplTerkait: ['CPL1'] },
  { kode: 'ARS202', nama: 'Perkembangan Arsitektur 2', sks: 2, semester: 2, prodiKode: 'ARS', dosen: 'Dr. Nurhayati, S.T., M.Arch', cplTerkait: ['CPL4'] },
  { kode: 'ARS203', nama: 'Pengantar Arsitektur 2', sks: 2, semester: 2, prodiKode: 'ARS', dosen: 'Ir. Ahmad Kadir, M.Arch', cplTerkait: ['CPL2'] },
  { kode: 'ARS204', nama: 'Struktur & Konstruksi 1', sks: 3, semester: 2, prodiKode: 'ARS', dosen: 'Dr. Ir. Bambang Suryanto', cplTerkait: ['CPL3', 'CPL6'] },
  { kode: 'ARS205', nama: 'Studio Perancangan 1', sks: 4, semester: 2, prodiKode: 'ARS', dosen: 'Ir. Fadhil Akbar, M.Arch', cplTerkait: ['CPL2', 'CPL5'] },
  { kode: 'ARS206', nama: 'Utilitas Bangunan', sks: 2, semester: 2, prodiKode: 'ARS', dosen: 'Ir. Rizki Ramadhan, M.T', cplTerkait: ['CPL7'] },
  { kode: 'ARS207', nama: 'Fisika Bangunan 1', sks: 2, semester: 2, prodiKode: 'ARS', dosen: 'Dr. Ir. Suryani Hasan', cplTerkait: ['CPL7'] },
  { kode: 'ARS208', nama: 'Gambar Teknik', sks: 2, semester: 2, prodiKode: 'ARS', dosen: 'Ir. Dewi Lestari, M.T', cplTerkait: ['CPL5', 'CPL8'] },
  { kode: 'ARS209', nama: 'Arsitektur Digital 1', sks: 1, semester: 2, prodiKode: 'ARS', dosen: 'Ir. Fauzi Akmal, M.Kom', cplTerkait: ['CPL5', 'CPL8'] },
  
  // ===== SEMESTER III (24 SKS, 9 MK) =====
  { kode: 'ARS301', nama: 'Studio Perancangan 2', sks: 6, semester: 3, prodiKode: 'ARS', dosen: 'Ir. Fadhil Akbar, M.Arch', cplTerkait: ['CPL2', 'CPL5'] },
  { kode: 'ARS302', nama: 'Struktur & Konstruksi 2', sks: 3, semester: 3, prodiKode: 'ARS', dosen: 'Dr. Ir. Bambang Suryanto', cplTerkait: ['CPL3', 'CPL6'] },
  { kode: 'ARS303', nama: 'Arsitektur Vernakular', sks: 2, semester: 3, prodiKode: 'ARS', dosen: 'Dr. Yusuf Abdullah, M.Arch', cplTerkait: ['CPL4'] },
  { kode: 'ARS304', nama: 'Fisika Bangunan 2', sks: 2, semester: 3, prodiKode: 'ARS', dosen: 'Dr. Ir. Suryani Hasan', cplTerkait: ['CPL7'] },
  { kode: 'ARS305', nama: 'Metode Perancangan', sks: 2, semester: 3, prodiKode: 'ARS', dosen: 'Dr. Andi Syahrir, M.Arch', cplTerkait: ['CPL2'] },
  { kode: 'ARS306', nama: 'Arsitektur Digital 2', sks: 3, semester: 3, prodiKode: 'ARS', dosen: 'Ir. Fauzi Akmal, M.Kom', cplTerkait: ['CPL5', 'CPL8'] },
  { kode: 'ARS307', nama: 'Arsitektur Islam', sks: 2, semester: 3, prodiKode: 'ARS', dosen: 'Prof. Dr. Abdul Malik, M.Arch', cplTerkait: ['CPL1', 'CPL4'] },
  { kode: 'ARS308', nama: 'Perumahan & Permukiman', sks: 2, semester: 3, prodiKode: 'ARS', dosen: 'Dr. Hj. Nurjannah, M.T', cplTerkait: ['CPL2'] },
  { kode: 'ARS309', nama: 'Estetika Bentuk & Ruang', sks: 2, semester: 3, prodiKode: 'ARS', dosen: 'Ir. Siti Maryam, M.Ds', cplTerkait: ['CPL2'] },
  
  // ===== SEMESTER IV (26 SKS, 10 MK) =====
  { kode: 'ARS401', nama: 'Studio Perancangan 3', sks: 6, semester: 4, prodiKode: 'ARS', dosen: 'Ir. Fadhil Akbar, M.Arch', cplTerkait: ['CPL2', 'CPL5'] },
  { kode: 'ARS402', nama: 'Struktur & Konstruksi 3', sks: 3, semester: 4, prodiKode: 'ARS', dosen: 'Dr. Ir. Bambang Suryanto', cplTerkait: ['CPL3', 'CPL6'] },
  { kode: 'ARS403', nama: 'Arsitektur Nusantara', sks: 2, semester: 4, prodiKode: 'ARS', dosen: 'Dr. Yusuf Abdullah, M.Arch', cplTerkait: ['CPL4'] },
  { kode: 'ARS404', nama: 'Manajemen Konstruksi', sks: 2, semester: 4, prodiKode: 'ARS', dosen: 'Ir. Rahman Hidayat, M.M', cplTerkait: ['CPL6'] },
  { kode: 'ARS405', nama: 'Pengantar Perencanaan Tapak', sks: 2, semester: 4, prodiKode: 'ARS', dosen: 'Dr. Andi Syahrir, M.Arch', cplTerkait: ['CPL2'] },
  { kode: 'ARS406', nama: 'Interior Arsitektur', sks: 3, semester: 4, prodiKode: 'ARS', dosen: 'Ir. Siti Maryam, M.Ds', cplTerkait: ['CPL2'] },
  { kode: 'ARS407', nama: 'Arsitektur Digital 3', sks: 3, semester: 4, prodiKode: 'ARS', dosen: 'Ir. Fauzi Akmal, M.Kom', cplTerkait: ['CPL5', 'CPL8'] },
  { kode: 'ARS408', nama: 'Pengantar Perencanaan Kota', sks: 2, semester: 4, prodiKode: 'ARS', dosen: 'Dr. Hj. Nurjannah, M.T', cplTerkait: ['CPL2'] },
  { kode: 'ARS409', nama: 'Material & Teknologi Bangunan', sks: 2, semester: 4, prodiKode: 'ARS', dosen: 'Ir. Rizki Ramadhan, M.T', cplTerkait: ['CPL6'] },
  { kode: 'ARS410', nama: 'Kewirausahaan', sks: 1, semester: 4, prodiKode: 'ARS', dosen: 'Dr. Ahmad Fauzi, M.M', cplTerkait: ['CPL1'] },
  
  // ===== SEMESTER V (23 SKS, 10 MK) =====
  { kode: 'ARS501', nama: 'Studio Perancangan 4', sks: 6, semester: 5, prodiKode: 'ARS', dosen: 'Ir. Fadhil Akbar, M.Arch', cplTerkait: ['CPL2', 'CPL5'] },
  { kode: 'ARS502', nama: 'Struktur Baja & Kayu', sks: 3, semester: 5, prodiKode: 'ARS', dosen: 'Dr. Ir. Bambang Suryanto', cplTerkait: ['CPL3', 'CPL6'] },
  { kode: 'ARS503', nama: 'Teori Arsitektur', sks: 2, semester: 5, prodiKode: 'ARS', dosen: 'Dr. Andi Syahrir, M.Arch', cplTerkait: ['CPL4'] },
  { kode: 'ARS504', nama: 'Pemrograman Ruang & Bangunan', sks: 2, semester: 5, prodiKode: 'ARS', dosen: 'Ir. Ahmad Kadir, M.Arch', cplTerkait: ['CPL2'] },
  { kode: 'ARS505', nama: 'Lanskap Arsitektur', sks: 2, semester: 5, prodiKode: 'ARS', dosen: 'Dr. Hj. Nurjannah, M.T', cplTerkait: ['CPL2'] },
  { kode: 'ARS506', nama: 'Arsitektur Digital 4', sks: 3, semester: 5, prodiKode: 'ARS', dosen: 'Ir. Fauzi Akmal, M.Kom', cplTerkait: ['CPL5', 'CPL8'] },
  { kode: 'ARS507', nama: 'Metode Penelitian', sks: 2, semester: 5, prodiKode: 'ARS', dosen: 'Dr. Nurhayati, S.T., M.Arch', cplTerkait: ['CPL5'] },
  { kode: 'ARS508', nama: 'Arsitektur Kontemporer', sks: 2, semester: 5, prodiKode: 'ARS', dosen: 'Dr. Yusuf Abdullah, M.Arch', cplTerkait: ['CPL4'] },
  { kode: 'ARS509', nama: 'Praktik Kerja Profesi', sks: 1, semester: 5, prodiKode: 'ARS', dosen: 'Koordinator PKP', cplTerkait: ['CPL1', 'CPL6'] },
  
  // ===== SEMESTER VI (17 SKS, 7 MK) =====
  { kode: 'ARS601', nama: 'Studio Perancangan 5', sks: 6, semester: 6, prodiKode: 'ARS', dosen: 'Ir. Fadhil Akbar, M.Arch', cplTerkait: ['CPL2', 'CPL5'] },
  { kode: 'ARS602', nama: 'Struktur Bentang Lebar', sks: 3, semester: 6, prodiKode: 'ARS', dosen: 'Dr. Ir. Bambang Suryanto', cplTerkait: ['CPL3', 'CPL6'] },
  { kode: 'ARS603', nama: 'Arsitektur Hijau', sks: 2, semester: 6, prodiKode: 'ARS', dosen: 'Dr. Andi Syahrir, M.Arch', cplTerkait: ['CPL1', 'CPL2', 'CPL7'] },
  { kode: 'ARS604', nama: 'Seminar Proposal', sks: 2, semester: 6, prodiKode: 'ARS', dosen: 'Dr. Nurhayati, S.T., M.Arch', cplTerkait: ['CPL5', 'CPL8'] },
  { kode: 'ARS605', nama: 'Kritik & Apresiasi Arsitektur', sks: 2, semester: 6, prodiKode: 'ARS', dosen: 'Dr. Yusuf Abdullah, M.Arch', cplTerkait: ['CPL4'] },
  { kode: 'ARS606', nama: 'Hukum & Etika Profesi', sks: 2, semester: 6, prodiKode: 'ARS', dosen: 'Ir. Rahman Hidayat, M.M', cplTerkait: ['CPL1'] },
  
  // ===== SEMESTER VII (10 SKS, 3 MK) =====
  { kode: 'ARS701', nama: 'Studio Perancangan 6', sks: 6, semester: 7, prodiKode: 'ARS', dosen: 'Ir. Fadhil Akbar, M.Arch', cplTerkait: ['CPL2', 'CPL5', 'CPL8'] },
  { kode: 'ARS702', nama: 'Konservasi Bangunan', sks: 2, semester: 7, prodiKode: 'ARS', dosen: 'Dr. Yusuf Abdullah, M.Arch', cplTerkait: ['CPL4', 'CPL6'] },
  { kode: 'ARS703', nama: 'Arsitektur Kota', sks: 2, semester: 7, prodiKode: 'ARS', dosen: 'Dr. Hj. Nurjannah, M.T', cplTerkait: ['CPL2'] },
  
  // ===== SEMESTER VIII (10 SKS, 2 MK) =====
  { kode: 'ARS801', nama: 'Tugas Akhir', sks: 8, semester: 8, prodiKode: 'ARS', dosen: 'Pembimbing Tugas Akhir', cplTerkait: ['CPL1', 'CPL2', 'CPL3', 'CPL4', 'CPL5', 'CPL6', 'CPL7', 'CPL8'] },
  { kode: 'ARS802', nama: 'Kuliah Kerja Nyata (KKN)', sks: 2, semester: 8, prodiKode: 'ARS', dosen: 'Koordinator KKN', cplTerkait: ['CPL1'] },
  
  // MATA KULIAH TEKNIK INFORMATIKA (144 SKS total, 8 semester)
  // ===== SEMESTER I (18 SKS, 9 MK) =====
  { kode: 'INF101', nama: 'Pancasila', sks: 2, semester: 1, prodiKode: 'INF', dosen: 'Drs. Hamzah, M.Pd', cplTerkait: ['CPL1'] },
  { kode: 'INF102', nama: 'Bahasa Indonesia', sks: 2, semester: 1, prodiKode: 'INF', dosen: 'Dr. Siti Nurhaliza, M.Hum', cplTerkait: ['CPL1'] },
  { kode: 'INF103', nama: 'Pendidikan Agama Islam', sks: 2, semester: 1, prodiKode: 'INF', dosen: 'Prof. Dr. Abdul Malik, M.Ag', cplTerkait: ['CPL1'] },
  { kode: 'INF104', nama: 'Matematika Diskrit', sks: 3, semester: 1, prodiKode: 'INF', dosen: 'Dr. Ahmad Fauzi, M.Kom', cplTerkait: ['CPL4'] },
  { kode: 'INF105', nama: 'Algoritma & Pemrograman', sks: 3, semester: 1, prodiKode: 'INF', dosen: 'Dr. Budi Santoso, M.T', cplTerkait: ['CPL4'] },
  { kode: 'INF106', nama: 'Pengantar Teknologi Informasi', sks: 2, semester: 1, prodiKode: 'INF', dosen: 'Ir. Citra Dewi, M.Kom', cplTerkait: ['CPL2'] },
  { kode: 'INF107', nama: 'Logika Informatika', sks: 2, semester: 1, prodiKode: 'INF', dosen: 'Dr. Dedi Prasetyo, M.Sc', cplTerkait: ['CPL4'] },
  { kode: 'INF108', nama: 'Bahasa Inggris Teknik', sks: 2, semester: 1, prodiKode: 'INF', dosen: 'Dr. Fatimah Zahra, M.A', cplTerkait: ['CPL1'] },
  
  // ===== SEMESTER II (18 SKS, 9 MK) =====
  { kode: 'INF201', nama: 'Pendidikan Kewarganegaraan', sks: 2, semester: 2, prodiKode: 'INF', dosen: 'Drs. Ibrahim Mahmud, M.Pd', cplTerkait: ['CPL1'] },
  { kode: 'INF202', nama: 'Struktur Data', sks: 3, semester: 2, prodiKode: 'INF', dosen: 'Dr. Eka Putri, M.Kom', cplTerkait: ['CPL4'] },
  { kode: 'INF203', nama: 'Pemrograman Berorientasi Objek', sks: 3, semester: 2, prodiKode: 'INF', dosen: 'Dr. Fahri Rahman, M.T', cplTerkait: ['CPL2', 'CPL4'] },
  { kode: 'INF204', nama: 'Sistem Digital', sks: 3, semester: 2, prodiKode: 'INF', dosen: 'Ir. Gita Sari, M.T', cplTerkait: ['CPL4'] },
  { kode: 'INF205', nama: 'Aljabar Linear', sks: 2, semester: 2, prodiKode: 'INF', dosen: 'Dr. Hendra Wijaya, M.Si', cplTerkait: ['CPL4'] },
  { kode: 'INF206', nama: 'Sistem Operasi', sks: 2, semester: 2, prodiKode: 'INF', dosen: 'Dr. Indah Permata, M.Kom', cplTerkait: ['CPL5'] },
  { kode: 'INF207', nama: 'Pemrograman Web', sks: 3, semester: 2, prodiKode: 'INF', dosen: 'Ir. Joko Susilo, M.T', cplTerkait: ['CPL6'] },
  
  // ===== SEMESTER III (18 SKS, 9 MK) =====
  { kode: 'INF301', nama: 'Basis Data', sks: 3, semester: 3, prodiKode: 'INF', dosen: 'Dr. Karina Sari, M.Kom', cplTerkait: ['CPL3'] },
  { kode: 'INF302', nama: 'Analisis & Desain Sistem', sks: 3, semester: 3, prodiKode: 'INF', dosen: 'Dr. Lukman Hakim, M.T', cplTerkait: ['CPL2'] },
  { kode: 'INF303', nama: 'Jaringan Komputer', sks: 3, semester: 3, prodiKode: 'INF', dosen: 'Dr. Mira Handayani, M.Kom', cplTerkait: ['CPL5'] },
  { kode: 'INF304', nama: 'Rekayasa Perangkat Lunak', sks: 3, semester: 3, prodiKode: 'INF', dosen: 'Dr. Nurul Fikri, M.T', cplTerkait: ['CPL2'] },
  { kode: 'INF305', nama: 'Statistika & Probabilitas', sks: 2, semester: 3, prodiKode: 'INF', dosen: 'Dr. Omar Syarif, M.Si', cplTerkait: ['CPL4'] },
  { kode: 'INF306', nama: 'Manajemen Basis Data', sks: 2, semester: 3, prodiKode: 'INF', dosen: 'Ir. Putri Ayu, M.Kom', cplTerkait: ['CPL3'] },
  { kode: 'INF307', nama: 'Interaksi Manusia Komputer', sks: 2, semester: 3, prodiKode: 'INF', dosen: 'Dr. Qori Santosa, M.Ds', cplTerkait: ['CPL6'] },
  
  // ===== SEMESTER IV (18 SKS, 9 MK) =====
  { kode: 'INF401', nama: 'Pemrograman Mobile', sks: 3, semester: 4, prodiKode: 'INF', dosen: 'Dr. Rina Wati, M.Kom', cplTerkait: ['CPL6'] },
  { kode: 'INF402', nama: 'Kecerdasan Buatan', sks: 3, semester: 4, prodiKode: 'INF', dosen: 'Dr. Satria Mandala, M.Kom', cplTerkait: ['CPL8'] },
  { kode: 'INF403', nama: 'Sistem Informasi Manajemen', sks: 2, semester: 4, prodiKode: 'INF', dosen: 'Dr. Tika Permata, M.M', cplTerkait: ['CPL2'] },
  { kode: 'INF404', nama: 'Arsitektur Komputer', sks: 3, semester: 4, prodiKode: 'INF', dosen: 'Dr. Umar Bakri, M.T', cplTerkait: ['CPL4'] },
  { kode: 'INF405', nama: 'Keamanan Sistem Informasi', sks: 3, semester: 4, prodiKode: 'INF', dosen: 'Dr. Vina Safitri, M.Kom', cplTerkait: ['CPL7'] },
  { kode: 'INF406', nama: 'Pemrograman Framework', sks: 2, semester: 4, prodiKode: 'INF', dosen: 'Ir. Wahyu Hidayat, M.Kom', cplTerkait: ['CPL6'] },
  { kode: 'INF407', nama: 'Metode Penelitian', sks: 2, semester: 4, prodiKode: 'INF', dosen: 'Prof. Dr. Yusuf Rahman, M.Kom', cplTerkait: ['CPL1'] },
  
  // ===== SEMESTER V (18 SKS, 9 MK) =====
  { kode: 'INF501', nama: 'Pengolahan Citra Digital', sks: 3, semester: 5, prodiKode: 'INF', dosen: 'Dr. Zahra Amelia, M.Kom', cplTerkait: ['CPL8'] },
  { kode: 'INF502', nama: 'Data Mining', sks: 3, semester: 5, prodiKode: 'INF', dosen: 'Dr. Ahmad Fauzi, M.Kom', cplTerkait: ['CPL8'] },
  { kode: 'INF503', nama: 'Sistem Terdistribusi', sks: 3, semester: 5, prodiKode: 'INF', dosen: 'Dr. Budi Santoso, M.T', cplTerkait: ['CPL5'] },
  { kode: 'INF504', nama: 'E-Business', sks: 2, semester: 5, prodiKode: 'INF', dosen: 'Dr. Citra Dewi, M.M', cplTerkait: ['CPL2'] },
  { kode: 'INF505', nama: 'Komputer Grafik', sks: 2, semester: 5, prodiKode: 'INF', dosen: 'Ir. Dedi Prasetyo, M.Kom', cplTerkait: ['CPL6'] },
  { kode: 'INF506', nama: 'Manajemen Proyek SI', sks: 2, semester: 5, prodiKode: 'INF', dosen: 'Dr. Eka Putri, M.M', cplTerkait: ['CPL2'] },
  { kode: 'INF507', nama: 'Etika Profesi IT', sks: 2, semester: 5, prodiKode: 'INF', dosen: 'Prof. Dr. Abdul Malik, M.Ag', cplTerkait: ['CPL1'] },
  { kode: 'INF508', nama: 'Technopreneurship', sks: 1, semester: 5, prodiKode: 'INF', dosen: 'Dr. Fahri Rahman, M.M', cplTerkait: ['CPL1'] },
  
  // ===== SEMESTER VI (18 SKS, 9 MK) =====
  { kode: 'INF601', nama: 'Machine Learning', sks: 3, semester: 6, prodiKode: 'INF', dosen: 'Dr. Gita Sari, M.Kom', cplTerkait: ['CPL8'] },
  { kode: 'INF602', nama: 'Cloud Computing', sks: 3, semester: 6, prodiKode: 'INF', dosen: 'Dr. Hendra Wijaya, M.Kom', cplTerkait: ['CPL8'] },
  { kode: 'INF603', nama: 'Internet of Things', sks: 3, semester: 6, prodiKode: 'INF', dosen: 'Dr. Indah Permata, M.T', cplTerkait: ['CPL6'] },
  { kode: 'INF604', nama: 'Big Data Analytics', sks: 3, semester: 6, prodiKode: 'INF', dosen: 'Dr. Joko Susilo, M.Kom', cplTerkait: ['CPL8'] },
  { kode: 'INF605', nama: 'Blockchain Technology', sks: 2, semester: 6, prodiKode: 'INF', dosen: 'Dr. Karina Sari, M.Kom', cplTerkait: ['CPL7'] },
  { kode: 'INF606', nama: 'DevOps & CI/CD', sks: 2, semester: 6, prodiKode: 'INF', dosen: 'Ir. Lukman Hakim, M.Kom', cplTerkait: ['CPL6'] },
  { kode: 'INF607', nama: 'Audit Sistem Informasi', sks: 2, semester: 6, prodiKode: 'INF', dosen: 'Dr. Mira Handayani, M.Ak', cplTerkait: ['CPL7'] },
  
  // ===== SEMESTER VII (18 SKS) =====
  { kode: 'INF701', nama: 'Kerja Praktek', sks: 2, semester: 7, prodiKode: 'INF', dosen: 'Koordinator KP', cplTerkait: ['CPL1', 'CPL2'] },
  { kode: 'INF702', nama: 'Proyek Sistem Informasi', sks: 4, semester: 7, prodiKode: 'INF', dosen: 'Tim Pembimbing', cplTerkait: ['CPL2', 'CPL3', 'CPL6'] },
  { kode: 'INF703', nama: 'Deep Learning', sks: 3, semester: 7, prodiKode: 'INF', dosen: 'Dr. Nurul Fikri, M.Kom', cplTerkait: ['CPL8'] },
  { kode: 'INF704', nama: 'Cyber Security', sks: 3, semester: 7, prodiKode: 'INF', dosen: 'Dr. Omar Syarif, M.Kom', cplTerkait: ['CPL7'] },
  { kode: 'INF705', nama: 'Sistem Embedded', sks: 3, semester: 7, prodiKode: 'INF', dosen: 'Dr. Putri Ayu, M.T', cplTerkait: ['CPL5'] },
  { kode: 'INF706', nama: 'Pilihan 1', sks: 3, semester: 7, prodiKode: 'INF', dosen: 'Dosen Pilihan', cplTerkait: ['CPL6', 'CPL8'] },
  
  // ===== SEMESTER VIII (18 SKS) =====
  { kode: 'INF801', nama: 'Tugas Akhir', sks: 6, semester: 8, prodiKode: 'INF', dosen: 'Pembimbing Tugas Akhir', cplTerkait: ['CPL1', 'CPL2', 'CPL3', 'CPL4', 'CPL5', 'CPL6', 'CPL7', 'CPL8'] },
  { kode: 'INF802', nama: 'Kuliah Kerja Nyata (KKN)', sks: 2, semester: 8, prodiKode: 'INF', dosen: 'Koordinator KKN', cplTerkait: ['CPL1'] },
  { kode: 'INF803', nama: 'Computer Vision', sks: 3, semester: 8, prodiKode: 'INF', dosen: 'Dr. Qori Santosa, M.Kom', cplTerkait: ['CPL8'] },
  { kode: 'INF804', nama: 'Natural Language Processing', sks: 3, semester: 8, prodiKode: 'INF', dosen: 'Dr. Rina Wati, M.Kom', cplTerkait: ['CPL8'] },
  { kode: 'INF805', nama: 'Pilihan 2', sks: 2, semester: 8, prodiKode: 'INF', dosen: 'Dosen Pilihan', cplTerkait: ['CPL6', 'CPL8'] },
  { kode: 'INF806', nama: 'Pilihan 3', sks: 2, semester: 8, prodiKode: 'INF', dosen: 'Dosen Pilihan', cplTerkait: ['CPL6', 'CPL8'] },
  
  // Contoh MK prodi lain (simplified)
  { kode: 'SIP101', nama: 'Mekanika Teknik', sks: 3, semester: 1, prodiKode: 'SIP', dosen: 'Dr. Ir. Gunawan, M.T', cplTerkait: ['CPL3'] },
  { kode: 'ELK101', nama: 'Rangkaian Listrik', sks: 3, semester: 1, prodiKode: 'ELK', dosen: 'Dr. Ir. Sulaiman, M.T', cplTerkait: ['CPL2'] },
  { kode: 'MES101', nama: 'Menggambar Mesin', sks: 3, semester: 1, prodiKode: 'MES', dosen: 'Ir. Harun, M.T', cplTerkait: ['CPL5'] },
  { kode: 'IND101', nama: 'Pengantar Teknik Industri', sks: 3, semester: 1, prodiKode: 'IND', dosen: 'Dr. Ir. Rahma, M.T', cplTerkait: ['CPL2'] },
];

// ===== NILAI MAHASISWA =====
export interface NilaiMahasiswa {
  id: string;
  mahasiswaId: string;
  mkKode: string;
  semester: string;
  tahunAjaran: string;
  nilaiAkhir: number;
  grade: string;
  nilaiCPMK: { cpmkKode: string; nilai: number }[];
}

export const nilaiMahasiswaData: NilaiMahasiswa[] = [
  // Mahasiswa Ahmad Fauzi (mahasiswaId: '1') - Informatika Semester 5
  // SEMESTER 1
  {
    id: 'N001',
    mahasiswaId: '1',
    mkKode: 'INF105',
    semester: 'Ganjil',
    tahunAjaran: '2021/2022',
    nilaiAkhir: 85.5,
    grade: 'A',
    nilaiCPMK: [
      { cpmkKode: 'CPMK-INF105-1', nilai: 84 },
      { cpmkKode: 'CPMK-INF105-2', nilai: 87 },
      { cpmkKode: 'CPMK-INF105-3', nilai: 85 },
      { cpmkKode: 'CPMK-INF105-4', nilai: 88 },
      { cpmkKode: 'CPMK-INF105-5', nilai: 83 },
    ]
  },
  {
    id: 'N002',
    mahasiswaId: '1',
    mkKode: 'INF104',
    semester: 'Ganjil',
    tahunAjaran: '2021/2022',
    nilaiAkhir: 82.0,
    grade: 'A-',
    nilaiCPMK: [
      { cpmkKode: 'CPMK-INF104-1', nilai: 80 },
      { cpmkKode: 'CPMK-INF104-2', nilai: 83 },
      { cpmkKode: 'CPMK-INF104-3', nilai: 82 },
      { cpmkKode: 'CPMK-INF104-4', nilai: 84 },
      { cpmkKode: 'CPMK-INF104-5', nilai: 81 },
    ]
  },
  {
    id: 'N003',
    mahasiswaId: '1',
    mkKode: 'INF106',
    semester: 'Ganjil',
    tahunAjaran: '2021/2022',
    nilaiAkhir: 88.0,
    grade: 'A',
    nilaiCPMK: [
      { cpmkKode: 'CPMK-INF106-1', nilai: 87 },
      { cpmkKode: 'CPMK-INF106-2', nilai: 89 },
      { cpmkKode: 'CPMK-INF106-3', nilai: 88 },
      { cpmkKode: 'CPMK-INF106-4', nilai: 87 },
      { cpmkKode: 'CPMK-INF106-5', nilai: 89 },
    ]
  },
  // SEMESTER 2
  {
    id: 'N004',
    mahasiswaId: '1',
    mkKode: 'INF202',
    semester: 'Genap',
    tahunAjaran: '2021/2022',
    nilaiAkhir: 83.5,
    grade: 'A-',
    nilaiCPMK: [
      { cpmkKode: 'CPMK-INF202-1', nilai: 82 },
      { cpmkKode: 'CPMK-INF202-2', nilai: 85 },
      { cpmkKode: 'CPMK-INF202-3', nilai: 83 },
      { cpmkKode: 'CPMK-INF202-4', nilai: 84 },
      { cpmkKode: 'CPMK-INF202-5', nilai: 84 },
    ]
  },
  {
    id: 'N005',
    mahasiswaId: '1',
    mkKode: 'INF203',
    semester: 'Genap',
    tahunAjaran: '2021/2022',
    nilaiAkhir: 86.0,
    grade: 'A',
    nilaiCPMK: [
      { cpmkKode: 'CPMK-INF203-1', nilai: 85 },
      { cpmkKode: 'CPMK-INF203-2', nilai: 87 },
      { cpmkKode: 'CPMK-INF203-3', nilai: 86 },
      { cpmkKode: 'CPMK-INF203-4', nilai: 85 },
      { cpmkKode: 'CPMK-INF203-5', nilai: 87 },
    ]
  },
  {
    id: 'N006',
    mahasiswaId: '1',
    mkKode: 'INF207',
    semester: 'Genap',
    tahunAjaran: '2021/2022',
    nilaiAkhir: 89.0,
    grade: 'A',
    nilaiCPMK: [
      { cpmkKode: 'CPMK-INF207-1', nilai: 88 },
      { cpmkKode: 'CPMK-INF207-2', nilai: 90 },
      { cpmkKode: 'CPMK-INF207-3', nilai: 89 },
      { cpmkKode: 'CPMK-INF207-4', nilai: 88 },
      { cpmkKode: 'CPMK-INF207-5', nilai: 90 },
    ]
  },
  
  // Mahasiswa Siti Aisyah (mahasiswaId: '2') - Informatika Semester 5
  // SEMESTER 1
  {
    id: 'N007',
    mahasiswaId: '2',
    mkKode: 'INF105',
    semester: 'Ganjil',
    tahunAjaran: '2022/2023',
    nilaiAkhir: 80.0,
    grade: 'A-',
    nilaiCPMK: [
      { cpmkKode: 'CPMK-INF105-1', nilai: 78 },
      { cpmkKode: 'CPMK-INF105-2', nilai: 82 },
      { cpmkKode: 'CPMK-INF105-3', nilai: 80 },
      { cpmkKode: 'CPMK-INF105-4', nilai: 81 },
      { cpmkKode: 'CPMK-INF105-5', nilai: 79 },
    ]
  },
  {
    id: 'N008',
    mahasiswaId: '2',
    mkKode: 'INF104',
    semester: 'Ganjil',
    tahunAjaran: '2022/2023',
    nilaiAkhir: 78.5,
    grade: 'B+',
    nilaiCPMK: [
      { cpmkKode: 'CPMK-INF104-1', nilai: 77 },
      { cpmkKode: 'CPMK-INF104-2', nilai: 80 },
      { cpmkKode: 'CPMK-INF104-3', nilai: 78 },
      { cpmkKode: 'CPMK-INF104-4', nilai: 79 },
      { cpmkKode: 'CPMK-INF104-5', nilai: 79 },
    ]
  },
  {
    id: 'N009',
    mahasiswaId: '2',
    mkKode: 'INF106',
    semester: 'Ganjil',
    tahunAjaran: '2022/2023',
    nilaiAkhir: 84.0,
    grade: 'A-',
    nilaiCPMK: [
      { cpmkKode: 'CPMK-INF106-1', nilai: 83 },
      { cpmkKode: 'CPMK-INF106-2', nilai: 85 },
      { cpmkKode: 'CPMK-INF106-3', nilai: 84 },
      { cpmkKode: 'CPMK-INF106-4', nilai: 83 },
      { cpmkKode: 'CPMK-INF106-5', nilai: 85 },
    ]
  },
  // SEMESTER 2
  {
    id: 'N010',
    mahasiswaId: '2',
    mkKode: 'INF202',
    semester: 'Genap',
    tahunAjaran: '2022/2023',
    nilaiAkhir: 79.0,
    grade: 'B+',
    nilaiCPMK: [
      { cpmkKode: 'CPMK-INF202-1', nilai: 77 },
      { cpmkKode: 'CPMK-INF202-2', nilai: 81 },
      { cpmkKode: 'CPMK-INF202-3', nilai: 79 },
      { cpmkKode: 'CPMK-INF202-4', nilai: 78 },
      { cpmkKode: 'CPMK-INF202-5', nilai: 80 },
    ]
  },
  {
    id: 'N011',
    mahasiswaId: '2',
    mkKode: 'INF203',
    semester: 'Genap',
    tahunAjaran: '2022/2023',
    nilaiAkhir: 82.0,
    grade: 'A-',
    nilaiCPMK: [
      { cpmkKode: 'CPMK-INF203-1', nilai: 80 },
      { cpmkKode: 'CPMK-INF203-2', nilai: 83 },
      { cpmkKode: 'CPMK-INF203-3', nilai: 82 },
      { cpmkKode: 'CPMK-INF203-4', nilai: 82 },
      { cpmkKode: 'CPMK-INF203-5', nilai: 83 },
    ]
  },
  {
    id: 'N012',
    mahasiswaId: '2',
    mkKode: 'INF207',
    semester: 'Genap',
    tahunAjaran: '2022/2023',
    nilaiAkhir: 85.5,
    grade: 'A',
    nilaiCPMK: [
      { cpmkKode: 'CPMK-INF207-1', nilai: 84 },
      { cpmkKode: 'CPMK-INF207-2', nilai: 87 },
      { cpmkKode: 'CPMK-INF207-3', nilai: 85 },
      { cpmkKode: 'CPMK-INF207-4', nilai: 86 },
      { cpmkKode: 'CPMK-INF207-5', nilai: 86 },
    ]
  },
  
  // Mahasiswa Budi Santoso (mahasiswaId: '3') - Arsitektur Semester 3
  // SEMESTER 2
  {
    id: 'N004',
    mahasiswaId: '2',
    mkKode: 'ARS501',
    semester: 'Ganjil',
    tahunAjaran: '2024/2025',
    nilaiAkhir: 88.6,
    grade: 'A',
    nilaiCPMK: [
      { cpmkKode: 'CPMK-ARS501-1', nilai: 86 },
      { cpmkKode: 'CPMK-ARS501-2', nilai: 90 },
      { cpmkKode: 'CPMK-ARS501-3', nilai: 88 },
      { cpmkKode: 'CPMK-ARS501-4', nilai: 89 },
      { cpmkKode: 'CPMK-ARS501-5', nilai: 90 },
    ]
  },
  {
    id: 'N005',
    mahasiswaId: '2',
    mkKode: 'ARS204',
    semester: 'Genap',
    tahunAjaran: '2021/2022',
    nilaiAkhir: 82.5,
    grade: 'A-',
    nilaiCPMK: [
      { cpmkKode: 'CPMK-ARS204-1', nilai: 80 },
      { cpmkKode: 'CPMK-ARS204-2', nilai: 84 },
      { cpmkKode: 'CPMK-ARS204-3', nilai: 83 },
      { cpmkKode: 'CPMK-ARS204-4', nilai: 82 },
      { cpmkKode: 'CPMK-ARS204-5', nilai: 84 },
    ]
  },
  {
    id: 'N006',
    mahasiswaId: '2',
    mkKode: 'ARS205',
    semester: 'Genap',
    tahunAjaran: '2021/2022',
    nilaiAkhir: 86.0,
    grade: 'A',
    nilaiCPMK: [
      { cpmkKode: 'CPMK-ARS205-1', nilai: 84 },
      { cpmkKode: 'CPMK-ARS205-2', nilai: 85 },
      { cpmkKode: 'CPMK-ARS205-3', nilai: 88 },
      { cpmkKode: 'CPMK-ARS205-4', nilai: 87 },
      { cpmkKode: 'CPMK-ARS205-5', nilai: 86 },
    ]
  },
  
  // ========== MAHASISWA BUDI SANTOSO (ID: 3) - Semester 3 Aktif ==========
  // Data Semester 2 (sudah selesai)
  {
    id: 'N007',
    mahasiswaId: '3',
    mkKode: 'ARS201', // Kewarganegaraan
    semester: 'Genap',
    tahunAjaran: '2022/2023',
    nilaiAkhir: 82,
    grade: 'A-',
    nilaiCPMK: [
      { cpmkKode: 'CPMK-ARS201-1', nilai: 82 * 0.2 },
      { cpmkKode: 'CPMK-ARS201-2', nilai: 82 * 0.2 },
      { cpmkKode: 'CPMK-ARS201-3', nilai: 82 * 0.3 },
      { cpmkKode: 'CPMK-ARS201-4', nilai: 82 * 0.2 },
      { cpmkKode: 'CPMK-ARS201-5', nilai: 82 * 0.1 },
    ]
  },
  {
    id: 'N008',
    mahasiswaId: '3',
    mkKode: 'CW6232014201', // Studio Perancangan 1
    semester: 'Genap',
    tahunAjaran: '2022/2023',
    nilaiAkhir: 85,
    grade: 'A',
    nilaiCPMK: [
      { cpmkKode: 'CPMK-SPA1-1', nilai: 85 * 0.2 },
      { cpmkKode: 'CPMK-SPA1-2', nilai: 85 * 0.2 },
      { cpmkKode: 'CPMK-SPA1-3', nilai: 85 * 0.3 },
      { cpmkKode: 'CPMK-SPA1-4', nilai: 85 * 0.2 },
      { cpmkKode: 'CPMK-SPA1-5', nilai: 85 * 0.1 },
    ]
  },
  {
    id: 'N009',
    mahasiswaId: '3',
    mkKode: 'CW6232012202', // Perkembangan Arsitektur 2
    semester: 'Genap',
    tahunAjaran: '2022/2023',
    nilaiAkhir: 78,
    grade: 'B+',
    nilaiCPMK: [
      { cpmkKode: 'CPMK-PA2-1', nilai: 78 * 0.2 },
      { cpmkKode: 'CPMK-PA2-2', nilai: 78 * 0.2 },
      { cpmkKode: 'CPMK-PA2-3', nilai: 78 * 0.3 },
      { cpmkKode: 'CPMK-PA2-4', nilai: 78 * 0.2 },
      { cpmkKode: 'CPMK-PA2-5', nilai: 78 * 0.1 },
    ]
  },
  {
    id: 'N010',
    mahasiswaId: '3',
    mkKode: 'CW6232012203', // Pengantar Arsitektur 2
    semester: 'Genap',
    tahunAjaran: '2022/2023',
    nilaiAkhir: 80,
    grade: 'A-',
    nilaiCPMK: [
      { cpmkKode: 'CPMK-PARS2-1', nilai: 80 * 0.2 },
      { cpmkKode: 'CPMK-PARS2-2', nilai: 80 * 0.2 },
      { cpmkKode: 'CPMK-PARS2-3', nilai: 80 * 0.3 },
      { cpmkKode: 'CPMK-PARS2-4', nilai: 80 * 0.2 },
      { cpmkKode: 'CPMK-PARS2-5', nilai: 80 * 0.1 },
    ]
  },
  {
    id: 'N011',
    mahasiswaId: '3',
    mkKode: 'CW6232012204', // Mekanika Bangunan
    semester: 'Genap',
    tahunAjaran: '2022/2023',
    nilaiAkhir: 75,
    grade: 'B+',
    nilaiCPMK: [
      { cpmkKode: 'CPMK-MB-1', nilai: 75 * 0.2 },
      { cpmkKode: 'CPMK-MB-2', nilai: 75 * 0.2 },
      { cpmkKode: 'CPMK-MB-3', nilai: 75 * 0.3 },
      { cpmkKode: 'CPMK-MB-4', nilai: 75 * 0.2 },
      { cpmkKode: 'CPMK-MB-5', nilai: 75 * 0.1 },
    ]
  },
  {
    id: 'N012',
    mahasiswaId: '3',
    mkKode: 'CW6232012205', // Estetika Bentuk
    semester: 'Genap',
    tahunAjaran: '2022/2023',
    nilaiAkhir: 83,
    grade: 'A-',
    nilaiCPMK: [
      { cpmkKode: 'CPMK-EB-1', nilai: 83 * 0.2 },
      { cpmkKode: 'CPMK-EB-2', nilai: 83 * 0.2 },
      { cpmkKode: 'CPMK-EB-3', nilai: 83 * 0.3 },
      { cpmkKode: 'CPMK-EB-4', nilai: 83 * 0.2 },
      { cpmkKode: 'CPMK-EB-5', nilai: 83 * 0.1 },
    ]
  },
  {
    id: 'N013',
    mahasiswaId: '3',
    mkKode: 'CW6232012206', // Pengantar Teknologi Bahan
    semester: 'Genap',
    tahunAjaran: '2022/2023',
    nilaiAkhir: 77,
    grade: 'B+',
    nilaiCPMK: [
      { cpmkKode: 'CPMK-PTB-1', nilai: 77 * 0.2 },
      { cpmkKode: 'CPMK-PTB-2', nilai: 77 * 0.2 },
      { cpmkKode: 'CPMK-PTB-3', nilai: 77 * 0.3 },
      { cpmkKode: 'CPMK-PTB-4', nilai: 77 * 0.2 },
      { cpmkKode: 'CPMK-PTB-5', nilai: 77 * 0.1 },
    ]
  },
  {
    id: 'N014',
    mahasiswaId: '3',
    mkKode: 'CW6232012207', // Pengetahuan Lingkungan
    semester: 'Genap',
    tahunAjaran: '2022/2023',
    nilaiAkhir: 81,
    grade: 'A-',
    nilaiCPMK: [
      { cpmkKode: 'CPMK-PL-1', nilai: 81 * 0.2 },
      { cpmkKode: 'CPMK-PL-2', nilai: 81 * 0.2 },
      { cpmkKode: 'CPMK-PL-3', nilai: 81 * 0.3 },
      { cpmkKode: 'CPMK-PL-4', nilai: 81 * 0.2 },
      { cpmkKode: 'CPMK-PL-5', nilai: 81 * 0.1 },
    ]
  },
  
  // Mahasiswa Dewi Lestari (mahasiswaId: '4') - Semester VI
  {
    id: 'N009',
    mahasiswaId: '4',
    mkKode: 'ARS603',
    semester: 'Genap',
    tahunAjaran: '2024/2025',
    nilaiAkhir: 90.5,
    grade: 'A',
    nilaiCPMK: [
      { cpmkKode: 'CPMK-ARS603-1', nilai: 89 },
      { cpmkKode: 'CPMK-ARS603-2', nilai: 91 },
      { cpmkKode: 'CPMK-ARS603-3', nilai: 92 },
      { cpmkKode: 'CPMK-ARS603-4', nilai: 90 },
      { cpmkKode: 'CPMK-ARS603-5', nilai: 91 },
    ]
  },
  {
    id: 'N010',
    mahasiswaId: '4',
    mkKode: 'ARS501',
    semester: 'Ganjil',
    tahunAjaran: '2023/2024',
    nilaiAkhir: 87.0,
    grade: 'A',
    nilaiCPMK: [
      { cpmkKode: 'CPMK-ARS501-1', nilai: 85 },
      { cpmkKode: 'CPMK-ARS501-2', nilai: 88 },
      { cpmkKode: 'CPMK-ARS501-3', nilai: 87 },
      { cpmkKode: 'CPMK-ARS501-4', nilai: 88 },
      { cpmkKode: 'CPMK-ARS501-5', nilai: 87 },
    ]
  },
];

// ===== HELPER FUNCTIONS =====

/**
 * Menghitung nilai CPL per semester untuk mahasiswa
 * Formula: Nilai CPL = Rata-rata nilai MK yang terkait dengan CPL tersebut di semester yang dipilih
 * 
 * @param mahasiswaId - ID mahasiswa
 * @param semester - Nomor semester (1-8)
 * @param prodiKode - Kode prodi mahasiswa
 * @returns Array of CPL dengan nilai per semester
 */
export function hitungNilaiCPLPerSemester(
  mahasiswaId: string, 
  semester: number, 
  prodiKode: string
): { cplKode: string; nilai: number; jumlahMK: number }[] {
  
  // 1. Ambil semua nilai MK mahasiswa
  const nilaiMhs = nilaiMahasiswaData.filter(n => n.mahasiswaId === mahasiswaId);
  
  // 2. Filter hanya MK di semester yang dipilih
  const mkDiSemester = mataKuliahData.filter(
    mk => mk.semester === semester && mk.prodiKode === prodiKode
  );
  
  // 3. Ambil nilai untuk MK di semester tersebut
  const nilaiMKSemester = nilaiMhs.filter(n => 
    mkDiSemester.some(mk => mk.kode === n.mkKode)
  );
  
  // 4. Group nilai MK berdasarkan CPL yang terkait
  const cplScores: { [cplKode: string]: number[] } = {};
  
  nilaiMKSemester.forEach(nilaiMK => {
    const mk = mkDiSemester.find(m => m.kode === nilaiMK.mkKode);
    if (mk && mk.cplTerkait) {
      mk.cplTerkait.forEach(cplKode => {
        if (!cplScores[cplKode]) {
          cplScores[cplKode] = [];
        }
        cplScores[cplKode].push(nilaiMK.nilaiAkhir);
      });
    }
  });
  
  // 5. Hitung rata-rata nilai MK untuk setiap CPL
  const result = Object.entries(cplScores).map(([cplKode, nilaiArray]) => {
    const rata = nilaiArray.reduce((sum, n) => sum + n, 0) / nilaiArray.length;
    return {
      cplKode,
      nilai: Math.round(rata * 10) / 10, // Round to 1 decimal
      jumlahMK: nilaiArray.length
    };
  });
  
  return result;
}

/**
 * Menghitung nilai CPL keseluruhan (semua semester) untuk mahasiswa
 * Untuk dashboard summary
 */
export function hitungNilaiCPLKeseluruhan(mahasiswaId: string, prodiKode: string): { cplKode: string; nilai: number }[] {
  const mahasiswa = mahasiswaData.find(m => m.id === mahasiswaId);
  if (!mahasiswa) return [];
  
  // Hitung CPL untuk setiap semester yang sudah dilalui
  const allCPLScores: { [cplKode: string]: number[] } = {};
  
  for (let sem = 1; sem <= mahasiswa.semesterAktif; sem++) {
    const cplSemester = hitungNilaiCPLPerSemester(mahasiswaId, sem, prodiKode);
    cplSemester.forEach(cpl => {
      if (!allCPLScores[cpl.cplKode]) {
        allCPLScores[cpl.cplKode] = [];
      }
      allCPLScores[cpl.cplKode].push(cpl.nilai);
    });
  }
  
  // Rata-rata dari semua semester
  return Object.entries(allCPLScores).map(([cplKode, nilaiArray]) => ({
    cplKode,
    nilai: Math.round((nilaiArray.reduce((sum, n) => sum + n, 0) / nilaiArray.length) * 10) / 10
  }));
}

/**
 * Breakdown nilai MK ke CPMK berdasarkan bobot
 * User input nilai MK, sistem otomatis breakdown ke CPMK
 */
export function breakdownNilaiMKtoCPMK(nilaiMK: number, mkKode: string): { cpmkKode: string; nilai: number }[] {
  const cpmkList = cpmkData.filter(c => c.mkKode === mkKode);
  
  return cpmkList.map(cpmk => ({
    cpmkKode: cpmk.kode,
    nilai: Math.round(nilaiMK * (cpmk.bobot / 100) * 10) / 10
  }));
}

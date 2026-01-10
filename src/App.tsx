import { useState, useEffect } from 'react';
import { DivisionCard } from './components/DivisionCard.tsx';
import { TimelineItem } from './components/TimelineItem.tsx';
import { ApplicationForm } from './components/ApplicationForm.tsx';
import { StatusChecker } from './components/StatusChecker.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx'; 
import { Users, Target, Calendar, FileText, Mail, Lock, ArrowRight, Search, Instagram, Edit, ClipboardList } from 'lucide-react';
import imgLogoHimaK3 from './assets/logo-hima.png';

export default function App() {
  const [activeTab, setActiveTab] = useState('about'); 
  const [showAdmin, setShowAdmin] = useState(false);
  const [showStatusChecker, setShowStatusChecker] = useState(false);
  
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const ADMIN_PASSWORD = "Adyanala2026"; 

  const isRegistrationOpen = false; // Ubah ke true jika ingin memperpanjang (extend)

  // --- LOGIKA SCROLL SPY ---
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['about', 'divisions', 'requirements', 'timeline', 'form', 'contact'];
      
      const current = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top >= -150 && rect.top <= 300; 
        }
        return false;
      });

      if (current) {
        setActiveTab(current);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Password salah!');
      setAdminPasswordInput('');
    }
  };

const handleAdminLogout = () => {
  setIsAdminAuthenticated(false);
  setAdminPasswordInput('');
  setLoginError('');
};
  // --- LOGIKA TAMPILAN ADMIN ---
  if (showAdmin) {
    if (!isAdminAuthenticated) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-[#4285F4]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Admin Login</h2>
              <p className="text-gray-500 text-sm">Masukkan password untuk mengakses dashboard</p>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4285F4] focus:border-transparent outline-none transition-all"
                  placeholder="Password Admin"
                  autoFocus
                />
                {loginError && <p className="text-red-500 text-sm mt-2 ml-1">{loginError}</p>}
              </div>
              <button type="submit" className="w-full bg-[#4285F4] text-white py-3 rounded-lg hover:bg-[#174EA6] transition-colors font-medium flex items-center justify-center gap-2">
                Masuk Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </form>
            <button onClick={() => { setShowAdmin(false); setLoginError(''); setAdminPasswordInput(''); }} className="w-full mt-4 text-gray-500 hover:text-gray-700 text-sm py-2">← Kembali ke Website Utama</button>
          </div>
        </div>
      );
    }

       return (
      <AdminDashboard 
        isAuthenticated={isAdminAuthenticated}
        onLogout={handleAdminLogout}
      />
    );
  }

  // --- LOGIKA TAMPILAN CEK STATUS ---
  if (showStatusChecker) {
    return (
      <div>
        <div className="bg-white shadow-md p-4">
          <button onClick={() => setShowStatusChecker(false)} className="text-[#4285F4] hover:text-[#174EA6] font-medium flex items-center gap-2">
             ← Kembali ke Website
          </button>
        </div>
        <StatusChecker />
      </div>
    );
  }

  const scrollToSection = (sectionId: string) => {
    setActiveTab(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -80; 
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    }
  };

  const divisions = [
    { id: 1, title: 'Departemen Sekretaris Bendahara', description: 'Mengelola dan menata administrasi serta keuangan HIMA K3 UNAIR secara tertib, transparan, dan bertanggung jawab melalui pencatatan, pengarsipan, serta pengelolaan dana organisasi guna mendukung kelancaran dan keberlangsungan seluruh program kerja.', requirements: ['Pelatihan Kesekretariatan dan Kebendaharaan', 'Musma GD dan AD/ART'] },
    { id: 2, title: 'Departemen PSDM', description: 'Berfokus pada pengelolaan dan penguatan hubungan internal organisasi demi terjalinnya komunikasi yang baik serta sdm organisasi yang berkompeten guna menguatkan nilai kontribusi mahasiswa baik untuk HIMA maupun Program Studi K3', requirements: ['Upgrading', 'OSH Student Gathering', 'Dies Natalis K3', 'Shield', 'LKMM-Pra TD', 'Welcome Wisudawan'] },
    { id: 3, title: 'Departemen ILPRES', description: 'Menyelenggarakan program kerja yang berkaitan dengan bidang keilmuan dan prestasi Mahasiswa-Mahasiswi D-IV Keselamatan dan Kesehatan Kerja yang dikemas dengan lingkup program kerja internal hingga eksternal yang menaungi lingkup prestasi dan informasi untuk Program Studi.', requirements: ['Seminar Nasional K3', 'Sharing Session', 'Paper Sharing and Learning', 'Training K3', 'Pojok Prestasi'] },
    { id: 4, title: 'Departemen HUBLU', description: 'Menjalin dan menjaga hubungan strategis dari lingkup internal dengan mitra eksternal yang bertujuan untuk menjadikan HIMA K3 UNAIR menjadi organisasi yang kolaboratif dengan memperluas wawasan serta jaring  relasi dengan pihak eksternal.', requirements: ['K3 Roadshow', 'Work Relation Program', 'OSH Welcoming', 'Devotion Public Occupational Safety and Health', 'Kajian Aksi Strategis'] },
    { id: 5, title: 'Departemen MEDINFO', description: 'Mengelola dan mengembangkan citra publik (branding) serta kanal-kanal komunikasi visual HIMA. Bertanggung jawab atas produksi konten, desain grafis, dan dokumentasi visual yang informatif, menarik, dan relevan untuk mendukung diseminasi informasi, publikasi kegiatan, serta membangun identitas organisasi yang profesional.', requirements: ['Creative Design', 'Creative Media', 'Copywriting', 'OSH Fair'] },
    { id: 6, title: 'Departemen EKRAF', description: 'Sebagai penggerak perekonomian organisasi dalam bentuk produksi, kreatif, dan marketing merchandise serta bertanggung jawab sebagai wadah untuk menaungi minat dan bakat  Mahasiswa/i di bidang kewirausahaan.', requirements: ['Safe Merch', 'OSHTEN'] },
    { id: 7, title: 'Departemen SENIORA', description: 'Menjadi wadah pengembangan minat dan bakat mahasiswa dalam bidang seni, kreativitas, dan olahraga. Berperan aktif dalam memfasilitasi kegiatan yang mendukung terciptanya keseimbangan fisik dan mental serta semangat sportivitas dan ekspresi diri di kalangan anggota HIMA dan Program Studi.', requirements: ['K3 Running Fest', 'Kelas Seni', 'K3 Sport Cup', 'OSH Cup', 'Olahraga Rutin'] }
  ];

  const timeline = [
    { date: '05-10 Januari 2026', title: 'Pendaftaran', description: 'Periode pendaftaran open recruitment dibuka' },
    { date: '11-14 Januari 2026', title: 'Wawancara', description: 'Wawancara dengan departemen pilihan' },
    { date: '17 Januari 2026', title: 'Pengumuman', description: 'Pengumuman hasil seleksi' }
  ];

  return (
    <div className="min-h-screen bg-[#FCF5E8]">
      {/* Navigation - Sticky */}
      <nav className="sticky top-0 bg-white shadow-md z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-3 md:py-4 gap-4">
            {/* Logo */}
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => scrollToSection('about')}
            >
              <img 
                src={imgLogoHimaK3} 
                alt="Logo Himakesker" 
                className="h-8 w-8 md:h-12 md:w-12 object-contain rounded-lg"
              />
            </div>

           {/* Navigation Menu */}
<div className="flex gap-1 md:gap-2 overflow-x-auto no-scrollbar relative">
  {/* Animated underline indicator */}
  <div
    className="absolute bottom-0 h-1 bg-gradient-to-r from-[#0D652D] to-[#34A853] transition-all duration-500 ease-out"
    style={{
      left: activeTab === 'about' ? '0' : 
            activeTab === 'divisions' ? 'calc(100% + 8px)' :
            activeTab === 'requirements' ? 'calc(200% + 16px)' :
            activeTab === 'timeline' ? 'calc(300% + 24px)' :
            activeTab === 'form' ? 'calc(400% + 32px)' :
            'calc(500% + 40px)',
      width: 'calc(16.66% - 4px)',
    }}
  />

  {[
    { id: 'about', label: 'Guidebook', icon: FileText },
    { id: 'divisions', label: 'Divisi', icon: Target },
    { id: 'requirements', label: 'Syarat', icon: ClipboardList },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'form', label: 'Daftar', icon: Edit },
    { id: 'contact', label: 'Kontak', icon: Mail }
  ].map(({ id, label, icon: Icon }) => (
    <button
      key={id}
      onClick={() => scrollToSection(id)}
      className={`flex items-center gap-2 px-3 py-2 md:px-6 md:py-2 rounded-lg transition-colors duration-300 ease-in-out whitespace-nowrap relative ${
        activeTab === id 
          ? 'text-[#0D652D] font-semibold' 
          : 'text-gray-600 hover:text-[#0D652D]'
      }`}
      title={label}
    >
      <Icon className={`w-4 h-4 md:w-4 md:h-4`} />
      <span className="hidden md:inline">{label}</span>
    </button>
  ))}
</div>

          </div>
        </div>
      </nav>

      {/* About Section */}
      <section id="about" className="py-24 px-4 scroll-mt-24 mt-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center mb-4 bg-gradient-to-r from-[#174EA6] to-[#4285F4] bg-clip-text text-transparent font-bold text-[32px] font-[Poppins] leading-tight">
            Guidebook Open Recruitment<br/>Hima K3 Unair Kabinet Adyanala
          </h2>
          <p className="text-center text-gray-600 max-w-3xl mx-auto mb-12">
            Pelajari lebih lanjut tentang visi misi, departemen, dan proker HIMA K3 UNAIR Kabinet Adyanala sebelum mendaftar.
          </p>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 bg-gradient-to-br from-[#0D652D] to-[#34A853] rounded-2xl flex items-center justify-center shadow-lg rotate-3 hover:rotate-0 transition-transform duration-300">
                    <FileText className="w-16 h-16 text-white" />
                  </div>
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h3 className="mb-3 text-[#0D652D] text-xl font-bold">📖 Buku Panduan (Guidebook)</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Dokumen ini berisi informasi krusial mengenai struktur kabinet, deskripsi kerja setiap departemen, dan program kerja yang akan dilaksanakan. Sangat disarankan untuk membaca ini agar kamu bisa memilih departemen yang paling sesuai dengan minatmu!
                  </p>
                  
                  <a
                    href="https://drive.google.com/drive/folders/1eGqwTforfjs4ZGsF9nWCzLw1_qS9IxV6?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 bg-gradient-to-r from-[#174EA6] to-[#4285F4] text-white px-8 py-4 rounded-xl hover:shadow-lg transition-all hover:-translate-y-1 duration-300 group"
                  >
                    <FileText className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-lg">Buka Guidebook Sekarang</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
              
              <div className="mt-10 pt-8 border-t border-gray-200">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div className="bg-blue-50/80 rounded-xl p-4 hover:bg-blue-100 transition-colors">
                    <p className="text-sm text-gray-600 mb-2">🎯 Kenali Arah Kami</p>
                    <p className="font-bold text-[#174EA6] text-lg">Visi & Misi Kabinet</p>
                  </div>
                  <div className="bg-green-50/80 rounded-xl p-4 hover:bg-green-100 transition-colors">
                    <p className="text-sm text-gray-600 mb-2">📂 Pahami Tugasnya</p>
                    <p className="font-bold text-[#0D652D] text-lg">Detail Departemen</p>
                  </div>
                  <div className="bg-red-50/80 rounded-xl p-4 hover:bg-red-100 transition-colors">
                    <p className="text-sm text-gray-600 mb-2">🔥 Lihat Rencananya</p>
                    <p className="font-bold text-[#A50E0E] text-lg">Program Kerja Unggulan</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divisions Section */}
      <section id="divisions" className="py-20 px-4 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center mb-4 bg-gradient-to-r from-[#174EA6] to-[#4285F4] bg-clip-text text-transparent font-bold text-[32px] font-[Poppins]">
            Departemen yang Membuka Rekrutmen
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Pilih departemen yang sesuai dengan minat dan kemampuanmu
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {divisions.map((division, index) => (
              <div key={division.id} className={`h-full ${index === 6 ? "lg:col-start-2" : ""}`}>
                <DivisionCard {...division} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section id="requirements" className="py-20 px-4 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center mb-12 bg-gradient-to-r from-[#174EA6] to-[#4285F4] bg-clip-text text-transparent text-[32px] font-[Poppins] font-bold">
            Persyaratan Umum
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 border-t-4 border-[#0D652D]">
              <h3 className="mb-6 text-[#0D652D] font-bold text-xl flex items-center gap-2">
                  📄 Persyaratan Administrasi
              </h3>
              <ul className="space-y-4">
                {['Mahasiswa aktif D4 K3 Universitas Airlangga', 'Belum pernah terlibat dalam tindak pelanggaran berat', 'Scan KTM, CV, Surat Komitmen, dan Portofolio bagi pendaftar departemen Medinfo', 'Berkomitmen penuh selama satu periode kepengurusan'].map((item, index) => (
                  <li key={index} className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#0D652D] to-[#34A853] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                        <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                    <span className="text-gray-700 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 border-t-4 border-[#A50E0E]">
              <h3 className="mb-6 text-[#A50E0E] font-bold text-xl flex items-center gap-2">
                💡 Kompetensi yang Dicari
              </h3>
              <ul className="space-y-4">
                {['Memiliki semangat belajar dan berkembang', 'Mampu bekerja sama secara tim maupun individu', 'Komunikatif, responsif, dan proaktif', 'Memiliki rasa tanggung jawab dan disiplin tinggi', 'Inisiatif, kreatif, dan solutif menghadapi masalah'].map((item, index) => (
                  <li key={index} className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#A50E0E] to-[#EA4335] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                        <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                    <span className="text-gray-700 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section id="timeline" className="py-20 px-4 bg-white scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center mb-12 bg-gradient-to-r from-[#174EA6] to-[#4285F4] bg-clip-text text-transparent text-[32px] font-[Poppins] font-bold">Timeline Rekrutmen</h2>
          <div className="space-y-8">
            {timeline.map((item, index) => (
              <TimelineItem key={index} {...item} isLast={index === timeline.length - 1} />
            ))}
          </div>
        </div>
      </section>

      {/* Application Form Section */}
<section id="form" className="py-20 px-4 scroll-mt-20">
  <div className="max-w-7xl mx-auto">
    <h2 className="text-center mb-4 bg-gradient-to-r from-[#174EA6] to-[#4285F4] bg-clip-text text-transparent font-bold text-[32px] font-[Poppins]">
      Formulir Pendaftaran
    </h2>
    
    {isRegistrationOpen ? (
      <>
        <p className="text-center text-gray-600 mb-12">Isi data dirimu dengan lengkap dan benar</p>
        <ApplicationForm divisions={divisions} />
      </>
    ) : (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-12 text-center border-t-4 border-red-500">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-12 h-12 text-red-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Pendaftaran Ditutup</h3>
        <p className="text-gray-600 mb-6">
          Mohon maaf, periode pendaftaran HIMA K3 UNAIR saat ini telah berakhir. 
          Pantau terus Instagram kami untuk informasi mengenai perpanjangan waktu pendaftaran.
        </p>
        <a 
          href="https://instagram.com/himak3unair" 
          className="inline-flex items-center gap-2 text-[#0D652D] font-semibold hover:underline"
        >
          <Instagram className="w-5 h-5" /> Cek Update di Instagram
        </a>
      </div>
    )}
  </div>
</section>

     {/* Contact Section - Versi Compact */}
      <section id="contact" className="py-12 px-4 bg-gradient-to-br from-[#0D652D] to-[#34A853] text-white scroll-mt-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="mb-2 text-2xl font-bold">Hubungi Kami</h2>
          <p className="mb-6 text-sm text-white/90">Ada pertanyaan seputar rekrutmen? Jangan ragu untuk menghubungi kami.</p>
          
          <div className="inline-flex bg-white/10 backdrop-blur-md rounded-xl p-6 hover:bg-white/20 transition-colors cursor-pointer group border border-white/10">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 mb-3 flex items-center justify-center bg-white/20 rounded-full group-hover:scale-110 transition-transform">
                   <Instagram className="w-6 h-6 text-white" />
                </div>
                <p className="text-white font-semibold mb-3">@himak3unair</p>
                <a 
                  href="https://instagram.com/himak3unair" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="px-5 py-1.5 bg-white text-[#0D652D] rounded-full font-bold text-xs hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                    Kunjungi Profil
                </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#383432] text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <p className="text-white/80 font-medium">© 2026 Departemen Media dan Informasi</p>
            <p className="text-white/60 mt-2 text-sm">Himpunan Mahasiswa D4 Keselamatan dan Kesehatan Kerja<br/>Kabinet Adyanala - Universitas Airlangga</p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-6 border-t border-white/10">
            <button onClick={() => setShowStatusChecker(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#34A853] hover:bg-[#2d9248] rounded-full transition-colors text-white font-medium text-sm shadow-sm">
              <Search className="w-4 h-4" /> Cek Status Pendaftaran
            </button>
            <button onClick={() => setShowAdmin(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors text-white font-medium text-sm shadow-sm">
               <Lock className="w-4 h-4" /> Admin
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
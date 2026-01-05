import { useState } from 'react';
import { Send, Upload, CheckCircle, Loader2, MessageCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Division {
  id: number;
  title: string;
  requirements: string[];
}

interface ApplicationFormProps {
  divisions: Division[];
}

export function ApplicationForm({ divisions }: ApplicationFormProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    nim: '',
    email: '',
    phone: '',
    semester: '2',
    ipk: '-',
    motivation: '-',
    department1: '',
    proker1: '',
    department2: '',
    proker2: '',
    experience: ''
  });

  const [isSekben1, setIsSekben1] = useState(false);
  const [isSekben2, setIsSekben2] = useState(false);
  const [ktmFile, setKtmFile] = useState<File | null>(null);
  const [suratKomitmenFile, setSuratKomitmenFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [applicationId, setApplicationId] = useState('');

  const supabase = createClient(projectId, publicAnonKey);

const needsPortfolio =
  (!isSekben1 &&
    formData.department1 === 'Departemen MEDINFO' &&
    formData.proker1 !== 'Copywriting' &&
    !!formData.proker1) ||
  (!isSekben2 &&
    formData.department2 === 'Departemen MEDINFO' &&
    formData.proker2 !== 'Copywriting' &&
    !!formData.proker2);

  const nonSekbenDepartments = divisions.filter(d => d.id !== 1);

  const getProkersByDepartment = (deptTitle: string) => {
    const dept = divisions.find(d => d.title === deptTitle);
    return dept ? dept.requirements : [];
  };

  const uploadFilesToStorage = async (nim: string) => {
    const uploadedFiles: Record<string, string> = {};
    const filesToUpload = {
      ktm: ktmFile,
      surat_komitmen: suratKomitmenFile,
      cv: cvFile,
      portofolio: portfolioFile,
    };

    for (const [fileType, file] of Object.entries(filesToUpload)) {
      if (!file) continue;

      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `applications/${nim}/${fileType}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('application-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('application-files')
        .getPublicUrl(filePath);

      uploadedFiles[fileType] = publicUrlData.publicUrl;
    }

    return uploadedFiles;
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!ktmFile || !suratKomitmenFile || !cvFile) {
        throw new Error('Silakan upload KTM, Surat Komitmen, dan CV terlebih dahulu');
      }

      if (needsPortfolio && !portfolioFile) {
        throw new Error('Portofolio wajib untuk proker MEDINFO');
      }

      // 👇👇👇 LOGIKA PERBAIKAN DATA SEKBEN (SPECIAL CASE) 👇👇👇
      const finalFormData = { ...formData }; // Kita copy dulu biar form asli di layar gak berubah

      // Cek Pilihan 1: Kalau dia centang Sekben
      if (isSekben1) {
        // Paksa Departemen jadi Sekben
        finalFormData.department1 = "Departemen Sekretaris Bendahara";
        // Gabungkan Jabatan + Departemen Penempatan ke dalam kolom Proker
        // Contoh hasil: "Sekretaris - Departemen PSDM"
        finalFormData.proker1 = `${formData.proker1} - ${formData.department1}`; 
      }

      // Cek Pilihan 2: Kalau dia centang Sekben
      if (isSekben2) {
        finalFormData.department2 = "Departemen Sekretaris Bendahara";
        // Contoh hasil: "Bendahara - Departemen ACARA"
        finalFormData.proker2 = `${formData.proker2} - ${formData.department2}`;
      }
      // 👆👆👆 SELESAI PERBAIKAN 👆👆👆


      const uploadedFiles = await uploadFilesToStorage(formData.nim);

      const response = await fetch(
        `https://ktarcapgygzzbkcxaosr.supabase.co/functions/v1/server/applications/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          // 👇 KITA KIRIM finalFormData YANG SUDAH DIPERBAIKI
          body: JSON.stringify({
            ...finalFormData, 
            files: uploadedFiles,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengirim pendaftaran');
      }

      console.log('Application submitted successfully:', data);
      setApplicationId(data.applicationId);
      setSubmitted(true);

      // Reset form state (tanpa mematikan tampilan sukses)
      setFormData({
        fullName: '',
        nim: '',
        email: '',
        phone: '',
        semester: '2',
        ipk: '-',
        motivation: '-',
        department1: '',
        proker1: '',
        department2: '',
        proker2: '',
        experience: ''
      });
      setIsSekben1(false);
      setIsSekben2(false);
      setKtmFile(null);
      setSuratKomitmenFile(null);
      setCvFile(null);
      setPortfolioFile(null);

    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengirim pendaftaran');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-[#0D652D] to-[#34A853] rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        
        <h3 className="text-2xl font-bold text-[#0D652D] mb-2">Pendaftaran Berhasil!</h3>
        
        <p className="text-gray-600 mb-6">
          Terima kasih telah mendaftar. Data kamu sudah kami terima.
        </p>

        {/* ID Pendaftaran */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8 inline-block">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">ID Pendaftaran Anda</p>
          <p className="font-mono text-xl font-bold text-[#0D652D] tracking-widest">{applicationId}</p>
        </div>

       {/* 👇 TOMBOL GRUP WHATSAPP YANG SUDAH DIPERBAIKI WARNANYA 👇 */}
<div className="mb-8">
  <p className="text-sm text-gray-600 mb-3 font-medium">
    Wajib bergabung ke Grup WhatsApp untuk informasi selanjutnya.
  </p>
  
  <a
    href="https://chat.whatsapp.com/LINK_GRUP_WA_KAMU_DISINI" // 👈 JANGAN LUPA GANTI LINK INI LAGI
    target="_blank"
    rel="noopener noreferrer"
    // PERUBAHAN DISINI:
    // 1. Menggunakan 'bg-green-600' dan 'hover:bg-green-700' (warna standar Tailwind)
    // 2. Menambahkan '!text-white' (tanda seru untuk memaksa teks warna putih)
    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 !text-white font-bold rounded-full shadow-md hover:shadow-lg transition-all duration-300"
  >
    <MessageCircle className="w-5 h-5" />
    <span>Gabung Grup WhatsApp</span>
  </a>
</div>

        <div className="border-t pt-6">
          <button 
            onClick={() => setSubmitted(false)}
            className="text-sm text-gray-400 hover:text-gray-600 underline"
          >
            Kembali ke Formulir (Daftar Baru)
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h3 className="mb-4 text-[#0D652D]">Data Diri</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="fullName" className="block text-sm mb-2 text-gray-700">Nama Lengkap *</label>
              <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#34A853] focus:border-transparent outline-none transition-all" placeholder="Masukkan nama lengkap" />
            </div>
            <div>
              <label htmlFor="nim" className="block text-sm mb-2 text-gray-700">NIM *</label>
              <input type="text" id="nim" name="nim" value={formData.nim} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#34A853] focus:border-transparent outline-none transition-all" placeholder="Contoh: 432251000" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm mb-2 text-gray-700">Email *</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#34A853] focus:border-transparent outline-none transition-all" placeholder="email@example.com" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm mb-2 text-gray-700">No. WhatsApp *</label>
              <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#34A853] focus:border-transparent outline-none transition-all" placeholder="08123456789" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-[#0D652D]">Pilihan Program Kerja</h3>

          <div className="mb-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
  <div className="flex items-center justify-between mb-4">
    <h4 className="font-medium text-gray-800">📌 Pilihan 1</h4>
    <label className="flex items-center cursor-pointer group">
      <input
        type="checkbox"
        checked={isSekben1}
        onChange={(e) => {
          setIsSekben1(e.target.checked);
          setFormData({ ...formData, department1: '', proker1: '' });
        }}
        className="w-4 h-4 rounded border-orange-300 text-orange-600"
      />
      <span className="ml-2 text-xs text-orange-700 font-medium">
        Daftar Departemen Sekben
      </span>
    </label>
  </div>

  {isSekben1 ? (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="department1-sekben"
            className="block text-sm mb-2 text-gray-700"
          >
            Departemen Penempatan *
          </label>
          <select
            id="department1-sekben"
            name="department1"
            value={formData.department1}
            onChange={(e) =>
              setFormData({ ...formData, department1: e.target.value })
            }
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#34A853] focus:border-transparent outline-none bg-white"
          >
            <option value="">Pilih Departemen</option>
            {nonSekbenDepartments.map((div) => (
              <option key={div.id} value={div.title}>
                {div.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="sekben-role"
            className="block text-sm mb-2 text-gray-700"
          >
            Posisif i *
          </label>
          <select
            id="sekben-role"
            name="proker1"
            value={formData.proker1}
            onChange={(e) =>
              setFormData({ ...formData, proker1: e.target.value })
            }
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#34A853] focus:border-transparent outline-none bg-white"
          >
            <option value="">Pilih Posisi</option>
            <option value="Sekretaris">Sekretaris</option>
            <option value="Bendahara">Bendahara</option>
          </select>
        </div>
      </div>
    </div>
  ) : (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label
          htmlFor="department1"
          className="block text-sm mb-2 text-gray-700"
        >
          Departemen *
        </label>
        <select
          id="department1"
          name="department1"
          value={formData.department1}
          onChange={(e) =>
            setFormData({
              ...formData,
              department1: e.target.value,
              proker1: '',
            })
          }
          required
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#34A853] focus:border-transparent outline-none bg-white"
        >
          <option value="">Pilih Departemen</option>
          {nonSekbenDepartments.map((div) => (
            <option key={div.id} value={div.title}>
              {div.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="proker1"
          className="block text-sm mb-2 text-gray-700"
        >
          Program Kerja *
        </label>
        <select
          id="proker1"
          name="proker1"
          value={formData.proker1}
          onChange={(e) =>
            setFormData({ ...formData, proker1: e.target.value })
          }
          required
          disabled={!formData.department1}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#34A853] focus:border-transparent outline-none bg-white disabled:bg-gray-100"
        >
          <option value="">
            {formData.department1 ? 'Pilih proker' : 'Pilih departemen dulu'}
          </option>
          {formData.department1 &&
            getProkersByDepartment(formData.department1)
              .filter(
                (proker) =>
                  !(
                    formData.department1 === formData.department2 &&
                    proker === formData.proker2
                  ),
              )
              .map((proker, index) => (
                <option key={index} value={proker}>
                  {proker}
                </option>
              ))}
        </select>
      </div>
    </div>
  )}
</div>

          <div className="mb-4 p-6 bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-800">📌 Pilihan 2</h4>
              <label className="flex items-center cursor-pointer group">
                <input type="checkbox" checked={isSekben2} onChange={(e) => { setIsSekben2(e.target.checked); setFormData({ ...formData, department2: '', proker2: '' }); }} className="w-4 h-4 rounded border-orange-300 text-orange-600" />
                <span className="ml-2 text-xs text-orange-700 font-medium">Daftar Departemen Sekben</span>
              </label>
            </div>

            {isSekben2 ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="department2-sekben" className="block text-sm mb-2 text-gray-700">Departemen Penempatan *</label>
                    <select id="department2-sekben" name="department2" value={formData.department2} onChange={(e) => setFormData({ ...formData, department2: e.target.value })} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4285F4] focus:border-transparent outline-none bg-white">
                      <option value="">Pilih Departemen</option>
                      {nonSekbenDepartments.map((div) => (
                        <option key={div.id} value={div.title}>{div.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="sekben-role-2" className="block text-sm mb-2 text-gray-700">Posisi *</label>
                    <select id="sekben-role-2" name="proker2" value={formData.proker2} onChange={(e) => setFormData({ ...formData, proker2: e.target.value })} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4285F4] focus:border-transparent outline-none bg-white">
                      <option value="">Pilih Posisi</option>
                      <option value="Sekretaris">Sekretaris</option>
                      <option value="Bendahara">Bendahara</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="department2" className="block text-sm mb-2 text-gray-700">Departemen *</label>
                  <select id="department2" name="department2" value={formData.department2} onChange={(e) => setFormData({ ...formData, department2: e.target.value, proker2: '' })} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4285F4] focus:border-transparent outline-none bg-white">
                    <option value="">Pilih Departemen</option>
                    {nonSekbenDepartments.map((div) => (
                      <option key={div.id} value={div.title}>{div.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="proker2" className="block text-sm mb-2 text-gray-700">Program Kerja *</label>
                  <select id="proker2" name="proker2" value={formData.proker2} onChange={(e) => setFormData({ ...formData, proker2: e.target.value })} required disabled={!formData.department2} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4285F4] focus:border-transparent outline-none bg-white disabled:bg-gray-100">
                    <option value="">{formData.department2 ? 'Pilih proker' : 'Pilih departemen dulu'}</option>
                    {formData.department2 && getProkersByDepartment(formData.department2).filter(proker => !(formData.department1 === formData.department2 && proker === formData.proker1)).map((proker, index) => (
                      <option key={index} value={proker}>{proker}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700"><strong>💡 Catatan:</strong></p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1 ml-4">
              <li>• Pilih departemen terlebih dahulu, baru pilih program kerja</li>
              <li>• Khusus <strong>Departemen Sekretaris/Bendahara</strong>: Centang "Daftar Departemen Sekben"</li>
              <li>• Kamu bisa daftar Sekben di kedua pilihan, salah satu, atau tidak sama sekali</li>
            </ul>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-[#0D652D]">Upload Berkas</h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload semua berkas dalam format PDF (max 2MB per file)
            {needsPortfolio && <span className="text-blue-600 font-medium"> - Portofolio wajib untuk proker MEDINFO</span>}
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#34A853] transition-colors">
              <div className="flex items-start gap-3">
                <Upload className="w-8 h-8 text-gray-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="font-medium text-gray-700 mb-1">KTM *</p>
                  <p className="text-xs text-gray-500 mb-3">Kartu Tanda Mahasiswa (PDF)</p>
                  <input type="file" accept=".pdf" className="hidden" id="ktm-file" onChange={(e) => setKtmFile(e.target.files?.[0] || null)} required />
                  <label htmlFor="ktm-file" className="inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors text-sm">{ktmFile ? '✓ File Dipilih' : 'Pilih File'}</label>
                  {ktmFile && <p className="text-xs text-green-600 mt-2">📄 {ktmFile.name}</p>}
                </div>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#34A853] transition-colors">
              <div className="flex items-start gap-3">
                <Upload className="w-8 h-8 text-gray-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="font-medium text-gray-700 mb-1">Surat Komitmen *</p>
                  <p className="text-xs text-gray-500 mb-3">Pernyataan kesediaan (PDF)</p>
                  <input type="file" accept=".pdf" className="hidden" id="surat-komitmen-file" onChange={(e) => setSuratKomitmenFile(e.target.files?.[0] || null)} required />
                  <label htmlFor="surat-komitmen-file" className="inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors text-sm">{suratKomitmenFile ? '✓ File Dipilih' : 'Pilih File'}</label>
                  {suratKomitmenFile && <p className="text-xs text-green-600 mt-2">📄 {suratKomitmenFile.name}</p>}
                </div>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#34A853] transition-colors">
              <div className="flex items-start gap-3">
                <Upload className="w-8 h-8 text-gray-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="font-medium text-gray-700 mb-1">CV (Curriculum Vitae) *</p>
                  <p className="text-xs text-gray-500 mb-3">Daftar riwayat hidup (PDF)</p>
                  <input type="file" accept=".pdf" className="hidden" id="cv-file" onChange={(e) => setCvFile(e.target.files?.[0] || null)} required />
                  <label htmlFor="cv-file" className="inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors text-sm">{cvFile ? '✓ File Dipilih' : 'Pilih File'}</label>
                  {cvFile && <p className="text-xs text-green-600 mt-2">📄 {cvFile.name}</p>}
                </div>
              </div>
            </div>

            {needsPortfolio && (
              <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 hover:border-[#4285F4] transition-colors bg-blue-50/30">
                <div className="flex items-start gap-3">
                  <Upload className="w-8 h-8 text-blue-500 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-700 mb-1">Portofolio *</p>
                    <p className="text-xs text-gray-500 mb-3">Wajib untuk MEDINFO (PDF)</p>
                    <input type="file" accept=".pdf" className="hidden" id="portfolio-file" onChange={(e) => setPortfolioFile(e.target.files?.[0] || null)} required />
                    <label htmlFor="portfolio-file" className="inline-block px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg cursor-pointer transition-colors text-sm">{portfolioFile ? '✓ File Dipilih' : 'Pilih File'}</label>
                    {portfolioFile && <p className="text-xs text-blue-600 mt-2">📄 {portfolioFile.name}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-600">💡 <strong>Catatan:</strong> Pastikan semua file dalam format PDF dan tidak melebihi 2MB per file.</p>
          </div>
        </div>

        <div className="pt-6">
          <button type="submit" className="w-full bg-gradient-to-r from-[#0D652D] to-[#34A853] text-white py-4 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (<><span>Kirim Pendaftaran</span><Send className="w-5 h-5" /></>)}
          </button>
          <p className="text-xs text-gray-500 text-center mt-4">Dengan mendaftar, Anda menyetujui untuk mengikuti seluruh tahapan seleksi</p>
        </div>
      </div>
    </form>
  );
}

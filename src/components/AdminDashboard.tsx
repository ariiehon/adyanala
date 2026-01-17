import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Users, Download, CheckCircle, XCircle, Clock, Search, LogOut, Briefcase, FileText } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import * as XLSX from 'xlsx';
const SUPABASE_FUNCTION_URL =
  'https://ktarcapgygzzbkcxaosr.supabase.co/functions/v1/server/applications';

interface Application {
  id: string;
  full_name: string;
  nim: string;
  email: string;
  phone: string;
  semester: string;
  ipk: number | string;
  proker1: string;
  department1: string;
  proker2: string;
  department2: string;
  motivation: string;
  experience: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  assigned_division?: string;
  division1?: string;
  final_proker?: string;
  final_role?: string;
  files?: {
    ktm?: string;
    surat_komitmen?: string;
    cv?: string;
    portfolio?: string;
  };
}

interface Stats {
  total: number;
  byDivision: Record<string, number>;
  bySemester: Record<string, number>;
  byStatus: {
    pending: number;
    accepted: number;
    rejected: number;
  };
}

interface AdminDashboardProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export function AdminDashboard({ isAuthenticated, onLogout }: AdminDashboardProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


   useEffect(() => {
    if (applications.length > 0) {
      console.log('Sample application:', applications[0]);
    }
  }, [applications]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDivision, setFilterDivision] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal assignment state
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [assignedDivision, setAssignedDivision] = useState('');
  const [assignedProker, setAssignedProker] = useState('');
  const [assignedProkerCustom, setAssignedProkerCustom] = useState('');
  const [assignedRole, setAssignedRole] = useState('Staff');
  const [updating, setUpdating] = useState(false);
  const [notice, setNotice] = useState('');

  // ✅ Fetch data saat component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
      fetchStats();
    }
  }, [isAuthenticated]);

useEffect(() => {
  if (selectedApplication) {
    // 👇 Cek assigned_division (DB) atau assignedDivision (Legacy)
    setAssignedDivision(
      selectedApplication.assigned_division || 
      selectedApplication.assignedDivision || 
      selectedApplication.department1 || ''
    );
    // ... sisa kode ...

    const finalProkerSource =
      selectedApplication.final_proker || selectedApplication.proker1;

    // Kalau final_proker BUKAN proker1 dan BUKAN proker2, berarti dulu pakai custom
    if (
      selectedApplication.final_proker &&
      selectedApplication.final_proker !== selectedApplication.proker1 &&
      selectedApplication.final_proker !== selectedApplication.proker2
    ) {
      // dropdown pilih "Proker Lainnya"
      setAssignedProker('Proker Lainnya');
      // input text terisi nama proker custom
      setAssignedProkerCustom(selectedApplication.final_proker);
    } else {
      // dropdown pilih proker1/proker2
      setAssignedProker(finalProkerSource);
      setAssignedProkerCustom('');
    }

    setAssignedRole(selectedApplication.final_role || 'Staff');
    setNotice('');
  }
}, [selectedApplication]);

  const handleLogout = () => {
    onLogout();
    setApplications([]);
    setStats(null);
  };

  // ✅ Fetch Applications
  const fetchApplications = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        'https://ktarcapgygzzbkcxaosr.supabase.co/functions/v1/server/applications/list',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.applications) {
        setApplications(data.applications);
      } else {
        throw new Error(data.error || 'Format response tidak valid');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error saat fetch aplikasi';
      console.error('Fetch Applications Error:', errorMsg);
      setError(errorMsg);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch Statistics
  const fetchStats = async () => {
    try {
      const response = await fetch(
        'https://ktarcapgygzzbkcxaosr.supabase.co/functions/v1/server/applications/stats',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Fetch Stats Error:', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // ✅ Update Status
  const updateStatus = async (id: string, status: 'accepted' | 'rejected' | 'pending') => {
    if (!selectedApplication) return;

    const finalProker = assignedProker === 'Proker Lainnya' ? assignedProkerCustom : assignedProker;

    if (status === 'accepted') {
      if (!assignedDivision || !finalProker || !assignedRole) {
        alert('Pilih Departemen, Proker atau isi Proker Lainnya, dan Jabatan sebelum menerima pendaftar.');
        return;
      }

      const confirmMsg = `Yakin ingin menerima ${selectedApplication.full_name} sebagai ${assignedRole} untuk proker ${finalProker} di ${assignedDivision}?`;
      if (!window.confirm(confirmMsg)) return;
    }

    setUpdating(true);
    setNotice('');

    const prevApps = [...applications];

setApplications(
  applications.map((app) =>
    app.id === id
      ? {
          ...app,
          status,
          // ❌ JANGAN ubah department1/department2 (itu pilihan user)
          // department1: assignedDivision,

          // ✅ SIMPAN PENEMPATAN FINAL DI FIELD TERPISAH
          assignedDivision,          // departemen final
          final_proker: finalProker, // proker final
          final_role: assignedRole,  // jabatan final
        }
      : app
  )
);

    try {
      const res = await fetch(
        `https://ktarcapgygzzbkcxaosr.supabase.co/functions/v1/server/applications/${id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            status,
            assignedDivision,
            final_proker: finalProker,
            final_role: assignedRole,
          }),
        }
      );

      const resJson = await res.json();

      if (!res.ok || !resJson.success) {
        setApplications(prevApps);
        throw new Error(resJson?.error || 'Gagal update status');
      }

      setNotice('✅ Status berhasil diperbarui dan email pengumuman dikirim.');
      setSelectedApplication(null);

      await fetchStats();
      await fetchApplications();
    } catch (error) {
      console.error('Error updating status:', error);
      setApplications(prevApps);
      setNotice('❌ Gagal memperbarui status. Cek koneksi atau coba lagi.');
      alert('Gagal update. Cek koneksi atau coba lagi.');
    } finally {
      setUpdating(false);
    }
  };

  // ✅ Filter & Search
 const filteredApplications = applications.filter((app) => {
  // 1) Filter status
  const statusMatch =
    filterStatus === 'all' || app.status === filterStatus;

  // 2) Filter divisi berdasarkan PILIHAN 1 & 2
  const divisionMatch =
    filterDivision === 'all' ||
    app.department1 === filterDivision ||
    app.department2 === filterDivision;

  // 3) Search Nama / NIM
  const searchLower = searchTerm.toLowerCase();
  const searchMatch =
    searchTerm === '' ||
    app.full_name.toLowerCase().includes(searchLower) ||
    app.nim.includes(searchTerm);

  return statusMatch && divisionMatch && searchMatch;
});

// Tambahkan fungsi ini di dalam component AdminDashboard
const exportToExcel = () => {
  if (!filteredApplications.length) {
    alert('Tidak ada data untuk diexport');
    return;
  }

  // Transform data ke format yang rapi untuk Excel
  const excelData = filteredApplications.map((app) => ({
    'No': filteredApplications.indexOf(app) + 1,
    'Nama Lengkap': app.full_name,
    'NIM': app.nim,
    'Email': app.email,
    'No. WhatsApp': app.phone,
    'Departemen 1': app.department1 || '-',
    'Proker 1': app.proker1 || '-',
    'Departemen 2': app.department2 || '-',
    'Proker 2': app.proker2 || '-',
    'KTM URL': (app as any).ktm_url || '',
    'CV URL': (app as any).cv_url || '',
    'Surat Komitmen URL': (app as any).surat_komitmen_url || '',
    'Portofolio URL': (app as any).portfolio_url || '',
    'Jabatan Final': app.final_role || '-',
    'Proker Final': app.final_proker || '-',
    'Status': app.status?.toUpperCase() || 'PENDING',
    'Tanggal Daftar': new Date(app.created_at).toLocaleDateString('id-ID')
  }));

  // Buat workbook dan worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pendaftar');

  // Set lebar kolom
  const colWidths = [
    { wch: 4 },   // No
    { wch: 20 },  // Nama
    { wch: 12 },  // NIM
    { wch: 20 },  // Email
    { wch: 15 },  // No. WhatsApp
    { wch: 18 },  // Departemen 1
    { wch: 15 },  // Proker 1
    { wch: 18 },  // Departemen 2
    { wch: 15 },  // Proker 2
    { wch: 30 },  // KTM URL
    { wch: 30 },  // CV URL
    { wch: 30 },  // Surat Komitmen URL
    { wch: 30 },  // Portofolio URL
    { wch: 15 },  // Jabatan Final
    { wch: 15 },  // Proker Final
    { wch: 12 },  // Status
    { wch: 15 }   // Tanggal Daftar
  ];
  worksheet['!cols'] = colWidths;

  // Download file
  XLSX.writeFile(workbook, `Pendaftar_HIMA_${new Date().toLocaleDateString('id-ID')}.xlsx`);
};


  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0D652D] to-[#34A853] rounded-2xl p-8 mb-8 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold font-Poppins">Dashboard Admin Rekrutmen</h1>
            <p className="text-[rgba(255,255,255,0.9)]">Kelola pendaftar, tetapkan jabatan & proker.</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.3)] rounded-lg text-sm flex gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            <p className="font-semibold">❌ Error Loading Data:</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={() => {
                fetchApplications();
                fetchStats();
              }}
              className="mt-2 text-sm bg-red-700 text-white px-3 py-1 rounded hover:bg-red-800"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex justify-between mb-2">
                <Users className="text-blue-500" />
                <span className="text-2xl font-bold">{stats.total}</span>
              </div>
              <p className="text-gray-500">Total Pendaftar</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex justify-between mb-2">
                <Clock className="text-yellow-500" />
                <span className="text-2xl font-bold">{stats.byStatus.pending}</span>
              </div>
              <p className="text-gray-500">Pending</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex justify-between mb-2">
                <CheckCircle className="text-green-500" />
                <span className="text-2xl font-bold">{stats.byStatus.accepted}</span>
              </div>
              <p className="text-gray-500">Diterima</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex justify-between mb-2">
                <XCircle className="text-red-500" />
                <span className="text-2xl font-bold">{stats.byStatus.rejected}</span>
              </div>
              <p className="text-gray-500">Ditolak</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <p className="text-gray-600 font-semibold">⏳ Memuat data pendaftar...</p>
            <div className="mt-4 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* Filters */}
<div className="bg-white p-6 rounded-xl shadow-md mb-6 space-y-4">
  <div className="grid md:grid-cols-3 gap-4">
    <div className="relative">
      <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
      <input
        type="text"
        placeholder="Cari Nama/NIM..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>

    <select
      value={filterStatus}
      onChange={(e) => setFilterStatus(e.target.value)}
      className="border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-green-500"
    >
      <option value="all">Semua Status</option>
      <option value="pending">Pending</option>
      <option value="accepted">Diterima</option>
      <option value="rejected">Ditolak</option>
    </select>

    <select
      value={filterDivision}
      onChange={(e) => setFilterDivision(e.target.value)}
      className="border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-green-500"
    >
      <option value="all">Semua Departemen (Pil 1 & 2)</option>
      <option value="Departemen Sekretaris Bendahara">Sekretaris Bendahara</option>
      <option value="Departemen PSDM">PSDM</option>
      <option value="Departemen ILPRES">ILPRES</option>
      <option value="Departemen HUBLU">HUBLU</option>
      <option value="Departemen MEDINFO">MEDINFO</option>
      <option value="Departemen EKRAF">EKRAF</option>
      <option value="Departemen SENIORA">SENIORA</option>
    </select>
  </div>

  <div className="flex justify-center">
    <button
      type="button"
      onClick={exportToExcel}
      className="px-4 py-2 bg-green-600 text-black rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
    >
      <Download className="w-4 h-4" />
      Export ke Excel
    </button>
  </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {filteredApplications.length > 0 ? (
             <table className="w-full text-left text-sm">
<thead className="bg-gray-50 border-b">
  <tr>
    <th className="p-4">Nama</th>
    <th className="p-4">NIM</th>
    <th className="p-4">Email</th>
    <th className="p-4">No. WA</th>
    <th className="p-4">Pilihan 1</th>
    <th className="p-4">Pilihan 2</th>
    <th className="p-4">Berkas</th>
    <th className="p-4">Penempatan Final</th>
    <th className="p-4">Status</th>
    <th className="p-4">Aksi</th>
   

  </tr>
</thead>
<tbody className="divide-y">
  {filteredApplications.map((app) => (
    <tr key={app.id} className="hover:bg-gray-50">
      <td className="p-4">
        <div className="font-medium">{app.full_name}</div>
      </td>

      <td className="p-4">{app.nim}</td>

      <td className="p-4 text-xs break-all">{app.email}</td>

      <td className="p-4 text-xs">{app.phone}</td>

      {/* 👉 Pilihan 1: divisi (bold) + proker di bawahnya */}
      <td className="p-4 text-sm">
        <div className="font-medium">{app.department1}</div>
        <div className="text-xs text-gray-600">{app.proker1}</div>
      </td>

      {/* 👉 Pilihan 2: sama, kalau kosong tampil "-" */}
      <td className="p-4 text-sm">
        {app.department2 ? (
          <>
            <div className="font-medium">{app.department2}</div>
            <div className="text-xs text-gray-600">{app.proker2}</div>
          </>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )}
      </td>

{/* 👇 GANTI BAGIAN KOLOM BERKAS DENGAN INI (VERTIKAL & HITAM PUTIH) 👇 */}
<td className="p-4 align-top">
  <div className="flex flex-col gap-1.5 w-[100px]"> 
    
    {/* KTM */}
    {(app as any).ktm_url && (
      <a
        href={(app as any).ktm_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center px-2 py-1 text-[10px] font-bold border border-gray-400 text-gray-800 rounded hover:bg-black hover:text-white hover:border-black transition-all"
        title="Lihat KTM"
      >
        KTM
      </a>
    )}

    {/* CV */}
    {(app as any).cv_url && (
      <a
        href={(app as any).cv_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center px-2 py-1 text-[10px] font-bold border border-gray-400 text-gray-800 rounded hover:bg-black hover:text-white hover:border-black transition-all"
        title="Lihat CV"
      >
        CV
      </a>
    )}

    {/* SURAT KOMITMEN */}
    {(app as any).surat_komitmen_url && (
      <a
        href={(app as any).surat_komitmen_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center px-2 py-1 text-[10px] font-bold border border-gray-400 text-gray-800 rounded hover:bg-black hover:text-white hover:border-black transition-all"
        title="Lihat Surat Komitmen"
      >
        SK
      </a>
    )}

    {/* PORTOFOLIO */}
    {(app as any).portfolio_url && (
      <a
        href={(app as any).portfolio_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center px-2 py-1 text-[10px] font-bold border border-gray-400 text-gray-800 rounded hover:bg-black hover:text-white hover:border-black transition-all"
        title="Lihat Portofolio"
      >
        PORTO
      </a>
    )}
    
    {/* Jika Kosong */}
    {!((app as any).ktm_url || (app as any).cv_url || (app as any).surat_komitmen_url || (app as any).portfolio_url) && (
       <span className="text-xs text-gray-300 italic text-center">-</span>
    )}
  </div>
</td>

<td className="p-4 text-sm">
  {app.status === 'accepted' && app.assigned_division && app.final_proker ? (
    <>
      <div className="font-medium">{app.assigned_division}</div>
      <div className="text-xs text-gray-600">
        {app.final_proker} — {app.final_role || 'Staff'}
      </div>
    </>
  ) : (
    <span className="text-xs text-gray-400">Belum ditetapkan</span>
  )}
</td>

      <td className="p-4">
        <span
          className={`px-2 py-1 rounded-full text-xs font-bold ${
            app.status === 'accepted'
              ? 'bg-green-100 text-green-700'
              : app.status === 'rejected'
              ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {app.status.toUpperCase()}
        </span>
      </td>

      <td className="p-4">
        <button
          onClick={() => setSelectedApplication(app)}
          className="text-blue-600 hover:underline font-medium text-sm"
        >
          Lihat Detail
        </button>
      </td>
    </tr>
  ))}
</tbody>
</table>

              ) : (
                <div className="p-8 text-center text-gray-500">Tidak ada data.</div>
              )}
            </div>

            {/* Modal Detail - LENGKAP! */}
            {selectedApplication && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
                  <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="text-xl font-bold text-green-800">Detail Pendaftaran</h3>
                    <button
                      onClick={() => setSelectedApplication(null)}
                      className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                    >
                      ✕
                    </button>
                  </div>

                  {/* ✨ DATA DIRI LENGKAP */}
                  <div className="grid md:grid-cols-2 gap-6 mb-6 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-semibold">Nama Lengkap</label>
                      <p className="font-medium">{selectedApplication.full_name}</p>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 uppercase font-semibold">NIM</label>
                      <p className="font-medium">{selectedApplication.nim}</p>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 uppercase font-semibold">Email</label>
                      <p className="font-medium break-all">{selectedApplication.email}</p>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 uppercase font-semibold">No. WhatsApp</label>
                      <p className="font-medium">{selectedApplication.phone}</p>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 uppercase font-semibold">Semester</label>
                      <p className="font-medium">{selectedApplication.semester}</p>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 uppercase font-semibold">IPK</label>
                      <p className="font-medium">{selectedApplication.ipk}</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-500 uppercase font-semibold">Motivasi</label>
                      <p className="font-medium text-sm">{selectedApplication.motivation || '-'}</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-500 uppercase font-semibold">Pengalaman</label>
                      <p className="font-medium text-sm">{selectedApplication.experience || '-'}</p>
                    </div>
                  </div>

                  {/* ✨ PILIHAN PROGRAM KERJA */}
                  <div className="mb-6 bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-bold text-blue-800 mb-3">📋 Pilihan Program Kerja</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 uppercase font-semibold">Pilihan 1</label>
                        <p className="font-bold text-green-600">{selectedApplication.proker1}</p>
                        <p className="text-sm text-gray-600">{selectedApplication.department1}</p>
                      </div>

                      {selectedApplication.proker2 && (
                        <div>
                          <label className="text-xs text-gray-500 uppercase font-semibold">Pilihan 2</label>
                          <p className="font-bold text-blue-600">{selectedApplication.proker2}</p>
                          <p className="text-sm text-gray-600">{selectedApplication.department2}</p>
                        </div>
                      )}
                    </div>
                  </div>

               {/* ✨ FILE UPLOADS - MONOCHROME STYLE */}
<div className="mb-6 border border-gray-200 p-4 rounded-lg bg-gray-50">
  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
    <FileText className="w-5 h-5" />
    Berkas Pendaftaran
  </h4>
  <div className="grid md:grid-cols-2 gap-3 text-sm">
    
    {(selectedApplication as any).ktm_url && (
      <a
        href={(selectedApplication as any).ktm_url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded hover:bg-black hover:border-black transition-colors"
      >
        <span className="font-medium text-gray-700 group-hover:text-white">KTM</span>
        <FileText className="w-4 h-4 text-gray-400 group-hover:text-white" />
      </a>
    )}

    {(selectedApplication as any).surat_komitmen_url && (
      <a
        href={(selectedApplication as any).surat_komitmen_url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded hover:bg-black hover:border-black transition-colors"
      >
        <span className="font-medium text-gray-700 group-hover:text-white">Surat Komitmen</span>
        <FileText className="w-4 h-4 text-gray-400 group-hover:text-white" />
      </a>
    )}

    {(selectedApplication as any).cv_url && (
      <a
        href={(selectedApplication as any).cv_url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded hover:bg-black hover:border-black transition-colors"
      >
        <span className="font-medium text-gray-700 group-hover:text-white">CV</span>
        <FileText className="w-4 h-4 text-gray-400 group-hover:text-white" />
      </a>
    )}

    {(selectedApplication as any).portfolio_url && (
      <a
        href={(selectedApplication as any).portfolio_url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded hover:bg-black hover:border-black transition-colors"
      >
        <span className="font-medium text-gray-700 group-hover:text-white">Portfolio</span>
        <FileText className="w-4 h-4 text-gray-400 group-hover:text-white" />
      </a>
    )}
  </div>
</div>
                  {/* Keputusan Final */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                    <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Keputusan Final
                    </h4>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      {/* Departemen */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Departemen</label>
                        <select
                          value={assignedDivision}
                          onChange={(e) => setAssignedDivision(e.target.value)}
                          className="w-full p-2 border rounded-md bg-white"
                        >
                          <option value="">Pilih Departemen</option>
                          <option value="Departemen Sekretaris Bendahara">Sekretaris Bendahara</option>
                          <option value="Departemen PSDM">PSDM</option>
                          <option value="Departemen ILPRES">ILPRES</option>
                          <option value="Departemen HUBLU">HUBLU</option>
                          <option value="Departemen MEDINFO">MEDINFO</option>
                          <option value="Departemen EKRAF">EKRAF</option>
                          <option value="Departemen SENIORA">SENIORA</option>
                        </select>
                      </div>

                      {/* Jabatan */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Jabatan</label>
                        <select
                          value={assignedRole}
                          onChange={(e) => setAssignedRole(e.target.value)}
                          className="w-full p-2 border rounded-md bg-white font-bold text-blue-700"
                        >

                          <option value="Penanggung Jawab">Penanggung Jawab</option>
                          <option value="Wakil Penanggung Jawab">Wakil Penanggung Jawab</option>
                          <option value="Sekretaris">Sekretaris</option>
                          <option value="Bendahara">Bendahara</option>
                          <option value="Staff">Staff</option>
                        </select>
                      </div>
                    </div>

                    {/* Proker */}
                    <div>
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Program Kerja / Proker</label>
                        <select
                          value={assignedProker}
                          onChange={(e) => setAssignedProker(e.target.value)}
                          className="w-full p-2 border rounded-md bg-white"
                        >
                          <option value={selectedApplication.proker1}>Pilihan 1: {selectedApplication.proker1}</option>
                          {selectedApplication.proker2 && (
                            <option value={selectedApplication.proker2}>Pilihan 2: {selectedApplication.proker2}</option>
                          )}
                          <option value="Proker Lainnya">Proker Lainnya</option>
                        </select>
                      </div>

                      {/* Custom Proker Input */}
                      {assignedProker === 'Proker Lainnya' && (
                        <div className="mb-4">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Proker Lainnya</label>
                          <input
                            value={assignedProkerCustom}
                            onChange={(e) => setAssignedProkerCustom(e.target.value)}
                            className="w-full p-2 border rounded-md bg-white"
                            placeholder="Masukkan nama program kerja"
                          />
                        </div>
                      )}
                    </div>

                    {/* Notice */}
                    {notice && <div className="mb-4 text-sm text-green-700 font-medium">{notice}</div>}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2 border-t border-blue-200 flex-wrap">
                      <button
                        disabled={updating}
                        onClick={() => updateStatus(selectedApplication.id, 'accepted')}
                        style={{
                          background: 'linear-gradient(90deg, #16a34a 0%, #059669 100%)',
                        }}
                        className="flex-1 min-w-[120px] text-white py-2 rounded-lg font-bold shadow-sm disabled:opacity-60 hover:shadow-md transition"
                      >
                        ✓ Terima
                      </button>

                      <button
                        disabled={updating}
                        onClick={() => updateStatus(selectedApplication.id, 'rejected')}
                        style={{
                          background: 'linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)',
                        }}
                        className="flex-1 min-w-[120px] text-white py-2 rounded-lg font-bold shadow-sm disabled:opacity-60 hover:shadow-md transition"
                      >
                        ✕ Tolak
                      </button>

                      <button
                        disabled={updating}
                        onClick={() => updateStatus(selectedApplication.id, 'pending')}
                        style={{
                          background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                        }}
                        className="flex-1 min-w-[120px] text-white py-2 rounded-lg font-bold shadow-sm disabled:opacity-60 hover:shadow-md transition"
                      >
                        ⏳ Pending
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
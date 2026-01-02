import { useState, useEffect } from 'react';
import { Users, Download, CheckCircle, XCircle, Clock, Search, LogOut, Briefcase } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Application {
  id: string;
  fullName: string;
  nim: string;
  email: string;
  phone: string;
  semester: string;
  ipk: number;
  proker1: string;
  department1: string;
  proker2: string;
  department2: string;
  motivation: string;
  experience: string;
  status: 'pending' | 'accepted' | 'rejected';
  submittedAt: string;
  division1?: string;
  finalRole?: string;
  finalProker?: string;
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

  // ✅ Fetch data saat component mount (jika authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
      fetchStats();
    }
  }, [isAuthenticated]);

  // ✅ Set nilai default modal ketika selectedApplication berubah
  useEffect(() => {
    if (selectedApplication) {
      setAssignedDivision(selectedApplication.department1 || selectedApplication.division1 || '');

      // Jika finalProker ada dan bukan salah satu dari pilihan, masukkan ke custom
      if (selectedApplication.finalProker) {
        if (selectedApplication.finalProker !== selectedApplication.proker1 && selectedApplication.finalProker !== selectedApplication.proker2) {
          setAssignedProker('Proker Lainnya Umum Departemen');
          setAssignedProkerCustom(selectedApplication.finalProker);
        } else {
          setAssignedProker(selectedApplication.finalProker);
          setAssignedProkerCustom('');
        }
      } else {
        setAssignedProker(selectedApplication.proker1);
        setAssignedProkerCustom('');
      }

      setAssignedRole(selectedApplication.finalRole || 'Staff');
      setNotice('');
    }
  }, [selectedApplication]);

  // ❌ HAPUS handleLogin - authentication dihandle di App.tsx saja

  const handleLogout = () => {
    onLogout();
    setApplications([]);
    setStats(null);
  };

  // ✅ Fetch Applications dengan error handling yang lebih baik
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
      // Jangan tampilkan error ke user untuk stats, cukup log
    }
  };

  // ✅ Update Status dengan validasi yang baik
  const updateStatus = async (id: string, status: 'accepted' | 'rejected' | 'pending') => {
    if (!selectedApplication) return;

    // Resolve nilai final proker
    const finalProker = assignedProker === 'Proker Lainnya Umum Departemen' ? assignedProkerCustom : assignedProker;

    // Validasi ketika menerima
    if (status === 'accepted') {
      if (!assignedDivision || !finalProker || !assignedRole) {
        alert('Pilih Departemen, Proker atau isi Proker Lainnya, dan Jabatan sebelum menerima pendaftar.');
        return;
      }

      const confirmMsg = `Yakin ingin menerima ${selectedApplication.fullName} sebagai ${assignedRole} untuk proker ${finalProker} di ${assignedDivision}?`;
      if (!window.confirm(confirmMsg)) return;
    }

    setUpdating(true);
    setNotice('');

    const prevApps = [...applications]; // optimistic update

    setApplications(
      applications.map((app) =>
        app.id === id
          ? {
              ...app,
              status,
              department1: assignedDivision,
              division1: assignedDivision,
              finalRole: assignedRole,
              finalProker: finalProker,
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
            finalProker: finalProker,
            finalRole: assignedRole,
          }),
        }
      );

      const resJson = await res.json();

      if (!res.ok || !resJson.success) {
        // rollback
        setApplications(prevApps);
        throw new Error(resJson?.error || 'Gagal update status');
      }

      setNotice('✅ Status berhasil diperbarui dan email pengumuman dikirim.');
      setSelectedApplication(null);

      // Refresh data & stats
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

  // ✅ Filter & Search Logic
  const filteredApplications = applications.filter((app) => {
    const statusMatch = filterStatus === 'all' || app.status === filterStatus;
    const appDivision = app.department1 || app.division1;
    const divisionMatch = filterDivision === 'all' || appDivision === filterDivision;
    const searchMatch =
      searchTerm === '' ||
      app.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.nim.includes(searchTerm);

    return statusMatch && divisionMatch && searchMatch;
  });

  // ✅ Export to CSV
  const exportToCSV = () => {
    const headers = 'Nama,NIM,Email,Telepon,Departemen Final,Proker Final,Jabatan,Status,Tanggal Daftar';
    const rows = filteredApplications
      .map(
        (app) =>
          `${app.fullName},${app.nim},${app.email},${app.phone},${app.department1 || app.division1},${app.finalProker || app.proker1},${app.finalRole || 'Staff'},${app.status},${new Date(app.submittedAt).toLocaleDateString('id-ID')}`
      )
      .join('\n');

    const csvContent = [headers, ...rows.split('\n')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `RekrutmenHIMAK3-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // ❌ Hapus pengecekan isAuthenticated - langsung tampilkan dashboard jika sudah login
  // App.tsx yang decide apakah perlu login atau tidak

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
            <div className="bg-white p-6 rounded-xl shadow-md mb-6 grid md:grid-cols-4 gap-4">
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
                <option value="all">Semua Departemen</option>
                {stats &&
                  Object.keys(stats.byDivision).map((div) => (
                    <option key={div} value={div}>
                      {div}
                    </option>
                  ))}
              </select>

              <button
                onClick={exportToCSV}
                className="bg-blue-600 text-white rounded-lg flex justify-center items-center gap-2 hover:bg-blue-700"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {filteredApplications.length > 0 ? (
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-4">Nama</th>
                      <th className="p-4">NIM</th>
                      <th className="p-4">Divisi</th>
                      <th className="p-4">Proker Final</th>
                      <th className="p-4">Jabatan</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="p-4">
                          <div>{app.fullName}</div>
                          <div className="text-xs text-gray-500">{app.email}</div>
                        </td>
                        <td className="p-4">{app.nim}</td>
                        <td className="p-4">{app.department1 || app.division1}</td>
                        <td className="p-4">{app.finalProker || app.proker1}</td>
                        <td className="p-4">
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">
                            {app.finalRole || 'Staff'}
                          </span>
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
                            className="text-blue-600 hover:underline"
                          >
                            Detail
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

            {/* Modal Detail */}
            {selectedApplication && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl max-w-3xl w-full max-h-90vh overflow-y-auto shadow-2xl p-6">
                  <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="text-xl font-bold text-green-800">Detail Pendaftaran</h3>
                    <button
                      onClick={() => setSelectedApplication(null)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Nama</label>
                      <p className="font-medium">{selectedApplication.fullName}</p>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 uppercase">NIM</label>
                      <p className="font-medium">{selectedApplication.nim}</p>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 uppercase">Pilihan 1</label>
                      <p className="font-bold">{selectedApplication.proker1}</p>
                      <p className="text-xs text-green-600">{selectedApplication.department1}</p>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 uppercase">Pilihan 2</label>
                      <p className="font-bold">{selectedApplication.proker2 || '-'}</p>
                      <p className="text-xs text-blue-600">{selectedApplication.department2}</p>
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
                          <option value="Proker Lainnya Umum Departemen">Lainnya Umum Departemen</option>
                        </select>
                      </div>

                      {/* Custom Proker Input */}
                      {assignedProker === 'Proker Lainnya Umum Departemen' && (
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
                    <div className="flex gap-3 pt-2 border-t border-blue-200">
                      <button
                        disabled={updating}
                        onClick={() => updateStatus(selectedApplication.id, 'accepted')}
                        style={{
                          background: 'linear-gradient(90deg, #16a34a 0%, #059669 100%)',
                        }}
                        className="flex-1 text-white py-2 rounded-lg font-bold shadow-sm disabled:opacity-60 transform hover:-translate-y-0.5 transition"
                      >
                        ✓ Terima
                      </button>

                      <button
                        disabled={updating}
                        onClick={() => updateStatus(selectedApplication.id, 'rejected')}
                        style={{
                          background: 'linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)',
                        }}
                        className="flex-1 text-white py-2 rounded-lg font-bold shadow-sm disabled:opacity-60 transform hover:-translate-y-0.5 transition"
                      >
                        ✕ Tolak
                      </button>

                      <button
                        disabled={updating}
                        onClick={() => updateStatus(selectedApplication.id, 'pending')}
                        style={{
                          background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                        }}
                        className="flex-1 text-white py-2 rounded-lg font-bold shadow-sm disabled:opacity-60 transform hover:-translate-y-0.5 transition"
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
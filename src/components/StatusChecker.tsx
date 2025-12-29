import { useState } from 'react';
import { Search, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ApplicationResult {
  found: boolean;
  fullName?: string;
  nim?: string;
  email?: string;
  proker1?: string;
  department1?: string;
  proker2?: string;
  department2?: string;
  status?: 'pending' | 'accepted' | 'rejected';
  submittedAt?: string;
}

export function StatusChecker() {
  const [searchValue, setSearchValue] = useState('');
  const [result, setResult] = useState<ApplicationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkStatus = async () => {
    if (!searchValue.trim()) {
      setError('Masukkan NIM atau Email');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/server/applications/check-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ identifier: searchValue.trim() }),
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setResult(data.result);
      } else {
        setError(data.message || 'Terjadi kesalahan');
      }
    } catch (err) {
      console.error('Error checking status:', err);
      setError('Gagal mengecek status. Coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'accepted':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          label: 'Selamat! Anda Diterima 🎉',
          message: 'Anda telah diterima sebagai anggota Himakesker. Kami akan menghubungi Anda segera melalui WhatsApp untuk informasi lebih lanjut.'
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          label: 'Mohon Maaf',
          message: 'Terima kasih atas minat Anda. Sayangnya, kami belum bisa menerima Anda di periode ini. Tetap semangat dan jangan menyerah!'
        };
      default:
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          label: 'Sedang Diproses',
          message: 'Pendaftaran Anda sedang dalam proses review. Mohon tunggu informasi lebih lanjut.'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FCF5E8] to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 
            className="text-4xl mb-3 text-[#0D652D]"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
          >
            Cek Status Pendaftaran
          </h1>
          <p 
            className="text-gray-600"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Masukkan NIM atau Email untuk mengecek status pendaftaran Anda
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="space-y-4">
            <div>
              <label 
                className="block text-sm mb-2 text-gray-700"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500 }}
              >
                NIM atau Email
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Contoh: 123456789 atau email@example.com"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && checkStatus()}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#34A853] focus:border-transparent outline-none"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {error}
                </p>
              </div>
            )}

            <button
              onClick={checkStatus}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#0D652D] to-[#34A853] text-white py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Mengecek...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Cek Status
                </>
              )}
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
            {result.found ? (
              <div className="space-y-6">
                {/* Personal Info */}
                <div className="border-b border-gray-200 pb-4">
                  <p 
                    className="text-sm text-gray-500 mb-1"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    Nama Lengkap
                  </p>
                  <p 
                    className="text-xl text-gray-900"
                    style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
                  >
                    {result.fullName}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p 
                      className="text-sm text-gray-500 mb-1"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      NIM
                    </p>
                    <p 
                      className="text-gray-900"
                      style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500 }}
                    >
                      {result.nim}
                    </p>
                  </div>
                  <div>
                    <p 
                      className="text-sm text-gray-500 mb-1"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      Email
                    </p>
                    <p 
                      className="text-gray-900"
                      style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500 }}
                    >
                      {result.email}
                    </p>
                  </div>
                </div>

                {/* Proker Choices */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
                  <p 
                    className="text-sm font-medium text-gray-700 mb-3"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    Pilihan Program Kerja
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p 
                        className="text-xs text-gray-500 mb-1"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      >
                        Pilihan 1
                      </p>
                      <p 
                        className="text-sm font-medium text-gray-900"
                        style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
                      >
                        {result.proker1}
                      </p>
                      <p 
                        className="text-xs text-[#34A853] mt-1"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      >
                        {result.department1}
                      </p>
                    </div>
                    <div>
                      <p 
                        className="text-xs text-gray-500 mb-1"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      >
                        Pilihan 2
                      </p>
                      {result.proker2 ? (
                        <>
                          <p 
                            className="text-sm font-medium text-gray-900"
                            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
                          >
                            {result.proker2}
                          </p>
                          <p 
                            className="text-xs text-[#34A853] mt-1"
                            style={{ fontFamily: "'Poppins', sans-serif" }}
                          >
                            {result.department2}
                          </p>
                        </>
                      ) : (
                        <>
                          <p 
                            className="text-sm font-medium text-gray-900"
                            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
                          >
                            {result.department2}
                          </p>
                          <p 
                            className="text-xs text-orange-600 mt-1"
                            style={{ fontFamily: "'Poppins', sans-serif" }}
                          >
                            (Departemen cadangan)
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Card */}
                {result.status && (() => {
                  const statusInfo = getStatusInfo(result.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <div className={`${statusInfo.bg} ${statusInfo.border} border-2 rounded-xl p-6 mt-6`}>
                      <div className="flex items-start gap-4">
                        <StatusIcon className={`w-8 h-8 ${statusInfo.color} flex-shrink-0 mt-1`} />
                        <div className="flex-1">
                          <h3 
                            className={`text-xl mb-2 ${statusInfo.color}`}
                            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}
                          >
                            {statusInfo.label}
                          </h3>
                          <p 
                            className="text-gray-700"
                            style={{ fontFamily: "'Poppins', sans-serif" }}
                          >
                            {statusInfo.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="text-center pt-4 border-t border-gray-200">
                  <p 
                    className="text-sm text-gray-500"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    Tanggal Pendaftaran: {result.submittedAt && new Date(result.submittedAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 
                  className="text-xl mb-2 text-gray-700"
                  style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
                >
                  Data Tidak Ditemukan
                </h3>
                <p 
                  className="text-gray-500"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Pastikan NIM atau Email yang Anda masukkan sudah benar
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
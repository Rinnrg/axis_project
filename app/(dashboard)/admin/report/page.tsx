'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  Megaphone,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  MessageSquare,
  Trash2,
  Edit3,
  X,
  MapPin,
  Tag,
  User as UserIcon,
  Phone,
  Mail,
  ChevronDown,
  ExternalLink,
  Paperclip,
  Users,
  Building,
  Image as ImageIcon,
} from 'lucide-react';

interface ReportUser {
  id: string;
  name: string;
  email: string;
  position: string | null;
  department: string | null;
}

interface ReportItem {
  id: string;
  userId?: string | null;
  isPublic?: boolean;
  reporterName?: string | null;
  reporterPhone?: string | null;
  reporterEmail?: string | null;
  title: string;
  category: string;
  description: string;
  location?: string | null;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  adminNote: string | null;
  attachment: string | null;
  createdAt: string;
  user?: ReportUser | null;
}

const CATEGORIES: Record<string, string> = {
  FASILITAS: '🏊 Fasilitas',
  KEBERSIHAN: '🧹 Kebersihan',
  KEAMANAN: '🔒 Keamanan',
  PERALATAN: '🔧 Peralatan',
  LAYANAN: '👥 Layanan',
  LAINNYA: '📋 Lainnya',
};

const STATUSES: Record<string, { label: string; icon: any; color: string }> = {
  OPEN: { label: 'Terbuka', icon: AlertTriangle, color: 'bg-amber-100 text-amber-800 border-amber-200' },
  IN_PROGRESS: { label: 'Diproses', icon: Clock, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  RESOLVED: { label: 'Selesai', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  CLOSED: { label: 'Ditutup', icon: XCircle, color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export default function AdminReportPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PUBLIC' | 'INTERNAL'>('ALL');

  // Edit Modal State
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [editStatus, setEditStatus] = useState<string>('OPEN');
  const [editAdminNote, setEditAdminNote] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  // Image Preview Modal State
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/reports');
      if (!res.ok) throw new Error('Gagal mengambil data laporan');
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const openEditModal = (report: ReportItem) => {
    setSelectedReport(report);
    setEditStatus(report.status);
    setEditAdminNote(report.adminNote || '');
  };

  const handleUpdateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    setUpdating(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedReport.id,
          status: editStatus,
          adminNote: editAdminNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui laporan');

      Swal.fire({
        icon: 'success',
        title: 'Berhasil Diperbarui',
        text: 'Status laporan dan catatan admin telah disimpan.',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'rounded-2xl' },
      });

      setSelectedReport(null);
      fetchReports();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: err.message || 'Terjadi kesalahan.',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'rounded-2xl' },
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: 'Laporan ini akan dihapus permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
      customClass: { popup: 'rounded-2xl' },
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/reports?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus laporan');

      setReports((prev) => prev.filter((r) => r.id !== id));
      Swal.fire({
        icon: 'success',
        title: 'Terhapus',
        text: 'Laporan telah berhasil dihapus.',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'rounded-2xl' },
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.message || 'Gagal menghapus laporan',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'rounded-2xl' },
      });
    }
  };

  // Utility to generate WhatsApp Link
  const formatWhatsAppUrl = (phone: string, title: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    let formattedPhone = cleanPhone;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    }
    const text = encodeURIComponent(
      `Halo, saya Admin Club House terkait laporan Anda: "${title}".`
    );
    return `https://wa.me/${formattedPhone}?text=${text}`;
  };

  const filteredReports = reports.filter((r) => {
    const isPublic = r.isPublic || !r.userId;
    const matchesType =
      typeFilter === 'ALL' ||
      (typeFilter === 'PUBLIC' && isPublic) ||
      (typeFilter === 'INTERNAL' && !isPublic);

    const reporterName = isPublic ? r.reporterName || 'Pelanggan' : r.user?.name || '';
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      reporterName.toLowerCase().includes(search.toLowerCase()) ||
      (r.location && r.location.toLowerCase().includes(search.toLowerCase())) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      (r.reporterPhone && r.reporterPhone.includes(search));

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;

    return matchesType && matchesSearch && matchesStatus;
  });

  const stats = {
    total: reports.length,
    publicCount: reports.filter((r) => r.isPublic || !r.userId).length,
    internalCount: reports.filter((r) => !r.isPublic && r.userId).length,
    open: reports.filter((r) => r.status === 'OPEN').length,
    inProgress: reports.filter((r) => r.status === 'IN_PROGRESS').length,
    resolved: reports.filter((r) => r.status === 'RESOLVED').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2.5">
              <Megaphone className="w-8 h-8 text-indigo-600" />
              Kelola Laporan & Pengaduan
            </h1>
            <p className="text-slate-600 mt-1">
              Pantau dan tindak lanjuti laporan dari pelanggan (tanpa login) serta keluhan internal karyawan.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Laporan</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-purple-50/90 p-4 rounded-xl border border-purple-200 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-700">Pelanggan</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">{stats.publicCount}</p>
          </div>
          <div className="bg-blue-50/90 p-4 rounded-xl border border-blue-200 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Karyawan</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{stats.internalCount}</p>
          </div>
          <div className="bg-amber-50/90 p-4 rounded-xl border border-amber-200 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Terbuka</p>
            <p className="text-2xl font-bold text-amber-900 mt-1">{stats.open}</p>
          </div>
          <div className="bg-sky-50/90 p-4 rounded-xl border border-sky-200 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Diproses</p>
            <p className="text-2xl font-bold text-sky-900 mt-1">{stats.inProgress}</p>
          </div>
          <div className="bg-emerald-50/90 p-4 rounded-xl border border-emerald-200 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Selesai</p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">{stats.resolved}</p>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama, no telp, judul, atau lokasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto items-center justify-end">
            {/* Sender Type Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setTypeFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${typeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Semua Tipe
              </button>
              <button
                onClick={() => setTypeFilter('PUBLIC')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${typeFilter === 'PUBLIC' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Pelanggan
              </button>
              <button
                onClick={() => setTypeFilter('INTERNAL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${typeFilter === 'INTERNAL' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Karyawan
              </button>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-1">
              {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {st === 'ALL' ? 'Semua Status' : STATUSES[st]?.label || st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* List of Reports */}
        <div className="space-y-4">
          {!loading && filteredReports.length > 0 ? (
            filteredReports.map((report) => {
              const statusCfg = STATUSES[report.status] || STATUSES.OPEN;
              const StatusIcon = statusCfg.icon;
              const isPublic = report.isPublic || !report.userId;

              return (
                <div
                  key={report.id}
                  className={`bg-white rounded-2xl border ${isPublic ? 'border-purple-200/80 shadow-purple-500/5' : 'border-slate-200'
                    } shadow-sm p-5 space-y-4 hover:border-indigo-300 transition-all`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        {/* Sender Type Badge */}
                        {isPublic ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center gap-1 shadow-xs">
                            <Users className="w-3 h-3" />
                            PELANGGAN (PUBLIC)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            KARYAWAN
                          </span>
                        )}

                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusCfg.color} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {CATEGORIES[report.category] || report.category}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900">{report.title}</h3>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-start">
                      <button
                        onClick={() => openEditModal(report)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Tindak Lanjuti
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="p-1.5 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Laporan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-3">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                      {report.description}
                    </p>

                    {/* Attachment Photo Thumbnail */}
                    {report.attachment && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setPreviewImage(report.attachment)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                        >
                          <ImageIcon className="w-4 h-4 text-indigo-600" />
                          Lihat Lampiran Foto
                        </button>
                      </div>
                    )}

                    {/* Reporter Info Details Box */}
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-4 text-slate-700">
                        {isPublic ? (
                          <>
                            <span className="flex items-center gap-1.5 font-bold text-purple-950">
                              <UserIcon className="w-4 h-4 text-purple-600" />
                              {report.reporterName || 'Pelanggan'}
                            </span>
                            {report.reporterPhone && (
                              <span className="flex items-center gap-1 font-semibold text-slate-800">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                {report.reporterPhone}
                              </span>
                            )}
                            {report.reporterEmail && (
                              <span className="flex items-center gap-1 text-slate-600">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                {report.reporterEmail}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="flex items-center gap-1.5 font-bold text-slate-900">
                            <UserIcon className="w-4 h-4 text-blue-600" />
                            {report.user?.name} ({report.user?.position || 'Karyawan'})
                          </span>
                        )}
                        <span className="text-slate-400">
                          {new Date(report.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>

                      {/* WhatsApp Direct Contact Button for Public Customers */}
                      {isPublic && report.reporterPhone && (
                        <a
                          href={formatWhatsAppUrl(report.reporterPhone, report.title)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Hubungi WhatsApp
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Admin Note */}
                  {report.adminNote && (
                    <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-3.5">
                      <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                        Tanggapan Admin / Pengelola:
                      </p>
                      <p className="text-xs text-indigo-900 leading-relaxed whitespace-pre-line">{report.adminNote}</p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-2 py-4">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-slate-500 text-sm">Memuat laporan dari server...</p>
                </div>
              ) : (
                <>
                  <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-700 font-semibold">Tidak ada laporan yang ditemukan</p>
                  <p className="text-slate-400 text-xs mt-1">
                    Coba sesuaikan pencarian atau filter tipe/status laporan.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit / Tindak Lanjuti Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Tindak Lanjuti Laporan</h3>
                <p className="text-xs text-slate-500 font-medium truncate max-w-xs">{selectedReport.title}</p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateReport} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Ubah Status Laporan</label>
                <div className="relative">
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white pr-8 cursor-pointer"
                  >
                    <option value="OPEN">Terbuka (Belum diproses)</option>
                    <option value="IN_PROGRESS">Diproses (Sedang ditangani)</option>
                    <option value="RESOLVED">Selesai (Masalah teratasi)</option>
                    <option value="CLOSED">Ditutup (Batal/Ditolak)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  Tanggapan / Catatan Admin <span className="text-slate-400 font-normal">(opsional)</span>
                </label>
                <textarea
                  value={editAdminNote}
                  onChange={(e) => setEditAdminNote(e.target.value)}
                  rows={4}
                  placeholder="Tuliskan tindak lanjut atau penjelasan solusi untuk dilaporkan ke pelanggan/karyawan..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-2">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewImage} alt="Preview Lampiran" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
}

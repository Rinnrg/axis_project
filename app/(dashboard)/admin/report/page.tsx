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
  ChevronDown,
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
  userId: string;
  title: string;
  category: string;
  description: string;
  location: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  adminNote: string | null;
  createdAt: string;
  user: ReportUser;
}

const CATEGORIES: Record<string, string> = {
  FASILITAS: '🏊 Fasilitas',
  KEBERSIHAN: '🧹 Kebersihan',
  KEAMANAN: '🔒 Keamanan',
  PERALATAN: '🔧 Peralatan',
  LAYANAN: '👥 Layanan',
  LAINNYA: '📋 Lainnya',
};

const PRIORITIES: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Rendah', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  MEDIUM: { label: 'Sedang', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  HIGH: { label: 'Tinggi', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-200' },
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

  // Edit Modal State
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [editStatus, setEditStatus] = useState<string>('OPEN');
  const [editAdminNote, setEditAdminNote] = useState<string>('');
  const [updating, setUpdating] = useState(false);

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

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.user?.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.location && r.location.toLowerCase().includes(search.toLowerCase())) ||
      r.description.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: reports.length,
    open: reports.filter((r) => r.status === 'OPEN').length,
    inProgress: reports.filter((r) => r.status === 'IN_PROGRESS').length,
    resolved: reports.filter((r) => r.status === 'RESOLVED').length,
    closed: reports.filter((r) => r.status === 'CLOSED').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2.5">
              <Megaphone className="w-8 h-8 text-indigo-600" />
              Kelola Laporan Club House
            </h1>
            <p className="text-slate-600 mt-1">
              Pantau dan tindak lanjuti komplain serta keluhan fasilitas di Club House
            </p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Memuat data...
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Terbuka</p>
            <p className="text-2xl font-bold text-amber-900 mt-1">{stats.open}</p>
          </div>
          <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-200 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Diproses</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{stats.inProgress}</p>
          </div>
          <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Selesai</p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">{stats.resolved}</p>
          </div>
          <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Ditutup</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.closed}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari judul, nama, atau lokasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'Semua' : STATUSES[st]?.label || st}
              </button>
            ))}
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
              const priCfg = PRIORITIES[report.priority] || PRIORITIES.MEDIUM;
              const StatusIcon = statusCfg.icon;

              return (
                <div
                  key={report.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 hover:border-slate-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusCfg.color} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${priCfg.color}`}>
                          Prioritas: {priCfg.label}
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
                  <div className="space-y-2">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {report.description}
                    </p>

                    <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        {report.user?.name} ({report.user?.position || 'Karyawan'})
                      </span>
                      {report.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          Lokasi: {report.location}
                        </span>
                      )}
                      <span>
                        Dibuat: {new Date(report.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>

                  {/* Admin Note if exists */}
                  {report.adminNote && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mt-2">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                        Tanggapan Admin / Pengelola:
                      </p>
                      <p className="text-xs text-slate-800 leading-relaxed">{report.adminNote}</p>
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
                    Coba sesuaikan pencarian atau filter status laporan.
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
                <p className="text-xs text-slate-500">{selectedReport.title}</p>
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
                  placeholder="Tuliskan tindak lanjut atau solusi yang telah dilakukan..."
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
    </div>
  );
}

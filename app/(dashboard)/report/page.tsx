'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Swal from 'sweetalert2';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Loader2,
  AlertCircle,
  ChevronDown,
  Megaphone,
  Tag,
  MapPin,
  FileText,
  Paperclip,
  X,
  ArrowUpRight,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'FASILITAS',  label: '🏊 Fasilitas',  desc: 'Kolam renang, gym, dll' },
  { value: 'KEBERSIHAN', label: '🧹 Kebersihan',  desc: 'Kebersihan area club house' },
  { value: 'KEAMANAN',   label: '🔒 Keamanan',   desc: 'Keamanan dan keselamatan' },
  { value: 'PERALATAN',  label: '🔧 Peralatan',  desc: 'Kerusakan alat/infrastruktur' },
  { value: 'LAYANAN',    label: '👥 Layanan',    desc: 'Layanan staf dan pelayanan' },
  { value: 'LAINNYA',    label: '📋 Lainnya',    desc: 'Laporan lain-lain' },
];

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  OPEN:        { label: 'Terbuka',     icon: AlertTriangle, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  IN_PROGRESS: { label: 'Diproses',    icon: Clock,         color: 'bg-blue-50  text-blue-700  border-blue-200'  },
  RESOLVED:    { label: 'Selesai',     icon: CheckCircle,   color: 'bg-green-50 text-green-700 border-green-200' },
  CLOSED:      { label: 'Ditutup',     icon: XCircle,       color: 'bg-slate-50 text-slate-600 border-slate-200' },
};

interface Report {
  id: string;
  title: string;
  category: string;
  description: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

export default function ReportPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const resetForm = () => {
    setTitle('');
    setCategory('');
    setDescription('');
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category || !description.trim()) {
      Swal.fire({ icon: 'warning', title: 'Lengkapi Form', text: 'Judul, kategori, dan deskripsi wajib diisi.', confirmButtonColor: '#4f46e5', customClass: { popup: 'rounded-2xl' } });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), category, description: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim laporan');

      Swal.fire({ icon: 'success', title: 'Laporan Terkirim!', text: 'Laporan Anda telah berhasil dikirim dan akan segera ditindaklanjuti.', timer: 2000, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
      resetForm();
      fetchReports();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Gagal!', text: err.message || 'Terjadi kesalahan.', confirmButtonColor: '#4f46e5', customClass: { popup: 'rounded-2xl' } });
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryLabel = (val: string) => CATEGORIES.find(c => c.value === val)?.label || val;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-7 h-7 text-indigo-600" />
              Laporan
            </h1>
            <p className="text-slate-500 text-sm mt-1">Sampaikan komplain atau masalah di Club House</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shrink-0 touch-manipulation"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Buat Laporan</span>
              <span className="sm:hidden">Buat</span>
            </button>
          )}
        </div>

        {/* Form Panel */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-base">Buat Laporan Baru</h2>
              <button onClick={resetForm} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-400" />Judul Laporan
                </label>
                <input
                  type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Contoh: Kerusakan AC di Lobi Utama"
                  maxLength={100}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-slate-400" />Kategori
                </label>
                <div className="relative">
                  <select
                    value={category} onChange={e => setCategory(e.target.value)} required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white pr-8 cursor-pointer"
                  >
                    <option value="" disabled>Pilih...</option>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Deskripsi Masalah</label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)} required
                  rows={4} maxLength={1000}
                  placeholder="Jelaskan masalah secara detail: apa yang terjadi, kapan, dan dampaknya..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
                />
                <p className="text-[11px] text-slate-400 text-right">{description.length}/1000</p>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={resetForm}
                  className="flex-1 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Mengirim...</> : 'Kirim Laporan'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reports List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">
            Laporan Saya ({reports.length})
          </h2>

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 flex flex-col items-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <p className="text-sm">Memuat laporan...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
              <Megaphone className="w-10 h-10 text-slate-200 mx-auto" />
              <p className="font-semibold text-slate-600">Belum ada laporan</p>
              <p className="text-xs text-slate-400">Klik "Buat Laporan" untuk menyampaikan masalah.</p>
            </div>
          ) : (
            reports.map(report => {
              const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.OPEN;
              const StatusIcon = statusCfg.icon;
              return (
                <div key={report.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate">{report.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {getCategoryLabel(report.category)} · {new Date(report.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.color}`}>
                        <StatusIcon className="w-2.5 h-2.5" />
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{report.description}</p>

                  {report.adminNote && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                      <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Catatan Admin</p>
                      <p className="text-xs text-indigo-800 leading-relaxed">{report.adminNote}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

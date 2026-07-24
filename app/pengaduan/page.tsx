'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Swal from 'sweetalert2';
import {
  Megaphone,
  User,
  Phone,
  Mail,
  FileText,
  Tag,
  Paperclip,
  Loader2,
  CheckCircle2,
  Send,
  X,
  ChevronDown,
  ShieldCheck,
  Building2,
  Sparkles,
  Search,
  History,
  Clock,
  AlertTriangle,
  XCircle,
  LogOut,
  Lock,
  PlusCircle,
  Eye,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'FASILITAS', label: '🏊 Fasilitas', desc: 'Kolam renang, gym, area umum, parkir' },
  { value: 'KEBERSIHAN', label: '🧹 Kebersihan', desc: 'Kebersihan fasilitas, sampah, toilet' },
  { value: 'KEAMANAN', label: '🔒 Keamanan', desc: 'Akses masuk, ketertiban, keamanan' },
  { value: 'PERALATAN', label: '🔧 Peralatan', desc: 'Kerusakan AC, lampu, alat gym, dll' },
  { value: 'LAYANAN', label: '👥 Layanan', desc: 'Pelayanan staf, kasir, customer service' },
  { value: 'LAINNYA', label: '📋 Lainnya', desc: 'Saran, masukan, atau keluhan lainnya' },
];

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  OPEN: { label: 'Terbuka', icon: AlertTriangle, color: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
  IN_PROGRESS: { label: 'Diproses', icon: Clock, color: 'bg-blue-500/10 text-blue-300 border-blue-500/30' },
  RESOLVED: { label: 'Selesai', icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
  CLOSED: { label: 'Ditutup', icon: XCircle, color: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
};

interface PublicReportItem {
  id: string;
  reporterName?: string | null;
  reporterPhone?: string | null;
  reporterEmail?: string | null;
  title: string;
  category: string;
  description: string;
  status: string;
  adminNote?: string | null;
  attachment?: string | null;
  createdAt: string;
}

export default function PublicReportPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  // Redirect authenticated internal users (employees & admins) to internal report page
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === 'admin' || user.role === 'chief_admin') {
        router.replace('/admin/report');
      } else {
        router.replace('/report');
      }
    }
  }, [user, isAuthenticated, isLoading, router]);

  // Submit Form States
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ id: string } | null>(null);

  // Customer Contact Fields
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');

  // Report Details Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);

  // History Search / Auth States
  const [searchQuery, setSearchQuery] = useState('');
  const [savedPhone, setSavedPhone] = useState<string | null>(null);
  const [historyReports, setHistoryReports] = useState<PublicReportItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searched, setSearched] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Load saved phone number on mount
  useEffect(() => {
    const phone = localStorage.getItem('customer_report_phone');
    if (phone) {
      setSavedPhone(phone);
      setSearchQuery(phone);
      fetchHistory(phone);
    }
  }, []);

  // Photo Upload Handler (base64)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Terlalu Besar',
        text: 'Ukuran foto maksimal 5 MB.',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'rounded-2xl' },
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachment(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setTitle('');
    setCategory('');
    setDescription('');
    setAttachment(null);
    setSuccessData(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reporterName.trim() || !reporterPhone.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Data Diri Belum Lengkap',
        text: 'Mohon isi nama lengkap dan nomor telepon/WhatsApp Anda.',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'rounded-2xl' },
      });
      return;
    }

    if (!title.trim() || !category || !description.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Lengkapi Detail Laporan',
        text: 'Mohon isi judul laporan, kategori, dan deskripsi masalah.',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'rounded-2xl' },
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reports/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterName: reporterName.trim(),
          reporterPhone: reporterPhone.trim(),
          reporterEmail: reporterEmail.trim() || null,
          title: title.trim(),
          category,
          description: description.trim(),
          attachment,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim laporan');

      // Auto-save phone for history lookup
      localStorage.setItem('customer_report_phone', reporterPhone.trim());
      setSavedPhone(reporterPhone.trim());

      setSuccessData({ id: data.reportId || data.report?.id });

      Swal.fire({
        icon: 'success',
        title: 'Laporan Berhasil Terkirim!',
        text: 'Terima kasih telah menyampaikan pengaduan Anda. Tim pengelola kami akan segera menindaklanjuti.',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'rounded-2xl' },
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirim',
        text: err.message || 'Terjadi kesalahan pada sistem. Silakan coba lagi.',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'rounded-2xl' },
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch History by Phone / Ticket ID
  const fetchHistory = async (query: string) => {
    if (!query.trim()) return;
    setLoadingHistory(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/reports/public?query=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengambil riwayat');
      setHistoryReports(data.reports || []);

      // Save phone if valid query
      if (query.trim().length >= 4) {
        localStorage.setItem('customer_report_phone', query.trim());
        setSavedPhone(query.trim());
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memuat Riwayat',
        text: err.message || 'Terjadi kesalahan.',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'rounded-2xl' },
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory(searchQuery);
  };

  const handleLogoutPhone = () => {
    localStorage.removeItem('customer_report_phone');
    setSavedPhone(null);
    setSearchQuery('');
    setHistoryReports([]);
    setSearched(false);
  };

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
        <p className="text-sm font-medium text-slate-300">Mengalihkan ke Halaman Laporan Karyawan...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">


        {/* Mode Toggle Tabs */}
        <div className="bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60 grid grid-cols-2 gap-2 shadow-lg">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'create'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
          >
            <PlusCircle className="w-4 h-4" />
            Buat Laporan Baru
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
          >
            <History className="w-4 h-4" />
            Cek Riwayat Laporan
          </button>
        </div>

        {/* TAB 1: BUAT LAPORAN BARU */}
        {activeTab === 'create' && (
          <>
            {successData ? (
              <div className="bg-slate-800/90 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">Laporan Berhasil Diterima</h2>
                  <p className="text-slate-300 text-sm max-w-md mx-auto">
                    ID Tiket Laporan Anda: <span className="font-mono font-bold text-indigo-400">{successData.id}</span>
                  </p>
                  <p className="text-slate-400 text-xs">
                    Tim admin akan menghubungi Anda melalui WhatsApp/Telepon jika membutuhkan keterangan lebih lanjut.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
                  >
                    Buat Laporan Lainnya
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('history');
                      if (reporterPhone) {
                        setSearchQuery(reporterPhone);
                        fetchHistory(reporterPhone);
                      }
                    }}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer flex items-center gap-2"
                  >
                    <History className="w-4 h-4" />
                    Lihat Status & Riwayat
                  </button>
                </div>
              </div>
            ) : (
              /* Main Form Card */
              <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* SECTION 1: DATA DIRI PELANGGAN */}
                  <div className="space-y-4">
                    <div className="border-b border-slate-700/60 pb-2 flex items-center justify-between">
                      <h2 className="text-base font-bold text-indigo-300 flex items-center gap-2">
                        <User className="w-4 h-4 text-indigo-400" />
                        1. Data Diri Pelanggan
                      </h2>
                      <span className="text-xs text-slate-400">*Wajib diisi</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Nama Lengkap */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Nama Lengkap <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={reporterName}
                          onChange={(e) => setReporterName(e.target.value)}
                          placeholder="Contoh: Budi Santoso"
                          className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                      </div>

                      {/* Nomor Telepon / WhatsApp */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          No. Telepon / WhatsApp <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={reporterPhone}
                          onChange={(e) => setReporterPhone(e.target.value)}
                          placeholder="Contoh: 08123456789"
                          className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    {/* Email (Optional) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        Alamat Email <span className="text-slate-500 font-normal">(opsional)</span>
                      </label>
                      <input
                        type="email"
                        value={reporterEmail}
                        onChange={(e) => setReporterEmail(e.target.value)}
                        placeholder="Contoh: pelanggan@gmail.com"
                        className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* SECTION 2: DETAIL LAPORAN */}
                  <div className="space-y-4 pt-2">
                    <div className="border-b border-slate-700/60 pb-2 flex items-center justify-between">
                      <h2 className="text-base font-bold text-indigo-300 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        2. Detail Laporan / Pengaduan
                      </h2>
                    </div>

                    {/* Judul Laporan */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Judul Laporan <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Contoh: Kerusakan Lampu di Area Gym"
                        maxLength={120}
                        className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        Kategori <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <select
                          required
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none pr-8 cursor-pointer"
                        >
                          <option value="" disabled className="bg-slate-900 text-slate-400">
                            Pilih Kategori...
                          </option>
                          {CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value} className="bg-slate-900 text-white">
                              {cat.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Deskripsi Masalah */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Deskripsi Lengkap <span className="text-rose-400">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        maxLength={1000}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Jelaskan kronologi atau permasalahan yang Anda alami secara mendetail..."
                        className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all"
                      />
                      <p className="text-[11px] text-slate-400 text-right">{description.length}/1000</p>
                    </div>

                    {/* Attachment Upload */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                        Lampiran Foto Bukti <span className="text-slate-500 font-normal">(opsional, maks 5MB)</span>
                      </label>

                      {attachment ? (
                        <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 max-w-xs">
                          <img src={attachment} alt="Lampiran Bukti" className="w-full h-40 object-cover" />
                          <button
                            type="button"
                            onClick={() => setAttachment(null)}
                            className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer"
                            title="Hapus Foto"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl bg-slate-900/40 hover:bg-slate-900/80 transition-all cursor-pointer group">
                          <Paperclip className="w-6 h-6 text-slate-400 group-hover:text-indigo-400 mb-1 transition-colors" />
                          <span className="text-xs text-slate-300 font-medium">Klik untuk memilih foto</span>
                          <span className="text-[10px] text-slate-500">Format PNG, JPG, JPEG, WebP</span>
                          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Security Banner */}
                  <div className="flex items-center gap-2 p-3 bg-indigo-950/50 border border-indigo-800/40 rounded-xl text-xs text-indigo-300">
                    <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Informasi pribadi Anda aman dan hanya digunakan untuk kepentingan verifikasi & tindak lanjut laporan.</span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-xl shadow-indigo-600/30 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Mengirimkan Laporan...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Kirimkan Laporan Pelanggan
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </>
        )}

        {/* TAB 2: CEK RIWAYAT LAPORAN (LOGIN NO. WA / ID TIKET) */}
        {activeTab === 'history' && (
          <div className="space-y-6">

            {/* Login / Search Box Card */}
            <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-indigo-400" />
                  <h2 className="font-bold text-white text-base">Login / Cek Status Pengaduan</h2>
                </div>
                {savedPhone && (
                  <button
                    onClick={handleLogoutPhone}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Ganti Nomor / Logout
                  </button>
                )}
              </div>

              <form onSubmit={handleSearchSubmit} className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 block">
                  Masukkan Nomor WhatsApp / Telepon atau ID Tiket Laporan Anda:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Contoh: 08123456789 atau ID Tiket..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loadingHistory}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    {loadingHistory ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Cek Laporan
                      </>
                    )}
                  </button>
                </div>
                {savedPhone && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Terhubung dengan sesi nomor: <span className="font-mono font-bold">{savedPhone}</span>
                  </p>
                )}
              </form>
            </div>

            {/* Results List */}
            <div className="space-y-4">
              {loadingHistory ? (
                <div className="bg-slate-800/60 rounded-3xl border border-slate-700/60 p-10 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                  <p className="text-sm text-slate-300">Mencari riwayat pengaduan Anda...</p>
                </div>
              ) : searched && historyReports.length === 0 ? (
                <div className="bg-slate-800/60 rounded-3xl border border-slate-700/60 p-10 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                  <h3 className="font-bold text-white text-base">Laporan Tidak Ditemukan</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Tidak ada pengaduan yang terdaftar dengan nomor atau ID tiket tersebut. Pastikan nomor yang diinput sesuai dengan saat pengajuan.
                  </p>
                </div>
              ) : (
                historyReports.map((report) => {
                  const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.OPEN;
                  const StatusIcon = statusCfg.icon;
                  const catDesc = CATEGORIES.find((c) => c.value === report.category)?.label || report.category;

                  return (
                    <div
                      key={report.id}
                      className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 hover:border-indigo-500/50 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-700/60 pb-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusCfg.color} flex items-center gap-1`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusCfg.label}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-700 text-slate-300">
                              {catDesc}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-white">{report.title}</h3>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            ID Tiket: <span className="text-indigo-300 font-bold">{report.id}</span>
                          </p>
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">
                          {new Date(report.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>

                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                        {report.description}
                      </p>

                      {/* Attachment */}
                      {report.attachment && (
                        <div>
                          <button
                            type="button"
                            onClick={() => setPreviewImage(report.attachment || null)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-indigo-300 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-400" />
                            Lihat Foto Lampiran
                          </button>
                        </div>
                      )}

                      {/* Admin Response Box */}
                      {report.adminNote ? (
                        <div className="bg-indigo-950/60 border border-indigo-800/50 rounded-2xl p-4 space-y-1">
                          <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            Tanggapan Pengelola / Admin:
                          </p>
                          <p className="text-xs text-indigo-200 leading-relaxed">
                            {report.adminNote}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">
                          * Laporan Anda sedang dalam antrean peninjauan oleh tim admin.
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Photo Modal */}
        {previewImage && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden p-2">
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 p-2 bg-slate-800 text-white rounded-full hover:bg-rose-600 transition-colors cursor-pointer z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <img src={previewImage} alt="Lampiran Foto" className="w-full max-h-[80vh] object-contain rounded-2xl" />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Axis Club House. Semua Hak Cipta Dilindungi.</p>
        </div>
      </div>
    </div>
  );
}

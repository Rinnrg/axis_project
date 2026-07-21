'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { FileText, Plus, AlertCircle, CheckCircle, Clock, X, RefreshCw } from 'lucide-react';

interface PermissionRecord {
  id: string;
  type: 'izin' | 'cuti' | 'sakit';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  attachment?: string | null;
}

export default function IzinPage() {
  const { user } = useAuth();
  const [showForm,  setShowForm]  = useState(false);
  const [records,   setRecords]   = useState<PermissionRecord[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [submitting,setSubmitting]= useState(false);
  const [attachment,setAttachment]  = useState<string | null>(null);
  const [formData,  setFormData]  = useState({
    type: 'izin' as 'izin' | 'cuti' | 'sakit',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file terlalu besar (maksimal 5MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const webpDataUrl = canvas.toDataURL('image/webp', 0.8);
        setAttachment(webpDataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const fetchPermissions = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/permissions?userId=${user.id}`);
      const data = await res.json();
      setRecords(data.permissions ?? []);
    } catch (err) {
      console.error('Failed to fetch permissions', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSubmitting(true);
    try {
      await fetch('/api/permissions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId: user.id, ...formData, attachment }),
      });
      setFormData({ type: 'izin', startDate: '', endDate: '', reason: '' });
      setAttachment(null);
      setShowForm(false);
      fetchPermissions();
    } catch (err) {
      console.error('Failed to submit permission', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'rejected': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:         return <Clock       className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusBadge = (s: string) => ({
    approved: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    rejected: 'bg-red-100    text-red-700    border border-red-200',
    pending:  'bg-amber-100  text-amber-700  border border-amber-200',
  }[s] ?? 'bg-amber-100 text-amber-700 border border-amber-200');

  const getStatusLabel  = (s: string) => ({ approved:'Disetujui', rejected:'Ditolak', pending:'Menunggu' }[s] ?? s);
  const getTypeLabel    = (t: string) => ({ izin:'Izin', cuti:'Cuti', sakit:'Sakit' }[t] ?? t);

  const typeColors: Record<string, string> = {
    izin:  'border-indigo-500 bg-indigo-50 text-indigo-700',
    cuti:  'border-violet-500 bg-violet-50 text-violet-700',
    sakit: 'border-rose-500   bg-rose-50   text-rose-700',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">

        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Pengajuan Izin</h1>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">Kelola pengajuan izin dan cuti Anda</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchPermissions}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors touch-manipulation"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {!showForm && (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-3 sm:px-4 text-sm touch-manipulation"
              >
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Ajukan Izin</span>
              </Button>
            )}
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-4 border border-indigo-100">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">Formulir Pengajuan Izin</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors touch-manipulation"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-medium text-slate-700">Jenis Izin</label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {(['izin', 'cuti', 'sakit'] as const).map(t => (
                    <button
                      key={t} type="button"
                      onClick={() => setFormData(p => ({ ...p, type: t }))}
                      className={`py-2.5 sm:py-3 rounded-lg border-2 text-sm font-medium transition-all touch-manipulation ${
                        formData.type === t ? typeColors[t] : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {getTypeLabel(t)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700">Dari Tanggal</label>
                  <input
                    type="date" value={formData.startDate}
                    onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-500 touch-manipulation"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700">Sampai Tanggal</label>
                  <input
                    type="date" value={formData.endDate}
                    onChange={e => setFormData(p => ({ ...p, endDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-500 touch-manipulation"
                    required
                  />
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-medium text-slate-700">Alasan</label>
                <textarea
                  value={formData.reason}
                  onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))}
                  placeholder="Jelaskan alasan izin/cuti Anda..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  required
                />
              </div>

              {/* Attachment File Upload */}
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-medium text-slate-700">
                  Unggah Bukti Pendukung (Opsional, PDF/Foto)
                </label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-500
                              file:mr-4 file:py-2.5 file:px-4
                              file:rounded-xl file:border-0
                              file:text-xs file:font-semibold
                              file:bg-indigo-50 file:text-indigo-700
                              hover:file:bg-indigo-100 transition-all cursor-pointer"
                  />
                  {attachment && (
                    <div className="mt-2 relative inline-block w-28 h-28 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <img
                        src={attachment}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  type="submit" disabled={submitting}
                  className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white h-11 touch-manipulation"
                >
                  {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
                </Button>
                <Button
                  type="button" onClick={() => setShowForm(false)} variant="outline"
                  className="flex-1 sm:flex-none h-11 touch-manipulation"
                >
                  Batal
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">Riwayat Pengajuan</h2>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4 sm:p-5 animate-pulse border border-slate-200">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 bg-slate-200 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 bg-slate-200 rounded" />
                      <div className="h-3 w-40 bg-slate-100 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : records.length > 0 ? (
            <div className="space-y-3">
              {records.map(perm => (
                <div
                  key={perm.id}
                  className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm sm:text-base">
                          {getTypeLabel(perm.type)}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                          {new Date(perm.startDate).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}
                          {' — '}
                          {new Date(perm.endDate).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${getStatusBadge(perm.status)}`}>
                      {getStatusIcon(perm.status)}
                      {getStatusLabel(perm.status)}
                    </span>
                  </div>

                  {perm.reason && (
                    <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 line-clamp-2">
                      {perm.reason}
                    </p>
                  )}

                  {perm.attachment && (
                    <div className="mt-2.5 space-y-1">
                      <p className="text-xs font-semibold text-slate-400">Bukti Lampiran:</p>
                      <a href={perm.attachment} target="_blank" rel="noopener noreferrer" className="inline-block group">
                        <img 
                          src={perm.attachment} 
                          alt="Bukti Lampiran" 
                          className="h-16 w-auto max-w-48 object-cover rounded-lg border border-slate-200 shadow-sm group-hover:opacity-85 transition-opacity" 
                        />
                      </a>
                    </div>
                  )}

                  <p className="text-xs text-slate-400 mt-2">
                    Diajukan: {new Date(perm.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-10 sm:p-16 text-center border border-slate-200">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Belum ada pengajuan izin</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium touch-manipulation"
              >
                + Buat pengajuan pertama
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

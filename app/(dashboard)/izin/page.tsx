'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { mockPermissions } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { FileText, Plus, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';

export default function IzinPage() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'izin' as 'izin' | 'cuti' | 'sakit',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const userPermissions = mockPermissions.filter(p => p.employeeId === user?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submit:', formData);
    setFormData({ type: 'izin', startDate: '', endDate: '', reason: '' });
    setShowForm(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'rejected': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:         return <Clock       className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: string) => ({
    approved: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    rejected: 'bg-red-100 text-red-700 border border-red-200',
    pending:  'bg-amber-100 text-amber-700 border border-amber-200',
  }[status] ?? 'bg-amber-100 text-amber-700 border border-amber-200');

  const getStatusLabel = (status: string) => ({
    approved: 'Disetujui',
    rejected: 'Ditolak',
    pending:  'Menunggu',
  }[status] ?? status);

  const getTypeLabel = (type: string) => ({
    izin: 'Izin',
    cuti: 'Cuti',
    sakit: 'Sakit',
  }[type] ?? type);

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
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-3 sm:px-4 text-sm shrink-0 touch-manipulation"
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Ajukan Izin</span>
            </Button>
          )}
        </div>

        {/* Form — slides in as a card */}
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
                      key={t}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, type: t }))}
                      className={`py-2.5 sm:py-3 rounded-lg border-2 text-sm font-medium transition-all touch-manipulation ${
                        formData.type === t
                          ? typeColors[t]
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
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
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-500 touch-manipulation"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700">Sampai Tanggal</label>
                  <input
                    type="date"
                    value={formData.endDate}
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

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <Button
                  type="submit"
                  className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white h-11 touch-manipulation"
                >
                  Kirim Pengajuan
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowForm(false)}
                  variant="outline"
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

          {userPermissions.length > 0 ? (
            <div className="space-y-3">
              {userPermissions.map(perm => (
                <div
                  key={perm.id}
                  className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 hover:shadow-md transition-shadow"
                >
                  {/* Top row: type + status */}
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
                          {new Date(perm.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {' — '}
                          {new Date(perm.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${getStatusBadge(perm.status)}`}>
                      {getStatusIcon(perm.status)}
                      {getStatusLabel(perm.status)}
                    </span>
                  </div>

                  {/* Reason */}
                  {perm.reason && (
                    <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 line-clamp-2">
                      {perm.reason}
                    </p>
                  )}

                  {/* Footer: submitted date */}
                  <p className="text-xs text-slate-400 mt-2">
                    Diajukan: {new Date(perm.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
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

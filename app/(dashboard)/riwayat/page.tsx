'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Calendar, Search, ChevronRight, RefreshCw } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: 'hadir' | 'telat' | 'izin' | 'alpha';
  notes: string;
}

export default function RiwayatPage() {
  const { user } = useAuth();
  const [month,      setMonth]      = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [records,    setRecords]    = useState<AttendanceRecord[]>([]);
  const [loading,    setLoading]    = useState(true);

  const fetchRecords = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/attendance?userId=${user.id}&month=${month}`);
      const data = await res.json();
      setRecords(data.attendances ?? []);
    } catch (err) {
      console.error('Failed to fetch riwayat', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, month]);

  useEffect(() => {
    fetchRecords();
    const interval = setInterval(fetchRecords, 5 * 60 * 60 * 1000); // 5-hour polling
    return () => clearInterval(interval);
  }, [fetchRecords]);

  const filtered = records.filter(r =>
    !searchTerm || r.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (s: string) => ({
    hadir: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    telat: 'bg-amber-100  text-amber-700  border border-amber-200',
    izin:  'bg-blue-100   text-blue-700   border border-blue-200',
    alpha: 'bg-red-100    text-red-700    border border-red-200',
  }[s] ?? 'bg-red-100 text-red-700 border border-red-200');

  const getStatusLabel = (s: string) => ({
    hadir: '✓ Hadir', telat: '⚠ Telat', izin: 'ℹ Izin', alpha: '✗ Alpha',
  }[s] ?? s);

  const stats = [
    { label: 'Hadir', value: filtered.filter(r => r.status === 'hadir').length, bg: 'bg-emerald-50', text: 'text-emerald-900', sub: 'text-emerald-700' },
    { label: 'Telat', value: filtered.filter(r => r.status === 'telat').length, bg: 'bg-amber-50',   text: 'text-amber-900',   sub: 'text-amber-700'  },
    { label: 'Izin',  value: filtered.filter(r => r.status === 'izin').length,  bg: 'bg-blue-50',   text: 'text-blue-900',    sub: 'text-blue-700'   },
    { label: 'Alpha', value: filtered.filter(r => r.status === 'alpha').length, bg: 'bg-red-50',    text: 'text-red-900',     sub: 'text-red-700'    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Riwayat Presensi</h1>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">Lihat dan filter riwayat kehadiran Anda</p>
          </div>
          <button
            onClick={fetchRecords}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors touch-manipulation"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-medium text-slate-700">Bulan</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="month" value={month}
                  onChange={e => setMonth(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 touch-manipulation"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-medium text-slate-700">Cari Catatan</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text" placeholder="Cari catatan..." value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {stats.map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-3 sm:p-4`}>
              <p className={`text-xs font-medium ${s.sub}`}>{s.label}</p>
              <p className={`text-2xl sm:text-3xl font-bold mt-0.5 ${s.text}`}>
                {loading ? '…' : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Data */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="divide-y divide-slate-100">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 flex gap-3 animate-pulse">
                  <div className="h-5 w-14 bg-slate-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 bg-slate-200 rounded" />
                    <div className="h-3 w-28 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {['Tanggal','Masuk','Pulang','Status','Catatan'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 text-sm font-medium text-slate-900">
                          {new Date(a.date).toLocaleDateString('id-ID', {
                            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
                          })}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">{a.checkInTime  || '—'}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{a.checkOutTime || '—'}</td>
                        <td className="px-5 py-4 text-sm">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(a.status)}`}>
                            {getStatusLabel(a.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500">{a.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-slate-100">
                {filtered.map(a => (
                  <div key={a.id} className="p-4 flex items-start gap-3">
                    <span className={`mt-0.5 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${getStatusBadge(a.status)}`}>
                      {getStatusLabel(a.status)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {new Date(a.date).toLocaleDateString('id-ID', {
                          weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
                        })}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Masuk: <span className="font-medium text-slate-700">{a.checkInTime || '—'}</span>
                        {' · '}
                        Pulang: <span className="font-medium text-slate-700">{a.checkOutTime || '—'}</span>
                      </p>
                      {a.notes && <p className="text-xs text-slate-400 mt-0.5 truncate">{a.notes}</p>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-10 text-center">
              <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Tidak ada data presensi untuk bulan ini</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

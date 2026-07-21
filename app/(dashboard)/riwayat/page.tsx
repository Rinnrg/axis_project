'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { mockAttendance } from '@/lib/mock-data';
import { Calendar, Search, ChevronRight } from 'lucide-react';

export default function RiwayatPage() {
  const { user } = useAuth();
  const [month, setMonth] = useState('2024-07');
  const [searchTerm, setSearchTerm] = useState('');

  const employeeAttendance = mockAttendance
    .filter(a => a.employeeId === user?.id && a.date.startsWith(month))
    .filter(a => !searchTerm || a.notes?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getStatusBadge = (status: string) => ({
    hadir: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    telat: 'bg-amber-100 text-amber-700 border border-amber-200',
    izin:  'bg-blue-100 text-blue-700 border border-blue-200',
    alpha: 'bg-red-100 text-red-700 border border-red-200',
  }[status] ?? 'bg-red-100 text-red-700 border border-red-200');

  const getStatusLabel = (status: string) => ({
    hadir: '✓ Hadir',
    telat: '⚠ Telat',
    izin:  'ℹ Izin',
    alpha: '✗ Alpha',
  }[status] ?? status);

  const stats = [
    { label: 'Hadir',  value: employeeAttendance.filter(a => a.status === 'hadir').length, bg: 'bg-emerald-50', text: 'text-emerald-900', sub: 'text-emerald-700' },
    { label: 'Telat',  value: employeeAttendance.filter(a => a.status === 'telat').length, bg: 'bg-amber-50',   text: 'text-amber-900',   sub: 'text-amber-700'  },
    { label: 'Izin',   value: employeeAttendance.filter(a => a.status === 'izin').length,  bg: 'bg-blue-50',   text: 'text-blue-900',    sub: 'text-blue-700'   },
    { label: 'Alpha',  value: employeeAttendance.filter(a => a.status === 'alpha').length, bg: 'bg-red-50',    text: 'text-red-900',     sub: 'text-red-700'    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Riwayat Presensi</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Lihat dan filter riwayat kehadiran Anda</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Month */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-medium text-slate-700">Bulan</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="month"
                  value={month}
                  onChange={e => setMonth(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 touch-manipulation"
                />
              </div>
            </div>
            {/* Search */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-medium text-slate-700">Cari Catatan</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari catatan..."
                  value={searchTerm}
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
              <p className={`text-2xl sm:text-3xl font-bold mt-0.5 ${s.text}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Data */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {employeeAttendance.length > 0 ? (
            <>
              {/* ---- Desktop table (md+) ---- */}
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
                    {employeeAttendance.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 text-sm font-medium text-slate-900">
                          {new Date(a.date).toLocaleDateString('id-ID', {
                            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
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

              {/* ---- Mobile card list (<md) ---- */}
              <div className="md:hidden divide-y divide-slate-100">
                {employeeAttendance.map(a => (
                  <div key={a.id} className="p-4 flex items-start gap-3">
                    <span className={`mt-0.5 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${getStatusBadge(a.status)}`}>
                      {getStatusLabel(a.status)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {new Date(a.date).toLocaleDateString('id-ID', {
                          weekday: 'long', day: 'numeric', month: 'long',
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

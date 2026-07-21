'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ClockWidget } from '@/components/clock-widget';
import { AttendanceCamera } from '@/components/attendance-camera';
import { mockAttendance } from '@/lib/mock-data';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
  LogIn,
  LogOut,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === 'admin') router.push('/admin/rekap');
  }, [user, router]);

  const [cameraOpen, setCameraOpen] = useState<'checkin' | 'checkout' | null>(null);
  const [, setTodayAttendance] = useState<Record<string, string> | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const employeeAttendance = mockAttendance.find(
    a => a.employeeId === user?.id && a.date === today
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'hadir':  return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'telat':  return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'izin':   return <FileText    className="w-5 h-5 text-blue-500" />;
      default:       return <Clock       className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hadir': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'telat': return 'bg-amber-50  border-amber-200  text-amber-700';
      case 'izin':  return 'bg-blue-50   border-blue-200   text-blue-700';
      default:      return 'bg-slate-50  border-slate-200  text-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6 md:space-y-8">

        {/* ------------------------------------------------------------------ */}
        {/* Welcome + Clock                                                     */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
              Selamat Datang,<br className="sm:hidden" /> {user?.name}! 👋
            </h1>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">
              {user?.position} • {user?.department}
            </p>
          </div>
          {/* Clock — hidden on tiny screens, shown sm+ */}
          <div className="hidden sm:block bg-white rounded-2xl shadow-lg p-5 md:p-6 shrink-0">
            <ClockWidget />
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Today Status Banner                                                 */}
        {/* ------------------------------------------------------------------ */}
        {employeeAttendance && (
          <div className={`rounded-xl sm:rounded-2xl border-2 p-4 sm:p-5 ${getStatusColor(employeeAttendance.status)}`}>
            <div className="flex items-center gap-2 mb-1.5">
              {getStatusIcon(employeeAttendance.status)}
              <h3 className="font-semibold text-sm sm:text-base">Status Hari Ini</h3>
            </div>
            <p className="text-sm">
              {employeeAttendance.status === 'hadir'
                ? `Masuk: ${employeeAttendance.checkInTime} | Pulang: ${employeeAttendance.checkOutTime || 'Belum'}`
                : employeeAttendance.status === 'telat'
                  ? `Masuk Telat: ${employeeAttendance.checkInTime}`
                  : employeeAttendance.status === 'izin'
                    ? `Alasan: ${employeeAttendance.notes}`
                    : 'Belum ada presensi'}
            </p>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Main Action Cards — stacked on mobile, side-by-side on md+         */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">

          {/* CHECK IN */}
          <button
            onClick={() => setCameraOpen('checkin')}
            disabled={!!employeeAttendance?.checkInTime}
            className="group relative overflow-hidden rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl
                       transition-all duration-300 text-left w-full
                       disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] touch-manipulation"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-indigo-700
                             group-hover:from-indigo-600 group-hover:to-indigo-800 transition-all" />
            <div className="relative p-6 sm:p-8 md:p-10 text-white space-y-2 sm:space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur shrink-0">
                  <LogIn className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">Presensi Masuk</h2>
                  <p className="text-indigo-200 text-xs sm:text-sm">
                    {employeeAttendance?.checkInTime
                      ? `✓ Sudah masuk ${employeeAttendance.checkInTime}`
                      : 'Klik untuk absen masuk'}
                  </p>
                </div>
              </div>
              <span className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-white/20 rounded-lg text-xs sm:text-sm font-medium backdrop-blur">
                {employeeAttendance?.checkInTime ? '✓ Selesai' : 'Mulai Sekarang →'}
              </span>
            </div>
          </button>

          {/* CHECK OUT */}
          <button
            onClick={() => setCameraOpen('checkout')}
            disabled={!employeeAttendance?.checkInTime || !!employeeAttendance?.checkOutTime}
            className="group relative overflow-hidden rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl
                       transition-all duration-300 text-left w-full
                       disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] touch-manipulation"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-700
                             group-hover:from-emerald-600 group-hover:to-emerald-800 transition-all" />
            <div className="relative p-6 sm:p-8 md:p-10 text-white space-y-2 sm:space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur shrink-0">
                  <LogOut className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">Presensi Pulang</h2>
                  <p className="text-emerald-200 text-xs sm:text-sm">
                    {employeeAttendance?.checkOutTime
                      ? `✓ Sudah pulang ${employeeAttendance.checkOutTime}`
                      : employeeAttendance?.checkInTime
                        ? 'Klik untuk absen pulang'
                        : 'Lakukan check-in terlebih dahulu'}
                  </p>
                </div>
              </div>
              <span className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-white/20 rounded-lg text-xs sm:text-sm font-medium backdrop-blur">
                {employeeAttendance?.checkOutTime ? '✓ Selesai' : 'Mulai Sekarang →'}
              </span>
            </div>
          </button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Secondary nav cards                                                 */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <a
            href="/riwayat"
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-4 sm:p-5 md:p-6
                       flex items-center gap-3 sm:gap-4 group active:scale-[0.97] touch-manipulation"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-left min-w-0">
              <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate">Riwayat</h3>
              <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">Lihat riwayat kehadiran</p>
            </div>
          </a>

          <a
            href="/izin"
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-4 sm:p-5 md:p-6
                       flex items-center gap-3 sm:gap-4 group active:scale-[0.97] touch-manipulation"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-left min-w-0">
              <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate">Izin/Cuti</h3>
              <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">Ajukan izin atau cuti</p>
            </div>
          </a>
        </div>

      </div>

      {/* Camera Modal */}
      {cameraOpen && (
        <AttendanceCamera
          type={cameraOpen}
          onClose={() => setCameraOpen(null)}
          onSuccess={(ts) => {
            setTodayAttendance(prev => ({
              ...prev,
              [cameraOpen === 'checkin' ? 'checkInTime' : 'checkOutTime']: ts,
            }));
          }}
        />
      )}
    </div>
  );
}

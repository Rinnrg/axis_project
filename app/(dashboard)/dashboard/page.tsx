'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ClockWidget } from '@/components/clock-widget';
import { AttendanceCamera } from '@/components/attendance-camera';
import Swal from 'sweetalert2';
import {
  CheckCircle, Clock, AlertCircle, FileText, Calendar, LogIn, LogOut, Megaphone, ArrowRight, Sparkles, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

interface TodayAttendance {
  id?: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [cameraOpen, setCameraOpen] = useState<'checkin' | 'checkout' | null>(null);
  const [todayAtt, setTodayAtt] = useState<TodayAttendance | null>(null);
  const [attLoading, setAttLoading] = useState(true);

  // ── Redirect admin & chief_admin ─────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && (user?.role === 'admin' || user?.role === 'chief_admin')) router.push('/admin');
  }, [user, authLoading, router]);

  // ── Fetch today's attendance from API ─────────────────────────────────────
  const fetchToday = useCallback(async () => {
    if (!user?.id) return;
    setAttLoading(true);
    try {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const res = await fetch(`/api/attendance?userId=${user.id}&date=${today}`);
      const data = await res.json();
      const records: TodayAttendance[] = data.attendances ?? [];
      setTodayAtt(records[0] ?? null);
    } catch (err) {
      console.error('Failed to fetch attendance', err);
    } finally {
      setAttLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchToday();
    const interval = setInterval(fetchToday, 2 * 60 * 60 * 1000); // 2-hour polling
    return () => clearInterval(interval);
  }, [fetchToday]);

  // ── After successful camera capture → call API ────────────────────────────
  const handleAttendanceSuccess = async (type: 'checkin' | 'checkout', timestamp: string, photo?: string) => {
    if (!user?.id) return;
    try {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const todayDateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const localTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type,
          photo,
          date: todayDateStr,
          localTime: localTimeStr
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        Swal.fire({
          icon: 'error',
          title: 'Presensi Gagal',
          text: errData.error || 'Terjadi kesalahan pada server saat mencatat absensi.',
          confirmButtonColor: '#4f46e5',
          customClass: { popup: 'rounded-2xl' }
        });
        return;
      }
    } catch (err) {
      console.error('Failed to save attendance', err);
      Swal.fire({
        icon: 'error',
        title: 'Koneksi Gagal',
        text: 'Tidak dapat menghubungi server. Pastikan koneksi internet Anda aktif.',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'rounded-2xl' }
      });
      return;
    }

    setTodayAtt(prev => ({
      checkInTime: prev?.checkInTime ?? null,
      checkOutTime: prev?.checkOutTime ?? null,
      status: prev?.status ?? 'hadir',
      ...prev,
      [type === 'checkin' ? 'checkInTime' : 'checkOutTime']: timestamp,
    }));

    setTimeout(fetchToday, 1500);
  };

  // ── Status helpers ────────────────────────────────────────────────────────
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'hadir': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'telat': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'izin': return <FileText className="w-5 h-5 text-blue-500" />;
      default: return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hadir': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700';
      case 'telat': return 'bg-amber-500/10  border-amber-500/30  text-amber-700';
      case 'izin': return 'bg-blue-500/10   border-blue-500/30   text-blue-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* Welcome + Clock */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                Portal Karyawan
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Selamat Datang,<br className="sm:hidden" /> {user?.name}!
            </h1>
            <p className="text-slate-500 mt-1 text-sm sm:text-base font-medium">
              {user?.position} • <span className="text-slate-700">{user?.department}</span>
            </p>
          </div>
          <div className="hidden sm:block bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/80 p-5 md:p-6 shrink-0">
            <ClockWidget />
          </div>
        </div>

        {/* Status Banner */}
        {!attLoading && todayAtt && (
          <div className={`rounded-2xl border p-4 sm:p-5 shadow-sm backdrop-blur-sm transition-all ${getStatusColor(todayAtt.status)}`}>
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon(todayAtt.status)}
              <h3 className="font-bold text-sm sm:text-base">Status Kehadiran Hari Ini</h3>
            </div>
            <p className="text-sm font-medium">
              {todayAtt.status === 'hadir' || todayAtt.status === 'telat'
                ? `Masuk: ${todayAtt.checkInTime ?? '—'} | Pulang: ${todayAtt.checkOutTime ?? 'Belum Pulang'}`
                : todayAtt.status === 'izin'
                  ? 'Izin hari ini'
                  : 'Belum ada catatan presensi hari ini'}
            </p>
          </div>
        )}

        {/* Loading Skeleton */}
        {attLoading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse h-16 shadow-sm" />
        )}

        {/* Action Cards (Main Interactive Buttons) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">

          {/* CHECK IN BUTTON */}
          <button
            onClick={() => setCameraOpen('checkin')}
            disabled={!!todayAtt?.checkInTime || attLoading}
            className="group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-indigo-500/25
                       transition-all duration-300 text-left w-full cursor-pointer
                       disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-xl active:scale-[0.98] touch-manipulation border border-indigo-400/30"
          >
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900
                            group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

            <div className="relative p-6 sm:p-8 md:p-9 text-white space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/15 group-hover:bg-white/25 rounded-2xl flex items-center justify-center backdrop-blur-md shrink-0 border border-white/20 transition-all duration-300 group-hover:-translate-y-1">
                  <LogIn className="w-6 h-6 sm:w-7 sm:h-7 text-white group-hover:scale-110 transition-transform duration-300" />
                </div>
                {!todayAtt?.checkInTime && !attLoading && (
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">Presensi Masuk</h2>
                <p className="text-indigo-100/90 text-xs sm:text-sm mt-1 font-medium">
                  {todayAtt?.checkInTime
                    ? `✓ Sudah presensi masuk (${todayAtt.checkInTime})`
                    : 'Ambil foto verifikasi untuk absen masuk'}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 group-hover:bg-white/30 rounded-xl text-xs sm:text-sm font-bold backdrop-blur-md border border-white/20 transition-all">
                  {todayAtt?.checkInTime ? '✓ Presensi Selesai' : 'Absen Sekarang'}
                  {!todayAtt?.checkInTime && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </span>
              </div>
            </div>
          </button>

          {/* CHECK OUT BUTTON */}
          <button
            onClick={() => setCameraOpen('checkout')}
            disabled={!todayAtt?.checkInTime || !!todayAtt?.checkOutTime || attLoading}
            className="group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-emerald-500/25
                       transition-all duration-300 text-left w-full cursor-pointer
                       disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-xl active:scale-[0.98] touch-manipulation border border-emerald-400/30"
          >
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900
                            group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

            <div className="relative p-6 sm:p-8 md:p-9 text-white space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/15 group-hover:bg-white/25 rounded-2xl flex items-center justify-center backdrop-blur-md shrink-0 border border-white/20 transition-all duration-300 group-hover:-translate-y-1">
                  <LogOut className="w-6 h-6 sm:w-7 sm:h-7 text-white group-hover:scale-110 transition-transform duration-300" />
                </div>
                {todayAtt?.checkInTime && !todayAtt?.checkOutTime && !attLoading && (
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">Presensi Pulang</h2>
                <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 font-medium">
                  {todayAtt?.checkOutTime
                    ? `✓ Sudah presensi pulang (${todayAtt.checkOutTime})`
                    : todayAtt?.checkInTime
                      ? 'Ambil foto verifikasi untuk absen pulang'
                      : 'Lakukan check-in terlebih dahulu'}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 group-hover:bg-white/30 rounded-xl text-xs sm:text-sm font-bold backdrop-blur-md border border-white/20 transition-all">
                  {todayAtt?.checkOutTime ? '✓ Presensi Selesai' : 'Absen Pulang'}
                  {todayAtt?.checkInTime && !todayAtt?.checkOutTime && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Secondary Nav Grid (Interactive Shortcut Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Riwayat Card */}
          <Link
            href="/riwayat"
            className="bg-white hover:bg-slate-50/80 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 p-5 sm:p-6
                       flex items-center justify-between group active:scale-[0.98] touch-manipulation"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="text-left min-w-0">
                <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                  Riwayat Presensi
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Lihat catatan kehadiran & absensi</p>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center transition-all duration-300 shrink-0">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Izin/Cuti Card */}
          <Link
            href="/izin"
            className="bg-white hover:bg-slate-50/80 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-amber-300 transition-all duration-300 p-5 sm:p-6
                       flex items-center justify-between group active:scale-[0.98] touch-manipulation"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="text-left min-w-0">
                <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-600 transition-colors">
                  Pengajuan Izin / Cuti
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Form permohonan izin & sakit</p>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 group-hover:bg-amber-500 text-amber-600 group-hover:text-white flex items-center justify-center transition-all duration-300 shrink-0">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Report Card (Pengaduan Club House) */}
        <Link
          href="/report"
          className="bg-gradient-to-r from-white via-rose-50/30 to-white hover:from-rose-50/60 hover:to-rose-50/20 rounded-2xl border border-rose-200/70 shadow-sm hover:shadow-xl transition-all duration-300 p-5 sm:p-6
                     flex items-center justify-between group active:scale-[0.98] touch-manipulation"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-700 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base group-hover:text-rose-600 transition-colors">
                  Laporan Club House
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 uppercase tracking-wider">
                  Internal
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Sampaikan keluhan atau saran kendala fasilitas & peralatan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-rose-600 bg-rose-100/80 group-hover:bg-rose-600 group-hover:text-white px-3.5 py-2 rounded-xl transition-all duration-300 shrink-0 flex items-center gap-1.5 shadow-xs">
              Buat Laporan
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </Link>

      </div>

      {/* Camera Modal */}
      {cameraOpen && (
        <AttendanceCamera
          type={cameraOpen}
          onClose={() => setCameraOpen(null)}
          onSuccess={(timestamp, photo) => {
            const type = cameraOpen;
            setCameraOpen(null);
            handleAttendanceSuccess(type, timestamp, photo);
          }}
        />
      )}
    </div>
  );
}

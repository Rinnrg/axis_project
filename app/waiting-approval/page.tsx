'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Clock, ShieldAlert, LogOut, Loader2 } from 'lucide-react';

export default function WaitingApprovalPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  // Route protection
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (isAuthenticated && user?.status === 'approved') {
        router.replace('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || (isAuthenticated && user?.status === 'approved')) {
    return null;
  }

  const isRejected = user?.status === 'rejected';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Card */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md text-center space-y-6">
          
          {/* Icon Header */}
          <div className="relative flex justify-center mx-auto">
            {isRejected ? (
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center border-2 border-red-200 animate-pulse">
                <ShieldAlert className="w-10 h-10 text-red-600" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center border-2 border-indigo-200">
                <Clock className="w-10 h-10 text-indigo-600 animate-pulse" />
              </div>
            )}
          </div>

          {/* Texts */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">
              {isRejected ? 'Pendaftaran Ditolak' : 'Menunggu Validasi Admin'}
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              {isRejected
                ? 'Maaf, permohonan pendaftaran akun Anda telah ditolak oleh administrator. Silakan hubungi admin untuk info lebih lanjut.'
                : 'Permohonan pendaftaran akun Anda telah berhasil dikirim dan saat ini sedang menunggu proses peninjauan dan validasi oleh tim Admin.'}
            </p>
          </div>

          {/* Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left text-xs space-y-1.5 text-slate-600">
            <p><span className="font-semibold text-slate-800">Nama:</span> {user?.name}</p>
            <p><span className="font-semibold text-slate-800">Email:</span> {user?.email}</p>
            <p><span className="font-semibold text-slate-800">Nomor HP:</span> {user?.phone}</p>
            <p>
              <span className="font-semibold text-slate-800">Status:</span>{' '}
              <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                isRejected ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {user?.status}
              </span>
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2">
            <Button
              onClick={handleLogout}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 py-3 rounded-xl
                         font-semibold transition-all h-12 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Keluar / Pindah Akun
            </Button>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Presensi. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

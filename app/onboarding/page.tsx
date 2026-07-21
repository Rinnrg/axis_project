'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { User, Phone, AlertCircle, Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fill name from session if available
  useEffect(() => {
    if (session?.user?.name && !name) {
      setName(session.user.name);
    }
  }, [session, name]);

  // Route protection
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated' && session?.user?.phone) {
      // If profile is already complete, redirect to dashboard
      router.replace('/dashboard');
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/users/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat menyimpan data');
      }

      // Refresh NextAuth session to update user information in cookie
      await update();

      // Redirect to dashboard
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Prevent flash of form before redirect if already onboarded
  if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.phone)) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl
                           flex items-center justify-center mx-auto shadow-lg shadow-indigo-200">
            <span className="text-3xl font-bold text-white">P</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Lengkapi Profil</h1>
            <p className="text-slate-500 text-sm mt-1">Langkah terakhir sebelum masuk ke sistem presensi</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Onboarding Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  required
                  onChange={e => setName(e.target.value)}
                  placeholder="Masukkan nama lengkap Anda"
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-slate-900
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Nomor HP / WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  required
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-slate-900
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700
                         hover:from-indigo-700 hover:to-indigo-800 text-white py-3 rounded-xl
                         font-semibold transition-all h-12 touch-manipulation"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan & Masuk'
              )}
            </Button>
          </form>
        </div>

        {/* Info box */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800">
          <p className="font-semibold mb-1">ℹ️ Mengapa ini diperlukan?</p>
          <p>Kami memerlukan nama lengkap dan nomor HP aktif Anda untuk keperluan pencatatan dan verifikasi kehadiran oleh tim HRD.</p>
        </div>
      </div>
    </div>
  );
}

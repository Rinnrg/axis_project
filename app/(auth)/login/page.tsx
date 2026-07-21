'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

// Google icon SVG
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function LoginForm() {
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [gLoading,  setGLoading]  = useState(false);

  const router       = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle, isAuthenticated } = useAuth();

  // Handle OAuth errors redirected back from NextAuth
  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'EmailNotRegistered') {
      setError('Email Google Anda belum terdaftar. Hubungi admin untuk mendaftarkan akun.');
    } else if (err) {
      setError('Terjadi kesalahan saat login. Silakan coba lagi.');
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (result.success) {
      router.replace('/dashboard');
    } else {
      setError(result.error ?? 'Email atau password salah');
      setPassword('');
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    setGLoading(true);
    loginWithGoogle();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl
                           flex items-center justify-center mx-auto shadow-lg shadow-indigo-200">
            <span className="text-3xl font-bold text-white">P</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Presensi</h1>
            <p className="text-slate-500 text-sm mt-1">Sistem Presensi Karyawan Modern</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={gLoading || loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3
                     bg-white border-2 border-slate-200 rounded-xl text-slate-700 font-semibold
                     hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700
                     transition-all duration-200 shadow-sm hover:shadow-md
                     disabled:opacity-50 disabled:cursor-not-allowed
                     active:scale-[0.98] touch-manipulation"
        >
          {gLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          <span>{gLoading ? 'Mengalihkan...' : 'Masuk dengan Google'}</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium px-1">atau dengan email</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                id="email" type="email" value={email} required
                onChange={e => setEmail(e.target.value)}
                placeholder="nama@example.com"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                id="password" type="password" value={password} required
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <Button
            type="submit" disabled={loading || gLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700
                       hover:from-indigo-700 hover:to-indigo-800 text-white py-3 rounded-xl
                       font-semibold transition-all h-12 touch-manipulation"
          >
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Memproses...</> : 'Masuk'}
          </Button>
        </form>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

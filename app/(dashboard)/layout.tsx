'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { Topbar } from '@/components/topbar';

function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        if (pathname.startsWith('/admin')) {
          router.replace('/login?role=admin');
        } else {
          router.replace('/login');
        }
      } else if (isAuthenticated) {
        if (!user?.phone) {
          router.replace('/onboarding');
        } else if (user?.status !== 'approved') {
          router.replace('/waiting-approval');
        }
      }
    }
  }, [isAuthenticated, isLoading, user, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardGuard>{children}</DashboardGuard>
  );
}

'use client';

import { useAuth } from '@/lib/auth-context';
import { Topbar } from '@/components/topbar';
import { redirect } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

'use client';

import { useAuth } from '@/lib/auth-context';
import { redirect } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}

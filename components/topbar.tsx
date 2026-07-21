'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Menu, X, LogOut, LayoutDashboard, Calendar, FileText, User, ClipboardList, UserCheck } from 'lucide-react';

export function Topbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const menuItems = user?.role === 'admin'
    ? [
        { label: 'Dashboard',      href: '/dashboard',   icon: LayoutDashboard },
        { label: 'Validasi User',  href: '/admin',       icon: UserCheck },
        { label: 'Rekap Presensi', href: '/admin/rekap', icon: ClipboardList },
      ]
    : [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Riwayat',   href: '/riwayat',   icon: Calendar },
        { label: 'Izin',      href: '/izin',       icon: FileText },
        { label: 'Profile',   href: '/profile',    icon: User },
      ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setMenuOpen(false)}>
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg
                           flex items-center justify-center text-white font-bold text-sm shadow-sm">
            P
          </div>
          <span className="font-bold text-slate-900 text-base hidden xs:inline sm:inline">Presensi</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {menuItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.position}</p>
          </div>
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full
                           flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile right: avatar + hamburger */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full
                           flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors touch-manipulation"
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
          >
            {menuOpen ? <X className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-slate-700" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          {/* User info banner */}
          <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100">
            <p className="text-sm font-semibold text-indigo-900">{user?.name}</p>
            <p className="text-xs text-indigo-600">{user?.position} • {user?.department}</p>
          </div>

          <div className="px-3 py-2 space-y-0.5">
            {menuItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors touch-manipulation ${
                  isActive(item.href)
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            ))}

            <div className="border-t border-slate-100 pt-2 mt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium
                           text-red-600 hover:bg-red-50 transition-colors touch-manipulation"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

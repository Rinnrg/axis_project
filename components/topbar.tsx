'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Menu, X, LogOut, LayoutDashboard, Calendar, FileText, User, ClipboardList, UserCheck, Megaphone } from 'lucide-react';
import Swal from 'sweetalert2';

export function Topbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogoutClick = () => {
    setProfileOpen(false);
    setMenuOpen(false);
    Swal.fire({
      title: 'Apakah Anda yakin?',
      text: 'Anda akan keluar dari sesi aktif Anda.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        Swal.fire({
          title: 'Berhasil Keluar!',
          text: 'Anda telah berhasil log out.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          router.push('/login');
        });
      }
    });
  };

  const menuItems = (user?.role === 'admin' || user?.role === 'chief_admin')
    ? [
        { label: 'Dashboard',       href: '/admin',                 icon: LayoutDashboard },
        { label: 'Management Role', href: '/admin/management-role', icon: UserCheck },
        { label: 'Rekap Presensi',  href: '/admin/rekap',           icon: ClipboardList },
        { label: 'Report',          href: '/admin/report',          icon: Megaphone },
      ]
    : [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Riwayat',   href: '/riwayat',   icon: Calendar },
        { label: 'Izin',      href: '/izin',       icon: FileText },
        { label: 'Report',    href: '/report',     icon: Megaphone },
      ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setMenuOpen(false)}>
          <img
            src="/axis.svg"
            alt="Axis Logo"
            className="w-8 h-8 object-contain"
          />
          <span className="font-bold text-slate-900 text-base hidden xs:inline sm:inline">CH Alam Juanda</span>
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

        {/* Desktop right — avatar dropdown */}
        <div className="hidden md:flex items-center gap-3 relative">
          <button
            onClick={() => setProfileOpen(v => !v)}
            className="flex items-center gap-3 p-1.5 hover:bg-slate-50 rounded-xl transition-colors text-left"
          >
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.position}</p>
            </div>
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover shadow-sm border border-slate-200"
              />
            ) : (
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full
                               flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </button>

          {/* Dropdown */}
          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs text-slate-400">Masuk sebagai</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <div className="p-1">
                  <Link
                    href="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Profil Saya</span>
                  </Link>
                  <button
                    onClick={handleLogoutClick}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Mobile right: avatar + hamburger */}
        <div className="md:hidden flex items-center gap-2">
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover shadow-sm border border-slate-200"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full
                             flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
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
          <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-900">{user?.name}</p>
              <p className="text-xs text-indigo-600">{user?.position} • {user?.department}</p>
            </div>
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="text-xs font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              Profil
            </Link>
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
                onClick={handleLogoutClick}
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

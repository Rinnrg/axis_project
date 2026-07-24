'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LayoutDashboard, Calendar, FileText, User, ClipboardList, UserCheck, Megaphone } from 'lucide-react';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';

// Perspective Text Component from navigation-menu-01
function PerspectiveText({ label }: { label: string }) {
  return (
    <div className="perspectiveText">
      <p>{label}</p>
      <p>{label}</p>
    </div>
  );
}

// Sliding Pill Button from navigation-menu-01
function NavButton({ isActive, toggleMenu }: { isActive: boolean; toggleMenu: () => void }) {
  return (
    <div className="nav-menu-button shadow-md">
      <motion.div
        className="slider"
        animate={{ top: isActive ? '-100%' : '0%' }}
        transition={{ duration: 0.5, type: 'tween', ease: [0.76, 0, 0.24, 1] }}
      >
        <div className="el cursor-pointer" onClick={toggleMenu}>
          <PerspectiveText label="Menu" />
        </div>
        <div className="el cursor-pointer" onClick={toggleMenu}>
          <PerspectiveText label="Close" />
        </div>
      </motion.div>
    </div>
  );
}

// Animation Variants from navigation-menu-01 motion/index.ts
const menuVariant = {
  open: {
    width: 'min(320px, calc(100vw - 32px))',
    height: '440px',
    top: '-12px',
    right: '-12px',
    transition: { duration: 0.75, type: 'tween', ease: [0.76, 0, 0.24, 1] },
  },
  closed: {
    width: '90px',
    height: '38px',
    top: '0px',
    right: '0px',
    transition: {
      duration: 0.75,
      delay: 0.35,
      type: 'tween',
      ease: [0.76, 0, 0.24, 1],
    },
  },
};

const perspective = {
  initial: {
    opacity: 0,
    rotateX: 90,
    translateY: 80,
    translateX: -20,
  },
  enter: (i: number) => ({
    opacity: 1,
    rotateX: 0,
    translateY: 0,
    translateX: 0,
    transition: {
      duration: 0.65,
      delay: 0.4 + i * 0.1,
      ease: [0.215, 0.61, 0.355, 1],
      opacity: { duration: 0.35 },
    },
  }),
  exit: {
    opacity: 0,
    transition: { duration: 0.4, type: 'linear', ease: [0.76, 0, 0.24, 1] },
  },
};

const slideIn = {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: 0.6 + i * 0.1,
      ease: [0.215, 0.61, 0.355, 1],
    },
  }),
  exit: {
    opacity: 0,
    transition: { duration: 0.4, type: 'tween', ease: 'easeInOut' },
  },
};

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
      cancelButtonText: 'Batal',
      customClass: { popup: 'rounded-2xl' }
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        Swal.fire({
          title: 'Berhasil Keluar!',
          text: 'Anda telah berhasil log out.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          customClass: { popup: 'rounded-2xl' }
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

        {/* Desktop Nav */}
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

        {/* Desktop Right — Avatar Dropdown */}
        <div className="hidden md:flex items-center gap-3 relative">
          <button
            onClick={() => setProfileOpen(v => !v)}
            className="flex items-center gap-3 p-1.5 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer"
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

          {/* Profile Dropdown Modal */}
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
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Mobile Right — Navigation Menu 01 Component */}
        <div className="md:hidden relative flex items-center gap-3">
          {/* Avatar Icon */}
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

          {/* Navigation Menu 01 Container */}
          <div className="relative z-50">
            <motion.div
              className="bg-[#2563eb] rounded-[25px] absolute right-0 top-0 overflow-hidden shadow-2xl border border-blue-400/30"
              variants={menuVariant}
              animate={menuOpen ? 'open' : 'closed'}
              initial="closed"
            >
              <AnimatePresence>
                {menuOpen && (
                  <div className="flex flex-col justify-between pr-[40px] pl-[32px] pt-[60px] pb-[32px] h-full text-white">
                    {/* Main Nav Links (Large Perspective Typography) */}
                    <div className="flex flex-col gap-3">
                      {menuItems.map((link, i) => (
                        <div key={link.href} className="perspective-1000">
                          <motion.div
                            custom={i}
                            variants={perspective}
                            initial="initial"
                            animate="enter"
                            exit="exit"
                          >
                            <Link
                              onClick={() => setMenuOpen(false)}
                              href={link.href}
                              className={`text-white text-[32px] sm:text-[36px] font-bold leading-tight hover:opacity-80 transition-opacity block ${
                                isActive(link.href) ? 'underline underline-offset-4 decoration-2 decoration-white' : ''
                              }`}
                            >
                              {link.label}
                            </Link>
                          </motion.div>
                        </div>
                      ))}
                    </div>

                    {/* Footer Links (Slide In Animation) */}
                    <motion.div className="flex flex-col gap-2 pt-4 border-t border-white/20 mt-4">
                      <motion.div
                        variants={slideIn}
                        custom={0}
                        initial="initial"
                        animate="enter"
                        exit="exit"
                        className="text-xs text-blue-100 flex items-center justify-between"
                      >
                        <span className="font-semibold">{user?.name}</span>
                        <span className="opacity-75 uppercase tracking-wider text-[10px]">{user?.role}</span>
                      </motion.div>

                      <motion.div
                        variants={slideIn}
                        custom={1}
                        initial="initial"
                        animate="enter"
                        exit="exit"
                        className="flex items-center gap-5 pt-1 text-sm font-bold"
                      >
                        <Link
                          href="/profile"
                          onClick={() => setMenuOpen(false)}
                          className="text-white hover:underline"
                        >
                          Profil Saya
                        </Link>
                        <button
                          onClick={handleLogoutClick}
                          className="text-rose-200 hover:text-rose-100 hover:underline cursor-pointer"
                        >
                          Keluar
                        </button>
                      </motion.div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Sliding Pill Button ("MENU" / "CLOSE") */}
            <NavButton
              isActive={menuOpen}
              toggleMenu={() => setMenuOpen(!menuOpen)}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

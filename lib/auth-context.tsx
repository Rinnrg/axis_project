'use client';

import { createContext, useContext } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

// ─── AuthUser type (matches session.user dari NextAuth) ───────────────────────
export interface AuthUser {
  id:          string;
  name:        string;
  email:       string;
  image?:      string | null;
  role:        'employee' | 'admin';
  position?:   string | null;
  department?: string | null;
  phone?:      string | null;
  status:      'pending' | 'approved' | 'rejected';
}

interface AuthContextType {
  user:            AuthUser | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  /** Login dengan email + password */
  login:           (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  /** Login dengan Google */
  loginWithGoogle: () => void;
  logout:          () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const isLoading       = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  // Map NextAuth session user → AuthUser
  const user: AuthUser | null = session?.user
    ? {
        id:          session.user.id          ?? '',
        name:        session.user.name        ?? '',
        email:       session.user.email       ?? '',
        image:       session.user.image       ?? null,
        role:       (session.user.role        ?? 'employee') as 'employee' | 'admin',
        position:    session.user.position    ?? null,
        department:  session.user.department  ?? null,
        phone:       session.user.phone       ?? null,
        status:     (session.user.status      ?? 'pending') as 'pending' | 'approved' | 'rejected',
      }
    : null;

  // ── Login dengan email + password ─────────────────────────────────────────
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { success: false, error: 'Email atau password salah' };
    }
    return { success: true };
  };

  // ── Login dengan Google ────────────────────────────────────────────────────
  const loginWithGoogle = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, login, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },

  providers: [
    // ── Google OAuth ──────────────────────────────────────────────────────
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ── Email + Password ──────────────────────────────────────────────────
    Credentials({
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        // Support plain-text (seed) and bcrypt hashes
        let valid = false;
        if (user.password.startsWith('$2')) {
          const bcrypt = await import('bcryptjs');
          valid = await bcrypt.compare(credentials.password as string, user.password);
        } else {
          valid = user.password === credentials.password;
        }

        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.photo };
      },
    }),
  ],

  callbacks: {
    // Hanya izinkan Google sign-in jika email sudah ada di database
    async signIn({ account, profile }) {
      if (account?.provider === 'google') {
        const existing = await prisma.user.findUnique({
          where: { email: profile?.email! },
        });
        if (!existing) return '/login?error=EmailNotRegistered';
      }
      return true;
    },

    // Tambahkan data custom ke JWT token
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, role: true, position: true, department: true, phone: true },
        });
        if (dbUser) {
          token.id         = dbUser.id;
          token.role       = dbUser.role.toLowerCase();
          token.position   = dbUser.position;
          token.department = dbUser.department;
          token.phone      = dbUser.phone;
        }
      }
      return token;
    },

    // Tampilkan data custom di session
    async session({ session, token }) {
      if (session.user) {
        session.user.id         = token.id         as string;
        session.user.role       = token.role       as string;
        session.user.position   = token.position   as string | null;
        session.user.department = token.department as string | null;
        session.user.phone      = token.phone      as string | null;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },
});

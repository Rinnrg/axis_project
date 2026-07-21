import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST /api/auth/login
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      )
    }

    // Support plain-text passwords (legacy/seed) AND bcrypt hashes
    let passwordValid = false
    if (user.password.startsWith('$2')) {
      passwordValid = await bcrypt.compare(password, user.password)
    } else {
      passwordValid = user.password === password
    }

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      )
    }

    // Return user without password
    const { password: _pw, ...safeUser } = user
    return NextResponse.json({ user: safeUser })
  } catch (err) {
    console.error('[/api/auth/login]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

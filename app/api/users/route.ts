import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ─── GET /api/users  (admin: list all users) ─────────────────────────────────
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        position: true,
        department: true,
        role: true,
        joinDate: true,
        photo: true,
      },
      orderBy: { name: 'asc' },
    })

    const formatted = users.map(u => ({
      ...u,
      role: u.role.toLowerCase() as 'employee' | 'admin',
    }))

    return NextResponse.json({ users: formatted })
  } catch (err) {
    console.error('[GET /api/users]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ─── POST /api/users  (admin: create user) ───────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, phone, position, department, role, joinDate } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nama, email, dan password wajib diisi' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      )
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password, // Store plain for now; hash in production
        phone,
        position,
        department,
        role: role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE',
        joinDate: joinDate ? new Date(joinDate) : new Date(),
      },
      select: {
        id: true, name: true, email: true,
        phone: true, position: true, department: true,
        role: true, joinDate: true,
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/users]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

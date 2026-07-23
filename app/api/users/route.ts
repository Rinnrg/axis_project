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
        status: true,
      },
      orderBy: { name: 'asc' },
    })

    const formatted = users.map(u => ({
      ...u,
      role: u.role.toLowerCase() as 'employee' | 'admin' | 'chief_admin',
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

// ─── PUT /api/users  (admin: update user position & role) ─────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, position } = body

    if (!userId || !position) {
      return NextResponse.json(
        { error: 'userId dan position wajib diisi' },
        { status: 400 }
      )
    }

    const posLower = position.toLowerCase();
    let newRole: 'ADMIN' | 'CHIEF_ADMIN' | 'EMPLOYEE' = 'EMPLOYEE';
    if (posLower === 'super admin') newRole = 'ADMIN';
    else if (posLower === 'chief admin') newRole = 'CHIEF_ADMIN';

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        position,
        role: newRole,
      },
    })

    return NextResponse.json({ user })
  } catch (err: any) {
    console.error('[PUT /api/users]', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

// ─── DELETE /api/users?userId=xxx  (admin: delete user) ────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId wajib diisi' }, { status: 400 })
    }

    // Protect admin and chief_admin from deletion
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    if (targetUser?.role === 'ADMIN' || targetUser?.role === 'CHIEF_ADMIN') {
      return NextResponse.json({ error: 'Akun admin tidak dapat dihapus' }, { status: 403 })
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[DELETE /api/users]', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

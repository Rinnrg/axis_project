import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper: format Date to "YYYY-MM-DD"
function fmtDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

// ─── GET /api/permissions?userId=xxx ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const all    = searchParams.get('all') === 'true' // admin: get all

    const where = all ? {} : userId ? { userId } : undefined

    if (!where) {
      return NextResponse.json({ error: 'userId diperlukan' }, { status: 400 })
    }

    const records = await prisma.permission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, department: true } } },
    })

    const formatted = records.map(r => ({
      id:        r.id,
      userId:    r.userId,
      userName:  r.user.name,
      type:      r.type.toLowerCase() as 'izin' | 'cuti' | 'sakit',
      startDate: fmtDate(r.startDate),
      endDate:   fmtDate(r.endDate),
      reason:    r.reason,
      status:    r.status.toLowerCase() as 'pending' | 'approved' | 'rejected',
      createdAt: fmtDate(r.createdAt),
    }))

    return NextResponse.json({ permissions: formatted })
  } catch (err) {
    console.error('[GET /api/permissions]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ─── POST /api/permissions  (create new leave request) ───────────────────────
export async function POST(req: NextRequest) {
  try {
    const { userId, type, startDate, endDate, reason } = await req.json()

    if (!userId || !type || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      )
    }

    const typeMap: Record<string, 'IZIN' | 'CUTI' | 'SAKIT'> = {
      izin: 'IZIN', cuti: 'CUTI', sakit: 'SAKIT',
    }

    const record = await prisma.permission.create({
      data: {
        userId,
        type:      typeMap[type] ?? 'IZIN',
        startDate: new Date(startDate),
        endDate:   new Date(endDate),
        reason,
        status:    'PENDING',
      },
    })

    return NextResponse.json({ permission: record }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/permissions]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ─── PATCH /api/permissions  (approve / reject — admin) ──────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json()

    if (!id || !status) {
      return NextResponse.json({ error: 'id dan status wajib diisi' }, { status: 400 })
    }

    const statusMap: Record<string, 'APPROVED' | 'REJECTED' | 'PENDING'> = {
      approved: 'APPROVED',
      rejected: 'REJECTED',
      pending:  'PENDING',
    }

    const record = await prisma.permission.update({
      where: { id },
      data:  { status: statusMap[status] ?? 'PENDING' },
    })

    return NextResponse.json({ permission: record })
  } catch (err) {
    console.error('[PATCH /api/permissions]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

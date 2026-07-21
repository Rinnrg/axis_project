import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadToBucket } from '@/lib/storage'

// Helper: format Date object to "HH:mm" string
function fmtTime(d: Date | null): string | null {
  if (!d) return null
  return d.toTimeString().slice(0, 5)
}

// Helper: format Date to "YYYY-MM-DD"
function fmtDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

// ─── GET /api/attendance?userId=xxx&month=2024-07 ─────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const month  = searchParams.get('month')  // e.g. "2024-07"
    const date   = searchParams.get('date')   // e.g. "2024-07-21" (single day)

    if (!userId) {
      return NextResponse.json({ error: 'userId diperlukan' }, { status: 400 })
    }

    const where: Record<string, unknown> = { userId }

    if (date) {
      // Exact date lookup
      const d = new Date(date)
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      where.date = { gte: d, lt: next }
    } else if (month) {
      // All records in that month
      const [year, mon] = month.split('-').map(Number)
      const start = new Date(year, mon - 1, 1)
      const end   = new Date(year, mon, 1)
      where.date  = { gte: start, lt: end }
    }

    const records = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
    })

    const formatted = records.map(r => ({
      id:           r.id,
      userId:       r.userId,
      date:         fmtDate(r.date),
      checkInTime:  fmtTime(r.checkInTime),
      checkOutTime: fmtTime(r.checkOutTime),
      status:       r.status.toLowerCase() as 'hadir' | 'telat' | 'izin' | 'alpha',
      notes:        r.notes ?? '',
      checkInPhoto: r.checkInPhoto,
      checkOutPhoto: r.checkOutPhoto,
    }))

    return NextResponse.json({ attendances: formatted })
  } catch (err) {
    console.error('[GET /api/attendance]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ─── POST /api/attendance  (create / checkin) ────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { userId, type, photo } = await req.json()
    // type: "checkin" | "checkout"
    // photo: base64 WebP representation of the user's face

    if (!userId || !type) {
      return NextResponse.json({ error: 'userId dan type wajib diisi' }, { status: 400 })
    }

    const now   = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Build time Date for Prisma @db.Time field
    const timeValue = new Date(
      1970, 0, 1,
      now.getHours(), now.getMinutes(), now.getSeconds()
    )

    const timeString = now.toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })

    if (type === 'checkin') {
      // Determine status: TELAT if after 08:30
      const cutoff = new Date(1970, 0, 1, 8, 30, 0)
      const status = timeValue > cutoff ? 'TELAT' : 'HADIR'

      let checkInPhoto: string | null = null
      if (photo) {
        const fileName = `${userId}_checkin_${today.getTime()}.webp`
        checkInPhoto = await uploadToBucket(photo, fileName)
      }

      const record = await prisma.attendance.upsert({
        where:  { userId_date: { userId, date: today } },
        update: { checkInTime: timeValue, status, notes: '', checkInPhoto },
        create: { userId, date: today, checkInTime: timeValue, status, notes: '', checkInPhoto },
      })

      return NextResponse.json({ time: timeString, status, id: record.id })
    }

    if (type === 'checkout') {
      const existing = await prisma.attendance.findUnique({
        where: { userId_date: { userId, date: today } },
      })
      if (!existing) {
        return NextResponse.json(
          { error: 'Belum melakukan check-in hari ini' },
          { status: 400 }
        )
      }

      let checkOutPhoto: string | null = null
      if (photo) {
        const fileName = `${userId}_checkout_${today.getTime()}.webp`
        checkOutPhoto = await uploadToBucket(photo, fileName)
      }

      const record = await prisma.attendance.update({
        where: { userId_date: { userId, date: today } },
        data:  { checkOutTime: timeValue, checkOutPhoto },
      })

      return NextResponse.json({ time: timeString, id: record.id })
    }

    return NextResponse.json({ error: 'type tidak valid' }, { status: 400 })
  } catch (err) {
    console.error('[POST /api/attendance]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

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
      // Exact date lookup using UTC to prevent timezone shifts
      const [year, month, day] = date.split('-').map(Number)
      const d = new Date(Date.UTC(year, month - 1, day))
      const next = new Date(d)
      next.setUTCDate(next.getUTCDate() + 1)
      where.date = { gte: d, lt: next }
    } else if (month) {
      // All records in that month using UTC boundaries
      const [year, mon] = month.split('-').map(Number)
      const start = new Date(Date.UTC(year, mon - 1, 1))
      const end   = new Date(Date.UTC(year, mon, 1))
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
    const { userId, type, photo, date, localTime } = await req.json()
    // type: "checkin" | "checkout"
    // photo: base64 WebP representation of the user's face
    // date: "YYYY-MM-DD" local client date
    // localTime: "HH:mm:ss" local client time

    if (!userId || !type) {
      return NextResponse.json({ error: 'userId dan type wajib diisi' }, { status: 400 })
    }

    const now = new Date()
    
    // Parse client date safely to avoid timezone shift
    let today: Date
    if (date) {
      const [year, month, day] = date.split('-').map(Number)
      today = new Date(Date.UTC(year, month - 1, day))
    } else {
      today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    }

    // Build time Date for Prisma @db.Time field using client local time
    let timeValue: Date
    let timeString: string
    if (localTime) {
      const [h, m, s] = localTime.split(':').map(Number)
      timeValue = new Date(1970, 0, 1, h, m, s)
      timeString = localTime
    } else {
      timeValue = new Date(
        1970, 0, 1,
        now.getHours(), now.getMinutes(), now.getSeconds()
      )
      timeString = now.toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      })
    }

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
  } catch (err: any) {
    console.error('[POST /api/attendance]', err)
    return NextResponse.json({ error: `Server error: ${err.message || err}` }, { status: 500 })
  }
}

// ─── DELETE /api/attendance?id=xxx ──────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id diperlukan' }, { status: 400 })
    }

    await prisma.attendance.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[DELETE /api/attendance]', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}


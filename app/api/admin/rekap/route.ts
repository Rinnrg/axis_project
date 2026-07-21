import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper: format Date object to "HH:mm" string
function fmtTime(d: Date | null): string | null {
  if (!d) return null
  return d.toTimeString().slice(0, 5)
}

// Helper: format Date to "YYYY-MM-DD"
function fmtDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const monthParam = searchParams.get('month') // e.g. "2024-07" or "all"

    const isAll = monthParam === 'all'

    let year = 0
    let month = 0
    let startDate = new Date()
    let endDate = new Date()

    if (!isAll) {
      if (monthParam) {
        const parts = monthParam.split('-')
        year = parseInt(parts[0], 10)
        month = parseInt(parts[1], 10)
      } else {
        const now = new Date()
        year = now.getFullYear()
        month = now.getMonth() + 1
      }
      startDate = new Date(Date.UTC(year, month - 1, 1))
      endDate = new Date(Date.UTC(year, month, 1))
    }

    // 1. Fetch all employees (users)
    const employees = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        position: true,
        department: true,
      },
    })

    // 2. Fetch all attendances (in date range or all)
    const attendances = await prisma.attendance.findMany({
      where: isAll ? {} : {
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    })

    // 3. Fetch all approved permissions (in date range or all)
    const permissions = await prisma.permission.findMany({
      where: isAll ? { status: 'APPROVED' } : {
        status: 'APPROVED',
        OR: [
          { startDate: { gte: startDate, lt: endDate } },
          { endDate: { gte: startDate, lt: endDate } },
          {
            startDate: { lte: startDate },
            endDate: { gte: endDate },
          },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    })

    // Map employees by ID for fast lookup
    const employeeMap = new Map(employees.map(e => [e.id, e]))

    // We will build a consolidated list of rekap records
    const rekapRecords: any[] = []

    // Add actual attendance records
    for (const att of attendances) {
      const emp = employeeMap.get(att.userId)
      if (!emp) continue

      rekapRecords.push({
        id: att.id,
        employeeId: att.userId,
        employeeName: emp.name,
        email: emp.email,
        position: emp.position || '-',
        department: emp.department || '-',
        date: fmtDate(att.date),
        checkInTime: fmtTime(att.checkInTime),
        checkOutTime: fmtTime(att.checkOutTime),
        status: att.status.toLowerCase(),
        notes: att.notes || '',
        permissionType: null,
        permissionReason: null,
        hasCheckInPhoto: !!att.checkInPhoto,
        hasCheckOutPhoto: !!att.checkOutPhoto,
        hasAttachment: false,
      })
    }

    // Process ALL approved permissions: generate a dedicated row per day of each permission.
    // These always appear in rekap — separate from attendance records.
    for (const perm of permissions) {
      const emp = employeeMap.get(perm.userId)
      if (!emp) continue

      // Calculate the start and end dates within the current month/range
      const start = (isAll || perm.startDate > startDate) ? perm.startDate : startDate
      const end = (isAll || perm.endDate < endDate) ? perm.endDate : new Date(Date.UTC(year, month - 1, 31))

      // Loop through each day of the permission
      const curr = new Date(start.getTime())
      let safetyCounter = 0
      const limit = isAll ? 100 : 35
      while (curr <= end && safetyCounter < limit) {
        safetyCounter++
        const dateStr = fmtDate(curr)

        rekapRecords.push({
          id: `perm-${perm.id}-${dateStr}`,
          employeeId: perm.userId,
          employeeName: emp.name,
          email: emp.email,
          position: emp.position || '-',
          department: emp.department || '-',
          date: dateStr,
          checkInTime: null,
          checkOutTime: null,
          status: 'izin',
          notes: `${perm.type.toUpperCase()}: ${perm.reason}`,
          permissionType: perm.type.toUpperCase(),  // IZIN | CUTI | SAKIT
          permissionReason: perm.reason,
          hasCheckInPhoto: false,
          hasCheckOutPhoto: false,
          hasAttachment: !!perm.attachment,
        })

        curr.setUTCDate(curr.getUTCDate() + 1)
      }
    }

    // Sort by date descending, then employee name ascending
    rekapRecords.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date)
      if (dateCompare !== 0) return dateCompare
      return a.employeeName.localeCompare(b.employeeName)
    })

    return NextResponse.json({
      employees,
      rekap: rekapRecords,
    })
  } catch (err) {
    console.error('[GET /api/admin/rekap]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

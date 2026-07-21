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
    const monthParam = searchParams.get('month') // e.g. "2024-07"

    let year: number
    let month: number

    if (monthParam) {
      const parts = monthParam.split('-')
      year = parseInt(parts[0], 10)
      month = parseInt(parts[1], 10)
    } else {
      const now = new Date()
      year = now.getFullYear()
      month = now.getMonth() + 1
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1))
    const endDate = new Date(Date.UTC(year, month, 1))

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

    // 2. Fetch all attendances in the date range
    const attendances = await prisma.attendance.findMany({
      where: {
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

    // 3. Fetch all approved permissions in the date range
    const permissions = await prisma.permission.findMany({
      where: {
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
        checkInPhoto: att.checkInPhoto,
        checkOutPhoto: att.checkOutPhoto,
        attachment: null,
      })
    }

    // Process permissions: for each approved permission, generate daily entries
    // if the employee doesn't already have an attendance record on that date.
    for (const perm of permissions) {
      const emp = employeeMap.get(perm.userId)
      if (!emp) continue

      // Calculate the start and end dates within the current month
      const start = perm.startDate < startDate ? startDate : perm.startDate
      const end = perm.endDate >= endDate ? new Date(Date.UTC(year, month - 1, 31)) : perm.endDate

      // Loop through dates
      const curr = new Date(start.getTime())
      // Cap loop just in case to prevent infinite loops
      let safetyCounter = 0
      while (curr <= end && safetyCounter < 35) {
        safetyCounter++
        const dateStr = fmtDate(curr)

        // Check if employee already has an attendance record on this date
        const hasAtt = attendances.some(
          a => a.userId === perm.userId && fmtDate(a.date) === dateStr
        )

        if (!hasAtt) {
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
            checkInPhoto: null,
            checkOutPhoto: null,
            attachment: perm.attachment,
          })
        }

        // Increment day
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

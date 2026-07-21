import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// Helper: format Date object to "HH:mm" string
function fmtTime(d: Date | null): string | null {
  if (!d) return null;
  return d.toTimeString().slice(0, 5);
}

// Helper: format Date to "YYYY-MM-DD"
function fmtDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate and check if admin
    const session = await auth();
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Determine today's date in GMT+7 (Asia/Jakarta)
    const now = new Date();
    const jakartaOffset = 7 * 60 * 60 * 1000;
    const localNow = new Date(now.getTime() + jakartaOffset);
    const dateStr = localNow.toISOString().split('T')[0];
    const [y, m, d] = dateStr.split('-').map(Number);
    
    const todayStart = new Date(Date.UTC(y, m - 1, d));
    const todayEnd = new Date(Date.UTC(y, m - 1, d + 1));

    // 3. Query general stats
    const totalEmployees = await prisma.user.count({
      where: { status: 'APPROVED' },
    });

    const pendingUsersCount = await prisma.user.count({
      where: { status: 'PENDING' },
    });

    const pendingPermissionsCount = await prisma.permission.count({
      where: { status: 'PENDING' },
    });

    // 4. Query today's attendances
    const attendances = await prisma.attendance.findMany({
      where: {
        date: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            department: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 5. Query today's approved leaves/permissions
    const activeLeaves = await prisma.permission.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: todayStart },
        endDate: { gte: todayStart },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            department: true,
          },
        },
      },
    });

    // 6. Query pending users lists
    const pendingUsers = await prisma.user.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        position: true,
        department: true,
        joinDate: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 7. Query pending leave/permission requests
    const pendingPermissions = await prisma.permission.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            name: true,
            department: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 8. Calculate counters for today's presence
    const presentCount = attendances.filter(a => a.status === 'HADIR' || a.status === 'TELAT').length;
    const lateCount = attendances.filter(a => a.status === 'TELAT').length;
    const leaveCount = activeLeaves.length;

    const formattedAttendances = attendances.map(a => ({
      id: a.id,
      userId: a.userId,
      employeeName: a.user.name,
      email: a.user.email,
      position: a.user.position || '-',
      department: a.user.department || '-',
      checkInTime: fmtTime(a.checkInTime),
      checkOutTime: fmtTime(a.checkOutTime),
      status: a.status.toLowerCase() as 'hadir' | 'telat' | 'izin' | 'alpha',
      notes: a.notes || '',
      checkInPhoto: a.checkInPhoto,
      checkOutPhoto: a.checkOutPhoto,
    }));

    const formattedPermissions = pendingPermissions.map(p => ({
      id: p.id,
      userId: p.userId,
      userName: p.user.name,
      department: p.user.department || '-',
      type: p.type.toLowerCase() as 'izin' | 'cuti' | 'sakit',
      startDate: fmtDate(p.startDate),
      endDate: fmtDate(p.endDate),
      reason: p.reason,
      attachment: p.attachment,
      createdAt: fmtDate(p.createdAt),
    }));

    return NextResponse.json({
      stats: {
        totalEmployees,
        pendingUsers: pendingUsersCount,
        pendingPermissions: pendingPermissionsCount,
        presentToday: presentCount,
        lateToday: lateCount,
        leaveToday: leaveCount,
      },
      attendances: formattedAttendances,
      pendingUsers,
      pendingPermissions: formattedPermissions,
    });
  } catch (err) {
    console.error('[GET /api/admin/dashboard]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

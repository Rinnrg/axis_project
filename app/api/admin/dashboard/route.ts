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
    // 1. Authenticate and check if admin or chief_admin
    const session = await auth();
    if (!session || !session.user || (session.user.role !== 'admin' && session.user.role !== 'chief_admin')) {
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

    const openReportsCount = await prisma.report.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
    });

    // 4. Query today's attendances
    let attendances: any[] = [];
    try {
      attendances = await prisma.attendance.findMany({
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
    } catch (attErr) {
      console.warn('Failed to fetch attendances for admin dashboard:', attErr);
    }

    // 5. Query today's approved leaves/permissions
    let activeLeaves: any[] = [];
    try {
      activeLeaves = await prisma.permission.findMany({
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
    } catch (permErr) {
      console.warn('Failed to fetch permissions:', permErr);
    }

    // 6. Query pending users lists
    let pendingUsers: any[] = [];
    try {
      pendingUsers = await prisma.user.findMany({
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
    } catch (pUsersErr) {
      console.warn('Failed to fetch pending users:', pUsersErr);
    }

    // 7. Query pending leave/permission requests
    let pendingPermissions: any[] = [];
    try {
      pendingPermissions = await prisma.permission.findMany({
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
    } catch (pPermErr) {
      console.warn('Failed to fetch pending permissions:', pPermErr);
    }

    // 8. Query 5 latest reports (Pengaduan terbaru)
    let recentReportsRaw: any[] = [];
    try {
      recentReportsRaw = await prisma.report.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              position: true,
            },
          },
        },
      });
    } catch (repErr) {
      console.warn('Failed to fetch recent reports:', repErr);
    }

    // 9. Calculate counters for today's presence
    const presentCount = attendances.filter(a => a.status === 'HADIR' || a.status === 'TELAT').length;
    const lateCount = attendances.filter(a => a.status === 'TELAT').length;
    const leaveCount = activeLeaves.length;

    const formattedAttendances = attendances.map(a => ({
      id: a.id,
      userId: a.userId,
      employeeName: a.user?.name || 'Karyawan',
      email: a.user?.email || '-',
      position: a.user?.position || '-',
      department: a.user?.department || '-',
      checkInTime: fmtTime(a.checkInTime),
      checkOutTime: fmtTime(a.checkOutTime),
      status: (a.status || 'HADIR').toLowerCase() as 'hadir' | 'telat' | 'izin' | 'alpha',
      notes: a.notes || '',
      checkInPhoto: a.checkInPhoto || null,
      checkOutPhoto: a.checkOutPhoto || null,
    }));

    const formattedPermissions = pendingPermissions.map(p => ({
      id: p.id,
      userId: p.userId,
      userName: p.user?.name || 'Karyawan',
      department: p.user?.department || '-',
      type: (p.type || 'IZIN').toLowerCase() as 'izin' | 'cuti' | 'sakit',
      startDate: fmtDate(p.startDate),
      endDate: fmtDate(p.endDate),
      reason: p.reason,
      attachment: p.attachment || null,
      createdAt: fmtDate(p.createdAt),
    }));

    const formattedReports = recentReportsRaw.map(r => ({
      id: r.id,
      title: r.title,
      category: r.category,
      description: r.description,
      status: r.status,
      isPublic: r.isPublic || !r.userId,
      reporterName: r.reporterName || null,
      reporterPhone: r.reporterPhone || null,
      userName: r.user?.name || null,
      userPosition: r.user?.position || null,
      createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({
      stats: {
        totalEmployees,
        pendingUsers: pendingUsersCount,
        pendingPermissions: pendingPermissionsCount,
        openReports: openReportsCount,
        presentToday: presentCount,
        lateToday: lateCount,
        leaveToday: leaveCount,
      },
      attendances: formattedAttendances,
      pendingUsers,
      pendingPermissions: formattedPermissions,
      recentReports: formattedReports,
    });
  } catch (err: any) {
    console.error('[GET /api/admin/dashboard]', err);
    return NextResponse.json({
      error: 'Server error',
      stats: { totalEmployees: 0, pendingUsers: 0, pendingPermissions: 0, openReports: 0, presentToday: 0, lateToday: 0, leaveToday: 0 },
      attendances: [],
      pendingUsers: [],
      pendingPermissions: [],
      recentReports: []
    });
  }
}

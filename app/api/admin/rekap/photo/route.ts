import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type'); // 'checkin' | 'checkout' | 'attachment'

    if (!id || !type) {
      return NextResponse.json({ error: 'id dan type wajib diisi' }, { status: 400 });
    }

    if (id.startsWith('perm-')) {
      // Permission record: id format is "perm-{permId}-{dateStr}"
      const parts = id.split('-');
      const permId = parts[1];
      const perm = await prisma.permission.findUnique({
        where: { id: permId },
        select: { attachment: true }
      });
      return NextResponse.json({ url: perm?.attachment || null });
    } else {
      // Attendance record
      const att = await prisma.attendance.findUnique({
        where: { id },
        select: {
          checkInPhoto: true,
          checkOutPhoto: true
        }
      });

      if (type === 'checkin') {
        return NextResponse.json({ url: att?.checkInPhoto || null });
      } else if (type === 'checkout') {
        return NextResponse.json({ url: att?.checkOutPhoto || null });
      }
    }

    return NextResponse.json({ url: null });
  } catch (err: any) {
    console.error('[GET /api/admin/rekap/photo]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

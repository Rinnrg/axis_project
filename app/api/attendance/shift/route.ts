import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId, shift, date } = await req.json();

    if (!userId || !shift) {
      return NextResponse.json({ error: 'userId dan shift wajib diisi' }, { status: 400 });
    }

    const now = new Date();
    let today: Date;
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      today = new Date(Date.UTC(year, month - 1, day));
    } else {
      today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    }

    // Get active shift config
    let config = await (prisma as any).shiftConfig.findUnique({
      where: { id: 'default' },
    });
    if (!config) {
      config = {
        shift1Name: 'Shift 1',
        shift1Start: '07:00',
        shift1End: '15:00',
        shift2Name: 'Shift 2',
        shift2Start: '15:00',
        shift2End: '23:00',
      };
    }

    let shiftName = '';
    if (shift === 'SHIFT_1') {
      shiftName = `${config.shift1Name || 'Shift 1'} (${config.shift1Start} - ${config.shift1End})`;
    } else if (shift === 'SHIFT_2') {
      shiftName = `${config.shift2Name || 'Shift 2'} (${config.shift2Start} - ${config.shift2End})`;
    } else {
      shiftName = shift;
    }

    // Upsert attendance with shift choice
    const record = await (prisma as any).attendance.upsert({
      where: { userId_date: { userId, date: today } },
      update: {
        shift,
        shiftName,
      },
      create: {
        userId,
        date: today,
        shift,
        shiftName,
        status: 'HADIR',
        notes: '',
      },
    });

    return NextResponse.json({
      success: true,
      attendance: record,
      shift,
      shiftName,
    });
  } catch (err: any) {
    console.error('[POST /api/attendance/shift]', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

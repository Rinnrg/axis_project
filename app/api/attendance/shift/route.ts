import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId, shift, date } = await req.json();

    if (!userId || !shift) {
      return NextResponse.json({ error: 'userId dan shift wajib diisi' }, { status: 400 });
    }

    const [year, month, day] = (date || new Date().toISOString().split('T')[0]).split('-').map(Number);
    const today = new Date(Date.UTC(year, month - 1, day));

    let config = null;
    try {
      config = await (prisma as any).shiftConfig.findUnique({
        where: { id: 'default' },
      });
    } catch (dbErr) {
      console.warn('shift_configs missing, using default:', dbErr);
    }

    if (!config) {
      config = {
        shift1Name: 'Shift 1 (Pagi)',
        shift1Start: '07:00',
        shift1End: '15:00',
        shift2Name: 'Shift 2 (Siang/Malam)',
        shift2Start: '15:00',
        shift2End: '23:00',
      };
    }

    const shiftName = shift === 'SHIFT_1' ? config.shift1Name : config.shift2Name;

    let record = null;
    try {
      record = await (prisma as any).attendance.upsert({
        where: { userId_date: { userId, date: today } },
        update: { shift, shiftName },
        create: { userId, date: today, shift, shiftName, status: 'HADIR', notes: '' },
      });
    } catch (dbErr) {
      console.warn('Could not save shift columns to DB, falling back to notes:', dbErr);
      record = await (prisma as any).attendance.upsert({
        where: { userId_date: { userId, date: today } },
        update: { notes: `Shift: ${shiftName}` },
        create: { userId, date: today, status: 'HADIR', notes: `Shift: ${shiftName}` },
      });
    }

    return NextResponse.json({
      success: true,
      shift: record.shift || shift,
      shiftName: record.shiftName || shiftName,
    });
  } catch (err: any) {
    console.error('[POST /api/attendance/shift]', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

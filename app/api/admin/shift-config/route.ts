import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    let config = await (prisma as any).shiftConfig.findUnique({
      where: { id: 'default' },
    });

    if (!config) {
      config = await (prisma as any).shiftConfig.create({
        data: {
          id: 'default',
          shift1Name: 'Shift 1 (Pagi)',
          shift1Start: '07:00',
          shift1End: '15:00',
          shift2Name: 'Shift 2 (Siang/Malam)',
          shift2Start: '15:00',
          shift2End: '23:00',
        },
      });
    }

    return NextResponse.json({ config });
  } catch (err: any) {
    console.error('[GET /api/admin/shift-config]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || (session.user.role !== 'admin' && session.user.role !== 'chief_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      shift1Name,
      shift1Start,
      shift1End,
      shift2Name,
      shift2Start,
      shift2End,
    } = await req.json();

    if (!shift1Start || !shift1End || !shift2Start || !shift2End) {
      return NextResponse.json({ error: 'Jam check-in & check-out wajb diisi lengkap' }, { status: 400 });
    }

    const config = await (prisma as any).shiftConfig.upsert({
      where: { id: 'default' },
      update: {
        shift1Name: shift1Name || 'Shift 1',
        shift1Start,
        shift1End,
        shift2Name: shift2Name || 'Shift 2',
        shift2Start,
        shift2End,
      },
      create: {
        id: 'default',
        shift1Name: shift1Name || 'Shift 1',
        shift1Start,
        shift1End,
        shift2Name: shift2Name || 'Shift 2',
        shift2Start,
        shift2End,
      },
    });

    return NextResponse.json({ config, message: 'Pengaturan shift berhasil disimpan' });
  } catch (err: any) {
    console.error('[POST /api/admin/shift-config]', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

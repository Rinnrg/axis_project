import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const DEFAULT_CONFIG = {
  id: 'default',
  shift1Name: 'Shift 1 (Pagi)',
  shift1Start: '07:00',
  shift1End: '15:00',
  shift2Name: 'Shift 2 (Siang/Malam)',
  shift2Start: '15:00',
  shift2End: '23:00',
};

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || (session.user.role !== 'admin' && session.user.role !== 'chief_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let config = null;
    try {
      config = await (prisma as any).shiftConfig.findUnique({
        where: { id: 'default' },
      });
    } catch (dbErr) {
      console.warn('shift_configs table missing on DB, returning default:', dbErr);
    }

    if (!config) {
      config = DEFAULT_CONFIG;
    }

    return NextResponse.json({ config });
  } catch (err) {
    console.error('[GET /api/admin/shift-config]', err);
    return NextResponse.json({ config: DEFAULT_CONFIG });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || (session.user.role !== 'admin' && session.user.role !== 'chief_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      shift1Name,
      shift1Start,
      shift1End,
      shift2Name,
      shift2Start,
      shift2End,
    } = body;

    let config = null;
    try {
      config = await (prisma as any).shiftConfig.upsert({
        where: { id: 'default' },
        update: {
          shift1Name,
          shift1Start,
          shift1End,
          shift2Name,
          shift2Start,
          shift2End,
        },
        create: {
          id: 'default',
          shift1Name: shift1Name || 'Shift 1 (Pagi)',
          shift1Start: shift1Start || '07:00',
          shift1End: shift1End || '15:00',
          shift2Name: shift2Name || 'Shift 2 (Siang/Malam)',
          shift2Start: shift2Start || '15:00',
          shift2End: shift2End || '23:00',
        },
      });
    } catch (dbErr: any) {
      console.error('Failed to save shiftConfig to DB:', dbErr);
      return NextResponse.json({
        error: 'Tabel database shift_configs belum tersedia. Pastikan migrasi prisma sudah di-push.',
      }, { status: 500 });
    }

    return NextResponse.json({ config });
  } catch (err) {
    console.error('[POST /api/admin/shift-config]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

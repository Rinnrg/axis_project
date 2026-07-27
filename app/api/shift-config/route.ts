import { NextRequest, NextResponse } from 'next/server';
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
    console.error('[GET /api/shift-config]', err);
    return NextResponse.json({ config: DEFAULT_CONFIG });
  }
}

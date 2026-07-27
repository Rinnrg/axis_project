import { NextRequest, NextResponse } from 'next/server';
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
    console.error('[GET /api/shift-config]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

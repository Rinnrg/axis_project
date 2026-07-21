import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate and check if admin
    const session = await auth();
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Parse body
    const { userId, action } = await req.json();

    if (!userId || !action || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'Parameter tidak valid' }, { status: 400 });
    }

    // 3. Map action to User status
    const status = action === 'approve' ? 'APPROVED' : 'REJECTED';

    // 4. Update status in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: { id: true, name: true, email: true, status: true },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('[POST /api/admin/users/action]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, phone } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nama lengkap tidak boleh kosong' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        phone: phone ? phone.trim() : null,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    console.error('[PUT /api/users/profile]', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

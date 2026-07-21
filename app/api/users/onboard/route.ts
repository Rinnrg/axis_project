import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, phone } = await req.json();

    if (!name || !phone || typeof name !== 'string' || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Nama lengkap dan nomor HP wajib diisi' }, { status: 400 });
    }

    // Clean and validate inputs
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (trimmedName.length < 2) {
      return NextResponse.json({ error: 'Nama lengkap terlalu pendek' }, { status: 400 });
    }

    if (trimmedPhone.length < 8) {
      return NextResponse.json({ error: 'Nomor HP tidak valid' }, { status: 400 });
    }

    // Update user name and phone in database
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: trimmedName,
        phone: trimmedPhone,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/users/onboard]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

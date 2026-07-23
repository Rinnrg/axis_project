import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// ─── GET /api/reports  ─────────────────────────────────────────────────────────
// Admin/Chief Admin: semua report | Employee: hanya miliknya sendiri
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const isAdminRole = session.user.role === 'admin' || session.user.role === 'chief_admin';

    const reports = await prisma.report.findMany({
      where: isAdminRole ? {} : { userId: session.user.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, position: true, department: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ reports });
  } catch (err) {
    console.error('[GET /api/reports]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ─── POST /api/reports  ────────────────────────────────────────────────────────
// Employee membuat laporan baru
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, category, description, location, priority, attachment } = body;

    if (!title || !category || !description) {
      return NextResponse.json(
        { error: 'Judul, kategori, dan deskripsi wajib diisi' },
        { status: 400 }
      );
    }

    const validCategories = ['FASILITAS', 'KEBERSIHAN', 'KEAMANAN', 'PERALATAN', 'LAYANAN', 'LAINNYA'];
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Kategori tidak valid' }, { status: 400 });
    }
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'Prioritas tidak valid' }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: {
        userId: session.user.id,
        title,
        category,
        description,
        location: location || null,
        priority: priority || 'MEDIUM',
        attachment: attachment || null,
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/reports]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ─── PATCH /api/reports  ───────────────────────────────────────────────────────
// Admin/Chief Admin: update status dan catatan admin
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdminRole = session.user.role === 'admin' || session.user.role === 'chief_admin';
    if (!isAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, adminNote } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID laporan wajib diisi' }, { status: 400 });
    }

    const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
    }

    const report = await prisma.report.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(adminNote !== undefined && { adminNote }),
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ report });
  } catch (err) {
    console.error('[PATCH /api/reports]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ─── DELETE /api/reports?id=xxx  ──────────────────────────────────────────────
// Admin/Chief Admin atau pemilik yang masih OPEN
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID laporan wajib diisi' }, { status: 400 });
    }

    const existing = await prisma.report.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Laporan tidak ditemukan' }, { status: 404 });
    }

    const isAdminRole = session.user.role === 'admin' || session.user.role === 'chief_admin';
    const isOwner = existing.userId === session.user.id;

    if (!isAdminRole && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.report.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/reports]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

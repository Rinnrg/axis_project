import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ─── POST /api/reports/public ──────────────────────────────────────────────────
// Pelanggan membuat laporan umum tanpa login
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      reporterName,
      reporterPhone,
      reporterEmail,
      title,
      category,
      description,
      location,
      priority,
      attachment,
    } = body;

    // Validasi input data pengirim & laporan
    if (!reporterName?.trim() || !reporterPhone?.trim()) {
      return NextResponse.json(
        { error: 'Nama dan nomor telepon/WhatsApp wajib diisi' },
        { status: 400 }
      );
    }

    if (!title?.trim() || !category || !description?.trim()) {
      return NextResponse.json(
        { error: 'Judul, kategori, dan deskripsi laporan wajib diisi' },
        { status: 400 }
      );
    }

    const validCategories = [
      'FASILITAS',
      'KEBERSIHAN',
      'KEAMANAN',
      'PERALATAN',
      'LAYANAN',
      'LAINNYA',
    ];
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Kategori tidak valid' }, { status: 400 });
    }

    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'Prioritas tidak valid' }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: {
        isPublic: true,
        reporterName: reporterName.trim(),
        reporterPhone: reporterPhone.trim(),
        reporterEmail: reporterEmail?.trim() || null,
        title: title.trim(),
        category,
        description: description.trim(),
        location: location?.trim() || null,
        priority: priority || 'MEDIUM',
        attachment: attachment || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        reportId: report.id,
        message: 'Laporan Anda berhasil dikirim dan akan segera diproses oleh admin.',
        report,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[POST /api/reports/public]', err);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

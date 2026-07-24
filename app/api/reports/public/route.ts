import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ─── GET /api/reports/public ──────────────────────────────────────────────────
// Pelanggan mencari & melihat riwayat pengaduan berdasarkan Nomor Telepon/WhatsApp atau ID Tiket
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query')?.trim() || searchParams.get('phone')?.trim();

    if (!query) {
      return NextResponse.json(
        { error: 'Nomor WhatsApp/Telepon atau ID Tiket wajib diisi' },
        { status: 400 }
      );
    }

    const reports = await prisma.report.findMany({
      where: {
        OR: [
          { reporterPhone: { contains: query } },
          { reporterEmail: { contains: query } },
          { id: { equals: query } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        reporterName: true,
        reporterPhone: true,
        reporterEmail: true,
        title: true,
        category: true,
        description: true,
        status: true,
        adminNote: true,
        attachment: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, count: reports.length, reports });
  } catch (err: any) {
    console.error('[GET /api/reports/public]', err);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

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

    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Kategori tidak valid' }, { status: 400 });
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

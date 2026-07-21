import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── Users ──────────────────────────────────────────────────────────────────
  const budi = await prisma.user.upsert({
    where: { email: 'budi@example.com' },
    update: {},
    create: {
      name:       'Budi Santoso',
      email:      'budi@example.com',
      password:   'password123',
      phone:      '081234567890',
      position:   'Software Engineer',
      department: 'IT',
      role:       'EMPLOYEE',
      status:     'APPROVED',
      joinDate:   new Date('2023-01-15'),
    },
  })

  const siti = await prisma.user.upsert({
    where: { email: 'siti@example.com' },
    update: {},
    create: {
      name:       'Siti Nurhaliza',
      email:      'siti@example.com',
      password:   'password123',
      phone:      '081234567891',
      position:   'Project Manager',
      department: 'Management',
      role:       'EMPLOYEE',
      status:     'APPROVED',
      joinDate:   new Date('2022-06-10'),
    },
  })

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name:       'Admin User',
      email:      'admin@example.com',
      password:   'admin123',
      phone:      '081234567892',
      position:   'HR Manager',
      department: 'HR',
      role:       'ADMIN',
      status:     'APPROVED',
      joinDate:   new Date('2021-01-01'),
    },
  })

  await prisma.user.upsert({
    where: { email: 'adminaxis@gmail.com' },
    update: {},
    create: {
      name:       'Admin Axis',
      email:      'adminaxis@gmail.com',
      password:   'axis0penhouse',
      phone:      '081299998888',
      position:   'Super Admin',
      department: 'Management',
      role:       'ADMIN',
      status:     'APPROVED',
      joinDate:   new Date('2026-07-21'),
    },
  })

  console.log('✅ Users seeded')

  // ── Attendance ─────────────────────────────────────────────────────────────
  // Helper to create Time Date
  const t = (h: number, m: number) => new Date(1970, 0, 1, h, m, 0)
  const d = (dateStr: string)       => new Date(dateStr)

  const attendanceSeed = [
    { userId: budi.id, date: d('2024-07-20'), checkInTime: t(8,15),  checkOutTime: t(17,30), status: 'HADIR' as const, notes: 'Normal' },
    { userId: budi.id, date: d('2024-07-19'), checkInTime: t(9,5),   checkOutTime: t(17,45), status: 'TELAT' as const, notes: 'Traffic jam' },
    { userId: budi.id, date: d('2024-07-18'), checkInTime: null,      checkOutTime: null,     status: 'IZIN'  as const, notes: 'Izin sakit' },
    { userId: budi.id, date: d('2024-07-17'), checkInTime: t(8,0),   checkOutTime: t(17,0),  status: 'HADIR' as const, notes: 'Normal' },
    { userId: siti.id, date: d('2024-07-20'), checkInTime: t(8,0),   checkOutTime: t(17,0),  status: 'HADIR' as const, notes: 'Normal' },
    { userId: siti.id, date: d('2024-07-19'), checkInTime: t(8,0),   checkOutTime: t(17,0),  status: 'HADIR' as const, notes: 'Normal' },
  ]

  for (const att of attendanceSeed) {
    await prisma.attendance.upsert({
      where:  { userId_date: { userId: att.userId, date: att.date } },
      update: {},
      create: att,
    })
  }

  console.log('✅ Attendance seeded')

  // ── Permissions ────────────────────────────────────────────────────────────
  const perms = [
    { userId: budi.id, type: 'CUTI'  as const, startDate: d('2024-08-01'), endDate: d('2024-08-05'), reason: 'Liburan keluarga', status: 'PENDING'  as const },
    { userId: budi.id, type: 'SAKIT' as const, startDate: d('2024-07-18'), endDate: d('2024-07-18'), reason: 'Demam',            status: 'APPROVED' as const },
    { userId: budi.id, type: 'IZIN'  as const, startDate: d('2024-07-10'), endDate: d('2024-07-10'), reason: 'Acara keluarga',   status: 'APPROVED' as const },
    { userId: siti.id, type: 'CUTI'  as const, startDate: d('2024-08-10'), endDate: d('2024-08-14'), reason: 'Honeymoon',        status: 'PENDING'  as const },
  ]

  for (const perm of perms) {
    await prisma.permission.create({ data: perm }).catch(() => { /* skip duplicates */ })
  }

  console.log('✅ Permissions seeded')
  console.log('\n🎉 Database seeded successfully!')
  console.log('\nLogin credentials:')
  console.log('  Karyawan:    budi@example.com / password123')
  console.log('  Admin 1:     admin@example.com / admin123')
  console.log('  Admin Axis:  adminaxis@gmail.com / axis0penhouse')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })

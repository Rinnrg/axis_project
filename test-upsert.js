const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting debug upsert query...");
  
  // Find a test user id
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("No user found in the DB. Please register a user first.");
    return;
  }
  
  const userId = user.id;
  console.log("Using test userId:", userId);
  
  const now = new Date();
  // Construct today's UTC midnight date
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const timeValue = new Date(1970, 0, 1, 8, 0, 0); // 8:00 AM
  
  console.log("Parameters:");
  console.log("- today (UTC):", today.toISOString());
  console.log("- timeValue:", timeValue.toISOString());
  
  try {
    const record = await prisma.attendance.upsert({
      where:  { userId_date: { userId, date: today } },
      update: { checkInTime: timeValue, status: 'HADIR', notes: 'DEBUG_TEST' },
      create: { userId, date: today, checkInTime: timeValue, status: 'HADIR', notes: 'DEBUG_TEST' },
    });
    console.log("SUCCESS! Upsert completed. Record:", record);
  } catch (err) {
    console.error("ERROR during upsert query:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

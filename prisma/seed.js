const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Hash default passwords
  const tinPasswordHash = await bcrypt.hash('Tin@LCAU2026', 10);
  const alyssaPasswordHash = await bcrypt.hash('Alyssa@LCAU2026', 10);

  // 2. Upsert Master Tin (Asset Holder)
  const tin = await prisma.user.upsert({
    where: { email: 'nyunttin@aiesec.net' },
    update: {
      name: 'Tim (Master Tin)',
      role: 'holder',
      assignedCategory: 'Stationary & General',
    },
    create: {
      email: 'nyunttin@aiesec.net',
      name: 'Tim (Master Tin)',
      password: tinPasswordHash,
      role: 'holder',
      assignedCategory: 'Stationary & General',
      status: 'active',
    },
  });
  console.log(`👤 Upserted user: ${tin.name} (${tin.role})`);

  // 3. Upsert Alyssa Intawong (LCVP)
  const alyssa = await prisma.user.upsert({
    where: { email: 'alyssa.intawong@aiesec.net' },
    update: {
      name: 'Alyssa Intawong',
      role: 'lcvp',
      assignedCategory: 'LCVP Finance & Legality',
    },
    create: {
      email: 'alyssa.intawong@aiesec.net',
      name: 'Alyssa Intawong',
      password: alyssaPasswordHash,
      role: 'lcvp',
      assignedCategory: 'LCVP Finance & Legality',
      status: 'active',
    },
  });
  console.log(`👤 Upserted user: ${alyssa.name} (${alyssa.role})`);

  // 4. Seed Category Holder Assignments
  const assignments = [
    {
      category: 'Stationary',
      holderName: 'Tim (Master Tin)',
      holderEmail: 'nyunttin@aiesec.net',
      storageLocation: 'Student Lounge Locker 4A',
    },
    {
      category: 'Decoration',
      holderName: 'Alyssa Intawong',
      holderEmail: 'alyssa.intawong@aiesec.net',
      storageLocation: 'Student Lounge Cabinet 2',
    },
    {
      category: 'General',
      holderName: 'Tim (Master Tin)',
      holderEmail: 'nyunttin@aiesec.net',
      storageLocation: 'Student Lounge Locker 4A',
    },
  ];

  for (const a of assignments) {
    await prisma.holderAssignment.upsert({
      where: { category: a.category },
      update: {
        holderName: a.holderName,
        holderEmail: a.holderEmail,
        storageLocation: a.storageLocation,
        lastUpdated: new Date(),
      },
      create: {
        category: a.category,
        holderName: a.holderName,
        holderEmail: a.holderEmail,
        storageLocation: a.storageLocation,
        lastUpdated: new Date(),
      },
    });
  }
  console.log('📦 Category assignments seeded.');

  // 5. Seed Initial Events
  const events = [
    {
      name: 'Culture & Connect Night 2026',
      date: new Date('2026-11-28'),
      organizingFunction: 'MX',
      location: 'AU Suvarnabhumi Campus, CL Plaza',
      description: 'Cultural bonding and community building event for incoming exchange participants and members.',
      status: 'upcoming',
      createdBy: 'alyssa.intawong@aiesec.net',
    },
    {
      name: 'LCAU Induction Day 26.27',
      date: new Date('2026-12-05'),
      organizingFunction: 'PM',
      location: 'John Paul II Hall, AU',
      description: 'Welcoming and onboarding new team members into LCAU.',
      status: 'upcoming',
      createdBy: 'nyunttin@aiesec.net',
    },
    {
      name: 'General Operations & Meeting',
      date: new Date('2026-12-31'),
      organizingFunction: 'All LC',
      location: 'Student Lounge Locker 4A',
      description: 'Day-to-day LC team meetings and general operational use.',
      status: 'ongoing',
      createdBy: 'nyunttin@aiesec.net',
    },
  ];

  for (const e of events) {
    const existing = await prisma.event.findFirst({
      where: { name: e.name },
    });
    if (!existing) {
      await prisma.event.create({ data: e });
    }
  }
  console.log('📅 Events seeded.');

  console.log('✅ Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

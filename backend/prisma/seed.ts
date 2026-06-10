import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear old entries safely
  await prisma.actionLog.deleteMany({});
  await prisma.lead.deleteMany({});

  // Insert test cases using explicit enum string values
  const lead1 = await prisma.lead.create({
    data: {
      name: 'Rahul Sharma',
      phone: '+919876543210',
      status: 'NEW', // Passed directly as a strict schema string match
      notes: 'Interested in 2BHK property. Prefer evening calls.',
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      name: 'Priya Nair',
      phone: '+918765432109',
      status: 'HOT_PROSPECT', // Passed directly as a strict schema string match
      notes: 'Visa application urgent. Documents pending.',
    },
  });

  console.log('Database seeded successfully! Loaded profiles:', { lead1, lead2 });
}

main()
  .catch((e) => {
    console.error(e);
    // Explicit global check handling
    if (typeof process !== 'undefined') {
      process.exit(1);
    }
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
// File: prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');
  const hashedPassword = await bcrypt.hash('password', 10);

  // Create Acme Tenant and Users
  const acme = await prisma.tenant.create({
    data: {
      name: 'Acme',
      slug: 'acme',
      users: {
        create: [
          {
            email: 'admin@acme.test',
            password: hashedPassword,
            role: 'ADMIN',
          },
          {
            email: 'user@acme.test',
            password: hashedPassword,
            role: 'MEMBER',
          },
        ],
      },
    },
  });

  // Create Globex Tenant and Users
  const globex = await prisma.tenant.create({
    data: {
      name: 'Globex',
      slug: 'globex',
      users: {
        create: [
          {
            email: 'admin@globex.test',
            password: hashedPassword,
            role: 'ADMIN',
          },
          {
            email: 'user@globex.test',
            password: hashedPassword,
            role: 'MEMBER',
          },
        ],
      },
    },
  });

  console.log({ acme, globex });
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
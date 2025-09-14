import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { NextApiRequest, NextApiResponse } from 'next';
import slugify from 'slugify';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password, tenantName } = req.body;

  if (!email || !password || !tenantName) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const slug = slugify(tenantName, { lower: true, strict: true });
    const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
    if (existingTenant) {
      return res.status(409).json({ message: 'Tenant name already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newTenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        slug: slug,
        users: {
          create: [{
            email,
            password: hashedPassword,
            role: 'ADMIN',
          }],
        },
      },
      include: {
        users: true,
      },
    });

    res.status(201).json({ message: 'Account created successfully', tenant: newTenant });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
// File: src/pages/api/notes/index.ts

import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

// Helper to get user from request headers
function getUser(req: NextApiRequest) {
  const userPayload = req.headers['x-user-payload'];
  if (typeof userPayload === 'string') {
    return JSON.parse(userPayload);
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  // --- List Notes ---
  if (req.method === 'GET') {
    const notes = await prisma.note.findMany({
      where: { tenantId: user.tenantId }, // ** CRITICAL ISOLATION **
    });
    return res.status(200).json(notes);
  }

  // --- Create Note ---
  if (req.method === 'POST') {
    const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });

    if (tenant?.plan === 'FREE') {
      const noteCount = await prisma.note.count({ where: { tenantId: user.tenantId } });
      if (noteCount >= 3) {
        return res.status(403).json({ message: 'Free plan limit of 3 notes reached. Please upgrade.' });
      }
    }

    const { title, content } = req.body;
    const newNote = await prisma.note.create({
      data: {
        title,
        content,
        tenantId: user.tenantId, // ** CRITICAL ISOLATION **
      },
    });
    return res.status(201).json(newNote);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
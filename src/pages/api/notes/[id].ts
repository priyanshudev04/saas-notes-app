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

  const { id } = req.query;

  // Check if the note belongs to the user's tenant
  const note = await prisma.note.findUnique({
    where: { id: id as string },
  });

  if (!note || note.tenantId !== user.tenantId) {
    return res.status(404).json({ message: 'Note not found or you do not have permission to access it.' });
  }

  // --- Retrieve a specific note (GET) ---
  if (req.method === 'GET') {
    return res.status(200).json(note);
  }

  // --- Update a note (PUT) ---
  if (req.method === 'PUT') {
    const { title, content } = req.body;
    const updatedNote = await prisma.note.update({
      where: { id: id as string },
      data: { title, content },
    });
    return res.status(200).json(updatedNote);
  }

  // --- Delete a note (DELETE) ---
  if (req.method === 'DELETE') {
    await prisma.note.delete({
      where: { id: id as string },
    });
    return res.status(204).end();
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
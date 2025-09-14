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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const user = getUser(req);
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden. Only admins can upgrade plans.' });
  }

  const { slug } = req.query;

  const tenant = await prisma.tenant.findUnique({
    where: { slug: slug as string },
  });

  if (!tenant) {
    return res.status(404).json({ message: 'Tenant not found.' });
  }
  
  // This check ensures an admin can only upgrade their own tenant
  if (tenant.id !== user.tenantId) {
      return res.status(403).json({ message: 'Forbidden. You can only upgrade your own tenant.' });
  }

  const updatedTenant = await prisma.tenant.update({
    where: { slug: slug as string },
    data: { plan: 'PRO' },
  });

  return res.status(200).json({ message: 'Tenant plan upgraded to PRO.', tenant: updatedTenant });
}
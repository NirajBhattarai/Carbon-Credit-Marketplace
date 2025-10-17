import { NextApiRequest, NextApiResponse } from 'next';
import { db, iotDevices, applications, eq, desc } from '@/lib/db';
import {
  authenticateJWTPages,
  AuthenticatedApiRequest,
} from '@/lib/auth/middleware';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const authResult = await authenticateJWTPages(req);
    if (authResult) {
      return res.status(authResult.status).json(authResult.data);
    }

    const walletAddress = (req as AuthenticatedApiRequest).user!.walletAddress;

    // Get user's devices directly by wallet address
    const devices = await db
      .select()
      .from(iotDevices)
      .where(eq(iotDevices.walletAddress, walletAddress))
      .orderBy(desc(iotDevices.createdAt));

    res.status(200).json({
      success: true,
      devices,
      count: devices.length,
    });
  } catch (error) {
    console.error('Get user devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user devices',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

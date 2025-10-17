import { NextApiRequest, NextApiResponse } from 'next';
import { db, iotDevices, eq, desc } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all devices (public endpoint for POC)
    const devices = await db
      .select()
      .from(iotDevices)
      .orderBy(desc(iotDevices.createdAt));

    res.status(200).json({
      success: true,
      devices,
      count: devices.length,
    });
  } catch (error) {
    console.error('Get public devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get devices',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateJWT } from '@/lib/auth/middleware-pages';
import { eq, desc } from 'drizzle-orm';

interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string;
    walletAddress: string;
    role: string;
  };
}

interface ActivityItem {
  id: string;
  type:
    | 'device_registered'
    | 'credits_generated'
    | 'data_updated'
    | 'transaction';
  title: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

/**
 * GET /api/user/activity - Get user's activity feed
 */
export default async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const authResult = await authenticateJWT(req);
    if (!authResult) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user!.id;
    const walletAddress = req.user!.walletAddress;

    // Fetch activity data from various sources
    const activities: ActivityItem[] = [];

    // Get device registrations
    const { db } = await import('@/lib/db');
    const { iotDevices } = await import('@/lib/db/schema');

    const devices = await db
      .select()
      .from(iotDevices)
      .where(eq(iotDevices.walletAddress, walletAddress))
      .orderBy(desc(iotDevices.createdAt))
      .limit(5);

    devices.forEach(device => {
      activities.push({
        id: `device_${device.id}`,
        type: 'device_registered',
        title: 'Device Registered',
        description: `${device.deviceType} device #${device.deviceId}`,
        timestamp: device.createdAt.toISOString(),
        metadata: {
          deviceId: device.deviceId,
          deviceType: device.deviceType,
          location: device.location,
        },
      });
    });

    // Get recent carbon credit transactions
    const { userCarbonCredits } = await import('@/lib/db/schema');

    const credits = await db
      .select()
      .from(userCarbonCredits)
      .where(eq(userCarbonCredits.walletAddress, walletAddress))
      .orderBy(desc(userCarbonCredits.createdAt))
      .limit(5);

    credits.forEach(credit => {
      activities.push({
        id: `credit_${credit.id}`,
        type: 'credits_generated',
        title: 'Carbon Credits Generated',
        description: `${credit.creditsGenerated.toFixed(1)} credits from ${credit.deviceType} monitoring`,
        timestamp: credit.createdAt.toISOString(),
        metadata: {
          creditsGenerated: credit.creditsGenerated,
          deviceType: credit.deviceType,
          co2Reduced: credit.co2Reduced,
        },
      });
    });

    // Sort activities by timestamp (most recent first)
    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Limit to 10 most recent activities
    const recentActivities = activities.slice(0, 10);

    res.status(200).json({
      success: true,
      activities: recentActivities,
      count: recentActivities.length,
    });
  } catch (error) {
    console.error('Error getting user activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

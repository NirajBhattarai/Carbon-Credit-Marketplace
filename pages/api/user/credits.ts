import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateJWT } from '@/lib/auth/middleware-pages';
import { db, userCarbonCredits, userCreditHistory } from '@/lib/db';
import { eq, desc, gte } from 'drizzle-orm';

/**
 * GET /api/user/credits - Get current credit data for a user
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    // Authenticate user
    const authResult = await authenticateJWT(req, res);
    if (!authResult.success) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { walletAddress } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid walletAddress parameter',
      });
    }

    // Get current credit data
    const creditData = await db
      .select()
      .from(userCarbonCredits)
      .where(eq(userCarbonCredits.walletAddress, walletAddress))
      .orderBy(desc(userCarbonCredits.updatedAt))
      .limit(1);

    if (creditData.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalCredits: 0,
          co2Reduced: 0,
          energySaved: 0,
          temperatureImpact: 0,
          humidityImpact: 0,
          isOnline: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const credits = creditData[0];

    return res.status(200).json({
      success: true,
      data: {
        totalCredits: parseFloat(credits.credits),
        co2Reduced: parseFloat(credits.co2Reduced),
        energySaved: parseFloat(credits.energySaved),
        temperatureImpact: parseFloat(credits.temperatureImpact),
        humidityImpact: parseFloat(credits.humidityImpact),
        isOnline: credits.isOnline,
        timestamp: credits.timestamp.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching credit data:', error);
    return res.status(500).json({
      error: 'Failed to fetch credit data',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
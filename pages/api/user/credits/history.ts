import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateJWT } from '@/lib/auth/middleware-pages';
import { db, userCreditHistory } from '@/lib/db';
import { eq, desc, gte } from 'drizzle-orm';

/**
 * GET /api/user/credits/history - Get credit history for a user
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

    const { walletAddress, period = '7d' } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid walletAddress parameter',
      });
    }

    // Calculate date range based on period
    let startDate: Date | undefined;
    const now = new Date();

    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = undefined; // No date filter
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Build query
    let query = db
      .select()
      .from(userCreditHistory)
      .where(eq(userCreditHistory.walletAddress, walletAddress));

    // Add date filter if specified
    if (startDate) {
      query = query.where(gte(userCreditHistory.createdAt, startDate));
    }

    // Execute query with ordering
    const creditHistory = await query.orderBy(desc(userCreditHistory.createdAt));

    // Transform data for frontend
    const transformedHistory = creditHistory.map(entry => ({
      id: entry.id,
      creditsEarned: parseFloat(entry.creditsEarned),
      co2Reduced: parseFloat(entry.co2Reduced),
      energySaved: parseFloat(entry.energySaved),
      temperatureImpact: parseFloat(entry.temperatureImpact),
      humidityImpact: parseFloat(entry.humidityImpact),
      source: entry.source,
      sourceId: entry.sourceId,
      createdAt: entry.createdAt.toISOString(),
      metadata: entry.metadata,
    }));

    return res.status(200).json({
      success: true,
      data: transformedHistory,
      meta: {
        period,
        startDate: startDate?.toISOString(),
        endDate: now.toISOString(),
        totalEntries: transformedHistory.length,
      },
    });
  } catch (error) {
    console.error('Error fetching credit history:', error);
    return res.status(500).json({
      error: 'Failed to fetch credit history',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import { CarbonCreditEngine } from '@/lib/services/carbon-credit-engine';
import { authenticateApiKeyPages } from '@/lib/auth/middleware';

/**
 * POST /api/credits/calculate - Calculate credits for a device
 * GET /api/credits/status/:deviceId - Get minting status for a device
 * POST /api/credits/mint - Create mint request
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Authenticate API key
    const authResult = await authenticateApiKeyPages(req, res);
    if (!authResult.success) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { method } = req;

    switch (method) {
      case 'POST':
        return await handleCalculateCredits(req, res);
      case 'GET':
        return await handleGetStatus(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Credits API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Calculate credits for a device over a time period
 */
async function handleCalculateCredits(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { deviceId, startTime, endTime, config } = req.body;

  if (!deviceId || !startTime || !endTime) {
    return res.status(400).json({
      error: 'Missing required fields: deviceId, startTime, endTime',
    });
  }

  try {
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validate time range
    if (start >= end) {
      return res.status(400).json({
        error: 'Start time must be before end time',
      });
    }

    // Check if time range is reasonable (not more than 7 days)
    const timeDiff = end.getTime() - start.getTime();
    const maxRange = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    if (timeDiff > maxRange) {
      return res.status(400).json({
        error: 'Time range cannot exceed 7 days',
      });
    }

    const result = await CarbonCreditEngine.processCreditsForPeriod(
      deviceId,
      start,
      end,
      config
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error calculating credits:', error);
    return res.status(500).json({
      error: 'Failed to calculate credits',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get minting status for a device
 */
async function handleGetStatus(req: NextApiRequest, res: NextApiResponse) {
  const { deviceId } = req.query;

  if (!deviceId || typeof deviceId !== 'string') {
    return res.status(400).json({
      error: 'Missing or invalid deviceId parameter',
    });
  }

  try {
    const status = await CarbonCreditEngine.getMintingStatus(deviceId);

    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error getting minting status:', error);
    return res.status(500).json({
      error: 'Failed to get minting status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

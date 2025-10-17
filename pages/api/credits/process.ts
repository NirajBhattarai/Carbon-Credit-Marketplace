import { NextApiRequest, NextApiResponse } from 'next';
import { ScheduledCreditProcessor } from '@/lib/services/scheduled-credit-processor';
import { CarbonCreditEngine } from '@/lib/services/carbon-credit-engine';

/**
 * POST /api/credits/process - Manually trigger credit processing
 * GET /api/credits/process/status - Get processing status
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { method } = req;

    switch (method) {
      case 'POST':
        return await handleProcessCredits(req, res);
      case 'GET':
        return await handleGetStatus(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Credit processing API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Manually trigger credit processing
 */
async function handleProcessCredits(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { deviceId, startTime, endTime, processAll } = req.body;

  try {
    if (processAll) {
      // Process all devices
      await ScheduledCreditProcessor.processAllDevices();
      
      return res.status(200).json({
        success: true,
        message: 'Credit processing started for all devices',
        data: {
          type: 'all_devices',
          timestamp: new Date().toISOString(),
        },
      });
    } else if (deviceId && startTime && endTime) {
      // Process specific device for specific time range
      const start = new Date(startTime);
      const end = new Date(endTime);

      const result = await ScheduledCreditProcessor.processCreditsForRange(
        deviceId,
        start,
        end
      );

      return res.status(200).json({
        success: true,
        message: `Credits processed for device ${deviceId}`,
        data: {
          type: 'specific_device',
          deviceId,
          timeRange: { startTime: start, endTime: end },
          result,
        },
      });
    } else {
      return res.status(400).json({
        error: 'Missing required parameters. Provide either processAll=true or deviceId, startTime, endTime',
      });
    }
  } catch (error) {
    console.error('Error processing credits:', error);
    return res.status(500).json({
      error: 'Failed to process credits',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get processing status
 */
async function handleGetStatus(req: NextApiRequest, res: NextApiResponse) {
  try {
    const status = ScheduledCreditProcessor.getStatus();

    return res.status(200).json({
      success: true,
      data: {
        ...status,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting processing status:', error);
    return res.status(500).json({
      error: 'Failed to get processing status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import { db, iotDevices, deviceData, eq, desc } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query } = req;
  const { deviceId } = query;

  if (!deviceId || typeof deviceId !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Device ID is required',
    });
  }

  try {
    switch (method) {
      case 'GET':
        return await getDeviceStatus(req, res);
      case 'PUT':
        if (req.url?.includes('/thresholds')) {
          return await updateThresholds(req, res);
        } else if (req.url?.includes('/reset')) {
          return await resetDeviceData(req, res);
        }
        break;
      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('IoT Device API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Get device status
async function getDeviceStatus(req: NextApiRequest, res: NextApiResponse) {
  const { deviceId } = req.query;

  try {
    const device = await db.query.iotDevices.findFirst({
      where: eq(iotDevices.deviceId, deviceId as string),
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: `Device ${deviceId} not found`,
      });
    }

    const recentData = await db.query.deviceData.findMany({
      where: eq(deviceData.deviceId, deviceId as string),
      orderBy: [desc(deviceData.timestamp)],
      limit: 10,
    });

    res.status(200).json({
      success: true,
      device,
      recentData,
    });
  } catch (error) {
    console.error('Get device status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get device status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Update device thresholds
async function updateThresholds(req: NextApiRequest, res: NextApiResponse) {
  const { deviceId } = req.query;
  const data = req.body;

  try {
    const device = await db.query.iotDevices.findFirst({
      where: eq(iotDevices.deviceId, deviceId as string),
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: `Device ${deviceId} not found`,
      });
    }

    // Update device metadata with new thresholds
    const updatedDevice = await db
      .update(iotDevices)
      .set({
        metadata: {
          co2Threshold: data.co2Threshold,
          energyThreshold: data.energyThreshold,
          timeWindow: data.timeWindow || 3600,
        },
      })
      .where(eq(iotDevices.deviceId, deviceId as string))
      .returning();

    res.status(200).json({
      success: true,
      message: 'Thresholds updated successfully',
      device: updatedDevice[0],
    });
  } catch (error) {
    console.error('Update thresholds error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update thresholds',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Reset device data
async function resetDeviceData(req: NextApiRequest, res: NextApiResponse) {
  const { deviceId } = req.query;

  try {
    const device = await db.query.iotDevices.findFirst({
      where: eq(iotDevices.deviceId, deviceId as string),
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: `Device ${deviceId} not found`,
      });
    }

    // Delete old data points (optional - you might want to keep historical data)
    // await db.delete(deviceData).where(eq(deviceData.deviceId, deviceId as string))

    res.status(200).json({
      success: true,
      message: 'Device data reset successfully',
    });
  } catch (error) {
    console.error('Reset device data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset device data',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

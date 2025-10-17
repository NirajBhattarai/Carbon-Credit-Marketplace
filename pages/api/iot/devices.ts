import { NextApiRequest, NextApiResponse } from 'next';
import { db, iotDevices, eq, desc } from '@/lib/db';
import { authenticateApiKey } from '@/lib/auth/middleware';
import { RedisService } from '../../../lib/redis';

interface DeviceRegistrationPayload {
  deviceId: string;
  deviceType: 'SEQUESTER' | 'EMITTER';
  location: string;
  projectName: string;
  description?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    // Authenticate API key for all requests
    const authError = await authenticateApiKey(req as any);
    if (authError) {
      return res.status(authError.status).json(authError.body);
    }

    switch (method) {
      case 'POST':
        return await registerDevice(req, res);
      case 'GET':
        return await getAllDevices(req, res);
      case 'PUT':
        return await updateDevice(req, res);
      case 'DELETE':
        return await deleteDevice(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('IoT Devices API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Register a new IoT device
async function registerDevice(req: NextApiRequest, res: NextApiResponse) {
  const data: DeviceRegistrationPayload = req.body;
  const application = (req as any).application;

  try {
    // Validate required fields
    if (
      !data.deviceId ||
      !data.deviceType ||
      !data.location ||
      !data.projectName
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required fields: deviceId, deviceType, location, projectName',
      });
    }

    // Validate device type
    if (!['SEQUESTER', 'EMITTER'].includes(data.deviceType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid device type. Must be SEQUESTER or EMITTER',
      });
    }

    // Validate device ID format
    if (!/^[A-Za-z0-9_-]+$/.test(data.deviceId)) {
      return res.status(400).json({
        success: false,
        message:
          'Device ID can only contain letters, numbers, hyphens, and underscores',
      });
    }

    // Check if device already exists
    const existingDevice = await db.query.iotDevices.findFirst({
      where: eq(iotDevices.deviceId, data.deviceId),
    });

    if (existingDevice) {
      return res.status(409).json({
        success: false,
        message: 'Device already registered',
      });
    }

    // Create device
    const device = await db
      .insert(iotDevices)
      .values({
        deviceId: data.deviceId,
        applicationId: application.id,
        deviceType: data.deviceType,
        location: data.location,
        projectName: data.projectName,
        description: data.description || '',
        isActive: true,
        lastSeen: new Date(),
        metadata: {
          registrationSource: 'api',
          registrationTimestamp: new Date().toISOString(),
          applicationId: application.id,
          applicationName: application.name,
          deviceCapabilities:
            data.deviceType === 'SEQUESTER'
              ? ['co2_monitoring', 'energy_tracking', 'credit_generation']
              : ['co2_monitoring', 'energy_tracking', 'credit_burning'],
        },
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Device registered successfully',
      device: device[0],
    });
  } catch (error) {
    console.error('Device registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register device',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Get all devices
async function getAllDevices(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { deviceType, isActive } = req.query;
    const application = (req as any).application;

    // Create cache key from query parameters
    const cacheKey = JSON.stringify({
      applicationId: application.id,
      deviceType,
      isActive,
    });

    // Try to get from Redis cache first
    const cachedData = await RedisService.getDeviceList();
    if (cachedData) {
      console.log('📱 Returning cached device list');
      return res.status(200).json({
        success: true,
        devices: cachedData,
        count: cachedData.length,
        cached: true,
      });
    }

    console.log('📱 Cache miss - Querying devices from database...');

    // Build where conditions based on query parameters
    let whereCondition = eq(iotDevices.applicationId, application.id);

    if (deviceType && ['SEQUESTER', 'EMITTER'].includes(deviceType as string)) {
      whereCondition = eq(
        iotDevices.deviceType,
        deviceType as 'SEQUESTER' | 'EMITTER'
      );
    }

    if (isActive !== undefined) {
      const isActiveCondition = eq(iotDevices.isActive, isActive === 'true');
      if (whereCondition) {
        // For now, we'll handle one filter at a time
        // In a production app, you'd want to implement proper AND logic
        whereCondition = isActiveCondition;
      } else {
        whereCondition = isActiveCondition;
      }
    }

    const devices = await db.query.iotDevices.findMany({
      where: whereCondition,
      orderBy: [desc(iotDevices.createdAt)],
    });

    // Cache the result
    await RedisService.cacheDeviceList(devices);

    res.status(200).json({
      success: true,
      devices,
      count: devices.length,
      cached: false,
    });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get devices',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Update device
async function updateDevice(req: NextApiRequest, res: NextApiResponse) {
  const { deviceId } = req.query;
  const updateData = req.body;

  try {
    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID is required',
      });
    }

    // Check if device exists
    const existingDevice = await db.query.iotDevices.findFirst({
      where: eq(iotDevices.deviceId, deviceId as string),
    });

    if (!existingDevice) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      });
    }

    // Validate update data
    const allowedFields = [
      'location',
      'projectName',
      'description',
      'isActive',
    ];
    const updateFields: any = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateFields[field] = updateData[field];
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
      });
    }

    updateFields.updatedAt = new Date();

    // Update device
    const updatedDevice = await db
      .update(iotDevices)
      .set(updateFields)
      .where(eq(iotDevices.deviceId, deviceId as string))
      .returning();

    res.status(200).json({
      success: true,
      message: 'Device updated successfully',
      device: updatedDevice[0],
    });
  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update device',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Delete device
async function deleteDevice(req: NextApiRequest, res: NextApiResponse) {
  const { deviceId } = req.query;

  try {
    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID is required',
      });
    }

    // Check if device exists
    const existingDevice = await db.query.iotDevices.findFirst({
      where: eq(iotDevices.deviceId, deviceId as string),
    });

    if (!existingDevice) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      });
    }

    // Soft delete - set isActive to false instead of hard delete
    await db
      .update(iotDevices)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(iotDevices.deviceId, deviceId as string));

    res.status(200).json({
      success: true,
      message: 'Device deactivated successfully',
    });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete device',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

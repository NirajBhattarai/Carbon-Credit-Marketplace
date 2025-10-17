import { NextApiRequest, NextApiResponse } from 'next';
import { db, iotDevices, applications, users, eq, and } from '@/lib/db';

interface AutoCreateDevicePayload {
  deviceId: string;
  deviceType: 'SEQUESTER' | 'EMITTER';
  location: string;
  projectName: string;
  description?: string;
  apiKey: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data: AutoCreateDevicePayload = req.body;

    // Validate required fields
    if (!data.deviceId || !data.deviceType || !data.apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: deviceId, deviceType, apiKey',
      });
    }

    // Validate device type
    if (!['SEQUESTER', 'EMITTER'].includes(data.deviceType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid device type. Must be SEQUESTER or EMITTER',
      });
    }

    // Get wallet address from API key
    const application = await db
      .select({
        walletAddress: applications.walletAddress,
        applicationName: applications.name,
      })
      .from(applications)
      .where(eq(applications.apiKey, data.apiKey))
      .limit(1);

    if (application.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'API key not found',
      });
    }

    const { walletAddress, applicationName } = application[0];

    console.log(
      `🔍 Checking device existence for deviceId: ${data.deviceId}, wallet: ${walletAddress}`
    );
    console.log(
      `📱 Device ID source: ${data.deviceId} (should be MAC address)`
    );

    // Check if device already exists for this wallet address
    const existingDevice = await db
      .select()
      .from(iotDevices)
      .where(
        and(
          eq(iotDevices.deviceId, data.deviceId),
          eq(iotDevices.walletAddress, walletAddress)
        )
      )
      .limit(1);

    if (existingDevice.length > 0) {
      // Device already exists for this wallet, just update lastSeen
      console.log(
        `✅ Device already exists for wallet ${walletAddress}, updating lastSeen`
      );
      await db
        .update(iotDevices)
        .set({
          lastSeen: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(iotDevices.id, existingDevice[0].id));

      return res.status(200).json({
        success: true,
        message: 'Device already exists, updated lastSeen',
        device: existingDevice[0],
      });
    }

    // Check if deviceId is already used by a different wallet
    const conflictingDevice = await db
      .select()
      .from(iotDevices)
      .where(eq(iotDevices.deviceId, data.deviceId))
      .limit(1);

    if (conflictingDevice.length > 0) {
      // Device ID is already used by another wallet
      console.log(
        `❌ Device ID ${data.deviceId} already exists for wallet ${conflictingDevice[0].walletAddress}`
      );
      return res.status(409).json({
        success: false,
        message: 'Device ID already exists for a different wallet',
        conflictingWallet: conflictingDevice[0].walletAddress,
      });
    }

    // Create new device
    const device = await db
      .insert(iotDevices)
      .values({
        deviceId: data.deviceId,
        walletAddress: walletAddress,
        deviceType: data.deviceType,
        location: data.location || 'Unknown Location',
        projectName:
          data.projectName ||
          `Auto-created Device ${new Date().toISOString().split('T')[0]}`,
        description:
          data.description ||
          `Device auto-created from MQTT data on ${new Date().toISOString()}`,
        isActive: true,
        lastSeen: new Date(),
        metadata: {
          registrationSource: 'mqtt_auto_create',
          registrationTimestamp: new Date().toISOString(),
          walletAddress: walletAddress,
          applicationName: applicationName,
          deviceCapabilities:
            data.deviceType === 'SEQUESTER'
              ? ['co2_monitoring', 'energy_tracking', 'credit_generation']
              : ['co2_monitoring', 'energy_tracking', 'credit_burning'],
        },
      })
      .returning();

    console.log(
      `✅ Auto-created IoT device: ${device[0].id} for wallet: ${walletAddress} with MAC: ${data.deviceId}`
    );

    res.status(201).json({
      success: true,
      message: 'Device auto-created successfully',
      device: device[0],
    });
  } catch (error) {
    console.error('Auto-create device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-create device',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

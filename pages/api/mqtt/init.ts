import { NextApiRequest, NextApiResponse } from 'next';
import { mqttCarbonCreditHandler } from '../../../lib/mqtt/carbon-credit-handler';

/**
 * POST /api/mqtt/init - Initialize MQTT Carbon Credit Handler
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action } = req.body;

    if (action === 'test') {
      const { deviceId } = req.body;

      if (!deviceId) {
        return res
          .status(400)
          .json({ error: 'Device ID is required for test action' });
      }

      // Publish test message
      mqttCarbonCreditHandler.publishTestMessage(deviceId);

      return res.status(200).json({
        success: true,
        message: `Test message published for device ${deviceId}`,
        timestamp: new Date().toISOString(),
      });
    }

    // Return connection status
    const isConnected = mqttCarbonCreditHandler.getConnectionStatus();

    res.status(200).json({
      success: true,
      message: 'MQTT Carbon Credit Handler status',
      connected: isConnected,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('MQTT init error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize MQTT handler',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import { db, iotKeys, company, companyCredit, deviceCreditHistory, eq, and } from '@/lib/db';
import { IoTDataProcessor, IoTDataPayload } from '@/lib/services/iot-processor';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    switch (method) {
      case 'POST':
        return await receiveIoTData(req, res);
      case 'GET':
        return await healthCheck(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('IoT Data API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Receive IoT data
async function receiveIoTData(req: NextApiRequest, res: NextApiResponse) {
  const data = req.body;

  try {
    // Check if it's the new format with carbon credit data
    if (
      data.c !== undefined &&
      data.h !== undefined &&
      data.cr !== undefined &&
      data.e !== undefined
    ) {
      return await processCarbonCreditData(req, res);
    }

    // Legacy format validation (commented out since tables don't exist)
    /*
    if (
      !data.deviceId ||
      typeof data.co2Value !== 'number' ||
      typeof data.energyValue !== 'number'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: deviceId, co2Value, energyValue',
      });
    }

    // Check if device exists
    const device = await db.query.iotDevices.findFirst({
      where: eq(iotDevices.deviceId, data.deviceId),
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: `Device ${data.deviceId} not found`,
      });
    }

    // Store raw data
    const dataPoint = await db
      .insert(deviceData)
      .values({
        deviceId: data.deviceId,
        timestamp: new Date(data.timestamp || Date.now()),
        co2Value: data.co2Value.toString(),
        energyValue: data.energyValue.toString(),
        temperature: (data.temperature || 25.0).toString(),
        humidity: (data.humidity || 50.0).toString(),
        dataHash: generateDataHash(data),
        verified: false,
      })
      .returning();

    // Update device last seen
    await db
      .update(iotDevices)
      .set({ lastSeen: new Date() })
      .where(eq(iotDevices.deviceId, data.deviceId));

    res.status(201).json({
      success: true,
      message: 'Data processed successfully',
      timestamp: new Date().toISOString(),
      dataPointId: dataPoint[0].id,
    });
    */
    
    // For now, return error for legacy format since tables don't exist
    return res.status(400).json({
      success: false,
      message: 'Legacy format not supported. Please use the new carbon credit format with apiKey.',
    });
  } catch (error) {
    console.error('Data processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process data',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Process carbon credit data format: {"c":1810,"h":64,"cr":905.0,"e":12.8,"o":true,"t":452787}
async function processCarbonCreditData(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { deviceId, apiKey, ...payload } = req.body;

  try {
    // Validate required fields
    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: deviceId',
      });
    }

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: apiKey',
      });
    }

    // Validate API key and get company
    const apiKeyData = await db
      .select({
        keyId: iotKeys.keyId,
        keyValue: iotKeys.keyValue,
        companyId: iotKeys.companyId,
        companyName: company.companyName,
        walletAddress: company.walletAddress,
      })
      .from(iotKeys)
      .innerJoin(company, eq(iotKeys.companyId, company.companyId))
      .where(eq(iotKeys.keyValue, apiKey))
      .limit(1);

    if (apiKeyData.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key',
      });
    }

    const { companyId, companyName, walletAddress } = apiKeyData[0];

    // Validate payload format
    const iotPayload: IoTDataPayload = {
      c: payload.c || 0,
      h: payload.h || 0,
      cr: payload.cr || 0,
      e: payload.e || 0,
      o: payload.o || false,
      t: payload.t || Math.floor(Date.now() / 1000),
    };

    // Check if device exists and belongs to the company
    // For now, we'll assume the device exists if the API key is valid
    // In a real implementation, you'd have a devices table linked to companies

    // Process the IoT data and update company credits
    const processedData = await processCompanyCredits(
      deviceId,
      iotPayload,
      companyId,
      companyName
    );

    // Update device last seen (commented out since iotDevices table doesn't exist)
    // await db
    //   .update(iotDevices)
    //   .set({ lastSeen: new Date() })
    //   .where(eq(iotDevices.deviceId, deviceId));

    res.status(201).json({
      success: true,
      message: 'Carbon credit data processed successfully',
      timestamp: new Date().toISOString(),
      company: companyName,
      processedData: {
        credits: processedData.credits,
        co2Reduced: processedData.co2Reduced,
        energySaved: processedData.energySaved,
        isOnline: processedData.isOnline,
      },
    });
  } catch (error) {
    console.error('Carbon credit data processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process carbon credit data',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Process company credits from IoT data
async function processCompanyCredits(
  deviceId: string,
  payload: IoTDataPayload,
  companyId: number,
  companyName: string
) {
  // Calculate credits from the payload
  const credits = payload.c || 0;
  const co2Reduced = payload.cr || 0;
  const energySaved = payload.e || 0;
  const temperatureImpact = 0; // Calculate based on humidity if needed
  const humidityImpact = payload.h || 0;
  const isOnline = payload.o || false;

  // Get or create company credit record
  let companyCreditRecord = await db
    .select()
    .from(companyCredit)
    .where(eq(companyCredit.companyId, companyId))
    .limit(1);

  if (companyCreditRecord.length === 0) {
    // Create new company credit record
    const [newCredit] = await db
      .insert(companyCredit)
      .values({
        companyId,
        totalCredit: credits.toString(),
        currentCredit: credits.toString(),
        soldCredit: '0.00',
      })
      .returning();
    companyCreditRecord = [newCredit];
  } else {
    // Update existing company credit record
    const currentTotal = parseFloat(companyCreditRecord[0].totalCredit);
    const currentCurrent = parseFloat(companyCreditRecord[0].currentCredit);
    
    const newTotal = currentTotal + credits;
    const newCurrent = currentCurrent + credits;

    await db
      .update(companyCredit)
      .set({
        totalCredit: newTotal.toString(),
        currentCredit: newCurrent.toString(),
      })
      .where(eq(companyCredit.companyId, companyId));

    companyCreditRecord[0].totalCredit = newTotal.toString();
    companyCreditRecord[0].currentCredit = newCurrent.toString();
  }

  // Add to device credit history
  await db.insert(deviceCreditHistory).values({
    deviceId: parseInt(deviceId) || 0, // Assuming deviceId can be converted to integer
    sequesteredCredits: credits.toString(),
    timeIntervalStart: new Date(payload.t * 1000),
    timeIntervalEnd: new Date(),
  });

  console.log(`💰 Company ${companyName} earned ${credits} credits from device ${deviceId}`);

  return {
    credits,
    co2Reduced,
    energySaved,
    temperatureImpact,
    humidityImpact,
    isOnline,
    timestamp: new Date(payload.t * 1000).toISOString(),
  };
}

// Health check
async function healthCheck(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test database connection
    await db.execute('SELECT 1');

    res.status(200).json({
      success: true,
      message: 'IoT Data API service is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Service unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import {
  db,
  userCarbonCredits,
  userCreditHistory,
  users,
} from '../../../lib/db';
import { eq, desc, sum, avg } from 'drizzle-orm';
import {
  RedisService,
  CarbonCreditData,
  DashboardData,
} from '../../../lib/redis';
import { authenticateJWT } from '../../../lib/auth/middleware';

interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string;
    walletAddress: string;
  };
}

/**
 * GET /api/user/credits - Get user's carbon credits
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    return handleGetCredits(req as AuthenticatedRequest, res);
  } else if (req.method === 'POST') {
    return handleAddCredits(req as AuthenticatedRequest, res);
  } else if (req.method === 'PUT') {
    return handleUpdateCredits(req as AuthenticatedRequest, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * Get user's carbon credits (with Redis caching)
 */
async function handleGetCredits(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  try {
    // Authenticate user
    const authResult = await authenticateJWT(req);
    if (!authResult) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user!.id;

    // Try to get from Redis cache first
    const cachedCredits = await RedisService.getUserCredits(userId);
    if (cachedCredits) {
      return res.status(200).json({
        success: true,
        data: cachedCredits,
        cached: true,
      });
    }

    // If not in cache, get from database
    const userCredits = await db
      .select()
      .from(userCarbonCredits)
      .where(eq(userCarbonCredits.userId, userId))
      .orderBy(desc(userCarbonCredits.updatedAt))
      .limit(1);

    if (userCredits.length === 0) {
      // Create initial record if user doesn't have credits yet
      const initialCredits: CarbonCreditData = {
        credits: 0,
        co2Reduced: 0,
        energySaved: 0,
        temperatureImpact: 0,
        humidityImpact: 0,
        isOnline: false,
        timestamp: new Date().toISOString(),
      };

      await db.insert(userCarbonCredits).values({
        userId,
        ...initialCredits,
      });

      // Cache the initial data
      await RedisService.cacheUserCredits(userId, initialCredits);

      return res.status(200).json({
        success: true,
        data: initialCredits,
        cached: false,
      });
    }

    const creditsData = userCredits[0];
    const creditsResponse: CarbonCreditData = {
      credits: parseFloat(creditsData.credits),
      co2Reduced: parseFloat(creditsData.co2Reduced),
      energySaved: parseFloat(creditsData.energySaved),
      temperatureImpact: parseFloat(creditsData.temperatureImpact),
      humidityImpact: parseFloat(creditsData.humidityImpact),
      isOnline: creditsData.isOnline,
      timestamp: creditsData.timestamp.toISOString(),
    };

    // Cache the data
    await RedisService.cacheUserCredits(userId, creditsResponse);

    res.status(200).json({
      success: true,
      data: creditsResponse,
      cached: false,
    });
  } catch (error) {
    console.error('Error getting user credits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Add new credits to user's account
 */
async function handleAddCredits(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  try {
    // Authenticate user
    const authResult = await authenticateJWT(req);
    if (!authResult) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user!.id;
    const {
      creditsEarned,
      co2Reduced,
      energySaved,
      temperatureImpact,
      humidityImpact,
      source = 'MANUAL',
      sourceId,
      metadata,
    } = req.body;

    // Validate required fields
    if (!creditsEarned || !co2Reduced || !energySaved) {
      return res.status(400).json({
        error:
          'Missing required fields: creditsEarned, co2Reduced, energySaved',
      });
    }

    // Get current credits
    const currentCredits = await db
      .select()
      .from(userCarbonCredits)
      .where(eq(userCarbonCredits.userId, userId))
      .orderBy(desc(userCarbonCredits.updatedAt))
      .limit(1);

    const currentData = currentCredits[0] || {
      credits: '0',
      co2Reduced: '0',
      energySaved: '0',
      temperatureImpact: '0',
      humidityImpact: '0',
      isOnline: false,
    };

    // Calculate new totals
    const newCredits =
      parseFloat(currentData.credits) + parseFloat(creditsEarned);
    const newCo2Reduced =
      parseFloat(currentData.co2Reduced) + parseFloat(co2Reduced);
    const newEnergySaved =
      parseFloat(currentData.energySaved) + parseFloat(energySaved);
    const newTemperatureImpact =
      parseFloat(currentData.temperatureImpact) +
      parseFloat(temperatureImpact || '0');
    const newHumidityImpact =
      parseFloat(currentData.humidityImpact) +
      parseFloat(humidityImpact || '0');

    // Update or insert user credits
    await db
      .insert(userCarbonCredits)
      .values({
        userId,
        credits: newCredits.toString(),
        co2Reduced: newCo2Reduced.toString(),
        energySaved: newEnergySaved.toString(),
        temperatureImpact: newTemperatureImpact.toString(),
        humidityImpact: newHumidityImpact.toString(),
        isOnline: true,
      })
      .onConflictDoNothing();

    // Add to credit history
    await db.insert(userCreditHistory).values({
      userId,
      creditsEarned: creditsEarned.toString(),
      co2Reduced: co2Reduced.toString(),
      energySaved: energySaved.toString(),
      temperatureImpact: (temperatureImpact || '0').toString(),
      humidityImpact: (humidityImpact || '0').toString(),
      source,
      sourceId,
      metadata,
    });

    // Update Redis cache
    const updatedCredits: CarbonCreditData = {
      credits: newCredits,
      co2Reduced: newCo2Reduced,
      energySaved: newEnergySaved,
      temperatureImpact: newTemperatureImpact,
      humidityImpact: newHumidityImpact,
      isOnline: true,
      timestamp: new Date().toISOString(),
    };

    await RedisService.cacheUserCredits(userId, updatedCredits);

    // Add to Redis history
    await RedisService.addCreditHistory(userId, {
      creditsEarned: parseFloat(creditsEarned),
      co2Reduced: parseFloat(co2Reduced),
      energySaved: parseFloat(energySaved),
      temperatureImpact: parseFloat(temperatureImpact || '0'),
      humidityImpact: parseFloat(humidityImpact || '0'),
      source,
      sourceId,
      timestamp: new Date().toISOString(),
    });

    // Update leaderboard
    await RedisService.updateLeaderboard(userId, newCredits);

    // Invalidate dashboard cache
    await RedisService.invalidateUserCache(userId);

    res.status(200).json({
      success: true,
      data: {
        creditsAdded: parseFloat(creditsEarned),
        newTotal: newCredits,
        message: 'Credits added successfully',
      },
    });
  } catch (error) {
    console.error('Error adding credits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Update user's credits (for IoT device data)
 */
async function handleUpdateCredits(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  try {
    // Authenticate user
    const authResult = await authenticateJWT(req);
    if (!authResult) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user!.id;
    const {
      credits,
      co2Reduced,
      energySaved,
      temperatureImpact,
      humidityImpact,
      isOnline,
    } = req.body;

    // Validate required fields
    if (
      credits === undefined ||
      co2Reduced === undefined ||
      energySaved === undefined
    ) {
      return res.status(400).json({
        error: 'Missing required fields: credits, co2Reduced, energySaved',
      });
    }

    // Update user credits
    await db
      .insert(userCarbonCredits)
      .values({
        userId,
        credits: credits.toString(),
        co2Reduced: co2Reduced.toString(),
        energySaved: energySaved.toString(),
        temperatureImpact: (temperatureImpact || '0').toString(),
        humidityImpact: (humidityImpact || '0').toString(),
        isOnline: isOnline || false,
      })
      .onConflictDoNothing();

    // Update Redis cache
    const updatedCredits: CarbonCreditData = {
      credits: parseFloat(credits),
      co2Reduced: parseFloat(co2Reduced),
      energySaved: parseFloat(energySaved),
      temperatureImpact: parseFloat(temperatureImpact || '0'),
      humidityImpact: parseFloat(humidityImpact || '0'),
      isOnline: isOnline || false,
      timestamp: new Date().toISOString(),
    };

    await RedisService.cacheUserCredits(userId, updatedCredits);

    // Update leaderboard
    await RedisService.updateLeaderboard(userId, parseFloat(credits));

    // Invalidate dashboard cache
    await RedisService.invalidateUserCache(userId);

    res.status(200).json({
      success: true,
      data: updatedCredits,
      message: 'Credits updated successfully',
    });
  } catch (error) {
    console.error('Error updating credits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

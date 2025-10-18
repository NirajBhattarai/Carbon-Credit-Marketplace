import { NextApiRequest, NextApiResponse } from 'next';
import { db, applications, apiKeys, usertable } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { RedisService } from '../../../lib/redis';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { apiKey } = req.query;

  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(400).json({ error: 'API key is required' });
  }

  try {
    // Try to get from Redis cache first
    const cachedData = await RedisService.getWalletAddress(apiKey);
    if (cachedData) {
      console.log('🔑 Returning cached wallet address data');
      return res.status(200).json({
        success: true,
        data: cachedData,
        cached: true,
      });
    }

    console.log('🔑 Cache miss - Querying wallet address from database...');

    // Extract the prefix from the full API key (format: cc_prefix)
    const apiKeyPrefix = apiKey.startsWith('cc_') ? apiKey.substring(3) : apiKey;

    // Query database to get wallet address from API key using the new schema
    const result = await db
      .select({
        walletAddress: usertable.walletAddress,
        username: `user_${usertable.walletAddress.slice(0, 8)}`,
        applicationName: applications.name,
        applicationId: applications.id,
        apiKeyId: apiKeys.id,
        apiKeyName: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        apiKeyStatus: apiKeys.status,
      })
      .from(apiKeys)
      .innerJoin(applications, eq(apiKeys.applicationId, applications.id))
      .innerJoin(usertable, eq(applications.walletAddress, usertable.walletAddress))
      .where(eq(apiKeys.keyPrefix, apiKeyPrefix))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'API key not found',
      });
    }

    const { walletAddress, username, applicationName, applicationId, apiKeyId, apiKeyName, keyPrefix, apiKeyStatus } =
      result[0];

    const responseData = {
      walletAddress,
      username,
      applicationName,
      applicationId,
      apiKeyId,
      apiKeyName,
      keyPrefix,
      apiKeyStatus,
      fullApiKey: apiKey,
    };

    // Cache the result
    await RedisService.cacheWalletAddress(apiKey, responseData);

    return res.status(200).json({
      success: true,
      data: responseData,
      cached: false,
    });
  } catch (error) {
    console.error('Error fetching wallet address:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

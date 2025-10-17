import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { applications } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateJWTPages } from '@/lib/auth/middleware';
import { generateApiKey, generateApiKeyJWT } from '@/lib/auth/jwt';
import { RedisService } from '../../../lib/redis';

/**
 * GET /api/developer/applications
 * Get all applications for the authenticated user
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      console.log(`[Applications API] GET request - fetching applications`);

      const authError = await authenticateJWTPages(req);
      if (authError) {
        console.log(`[Applications API] Authentication failed:`, authError);
        return res.status(authError.status).json(authError.data);
      }

      const walletAddress = (req as any).user.walletAddress;
      console.log(
        `[Applications API] Fetching applications for wallet:`,
        walletAddress
      );

      // Try to get from Redis cache first
      const cachedData = await RedisService.getApplicationList(walletAddress);
      if (cachedData) {
        console.log(
          `[Applications API] Returning cached applications for wallet:`,
          walletAddress
        );
        return res.status(200).json({
          success: true,
          applications: cachedData,
          cached: true,
        });
      }

      console.log(
        `[Applications API] Cache miss - Querying applications from database...`
      );

      // Fetch applications from database
      const userApplications = await db
        .select()
        .from(applications)
        .where(eq(applications.walletAddress, walletAddress))
        .orderBy(applications.createdAt);

      console.log(
        `[Applications API] Found ${userApplications.length} applications`
      );

      // Cache the result
      await RedisService.cacheApplicationList(walletAddress, userApplications);

      return res.status(200).json({
        success: true,
        applications: userApplications,
        cached: false,
      });
    } catch (error) {
      console.error(`[Applications API] GET error:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      return res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  if (req.method === 'POST') {
    try {
      console.log(`[Applications API] POST request - creating application`);
      console.log(`[Applications API] Request body:`, req.body);

      const authError = await authenticateJWTPages(req);
      if (authError) {
        console.log(`[Applications API] Authentication failed:`, authError);
        return res.status(authError.status).json(authError.data);
      }

      const walletAddress = (req as any).user.walletAddress;
      const { name, description, website } = req.body;

      console.log(
        `[Applications API] Creating application for wallet:`,
        walletAddress
      );

      if (!name) {
        console.log(`[Applications API] Missing required field: name`);
        return res.status(400).json({
          error: 'Application name is required',
        });
      }

      // Generate API key automatically
      console.log(`[Applications API] Generating API key...`);
      const { key } = generateApiKey();

      // Create application in database with API key
      const applicationData: any = {
        walletAddress,
        name,
        description: description || null,
        website: website || null,
        status: 'ACTIVE',
        apiKey: key,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newApplication = await db
        .insert(applications)
        .values(applicationData)
        .returning();

      console.log(
        `[Applications API] Application created with ID: ${newApplication[0].id} and API key: ${key.substring(0, 8)}...`
      );

      // Generate JWT token for the API key
      console.log(`[Applications API] Generating JWT token...`);
      const token = generateApiKeyJWT({
        applicationId: newApplication[0].id,
        walletAddress,
        permissions: ['read:devices', 'write:devices'],
      });

      const response: any = {
        success: true,
        application: newApplication[0],
        apiKey: {
          key,
          token,
          name: `${name} API Key`,
          permissions: ['read:devices', 'write:devices'],
        },
      };

      return res.status(201).json(response);
    } catch (error) {
      console.error(`[Applications API] POST error:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        requestBody: req.body,
      });
      return res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

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

      const userId = (req as any).user.id;
      console.log(`[Applications API] Fetching applications for user:`, userId);

      // Try to get from Redis cache first
      const cachedData = await RedisService.getApplicationList(userId);
      if (cachedData) {
        console.log(
          `[Applications API] Returning cached applications for user:`,
          userId
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
        .where(eq(applications.userId, userId))
        .orderBy(applications.createdAt);

      console.log(
        `[Applications API] Found ${userApplications.length} applications`
      );

      // Cache the result
      await RedisService.cacheApplicationList(userId, userApplications);

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

      const userId = (req as any).user.id;
      const { name, description, website } = req.body;

      console.log(`[Applications API] Creating application for user:`, userId);

      if (!name) {
        console.log(`[Applications API] Missing required field: name`);
        return res.status(400).json({
          error: 'Application name is required',
        });
      }

      // Create application in database with automatic API key generation
      console.log(`[Applications API] Generating API key for application`);
      const { key } = generateApiKey();

      const applicationData: any = {
        userId,
        name,
        description: description || null,
        website: website || null,
        status: 'ACTIVE',
        // Single API key field
        apiKey: key,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newApplication = await db
        .insert(applications)
        .values(applicationData)
        .returning();

      console.log(
        `[Applications API] Application created with ID: ${newApplication[0].id}`
      );

      // Generate JWT token for the API key
      console.log(`[Applications API] Generating JWT token...`);
      const token = generateApiKeyJWT({
        applicationId: newApplication[0].id,
        userId,
        permissions: ['read:devices', 'write:devices'],
      });

      const response: any = {
        success: true,
        application: newApplication[0],
        apiKey: {
          key: newApplication[0].apiKey,
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

  if (req.method === 'PUT') {
    try {
      console.log(
        `[Applications API] PUT request - creating API key for application`
      );
      console.log(`[Applications API] Request body:`, req.body);

      const authError = await authenticateJWTPages(req);
      if (authError) {
        console.log(`[Applications API] Authentication failed:`, authError);
        return res.status(authError.status).json(authError.data);
      }

      const userId = (req as any).user.id;
      const { applicationId, name, expiresInDays, permissions } = req.body;

      console.log(
        `[Applications API] Creating API key for application:`,
        applicationId
      );

      if (!applicationId) {
        console.log(`[Applications API] Missing required field: applicationId`);
        return res.status(400).json({
          error: 'Application ID is required',
        });
      }

      // Verify the application belongs to the user
      const application = await db
        .select()
        .from(applications)
        .where(
          and(
            eq(applications.id, applicationId),
            eq(applications.userId, userId)
          )
        )
        .limit(1);

      console.log(
        `[Applications API] Application query result:`,
        application.length > 0 ? 'found' : 'not found'
      );

      if (application.length === 0) {
        console.log(
          `[Applications API] Application not found - ID: ${applicationId}, User: ${userId}`
        );
        return res.status(404).json({ error: 'Application not found' });
      }

      // Check if application already has an API key
      if (application[0].apiKey) {
        console.log(`[Applications API] Application already has an API key`);
        return res
          .status(400)
          .json({ error: 'Application already has an API key' });
      }

      console.log(`[Applications API] Generating API key...`);
      const { key } = generateApiKey();

      console.log(`[Applications API] Updating application with API key...`);
      const updatedApplication = await db
        .update(applications)
        .set({
          apiKey: key,
          updatedAt: new Date(),
        })
        .where(eq(applications.id, applicationId))
        .returning();

      console.log(
        `[Applications API] API key created for application: ${applicationId}`
      );

      // Generate JWT token for the API key
      console.log(`[Applications API] Generating JWT token...`);
      const token = generateApiKeyJWT({
        applicationId,
        userId,
        permissions: permissions || ['read:devices', 'write:devices'],
      });

      return res.status(200).json({
        success: true,
        apiKey: {
          key,
          token,
          name: `${application[0].name} API Key`,
          permissions: permissions || ['read:devices', 'write:devices'],
        },
      });
    } catch (error) {
      console.error(`[Applications API] PUT error:`, {
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

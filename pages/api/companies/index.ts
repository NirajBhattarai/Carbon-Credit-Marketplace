import { NextApiRequest, NextApiResponse } from 'next';
import { db, applications, apiKeys, iotDevices, usertable } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Companies API] Fetching all companies with applications, API keys, and devices');

    // Get all applications with their users (companies)
    const applicationsWithUsers = await db
      .select({
        applicationId: applications.id,
        applicationName: applications.name,
        applicationDescription: applications.description,
        applicationWebsite: applications.website,
        applicationStatus: applications.status,
        applicationCreatedAt: applications.createdAt,
        walletAddress: applications.walletAddress,
        username: `user_${usertable.walletAddress.slice(0, 8)}`,
        userEmail: null,
        userRole: 'USER',
      })
      .from(applications)
      .innerJoin(usertable, eq(applications.walletAddress, usertable.walletAddress))
      .orderBy(desc(applications.createdAt));

    // Get all API keys
    const allApiKeys = await db
      .select({
        apiKeyId: apiKeys.id,
        applicationId: apiKeys.applicationId,
        apiKeyName: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        status: apiKeys.status,
        lastUsed: apiKeys.lastUsed,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .orderBy(desc(apiKeys.createdAt));

    // Get all devices
    const allDevices = await db
      .select({
        deviceId: iotDevices.deviceId,
        walletAddress: iotDevices.walletAddress,
        deviceType: iotDevices.deviceType,
        location: iotDevices.location,
        projectName: iotDevices.projectName,
        description: iotDevices.description,
        isActive: iotDevices.isActive,
        lastSeen: iotDevices.lastSeen,
        createdAt: iotDevices.createdAt,
      })
      .from(iotDevices)
      .orderBy(desc(iotDevices.createdAt));

    // Group data by company (wallet address)
    const companiesMap = new Map();

    // Process applications and group by company
    applicationsWithUsers.forEach(app => {
      const walletAddress = app.walletAddress;
      
      if (!companiesMap.has(walletAddress)) {
        companiesMap.set(walletAddress, {
          walletAddress,
          username: app.username,
          email: app.userEmail,
          role: app.userRole,
          applications: [],
          totalApiKeys: 0,
          totalDevices: 0,
        });
      }

      const company = companiesMap.get(walletAddress);
      
      // Get API keys for this application
      const appApiKeys = allApiKeys.filter(key => key.applicationId === app.applicationId);
      
      // Get devices for this company
      const companyDevices = allDevices.filter(device => device.walletAddress === walletAddress);

      company.applications.push({
        id: app.applicationId,
        name: app.applicationName,
        description: app.applicationDescription,
        website: app.applicationWebsite,
        status: app.applicationStatus,
        createdAt: app.applicationCreatedAt,
        apiKeys: appApiKeys,
        deviceCount: companyDevices.length,
      });

      company.totalApiKeys += appApiKeys.length;
      company.totalDevices += companyDevices.length;
    });

    // Convert map to array and add device details
    const companies = Array.from(companiesMap.values()).map(company => {
      const companyDevices = allDevices.filter(device => device.walletAddress === company.walletAddress);
      
      return {
        ...company,
        devices: companyDevices,
        totalApplications: company.applications.length,
      };
    });

    console.log(`[Companies API] Found ${companies.length} companies`);

    return res.status(200).json({
      success: true,
      companies,
      totalCompanies: companies.length,
      totalApplications: applicationsWithUsers.length,
      totalApiKeys: allApiKeys.length,
      totalDevices: allDevices.length,
    });

  } catch (error) {
    console.error('[Companies API] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

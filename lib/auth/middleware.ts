import { NextRequest, NextResponse } from 'next/server';
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyJWT, verifyApiKeyJWT, extractTokenFromHeader } from './jwt';
import { db } from '@/lib/db';
import { users, applications } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    walletAddress: string;
    role: string;
  };
  application?: {
    id: string;
    userId: string;
    name: string;
  };
}

export interface AuthenticatedApiRequest extends NextApiRequest {
  user?: {
    id: string;
    walletAddress: string;
    role: string;
  };
  application?: {
    id: string;
    userId: string;
    name: string;
  };
}

/**
 * Middleware to authenticate JWT tokens
 */
export async function authenticateJWT(
  request: NextRequest
): Promise<NextResponse | null> {
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader || undefined);

  if (!token) {
    return NextResponse.json(
      { error: 'Authorization token required' },
      { status: 401 }
    );
  }

  const payload = verifyJWT(token);
  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  // Verify user exists in database, create if not found
  let user = await db
    .select()
    .from(users)
    .where(eq(users.walletAddress, payload.walletAddress))
    .limit(1);

  if (user.length === 0) {
    // Create user if they don't exist
    try {
      const newUser = await db
        .insert(users)
        .values({
          walletAddress: payload.walletAddress,
          username: `user_${payload.walletAddress.slice(0, 8)}`,
          role: (payload.role as 'USER' | 'DEVELOPER' | 'ADMIN') || 'USER',
          isVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      user = newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }
  }

  // Add user info to request
  (request as AuthenticatedRequest).user = {
    id: payload.userId,
    walletAddress: payload.walletAddress,
    role: payload.role,
  };

  return null;
}

/**
 * Middleware to authenticate API keys
 */
export async function authenticateApiKey(
  request: NextRequest
): Promise<NextResponse | null> {
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader || undefined);

  if (!token) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }

  const payload = verifyApiKeyJWT(token);
  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired API key' },
      { status: 401 }
    );
  }

  // Verify application exists and is active
  const application = await db
    .select({
      id: applications.id,
      walletAddress: applications.walletAddress,
      name: applications.name,
      status: applications.status,
      apiKey: applications.apiKey,
    })
    .from(applications)
    .where(eq(applications.id, payload.applicationId))
    .limit(1);

  if (application.length === 0) {
    return NextResponse.json(
      { error: 'Application not found' },
      { status: 401 }
    );
  }

  const app = application[0];

  // Check if application is active
  if (app.status !== 'ACTIVE') {
    return NextResponse.json(
      { error: 'Application is not active' },
      { status: 401 }
    );
  }

  // Add application info to request
  (request as AuthenticatedRequest).application = {
    id: app.id,
    userId: app.walletAddress,
    name: app.name,
  };

  return null;
}

/**
 * Middleware to require specific user roles
 */
export function requireRole(roles: string[]) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const authError = await authenticateJWT(request);
    if (authError) return authError;

    const user = (request as AuthenticatedRequest).user;
    if (!user || !roles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return null;
  };
}

/**
 * Middleware to require developer role
 */
export function requireDeveloper(
  request: NextRequest
): Promise<NextResponse | null> {
  return requireRole(['DEVELOPER', 'ADMIN'])(request);
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(
  request: NextRequest
): Promise<NextResponse | null> {
  return requireRole(['ADMIN'])(request);
}

/**
 * Helper function to get authenticated user from request
 */
export function getAuthenticatedUser(request: NextRequest) {
  return (request as AuthenticatedRequest).user;
}

/**
 * Helper function to get authenticated application from request
 */
export function getAuthenticatedApplication(request: NextRequest) {
  return (request as AuthenticatedRequest).application;
}

// Pages Router compatible authentication functions

/**
 * Middleware to authenticate JWT tokens for Pages Router
 */
export async function authenticateJWTPages(
  request: NextApiRequest
): Promise<{ status: number; data: any } | null> {
  console.log(`[Auth Middleware] Starting authentication...`);
  const authHeader = request.headers.authorization;
  console.log(
    `[Auth Middleware] Authorization header:`,
    authHeader ? 'Bearer ***' : 'none'
  );

  const token = extractTokenFromHeader(authHeader);
  console.log(
    `[Auth Middleware] Extracted token:`,
    token ? 'present' : 'missing'
  );

  if (!token) {
    console.log(`[Auth Middleware] No token found in authorization header`);
    return {
      status: 401,
      data: { error: 'Authorization token required' },
    };
  }

  console.log(`[Auth Middleware] Verifying JWT token...`);
  const payload = verifyJWT(token);
  if (!payload) {
    console.log(`[Auth Middleware] JWT verification failed`);
    return {
      status: 401,
      data: { error: 'Invalid or expired token' },
    };
  }

  console.log(
    `[Auth Middleware] JWT verified successfully for user:`,
    payload.userId
  );

  // Verify user exists in database, create if not found
  console.log(
    `[Auth Middleware] Looking up user in database:`,
    payload.walletAddress
  );
  let user = await db
    .select()
    .from(users)
    .where(eq(users.walletAddress, payload.walletAddress))
    .limit(1);

  if (user.length === 0) {
    console.log(
      `[Auth Middleware] User not found, creating new user:`,
      payload.walletAddress
    );
    // Create user if they don't exist
    try {
      const newUser = await db
        .insert(users)
        .values({
          walletAddress: payload.walletAddress,
          username: `user_${payload.walletAddress.slice(0, 8)}`,
          role: (payload.role as 'USER' | 'DEVELOPER' | 'ADMIN') || 'USER',
          isVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      console.log(
        `[Auth Middleware] User created successfully:`,
        newUser[0].walletAddress
      );
      user = newUser;
    } catch (error) {
      console.error(`[Auth Middleware] Error creating user:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: payload.userId,
        walletAddress: payload.walletAddress,
      });
      return {
        status: 500,
        data: { error: 'Failed to create user' },
      };
    }
  } else {
    console.log(
      `[Auth Middleware] User found in database:`,
      user[0].walletAddress
    );
  }

  // Add user info to request
  (request as AuthenticatedApiRequest).user = {
    id: payload.userId,
    walletAddress: payload.walletAddress,
    role: payload.role,
  };

  return null;
}

/**
 * Middleware to authenticate API keys for Pages Router
 */
export async function authenticateApiKeyPages(
  request: NextApiRequest
): Promise<{ status: number; data: any } | null> {
  console.log(`[API Key Auth] Starting API key authentication...`);
  const authHeader = request.headers.authorization;
  console.log(
    `[API Key Auth] Authorization header:`,
    authHeader ? 'Bearer ***' : 'none'
  );

  const token = extractTokenFromHeader(authHeader);
  console.log(`[API Key Auth] Extracted token:`, token ? 'present' : 'missing');

  if (!token) {
    console.log(`[API Key Auth] No token found in authorization header`);
    return {
      status: 401,
      data: { error: 'API key required' },
    };
  }

  console.log(`[API Key Auth] Verifying API key JWT token...`);
  const payload = verifyApiKeyJWT(token);
  if (!payload) {
    console.log(`[API Key Auth] API key JWT verification failed`);
    return {
      status: 401,
      data: { error: 'Invalid or expired API key' },
    };
  }

  console.log(
    `[API Key Auth] API key JWT verified successfully for application:`,
    payload.applicationId
  );

  // Verify application exists and is active
  console.log(
    `[API Key Auth] Looking up application in database:`,
    payload.applicationId
  );
  const application = await db
    .select({
      id: applications.id,
      walletAddress: applications.walletAddress,
      name: applications.name,
      status: applications.status,
      apiKey: applications.apiKey,
    })
    .from(applications)
    .where(eq(applications.id, payload.applicationId))
    .limit(1);

  if (application.length === 0) {
    console.log(`[API Key Auth] Application not found in database`);
    return {
      status: 401,
      data: { error: 'Application not found' },
    };
  }

  const app = application[0];
  console.log(`[API Key Auth] Application found:`, app.id);

  // Check if application is active
  if (app.status !== 'ACTIVE') {
    console.log(`[API Key Auth] Application is not active:`, app.status);
    return {
      status: 401,
      data: { error: 'Application is not active' },
    };
  }

  console.log(
    `[API Key Auth] Application authentication successful for application:`,
    app.name
  );

  // Add application info to request
  (request as AuthenticatedApiRequest).application = {
    id: app.id,
    userId: app.walletAddress,
    name: app.name,
  };

  return null;
}

/**
 * Helper function to get authenticated user from Pages Router request
 */
export function getAuthenticatedUserPages(request: NextApiRequest) {
  return (request as AuthenticatedApiRequest).user;
}

/**
 * Helper function to get authenticated application from Pages Router request
 */
export function getAuthenticatedApplicationPages(request: NextApiRequest) {
  return (request as AuthenticatedApiRequest).application;
}

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET =
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  walletAddress: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface ApiKeyPayload {
  applicationId: string;
  userId: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

/**
 * Generate a JWT token for user authentication
 */
export function generateJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'carbon-credit-marketplace',
    audience: 'carbon-credit-marketplace-users',
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'carbon-credit-marketplace',
      audience: 'carbon-credit-marketplace-users',
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Generate an API key with prefix and hash
 */
export function generateApiKey(): {
  key: string;
  hash: string;
  prefix: string;
} {
  const randomBytes = crypto.randomBytes(32);
  const key = `cc_${randomBytes.toString('hex')}`;
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const prefix = key.substring(0, 8);

  return { key, hash, prefix };
}

/**
 * Generate a JWT token for API key authentication
 */
export function generateApiKeyJWT(
  payload: Omit<ApiKeyPayload, 'iat' | 'exp'>
): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '30d',
    issuer: 'carbon-credit-marketplace',
    audience: 'carbon-credit-marketplace-api',
  });
}

/**
 * Verify API key JWT token
 */
export function verifyApiKeyJWT(token: string): ApiKeyPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'carbon-credit-marketplace',
      audience: 'carbon-credit-marketplace-api',
    }) as ApiKeyPayload;

    return decoded;
  } catch (error) {
    console.error('API Key JWT verification failed:', error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(
  authHeader: string | undefined
): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
}

/**
 * Generate a signature for wallet authentication
 */
export function generateWalletSignature(
  message: string,
  privateKey: string
): string {
  return crypto.createHmac('sha256', privateKey).update(message).digest('hex');
}

/**
 * Verify wallet signature
 */
export function verifyWalletSignature(
  message: string,
  signature: string,
  walletAddress: string
): boolean {
  // In a real implementation, you would verify the signature against the wallet address
  // This is a simplified version for demonstration
  const expectedSignature = crypto
    .createHmac('sha256', walletAddress)
    .update(message)
    .digest('hex');
  return signature === expectedSignature;
}

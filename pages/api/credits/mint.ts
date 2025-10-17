import { NextApiRequest, NextApiResponse } from 'next';
import { CarbonCreditEngine } from '@/lib/services/carbon-credit-engine';
import { authenticateApiKeyPages } from '@/lib/auth/middleware';
import { db, carbonCreditTransactions } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/credits/mint - Create mint request for credits
 * GET /api/credits/mint/:deviceId - Get mint requests for a device
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Authenticate API key
    const authResult = await authenticateApiKeyPages(req, res);
    if (!authResult.success) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { method } = req;

    switch (method) {
      case 'POST':
        return await handleCreateMintRequest(req, res);
      case 'GET':
        return await handleGetMintRequests(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Mint API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Create mint request for credits
 */
async function handleCreateMintRequest(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { deviceId, amount, dataHash } = req.body;

  if (!deviceId || !amount || !dataHash) {
    return res.status(400).json({
      error: 'Missing required fields: deviceId, amount, dataHash',
    });
  }

  if (amount <= 0) {
    return res.status(400).json({
      error: 'Amount must be greater than 0',
    });
  }

  try {
    // Get minting status to check available credits
    const status = await CarbonCreditEngine.getMintingStatus(deviceId);

    if (status.availableToMint < amount) {
      return res.status(400).json({
        error: 'Insufficient credits available for minting',
        available: status.availableToMint,
        requested: amount,
      });
    }

    // Check if there's a pending mint request
    const pendingMint = await db
      .select()
      .from(carbonCreditTransactions)
      .where(
        and(
          eq(carbonCreditTransactions.deviceId, deviceId),
          eq(carbonCreditTransactions.transactionType, 'MINT'),
          eq(carbonCreditTransactions.status, 'PENDING')
        )
      )
      .limit(1);

    if (pendingMint.length > 0) {
      return res.status(400).json({
        error: 'There is already a pending mint request for this device',
        pendingRequestId: pendingMint[0].id,
      });
    }

    // Create mint request
    const requestId = await CarbonCreditEngine.createMintRequest(
      deviceId,
      amount,
      dataHash
    );

    return res.status(201).json({
      success: true,
      data: {
        requestId,
        deviceId,
        amount,
        status: 'PENDING',
        message: 'Mint request created successfully. Awaiting blockchain confirmation.',
      },
    });
  } catch (error) {
    console.error('Error creating mint request:', error);
    return res.status(500).json({
      error: 'Failed to create mint request',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get mint requests for a device
 */
async function handleGetMintRequests(req: NextApiRequest, res: NextApiResponse) {
  const { deviceId } = req.query;

  if (!deviceId || typeof deviceId !== 'string') {
    return res.status(400).json({
      error: 'Missing or invalid deviceId parameter',
    });
  }

  try {
    // Get all mint requests for the device
    const mintRequests = await db
      .select()
      .from(carbonCreditTransactions)
      .where(
        and(
          eq(carbonCreditTransactions.deviceId, deviceId),
          eq(carbonCreditTransactions.transactionType, 'MINT')
        )
      )
      .orderBy(carbonCreditTransactions.createdAt);

    return res.status(200).json({
      success: true,
      data: {
        deviceId,
        requests: mintRequests.map(req => ({
          id: req.id,
          amount: req.amount,
          status: req.status,
          blockchainTxHash: req.blockchainTxHash,
          createdAt: req.createdAt,
          updatedAt: req.updatedAt,
          data: req.data,
          errorMessage: req.errorMessage,
        })),
        totalRequests: mintRequests.length,
        pendingRequests: mintRequests.filter(req => req.status === 'PENDING').length,
        confirmedRequests: mintRequests.filter(req => req.status === 'CONFIRMED').length,
        failedRequests: mintRequests.filter(req => req.status === 'FAILED').length,
      },
    });
  } catch (error) {
    console.error('Error getting mint requests:', error);
    return res.status(500).json({
      error: 'Failed to get mint requests',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

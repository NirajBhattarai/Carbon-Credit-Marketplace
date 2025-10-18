import { NextApiRequest, NextApiResponse } from 'next';
import { db, companyCredit, creditHistory, company } from '@/lib/db';
import { eq } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    return handleSellCredits(req, res);
  } else if (req.method === 'GET') {
    return handleGetCreditOffers(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Handle selling credits
async function handleSellCredits(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { companyId, amount, price, buyerInfo } = req.body;

    if (!companyId || !amount || !price) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: companyId, amount, price',
      });
    }

    // Get current company credit
    const currentCredit = await db
      .select()
      .from(companyCredit)
      .where(eq(companyCredit.companyId, companyId))
      .limit(1);

    if (currentCredit.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company credit record not found',
      });
    }

    const credit = currentCredit[0];
    const currentAmount = parseFloat(credit.currentCredit);
    const sellAmount = parseFloat(amount);
    const sellPrice = parseFloat(price);

    // Check if company has enough credits to sell
    if (currentAmount < sellAmount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient credits to sell',
        available: currentAmount,
        requested: sellAmount,
      });
    }

    // Update company credit
    const newCurrentCredit = (currentAmount - sellAmount).toString();
    const newSoldCredit = (parseFloat(credit.soldCredit) + sellAmount).toString();

    await db
      .update(companyCredit)
      .set({
        currentCredit: newCurrentCredit,
        soldCredit: newSoldCredit,
      })
      .where(eq(companyCredit.companyId, companyId));

    // Record the sale in credit history
    await db.insert(creditHistory).values({
      companyId: companyId,
      soldAmount: sellAmount.toString(),
      soldPrice: sellPrice.toString(),
      buyerInfo: buyerInfo || null,
    });

    console.log(`💰 Credits sold: ${sellAmount} credits for $${sellPrice} by company ${companyId}`);

    return res.status(200).json({
      success: true,
      message: 'Credits sold successfully',
      transaction: {
        companyId,
        amount: sellAmount,
        price: sellPrice,
        totalValue: sellAmount * sellPrice,
        buyerInfo,
        timestamp: new Date().toISOString(),
      },
      updatedCredits: {
        current: parseFloat(newCurrentCredit),
        sold: parseFloat(newSoldCredit),
      },
    });

  } catch (error) {
    console.error('[Sell Credits] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Handle getting credit offers
async function handleGetCreditOffers(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { minPrice, maxPrice, minAmount } = req.query;

    // Build query conditions
    let whereConditions = eq(companyCredit.currentCredit, '0'); // Only companies with credits to sell

    // Get all companies with credits available for sale
    const creditOffers = await db
      .select({
        companyId: companyCredit.companyId,
        totalCredit: companyCredit.totalCredit,
        currentCredit: companyCredit.currentCredit,
        soldCredit: companyCredit.soldCredit,
        offerPrice: companyCredit.offerPrice,
        companyName: company.companyName,
        location: company.location,
        website: company.website,
      })
      .from(companyCredit)
      .leftJoin(company, eq(companyCredit.companyId, company.companyId))
      .where(eq(companyCredit.currentCredit, '0')) // Only show companies with credits to sell
      .orderBy(companyCredit.offerPrice);

    // Filter by price range if specified
    let filteredOffers = creditOffers;
    if (minPrice) {
      filteredOffers = filteredOffers.filter(offer => 
        parseFloat(offer.offerPrice || '0') >= parseFloat(minPrice as string)
      );
    }
    if (maxPrice) {
      filteredOffers = filteredOffers.filter(offer => 
        parseFloat(offer.offerPrice || '0') <= parseFloat(maxPrice as string)
      );
    }
    if (minAmount) {
      filteredOffers = filteredOffers.filter(offer => 
        parseFloat(offer.currentCredit) >= parseFloat(minAmount as string)
      );
    }

    const offers = filteredOffers.map(offer => ({
      companyId: offer.companyId,
      companyName: offer.companyName,
      location: offer.location,
      website: offer.website,
      credits: {
        total: parseFloat(offer.totalCredit),
        current: parseFloat(offer.currentCredit),
        sold: parseFloat(offer.soldCredit),
        offerPrice: parseFloat(offer.offerPrice || '0'),
      },
      totalValue: parseFloat(offer.currentCredit) * parseFloat(offer.offerPrice || '0'),
    }));

    return res.status(200).json({
      success: true,
      offers,
      totalOffers: offers.length,
      totalCreditsAvailable: offers.reduce((sum, o) => sum + o.credits.current, 0),
      averagePrice: offers.length > 0 
        ? offers.reduce((sum, o) => sum + o.credits.offerPrice, 0) / offers.length 
        : 0,
    });

  } catch (error) {
    console.error('[Get Credit Offers] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

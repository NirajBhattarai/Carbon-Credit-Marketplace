import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/auth/middleware'
import { mintCarbonCreditNFT, burnCarbonCreditNFT, getUserNFTs } from '@/lib/nft/minting'

/**
 * POST /api/nft/mint
 * Mint NFT for IoT device data
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate API key
    const authError = await authenticateApiKey(request)
    if (authError) return authError

    const body = await request.json()
    const { deviceId, co2Value, energyValue, temperature, humidity, timestamp, dataHash } = body

    // Validate required fields
    if (!deviceId || co2Value === undefined || energyValue === undefined || 
        temperature === undefined || humidity === undefined || !timestamp || !dataHash) {
      return NextResponse.json(
        { error: 'Missing required fields: deviceId, co2Value, energyValue, temperature, humidity, timestamp, dataHash' },
        { status: 400 }
      )
    }

    // Mint NFT
    const result = await mintCarbonCreditNFT({
      deviceId,
      co2Value: parseFloat(co2Value),
      energyValue: parseFloat(energyValue),
      temperature: parseFloat(temperature),
      humidity: parseFloat(humidity),
      timestamp: new Date(timestamp),
      dataHash
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      nft: result.nft,
      transactionId: result.transactionId
    })

  } catch (error) {
    console.error('NFT minting error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/nft/burn
 * Burn carbon credit NFT
 */
export async function POST_BURN(request: NextRequest) {
  try {
    // Authenticate API key
    const authError = await authenticateApiKey(request)
    if (authError) return authError

    const body = await request.json()
    const { nftId, amount } = body

    // Validate required fields
    if (!nftId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: nftId, amount' },
        { status: 400 }
      )
    }

    // Burn NFT
    const result = await burnCarbonCreditNFT(nftId, parseFloat(amount))

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      transactionId: result.transactionId
    })

  } catch (error) {
    console.error('NFT burn error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

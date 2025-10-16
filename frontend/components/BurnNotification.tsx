'use client'

import { useState, useEffect } from 'react'
import { NFT } from '@/lib/types'

interface BurnNotificationProps {
  nft: NFT
  onBurn: (nftId: string) => void
}

export default function BurnNotification({ nft, onBurn }: BurnNotificationProps): JSX.Element {
  const [showNotification, setShowNotification] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    // Check if NFT should be burned (credits = 0)
    if (nft.remainingCredits === 0 && nft.burnStatus === 'active') {
      setShowNotification(true)
      // Set a countdown timer for burn process
      setTimeLeft(30) // 30 seconds countdown
      
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            onBurn(nft.id)
            setShowNotification(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [nft.remainingCredits, nft.burnStatus, nft.id, onBurn])

  if (!showNotification) return <></>

  return (
    <div className="fixed top-4 right-4 z-50 bg-red-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
          <span className="text-lg">🔥</span>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-sm">Credit Burn Alert</h3>
          <p className="text-xs opacity-90 mt-1">
            {nft.name} has 0 credits remaining
          </p>
          <p className="text-xs opacity-90">
            Burning in {timeLeft}s...
          </p>
        </div>
        <button
          onClick={() => setShowNotification(false)}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

interface CreditUsageModalProps {
  nft: NFT
  isOpen: boolean
  onClose: () => void
  onUseCredits: (nftId: string, creditsToUse: number) => void
}

export function CreditUsageModal({ nft, isOpen, onClose, onUseCredits }: CreditUsageModalProps): JSX.Element {
  const [creditsToUse, setCreditsToUse] = useState(1)

  if (!isOpen) return <></>

  const handleUseCredits = () => {
    if (creditsToUse > 0 && creditsToUse <= nft.remainingCredits) {
      onUseCredits(nft.id, creditsToUse)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Use Carbon Credits</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <img
              src={nft.image}
              alt={nft.name}
              className="w-16 h-16 rounded-xl object-cover"
            />
            <div>
              <h3 className="font-semibold text-gray-900">{nft.name}</h3>
              <p className="text-sm text-gray-600">{nft.collection.name}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Available Credits</span>
              <span className="text-sm font-bold text-gray-900">{nft.remainingCredits}/{nft.totalCredits}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(nft.remainingCredits / nft.totalCredits) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Credits to Use
            </label>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setCreditsToUse(Math.max(1, creditsToUse - 1))}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <input
                type="number"
                value={creditsToUse}
                onChange={(e) => setCreditsToUse(Math.max(1, Math.min(nft.remainingCredits, parseInt(e.target.value) || 1)))}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-center font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max={nft.remainingCredits}
              />
              <button
                onClick={() => setCreditsToUse(Math.min(nft.remainingCredits, creditsToUse + 1))}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Using {creditsToUse} credit{creditsToUse !== 1 ? 's' : ''} will leave {nft.remainingCredits - creditsToUse} remaining
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUseCredits}
            disabled={creditsToUse <= 0 || creditsToUse > nft.remainingCredits}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Use Credits
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'

interface BuyModalProps {
  nft: {
    id: string
    name: string
    image: string
    price: number
    currency: string
    owner: {
      name: string
      address: string
    }
  }
  isOpen: boolean
  onClose: () => void
}

export default function BuyModal({ nft, isOpen, onClose }: BuyModalProps): JSX.Element {
  const [step, setStep] = useState<'confirm' | 'processing' | 'success'>('confirm')
  const [paymentMethod, setPaymentMethod] = useState<'eth' | 'usdc'>('eth')

  if (!isOpen) return <></>

  const handleBuy = () => {
    setStep('processing')
    // Simulate processing
    setTimeout(() => {
      setStep('success')
    }, 2000)
  }

  const handleClose = () => {
    setStep('confirm')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {step === 'confirm' && (
          <>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Complete Purchase</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-16 h-16 rounded-lg"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{nft.name}</h3>
                  <p className="text-sm text-gray-600">by {nft.owner.name}</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="payment"
                        value="eth"
                        checked={paymentMethod === 'eth'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'eth' | 'usdc')}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Ethereum (ETH)</div>
                        <div className="text-sm text-gray-600">{nft.price} ETH</div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="payment"
                        value="usdc"
                        checked={paymentMethod === 'usdc'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'eth' | 'usdc')}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900">USD Coin (USDC)</div>
                        <div className="text-sm text-gray-600">${(nft.price * 2000).toLocaleString()}</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Item Price</span>
                  <span className="text-sm font-medium text-gray-900">
                    {paymentMethod === 'eth' ? `${nft.price} ETH` : `$${(nft.price * 2000).toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Service Fee</span>
                  <span className="text-sm font-medium text-gray-900">
                    {paymentMethod === 'eth' ? `${(nft.price * 0.025).toFixed(3)} ETH` : `$${(nft.price * 2000 * 0.025).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                  <span className="font-medium text-gray-900">Total</span>
                  <span className="font-bold text-gray-900">
                    {paymentMethod === 'eth' ? `${(nft.price * 1.025).toFixed(3)} ETH` : `$${(nft.price * 2000 * 1.025).toFixed(2)}`}
                  </span>
                </div>
              </div>

              <button
                onClick={handleBuy}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                Complete Purchase
              </button>
            </div>
          </>
        )}

        {step === 'processing' && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Transaction</h3>
            <p className="text-gray-600">Please wait while we process your purchase...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Purchase Successful!</h3>
            <p className="text-gray-600 mb-6">You now own {nft.name}</p>
            <button
              onClick={handleClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
            >
              View in Profile
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

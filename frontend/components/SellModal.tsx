'use client'

import { useState } from 'react'

interface SellModalProps {
  nft: {
    id: string
    name: string
    image: string
    price: number
    currency: string
  }
  isOpen: boolean
  onClose: () => void
}

export default function SellModal({ nft, isOpen, onClose }: SellModalProps): JSX.Element {
  const [step, setStep] = useState<'price' | 'confirm' | 'processing' | 'success'>('price')
  const [price, setPrice] = useState(nft.price.toString())
  const [currency, setCurrency] = useState<'ETH' | 'USDC'>('ETH')
  const [duration, setDuration] = useState<'1' | '3' | '7' | '30'>('7')

  if (!isOpen) return <></>

  const handleNext = () => {
    if (step === 'price') {
      setStep('confirm')
    } else if (step === 'confirm') {
      setStep('processing')
      // Simulate processing
      setTimeout(() => {
        setStep('success')
      }, 2000)
    }
  }

  const handleClose = () => {
    setStep('price')
    onClose()
  }

  const priceInUSD = parseFloat(price) * 2000

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {step === 'price' && (
          <>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">List for Sale</h2>
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
                  <p className="text-sm text-gray-600">List this item for sale</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      step="0.001"
                    />
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as 'ETH' | 'USDC')}
                      className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ETH">ETH</option>
                      <option value="USDC">USDC</option>
                    </select>
                  </div>
                  {currency === 'ETH' && (
                    <p className="text-sm text-gray-600 mt-1">≈ ${priceInUSD.toLocaleString()}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: '1', label: '1 day' },
                      { value: '3', label: '3 days' },
                      { value: '7', label: '7 days' },
                      { value: '30', label: '30 days' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setDuration(option.value as '1' | '3' | '7' | '30')}
                        className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
                          duration === option.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Listing Price</span>
                  <span className="text-sm font-medium text-gray-900">
                    {price} {currency}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Service Fee (2.5%)</span>
                  <span className="text-sm font-medium text-gray-900">
                    {(parseFloat(price) * 0.025).toFixed(3)} {currency}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                  <span className="font-medium text-gray-900">You'll Receive</span>
                  <span className="font-bold text-gray-900">
                    {(parseFloat(price) * 0.975).toFixed(3)} {currency}
                  </span>
                </div>
              </div>

              <button
                onClick={handleNext}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Confirm Listing</h2>
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
                  <p className="text-sm text-gray-600">Listed for {price} {currency}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price</span>
                  <span className="font-medium">{price} {currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{duration} day{duration !== '1' ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee</span>
                  <span className="font-medium">{(parseFloat(price) * 0.025).toFixed(3)} {currency}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-3">
                  <span className="font-medium">You'll Receive</span>
                  <span className="font-bold">{(parseFloat(price) * 0.975).toFixed(3)} {currency}</span>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Important:</p>
                    <p>Once listed, this item will be available for purchase by other users. You can cancel the listing anytime before it's sold.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleNext}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                List Item
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating Listing</h3>
            <p className="text-gray-600">Please wait while we create your listing...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Listing Created!</h3>
            <p className="text-gray-600 mb-6">{nft.name} is now available for purchase</p>
            <button
              onClick={handleClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
            >
              View Listing
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

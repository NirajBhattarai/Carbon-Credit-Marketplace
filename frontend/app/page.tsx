'use client'

import { useState } from 'react'
import Link from 'next/link'
import NFTCard from '@/components/NFTCard'
import CollectionCard from '@/components/CollectionCard'
import { Button } from '@/components/ui/Button'
import { mockNFTs, mockCollections } from '@/lib/mockData'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'nfts' | 'collections'>('nfts')

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 text-white py-20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:20px_20px]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
            <span className="text-sm font-medium">🌿 EcoTrade v1.0</span>
          </div>
          
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
            The Future of Carbon Credit Trading
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto text-emerald-100 leading-relaxed">
            Trade verified carbon credits from industry leaders like South Pole, Finite Carbon, and Blue Source. 
            Join Shell, Microsoft, and Delta in offsetting emissions through blockchain-powered transparency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-emerald-600 px-8 py-4 rounded-xl font-semibold hover:bg-emerald-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
              <Link href="/nfts">Browse NFTs</Link>
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-emerald-600 transition-all duration-300 backdrop-blur-sm">
              Launch Your Project
            </button>
          </div>
        </div>
      </section>

      {/* Trading Credits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Trading Credits</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Discover and trade verified carbon credits from leading environmental projects worldwide
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Forest Conservation</h3>
                <span className="text-2xl">🌲</span>
              </div>
              <p className="text-gray-600 mb-4">Protecting endangered forests and wildlife habitats</p>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">$45</div>
                  <div className="text-sm text-gray-500">per ton CO2</div>
                </div>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Trade Now
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Renewable Energy</h3>
                <span className="text-2xl">⚡</span>
              </div>
              <p className="text-gray-600 mb-4">Solar and wind energy projects reducing fossil fuel dependence</p>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">$32</div>
                  <div className="text-sm text-gray-500">per ton CO2</div>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Trade Now
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Ocean Restoration</h3>
                <span className="text-2xl">🌊</span>
              </div>
              <p className="text-gray-600 mb-4">Marine ecosystem restoration and coral reef protection</p>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-2xl font-bold text-purple-600">$58</div>
                  <div className="text-sm text-gray-500">per ton CO2</div>
                </div>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  Trade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('nfts')}
                className={`pb-2 border-b-2 font-semibold ${
                  activeTab === 'nfts'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Trending Credits
              </button>
              <button
                onClick={() => setActiveTab('collections')}
                className={`pb-2 border-b-2 font-semibold ${
                  activeTab === 'collections'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Top Projects
              </button>
            </div>
            <Link href="/nfts">
              <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                View All NFTs →
              </Button>
            </Link>
          </div>

          {/* Content */}
          {activeTab === 'nfts' && (
            <>
              {/* NFT Context Section */}
              <div className="mb-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Carbon Credit Overview */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-xl">🌿</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Carbon Credits</h3>
                        <p className="text-sm text-gray-600">Verified Environmental Assets</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Credits:</span>
                        <span className="font-semibold text-emerald-600">2,847</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Active Projects:</span>
                        <span className="font-semibold text-emerald-600">156</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">CO2 Reduced:</span>
                        <span className="font-semibold text-emerald-600">847 tons</span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Standards */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-xl">✅</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Verification</h3>
                        <p className="text-sm text-gray-600">Industry Standards</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">VCS:</span>
                        <span className="font-semibold text-blue-600">68%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Gold Standard:</span>
                        <span className="font-semibold text-blue-600">24%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">CAR:</span>
                        <span className="font-semibold text-blue-600">8%</span>
                      </div>
                    </div>
                  </div>

                  {/* Project Types */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-xl">🌍</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Project Types</h3>
                        <p className="text-sm text-gray-600">Environmental Impact</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Forest:</span>
                        <span className="font-semibold text-teal-600">45%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Renewable:</span>
                        <span className="font-semibold text-teal-600">32%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Ocean:</span>
                        <span className="font-semibold text-teal-600">23%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Features */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white/50 rounded-lg">
                    <div className="text-2xl mb-1">🔒</div>
                    <div className="text-sm font-medium text-gray-700">Blockchain Secured</div>
                  </div>
                  <div className="text-center p-3 bg-white/50 rounded-lg">
                    <div className="text-2xl mb-1">📊</div>
                    <div className="text-sm font-medium text-gray-700">Real-time Tracking</div>
                  </div>
                  <div className="text-center p-3 bg-white/50 rounded-lg">
                    <div className="text-2xl mb-1">♻️</div>
                    <div className="text-sm font-medium text-gray-700">Auto Burn</div>
                  </div>
                  <div className="text-center p-3 bg-white/50 rounded-lg">
                    <div className="text-2xl mb-1">🌱</div>
                    <div className="text-sm font-medium text-gray-700">Verified Impact</div>
                  </div>
                </div>
              </div>

              {/* NFT Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {mockNFTs.map((nft) => (
                  <Link key={nft.id} href={`/nft/${nft.id}`}>
                    <NFTCard nft={nft} />
                  </Link>
                ))}
              </div>
            </>
          )}

          {activeTab === 'collections' && (
            <>
              {/* Collections Context Section */}
              <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Project Overview */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-xl">🏢</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Project Collections</h3>
                        <p className="text-sm text-gray-600">Verified Carbon Projects</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Collections:</span>
                        <span className="font-semibold text-blue-600">12</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Verified Projects:</span>
                        <span className="font-semibold text-blue-600">8</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Volume:</span>
                        <span className="font-semibold text-blue-600">$2.4M</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Performers */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-xl">📈</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Top Performers</h3>
                        <p className="text-sm text-gray-600">Highest Volume</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Ocean Conservation:</span>
                        <span className="font-semibold text-green-600">$1.2M</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Forest Credits:</span>
                        <span className="font-semibold text-green-600">$850K</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Renewable Energy:</span>
                        <span className="font-semibold text-green-600">$350K</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collection Features */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white/50 rounded-lg">
                    <div className="text-2xl mb-1">🏆</div>
                    <div className="text-sm font-medium text-gray-700">Verified Projects</div>
                  </div>
                  <div className="text-center p-3 bg-white/50 rounded-lg">
                    <div className="text-2xl mb-1">📊</div>
                    <div className="text-sm font-medium text-gray-700">Volume Tracking</div>
                  </div>
                  <div className="text-center p-3 bg-white/50 rounded-lg">
                    <div className="text-2xl mb-1">🌍</div>
                    <div className="text-sm font-medium text-gray-700">Global Impact</div>
                  </div>
                  <div className="text-center p-3 bg-white/50 rounded-lg">
                    <div className="text-2xl mb-1">💎</div>
                    <div className="text-sm font-medium text-gray-700">Premium Quality</div>
                  </div>
                </div>
              </div>

              {/* Collections Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockCollections.map((collection) => (
                  <Link key={collection.id} href={`/collection/${collection.slug}`}>
                    <CollectionCard collection={collection} />
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Load More Button */}
          <div className="text-center mt-12">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Load More
            </button>
          </div>
        </div>
      </section>

      {/* Top Projects Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Top Projects</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Leading carbon credit projects with verified impact and transparent reporting
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-2xl">🌳</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Amazon Rainforest Protection</h3>
                  <p className="text-gray-600">South Pole • Brazil</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-3xl font-bold text-green-600">2.4M</div>
                  <div className="text-sm text-gray-500">Tons CO2 Reduced</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">$89M</div>
                  <div className="text-sm text-gray-500">Total Value</div>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Protecting 500,000 hectares of Amazon rainforest from deforestation, 
                preserving biodiversity and indigenous communities.
              </p>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Verified by VCS</span>
                </div>
                <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  View Project
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-2xl">🌞</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Solar Farm Initiative</h3>
                  <p className="text-gray-600">Blue Source • India</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-3xl font-bold text-green-600">1.8M</div>
                  <div className="text-sm text-gray-500">Tons CO2 Reduced</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">$67M</div>
                  <div className="text-sm text-gray-500">Total Value</div>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Large-scale solar energy project providing clean electricity to rural communities 
                and reducing coal dependency across India.
              </p>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Verified by Gold Standard</span>
                </div>
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  View Project
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEX CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Trade Carbon Credits Instantly</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            Use our decentralized exchange to buy and sell carbon credits with stablecoins. 
            No intermediaries, transparent pricing, and instant settlement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              <a href="/swap">Start Trading</a>
            </button>
            <button className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors">
              View Liquidity Pools
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900">1B+</div>
              <div className="text-gray-600">Tons CO2 Reduced</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">800+</div>
              <div className="text-gray-600">Active Projects</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">$400M</div>
              <div className="text-gray-600">Annual Revenue</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">$250B</div>
              <div className="text-gray-600">Market by 2050</div>
            </div>
          </div>
        </div>
      </section>

      {/* Burn Status Section */}
      <section className="py-16 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Real-Time Credit Tracking</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Every carbon credit is tracked on-chain. When credits reach zero, they are automatically burned to prevent double-spending and ensure environmental integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌱</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Active Credits</h3>
              <p className="text-gray-600 mb-4">Credits available for use and trading</p>
              <div className="text-3xl font-bold text-green-600">8,247</div>
              <div className="text-sm text-gray-500">Available Now</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⏰</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Expiring Soon</h3>
              <p className="text-gray-600 mb-4">Credits with less than 20% remaining</p>
              <div className="text-3xl font-bold text-orange-600">1,234</div>
              <div className="text-sm text-gray-500">Low Balance</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔥</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Burned Credits</h3>
              <p className="text-gray-600 mb-4">Credits that have been fully consumed</p>
              <div className="text-3xl font-bold text-red-600">519</div>
              <div className="text-sm text-gray-500">Permanently Retired</div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="bg-white rounded-xl p-6 shadow-lg max-w-2xl mx-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Burn Mechanism</h3>
              <p className="text-gray-600 text-sm">
                When a carbon credit reaches 0 remaining credits, it is automatically burned on-chain. 
                This prevents double-spending and ensures each credit represents a unique environmental impact.
                Burned credits are permanently retired and cannot be traded or used again.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Leaders Section */}
      <section className="py-16 bg-gradient-to-r from-gray-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted by Industry Leaders</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Join the world's largest carbon credit developers and major corporate buyers in the fastest-growing environmental market
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* South Pole */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold text-lg">SP</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">South Pole</h3>
                  <p className="text-sm text-gray-600">Zurich, Switzerland</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Projects:</span>
                  <span className="font-semibold">800+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenue:</span>
                  <span className="font-semibold">$400M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Employees:</span>
                  <span className="font-semibold">1,200+</span>
                </div>
              </div>
            </div>

            {/* Finite Carbon */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-green-600 font-bold text-lg">FC</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Finite Carbon</h3>
                  <p className="text-sm text-gray-600">North America</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Forest Acres:</span>
                  <span className="font-semibold">4M+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Credits:</span>
                  <span className="font-semibold">100M+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenue:</span>
                  <span className="font-semibold">$1B+</span>
                </div>
              </div>
            </div>

            {/* Blue Source */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-purple-600 font-bold text-lg">BS</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Blue Source</h3>
                  <p className="text-sm text-gray-600">North America</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Credits:</span>
                  <span className="font-semibold">150M+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Indigenous Revenue:</span>
                  <span className="font-semibold">$162M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Founded:</span>
                  <span className="font-semibold">2001</span>
                </div>
              </div>
            </div>
          </div>

          {/* Major Buyers */}
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">Major Corporate Buyers</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {[
                { name: 'Shell', credits: '14.1M', logo: '🛢️' },
                { name: 'Microsoft', credits: '10M+', logo: '💻' },
                { name: 'Eni', credits: '6M', logo: '⚡' },
                { name: 'Engie', credits: '2.1M', logo: '🌱' },
                { name: 'Delta', credits: '1M+', logo: '✈️' }
              ].map((buyer) => (
                <div key={buyer.name} className="text-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-3xl mb-2">{buyer.logo}</div>
                  <div className="font-semibold text-gray-900">{buyer.name}</div>
                  <div className="text-sm text-gray-600">{buyer.credits} credits</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
   

      {/* Blockchain Advantage Section */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Blockchain-Powered Transparency</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Unlike traditional carbon markets, our blockchain platform ensures every credit is verified, traceable, and tamper-proof
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-xl shadow-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Verified Standards</h3>
              <p className="text-gray-600">Gold Standard, Verra VCS, and Climate Action Reserve certified projects</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl shadow-lg">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Instant Settlement</h3>
              <p className="text-gray-600">Smart contracts enable immediate, secure transactions without intermediaries</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl shadow-lg">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Market Growth</h3>
              <p className="text-gray-600">Projected to reach $250B by 2050 - join the fastest-growing environmental market</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Browse by Project Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              { name: 'Forest Credits', icon: '🌲', count: '125K', desc: 'Reforestation & Conservation' },
              { name: 'Ocean Credits', icon: '🌊', count: '89K', desc: 'Blue Carbon & Marine' },
              { name: 'Renewable Energy', icon: '⚡', count: '45K', desc: 'Solar, Wind & Hydro' },
              { name: 'Carbon Capture', icon: '🌱', count: '67K', desc: 'Direct Air Capture' },
              { name: 'Wildlife Conservation', icon: '🦋', count: '34K', desc: 'Biodiversity Protection' },
              { name: 'Clean Technology', icon: '🔬', count: '23K', desc: 'Innovation & R&D' },
            ].map((category) => (
              <div key={category.name} className="text-center p-6 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100 hover:border-green-200">
                <div className="text-4xl mb-3">{category.icon}</div>
                <div className="font-semibold text-gray-900 mb-1">{category.name}</div>
                <div className="text-sm text-gray-600 mb-2">{category.count} credits</div>
                <div className="text-xs text-gray-500">{category.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

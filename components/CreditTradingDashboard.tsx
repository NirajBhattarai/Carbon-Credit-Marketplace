'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CreditOffer {
  companyId: number;
  companyName: string;
  location: string;
  website: string;
  credits: {
    total: number;
    current: number;
    sold: number;
    offerPrice: number;
  };
  totalValue: number;
}

interface CreditOffersData {
  offers: CreditOffer[];
  totalOffers: number;
  totalCreditsAvailable: number;
  averagePrice: number;
}

interface BuyCreditsForm {
  companyId: number;
  amount: string;
  price: string;
  buyerInfo: string;
}

export function CreditTradingDashboard() {
  const [offers, setOffers] = useState<CreditOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyingCredits, setBuyingCredits] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<CreditOffer | null>(null);
  const [buyForm, setBuyForm] = useState<BuyCreditsForm>({
    companyId: 0,
    amount: '',
    price: '',
    buyerInfo: '',
  });
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minAmount: '',
  });

  // Fetch credit offers
  const fetchOffers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);

      const response = await fetch(`/api/credits/sell?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setOffers(data.offers);
      } else {
        setError(data.error || 'Failed to fetch credit offers');
      }
    } catch (err) {
      setError('Failed to fetch credit offers');
      console.error('Error fetching offers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [filters]);

  const formatCredits = (credits: number) => {
    return credits.toFixed(2);
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const formatTotalValue = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  const handleBuyCredits = async () => {
    if (!selectedOffer || !buyForm.amount || !buyForm.price) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setBuyingCredits(true);
      const response = await fetch('/api/credits/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: selectedOffer.companyId,
          amount: buyForm.amount,
          price: buyForm.price,
          buyerInfo: buyForm.buyerInfo,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Successfully purchased ${buyForm.amount} credits for ${formatPrice(parseFloat(buyForm.price))} each!`);
        setSelectedOffer(null);
        setBuyForm({
          companyId: 0,
          amount: '',
          price: '',
          buyerInfo: '',
        });
        fetchOffers(); // Refresh offers
      } else {
        alert(data.error || 'Failed to buy credits');
      }
    } catch (err) {
      alert('Failed to buy credits');
      console.error('Error buying credits:', err);
    } finally {
      setBuyingCredits(false);
    }
  };

  const openBuyModal = (offer: CreditOffer) => {
    setSelectedOffer(offer);
    setBuyForm({
      companyId: offer.companyId,
      amount: '',
      price: offer.credits.offerPrice.toString(),
      buyerInfo: '',
    });
  };

  const closeBuyModal = () => {
    setSelectedOffer(null);
    setBuyForm({
      companyId: 0,
      amount: '',
      price: '',
      buyerInfo: '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading credit offers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <div className="text-red-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
        <p className="text-gray-600">{error}</p>
        <Button 
          onClick={fetchOffers} 
          className="mt-4"
        >
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Carbon Credit Marketplace</h1>
        <p className="text-gray-600">Buy and sell sequestered carbon credits from verified companies</p>
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{offers.length}</div>
          <div className="text-sm text-gray-600">Active Offers</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{formatCredits(offers.reduce((sum, o) => sum + o.credits.current, 0))}</div>
          <div className="text-sm text-gray-600">Credits Available</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-purple-600">{formatPrice(offers.reduce((sum, o) => sum + o.totalValue, 0))}</div>
          <div className="text-sm text-gray-600">Total Market Value</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-orange-600">{formatPrice(offers.length > 0 ? offers.reduce((sum, o) => sum + o.credits.offerPrice, 0) / offers.length : 0)}</div>
          <div className="text-sm text-gray-600">Average Price</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Filter Offers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Min Price ($)</label>
            <Input
              type="number"
              placeholder="0.00"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Price ($)</label>
            <Input
              type="number"
              placeholder="100.00"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Min Amount</label>
            <Input
              type="number"
              placeholder="10.00"
              value={filters.minAmount}
              onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={fetchOffers} variant="outline">
            Apply Filters
          </Button>
        </div>
      </Card>

      {/* Credit Offers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {offers.map((offer) => (
          <Card key={offer.companyId} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{offer.companyName}</h3>
                <p className="text-sm text-gray-600">{offer.location}</p>
              </div>
              <Badge className="bg-green-100 text-green-800">
                Available
              </Badge>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Credits Available:</span>
                <span className="font-medium">{formatCredits(offer.credits.current)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price per Credit:</span>
                <span className="font-medium">{formatPrice(offer.credits.offerPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Value:</span>
                <span className="font-medium">{formatTotalValue(offer.totalValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Credits:</span>
                <span className="font-medium">{formatCredits(offer.credits.total)}</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={() => openBuyModal(offer)}
                className="flex-1"
                disabled={offer.credits.current === 0}
              >
                Buy Credits
              </Button>
              <Button 
                onClick={() => window.open(offer.website, '_blank')}
                variant="outline"
                className="flex-1"
              >
                Visit Website
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {offers.length === 0 && (
        <Card className="p-6 text-center">
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Credit Offers Available</h3>
            <p className="text-gray-600">Try adjusting your filters or check back later for new offers.</p>
          </div>
        </Card>
      )}

      {/* Buy Credits Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Buy Credits from {selectedOffer.companyName}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount to Buy</label>
                <Input
                  type="number"
                  placeholder="10.00"
                  value={buyForm.amount}
                  onChange={(e) => setBuyForm({ ...buyForm, amount: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available: {formatCredits(selectedOffer.credits.current)} credits
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price per Credit ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={buyForm.price}
                  onChange={(e) => setBuyForm({ ...buyForm, price: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Buyer Information (Optional)</label>
                <Input
                  type="text"
                  placeholder="Your company name"
                  value={buyForm.buyerInfo}
                  onChange={(e) => setBuyForm({ ...buyForm, buyerInfo: e.target.value })}
                />
              </div>

              {buyForm.amount && buyForm.price && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Total Cost:</span>
                    <span className="font-medium">
                      {formatPrice(parseFloat(buyForm.amount) * parseFloat(buyForm.price))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-2 mt-6">
              <Button 
                onClick={closeBuyModal}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleBuyCredits}
                className="flex-1"
                disabled={buyingCredits || !buyForm.amount || !buyForm.price}
              >
                {buyingCredits ? 'Processing...' : 'Buy Credits'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface CreditData {
  totalCredits: number;
  co2Reduced: number;
  energySaved: number;
  temperatureImpact: number;
  humidityImpact: number;
  isOnline: boolean;
  timestamp: string;
}

interface CreditHistory {
  id: string;
  creditsEarned: number;
  co2Reduced: number;
  energySaved: number;
  temperatureImpact: number;
  humidityImpact: number;
  source: string;
  sourceId: string;
  createdAt: string;
  metadata?: any;
}

interface CreditAccumulationProps {
  walletAddress: string;
}

export function CreditAccumulation({ walletAddress }: CreditAccumulationProps) {
  const [creditData, setCreditData] = useState<CreditData | null>(null);
  const [creditHistory, setCreditHistory] = useState<CreditHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d' | 'all'>('7d');

  useEffect(() => {
    fetchCreditData();
    fetchCreditHistory();
  }, [walletAddress, selectedPeriod]);

  const fetchCreditData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/public/credits?walletAddress=${walletAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch credit data');
      }

      const data = await response.json();
      setCreditData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch credit data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCreditHistory = async () => {
    try {
      const response = await fetch(
        `/api/public/credits/history?walletAddress=${walletAddress}&period=${selectedPeriod}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch credit history');
      }

      const data = await response.json();
      setCreditHistory(data.data || []);
    } catch (err) {
      console.error('Error fetching credit history:', err);
    }
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '24h': return 'Last 24 Hours';
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case 'all': return 'All Time';
      default: return 'Last 7 Days';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-2">Error Loading Credits</p>
          <p className="text-sm">{error}</p>
          <Button 
            onClick={fetchCreditData}
            className="mt-4"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (!creditData) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <p className="text-lg font-semibold mb-2">No Credit Data</p>
          <p className="text-sm">No carbon credits have been accumulated yet.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Credit Summary */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Carbon Credits</h2>
          <Badge 
            variant={creditData.isOnline ? 'success' : 'warning'}
            className="flex items-center gap-2"
          >
            <div className={`w-2 h-2 rounded-full ${
              creditData.isOnline ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            {creditData.isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Credits */}
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600 mb-2">
              {formatNumber(creditData.totalCredits)}
            </div>
            <div className="text-sm text-gray-600">Total Credits</div>
          </div>

          {/* CO2 Reduced */}
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {formatNumber(creditData.co2Reduced)} kg
            </div>
            <div className="text-sm text-gray-600">CO₂ Reduced</div>
          </div>

          {/* Energy Saved */}
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {formatNumber(creditData.energySaved)} kWh
            </div>
            <div className="text-sm text-gray-600">Energy Saved</div>
          </div>

          {/* Environmental Impact */}
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-2">
              {formatNumber(creditData.temperatureImpact + creditData.humidityImpact)}
            </div>
            <div className="text-sm text-gray-600">Env. Impact</div>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          Last updated: {formatDate(creditData.timestamp)}
        </div>
      </Card>

      {/* Credit History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Credit History</h3>
          <div className="flex gap-2">
            {(['24h', '7d', '30d', 'all'] as const).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
              >
                {period.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        {creditHistory.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg font-semibold mb-2">No Credit History</p>
            <p className="text-sm">
              No credits have been earned in the {getPeriodLabel(selectedPeriod).toLowerCase()}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {creditHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="success" className="text-xs">
                      +{formatNumber(entry.creditsEarned)} Credits
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {entry.source === 'IOT_DEVICE' ? 'IoT Device' : entry.source}
                    </span>
                    {entry.sourceId && (
                      <span className="text-xs text-gray-500">
                        Device: {entry.sourceId}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">CO₂:</span>
                      <span className="ml-1 font-medium">
                        {formatNumber(entry.co2Reduced)} kg
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Energy:</span>
                      <span className="ml-1 font-medium">
                        {formatNumber(entry.energySaved)} kWh
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Temp Impact:</span>
                      <span className="ml-1 font-medium">
                        {formatNumber(entry.temperatureImpact)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Humidity Impact:</span>
                      <span className="ml-1 font-medium">
                        {formatNumber(entry.humidityImpact)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    {formatDate(entry.createdAt)}
                  </div>
                  {entry.metadata?.timeRange && (
                    <div className="text-xs text-gray-500 mt-1">
                      Period: {formatDate(entry.metadata.timeRange.start)} - {formatDate(entry.metadata.timeRange.end)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

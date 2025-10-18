'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface Company {
  companyId: number;
  companyName: string;
  address: string;
  website: string;
  location: string;
  walletAddress: string;
  credits: {
    total: number;
    current: number;
    sold: number;
    offerPrice: number;
  };
  stats: {
    iotKeys: number;
    devices: number;
    recentSales: number;
  };
  recentSales: Array<{
    amount: number;
    price: number;
    buyer: string;
    date: string;
  }>;
}

interface CompaniesData {
  companies: Company[];
  totalCompanies: number;
  totalCredits: number;
  totalCurrentCredits: number;
  totalSoldCredits: number;
}

export function CompaniesDashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // Fetch companies data
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/companies/new-schema');
        const data = await response.json();
        
        if (data.success) {
          setCompanies(data.companies);
        } else {
          setError(data.error || 'Failed to fetch companies');
        }
      } catch (err) {
        setError('Failed to fetch companies');
        console.error('Error fetching companies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatCredits = (credits: number) => {
    return credits.toFixed(2);
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Pagination
  const totalPages = Math.ceil(companies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCompanies = companies.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading companies...</span>
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
          onClick={() => window.location.reload()} 
          className="mt-4"
        >
          Retry
        </Button>
      </Card>
    );
  }

  // If viewing specific company details
  if (selectedCompany) {
    return (
      <div>
        <div className="mb-6">
          <Button 
            onClick={() => setSelectedCompany(null)}
            className="mb-4"
          >
            ← Back to Companies
          </Button>
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedCompany.companyName}
          </h2>
          <p className="text-gray-600">{formatWalletAddress(selectedCompany.walletAddress)}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{formatCredits(selectedCompany.credits.total)}</div>
            <div className="text-sm text-gray-600">Total Credits</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{formatCredits(selectedCompany.credits.current)}</div>
            <div className="text-sm text-gray-600">Available Credits</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">{formatCredits(selectedCompany.credits.sold)}</div>
            <div className="text-sm text-gray-600">Sold Credits</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">{formatPrice(selectedCompany.credits.offerPrice)}</div>
            <div className="text-sm text-gray-600">Offer Price</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Company Information</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Address:</span>
                <p className="font-medium">{selectedCompany.address}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Website:</span>
                <p className="font-medium">
                  <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {selectedCompany.website}
                  </a>
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Location:</span>
                <p className="font-medium">{selectedCompany.location}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Wallet Address:</span>
                <p className="font-medium font-mono">{selectedCompany.walletAddress}</p>
              </div>
            </div>
          </Card>

          {/* Device Stats */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Device Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">IoT Keys:</span>
                <Badge className="bg-blue-100 text-blue-800">{selectedCompany.stats.iotKeys}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Devices:</span>
                <Badge className="bg-green-100 text-green-800">{selectedCompany.stats.devices}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Recent Sales:</span>
                <Badge className="bg-purple-100 text-purple-800">{selectedCompany.stats.recentSales}</Badge>
              </div>
            </div>
          </Card>

          {/* Recent Sales */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Recent Sales</h3>
            {selectedCompany.recentSales.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedCompany.recentSales.map((sale, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCredits(sale.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPrice(sale.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.buyer || 'Anonymous'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(sale.date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent sales</p>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // Main companies view
  return (
    <div>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{companies.length}</div>
          <div className="text-sm text-gray-600">Total Companies</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-green-600">
            {companies.reduce((sum, c) => sum + c.credits.current, 0).toFixed(0)}
          </div>
          <div className="text-sm text-gray-600">Available Credits</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-purple-600">
            {companies.reduce((sum, c) => sum + c.credits.sold, 0).toFixed(0)}
          </div>
          <div className="text-sm text-gray-600">Sold Credits</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-orange-600">
            {companies.length > 0 
              ? `$${(companies.reduce((sum, c) => sum + c.credits.offerPrice, 0) / companies.length).toFixed(2)}`
              : '$0.00'
            }
          </div>
          <div className="text-sm text-gray-600">Avg Price</div>
        </Card>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {currentCompanies.map((company) => (
          <Card key={company.companyId} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{company.companyName}</h3>
                <p className="text-sm text-gray-600">{formatWalletAddress(company.walletAddress)}</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                {company.location}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatCredits(company.credits.current)}</div>
                <div className="text-xs text-gray-600">Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{formatPrice(company.credits.offerPrice)}</div>
                <div className="text-xs text-gray-600">Per Credit</div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Credits:</span>
                <span className="font-medium">{formatCredits(company.credits.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sold Credits:</span>
                <span className="font-medium">{formatCredits(company.credits.sold)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Devices:</span>
                <span className="font-medium">{company.stats.devices}</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={() => setSelectedCompany(company)}
                className="flex-1"
              >
                View Details
              </Button>
              <Button 
                onClick={() => {/* TODO: Implement buy credits */}}
                variant="outline"
                className="flex-1"
                disabled={company.credits.current === 0}
              >
                Buy Credits
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 space-x-2">
          <Button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            variant="outline"
          >
            Previous
          </Button>
          
          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                onClick={() => setCurrentPage(page)}
                variant={currentPage === page ? "primary" : "outline"}
                className="w-10"
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}

      {/* Page Info */}
      <div className="text-center mt-4 text-sm text-gray-600">
        Showing {startIndex + 1}-{Math.min(endIndex, companies.length)} of {companies.length} companies
      </div>
    </div>
  );
}

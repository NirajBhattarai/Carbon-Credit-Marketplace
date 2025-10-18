'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface Device {
  deviceId: number;
  keyId: number;
  companyId: number;
  sequesteredCarbonCredits: number;
  companyName?: string;
  location?: string;
  apiKey?: string;
  isActive?: boolean;
  lastSeen?: string;
}

interface Company {
  companyId: number;
  companyName: string;
  location: string;
  walletAddress: string;
  devices: Device[];
  totalCredits: number;
  currentCredits: number;
}

interface DeviceCreditHistory {
  historyId: number;
  deviceId: number;
  sequesteredCredits: number;
  timeIntervalStart: string;
  timeIntervalEnd: string;
}

export function IoTDevicesDashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [deviceHistory, setDeviceHistory] = useState<DeviceCreditHistory[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(3);

  // Fetch companies and devices data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch companies data
        const companiesResponse = await fetch('/api/companies/new-schema');
        const companiesData = await companiesResponse.json();
        
        if (companiesData.success) {
          // Transform the data to include devices
          const companiesWithDevices = await Promise.all(
            companiesData.companies.map(async (company: any) => {
              // Fetch devices for this company (this would be a separate API call)
              // For now, we'll simulate device data
              const devices = await generateMockDevices(company.companyId, company.companyName);
              
              return {
                companyId: company.companyId,
                companyName: company.companyName,
                location: company.location,
                walletAddress: company.walletAddress,
                devices: devices,
                totalCredits: company.credits.total,
                currentCredits: company.credits.current,
              };
            })
          );
          
          setCompanies(companiesWithDevices);
        } else {
          setError(companiesData.error || 'Failed to fetch companies');
        }
      } catch (err) {
        setError('Failed to fetch data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Generate mock device data (in real implementation, this would come from API)
  const generateMockDevices = async (companyId: number, companyName: string): Promise<Device[]> => {
    const deviceCount = 5 + Math.floor(Math.random() * 6); // 5-10 devices
    const devices: Device[] = [];
    
    for (let i = 0; i < deviceCount; i++) {
      devices.push({
        deviceId: companyId * 100 + i + 1,
        keyId: companyId * 10 + i + 1,
        companyId: companyId,
        sequesteredCarbonCredits: Math.random() * 100 + 10, // 10-110 credits
        companyName: companyName,
        location: `${companyName} Facility ${Math.floor(Math.random() * 5) + 1}`,
        apiKey: `cc_${Math.random().toString(36).substr(2, 16)}`,
        isActive: Math.random() > 0.1, // 90% active
        lastSeen: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
    
    return devices;
  };

  const formatCredits = (credits: number) => {
    return credits.toFixed(2);
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
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
        <span className="ml-3 text-gray-600">Loading IoT devices...</span>
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

  // If viewing specific company devices
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
            {selectedCompany.companyName} - IoT Devices
          </h2>
          <p className="text-gray-600">{formatWalletAddress(selectedCompany.walletAddress)}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{selectedCompany.devices.length}</div>
            <div className="text-sm text-gray-600">Total Devices</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">
              {selectedCompany.devices.filter(d => d.isActive).length}
            </div>
            <div className="text-sm text-gray-600">Active Devices</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">
              {formatCredits(selectedCompany.devices.reduce((sum, d) => sum + d.sequesteredCarbonCredits, 0))}
            </div>
            <div className="text-sm text-gray-600">Total Credits Generated</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {selectedCompany.devices.map((device) => (
            <Card key={device.deviceId} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Device #{device.deviceId}</h3>
                  <p className="text-sm text-gray-600">{device.location}</p>
                </div>
                <Badge className={getStatusColor(device.isActive || false)}>
                  {getStatusText(device.isActive || false)}
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Credits Generated:</span>
                  <span className="font-medium">{formatCredits(device.sequesteredCarbonCredits)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">API Key:</span>
                  <span className="font-mono text-xs">{device.apiKey?.slice(0, 12)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Seen:</span>
                  <span className="text-sm">{device.lastSeen ? formatDate(device.lastSeen) : 'Never'}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={() => {/* TODO: View device details */}}
                  className="flex-1"
                >
                  View Details
                </Button>
                <Button 
                  onClick={() => {/* TODO: View history */}}
                  variant="outline"
                  className="flex-1"
                >
                  View History
                </Button>
              </div>
            </Card>
          ))}
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
          <div className="text-sm text-gray-600">Companies</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-green-600">
            {companies.reduce((sum, c) => sum + c.devices.length, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Devices</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-purple-600">
            {companies.reduce((sum, c) => sum + c.devices.filter(d => d.isActive).length, 0)}
          </div>
          <div className="text-sm text-gray-600">Active Devices</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-orange-600">
            {formatCredits(companies.reduce((sum, c) => sum + c.devices.reduce((dSum, d) => dSum + d.sequesteredCarbonCredits, 0), 0))}
          </div>
          <div className="text-sm text-gray-600">Total Credits</div>
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
                <div className="text-2xl font-bold text-green-600">{company.devices.length}</div>
                <div className="text-xs text-gray-600">Devices</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {company.devices.filter(d => d.isActive).length}
                </div>
                <div className="text-xs text-gray-600">Active</div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Credits:</span>
                <span className="font-medium">{formatCredits(company.totalCredits)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Current Credits:</span>
                <span className="font-medium">{formatCredits(company.currentCredits)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Device Credits:</span>
                <span className="font-medium">
                  {formatCredits(company.devices.reduce((sum, d) => sum + d.sequesteredCarbonCredits, 0))}
                </span>
              </div>
            </div>

            <Button 
              onClick={() => setSelectedCompany(company)}
              className="w-full"
            >
              View Devices
            </Button>
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

'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/auth/context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';

interface Company {
  id: number;
  name: string;
  address?: string;
  website?: string;
  location?: string;
  walletAddress: string;
  credits?: {
    totalCredit: number;
    currentCredit: number;
    soldCredit: number;
    offerPrice?: number;
  };
}

interface ApiKey {
  id: number;
  key: string;
  companyId: number;
  companyName: string;
}

export default function MyCompanyPage() {
  const { isAuthenticated, authToken } = useUser();
  const [company, setCompany] = useState<Company | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showCreateApiKey, setShowCreateApiKey] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    address: '',
    website: '',
    location: '',
  });

  // API key form state
  const [newApiKey, setNewApiKey] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated && authToken) {
      fetchCompanyData();
    }
  }, [isAuthenticated, authToken]);

  const fetchCompanyData = async () => {
    try {
      if (!authToken) {
        return;
      }

      // Fetch company data
      const companyResponse = await fetch('/api/companies/my-company', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        if (companyData.success) {
          setCompany(companyData.company);
        } else if (companyData.needsCompany) {
          setCompany(null);
        }
      }

      // Fetch API keys
      const apiKeysResponse = await fetch('/api/companies/api-keys', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (apiKeysResponse.ok) {
        const apiKeysData = await apiKeysResponse.json();
        if (apiKeysData.success) {
          setApiKeys(apiKeysData.apiKeys);
        }
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
      setToast({ message: 'Failed to fetch company data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsCreatingCompany(true);
    try {
      if (!authToken) {
        setToast({ message: 'No authentication token found', type: 'error' });
        return;
      }

      const response = await fetch('/api/companies/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(companyForm),
      });

      const data = await response.json();
      
      if (data.success) {
        setCompany(data.company);
        setShowCreateCompany(false);
        setCompanyForm({ companyName: '', address: '', website: '', location: '' });
        setToast({ message: 'Company created successfully!', type: 'success' });
      } else {
        setToast({ message: data.error || 'Failed to create company', type: 'error' });
      }
    } catch (error) {
      console.error('Error creating company:', error);
      setToast({ message: 'Failed to create company', type: 'error' });
    } finally {
      setIsCreatingCompany(false);
    }
  };

  const handleCreateApiKey = async () => {
    try {
      if (!authToken) {
        setToast({ message: 'No authentication token found', type: 'error' });
        return;
      }

      const response = await fetch('/api/companies/api-keys/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setNewApiKey(data.apiKey.key);
        setApiKeys([...apiKeys, data.apiKey]);
        setToast({ message: 'API key created successfully!', type: 'success' });
      } else {
        setToast({ message: data.error || 'Failed to create API key', type: 'error' });
      }
    } catch (error) {
      console.error('Error creating API key:', error);
      setToast({ message: 'Failed to create API key', type: 'error' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setToast({ message: 'Copied to clipboard!', type: 'success' });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please connect your wallet to access your company dashboard.</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading company data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Company</h1>
          <p className="text-gray-600">Manage your company, API keys, and carbon credits</p>
        </div>

        {!company ? (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 text-center border-0 shadow-xl bg-gradient-to-br from-white to-emerald-50">
              <div className="text-8xl mb-6 animate-bounce">🏢</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Create Your Company</h2>
              <p className="text-gray-600 mb-8 text-lg">
                Start your carbon credit journey by creating a company profile. This will allow you to generate API keys and begin earning carbon credits through your IoT devices.
              </p>
              <Button
                onClick={() => setShowCreateCompany(true)}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                <span className="mr-2">✨</span>
                Create Company
              </Button>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Company Information */}
            <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-white to-emerald-50">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-2xl">🏢</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Company Information</h2>
              </div>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-emerald-100">
                  <label className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Company Name</label>
                  <p className="text-gray-900 font-medium mt-1">{company.name}</p>
                </div>
                {company.address && (
                  <div className="bg-white rounded-lg p-4 border border-emerald-100">
                    <label className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Address</label>
                    <p className="text-gray-900 mt-1">{company.address}</p>
                  </div>
                )}
                {company.website && (
                  <div className="bg-white rounded-lg p-4 border border-emerald-100">
                    <label className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Website</label>
                    <p className="text-gray-900 mt-1">
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 font-medium">
                        {company.website}
                      </a>
                    </p>
                  </div>
                )}
                {company.location && (
                  <div className="bg-white rounded-lg p-4 border border-emerald-100">
                    <label className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Location</label>
                    <p className="text-gray-900 mt-1">{company.location}</p>
                  </div>
                )}
                <div className="bg-white rounded-lg p-4 border border-emerald-100">
                  <label className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Wallet Address</label>
                  <p className="text-gray-900 font-mono text-sm mt-1 break-all">{company.walletAddress}</p>
                </div>
              </div>
            </Card>

            {/* Carbon Credits */}
            <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-white to-green-50">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-2xl">🌱</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Carbon Credits</h2>
              </div>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-green-700 uppercase tracking-wide">Total Credits</span>
                    <span className="text-2xl font-bold text-emerald-600">{(company.credits?.totalCredit || 0).toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">All credits earned from devices</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-green-700 uppercase tracking-wide">Available Credits</span>
                    <span className="text-2xl font-bold text-green-600">{(company.credits?.currentCredit || 0).toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Credits ready for trading</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-green-700 uppercase tracking-wide">Sold Credits</span>
                    <span className="text-2xl font-bold text-blue-600">{(company.credits?.soldCredit || 0).toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Credits sold in marketplace</p>
                </div>
                {company.credits?.offerPrice && (
                  <div className="bg-white rounded-lg p-4 border border-green-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-green-700 uppercase tracking-wide">Offer Price</span>
                      <span className="text-2xl font-bold text-purple-600">${company.credits.offerPrice.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Price per credit</p>
                  </div>
                )}
              </div>
            </Card>

            {/* API Keys */}
            <Card className="p-6 lg:col-span-2 border-0 shadow-lg bg-gradient-to-br from-white to-blue-50">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                    <span className="text-2xl">🔑</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">API Keys</h2>
                </div>
                <Button
                  onClick={() => setShowCreateApiKey(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <span className="mr-2">➕</span>
                  Create API Key
                </Button>
              </div>
              
              {apiKeys.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🔑</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No API Keys Yet</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Create your first API key to start connecting IoT devices and generating carbon credits.
                  </p>
                  <Button
                    onClick={() => setShowCreateApiKey(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <span className="mr-2">🚀</span>
                    Create Your First API Key
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="bg-white rounded-xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-sm">🔑</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">API Key #{apiKey.id}</h4>
                            <p className="text-sm text-gray-500">{apiKey.companyName}</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => copyToClipboard(apiKey.key)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          📋 Copy
                        </Button>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border">
                        <p className="font-mono text-sm text-gray-700 break-all">
                          {apiKey.key}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Create Company Modal */}
        <Modal
          isOpen={showCreateCompany}
          onClose={() => setShowCreateCompany(false)}
          title=""
        >
          <div className="p-6">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏢</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Company</h2>
              <p className="text-gray-600">Fill in your company details to get started</p>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-6">
              {/* Company Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyForm.companyName}
                  onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 bg-white"
                  placeholder="Enter your company name"
                  required
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Address
                </label>
                <textarea
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 bg-white resize-none"
                  placeholder="Enter your company address"
                  rows={3}
                />
              </div>

              {/* Website */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Website
                </label>
                <input
                  type="text"
                  value={companyForm.website}
                  onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 bg-white"
                  placeholder="https://yourcompany.com"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  value={companyForm.location}
                  onChange={(e) => setCompanyForm({ ...companyForm, location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 bg-white"
                  placeholder="City, Country"
                />
              </div>

              {/* Benefits */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
                <h3 className="font-semibold text-emerald-800 mb-2">✨ What you'll get:</h3>
                <ul className="text-sm text-emerald-700 space-y-1">
                  <li>• Generate unlimited API keys for your devices</li>
                  <li>• Start earning carbon credits immediately</li>
                  <li>• Track your environmental impact</li>
                  <li>• Access to carbon credit marketplace</li>
                </ul>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowCreateCompany(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreatingCompany}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isCreatingCompany ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🚀</span>
                      Create Company
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Create API Key Modal */}
        <Modal
          isOpen={showCreateApiKey}
          onClose={() => setShowCreateApiKey(false)}
          title=""
        >
          <div className="p-6">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔑</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create API Key</h2>
              <p className="text-gray-600">Generate a new API key for your IoT devices</p>
            </div>

            <div className="space-y-6">
              {/* Info Box */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">🔐 How it works:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use this key to authenticate your IoT devices</li>
                  <li>• Each device needs this key to send data</li>
                  <li>• Keep your API key secure and private</li>
                  <li>• You can create multiple keys for different devices</li>
                </ul>
              </div>

              {newApiKey && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center mb-3">
                    <span className="text-green-600 text-xl mr-2">✅</span>
                    <h3 className="font-semibold text-green-800">API Key Created Successfully!</h3>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200 mb-4">
                    <p className="text-xs text-gray-500 mb-2">Your API Key:</p>
                    <p className="font-mono text-sm bg-gray-100 p-3 rounded border break-all">
                      {newApiKey}
                    </p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <span className="font-semibold">⚠️ Important:</span> Copy this key now! You won't be able to see it again.
                    </p>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  onClick={() => setShowCreateApiKey(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  {newApiKey ? 'Close' : 'Cancel'}
                </Button>
                {!newApiKey && (
                  <Button
                    onClick={handleCreateApiKey}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <span className="mr-2">🔑</span>
                    Generate API Key
                  </Button>
                )}
                {newApiKey && (
                  <Button
                    onClick={() => copyToClipboard(newApiKey)}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <span className="mr-2">📋</span>
                    Copy Key
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}

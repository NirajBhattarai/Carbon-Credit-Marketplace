'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Toast } from '@/components/ui/Toast'
import { CustomConnectButton } from '@/components/ConnectButton'
import { AuthenticationStatus, ManualAuthenticationTrigger } from '@/components/auth/AuthenticationHandler'
import { useUser } from '@/lib/auth/context'

interface Application {
  id: string
  name: string
  description: string
  website: string
  status: string
  createdAt: string
  updatedAt: string
  // Single API Key field
  apiKey?: string | null
}

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  status: string
  lastUsed: string | null
  expiresAt: string | null
  createdAt: string
}

interface NewApiKey {
  key: string
  token: string
  name: string
  expiresAt: string | null
  permissions: string[]
}

export function DeveloperDashboard() {
  const { address, isConnected } = useAccount()
  const { user, isAuthenticated } = useUser()
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateApp, setShowCreateApp] = useState(false)
  const [showCreateKey, setShowCreateKey] = useState(false)
  const [newApiKey, setNewApiKey] = useState<NewApiKey | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Form states
  const [appForm, setAppForm] = useState({
    name: '',
    description: '',
    website: ''
  })
  const [keyForm, setKeyForm] = useState({
    name: '',
    expiresInDays: 30,
    permissions: ['read:devices', 'write:devices']
  })

  useEffect(() => {
    if (isConnected && address && isAuthenticated && user) {
      fetchApplications()
    }
  }, [isConnected, address, isAuthenticated, user])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setToast({ message: 'Please login first', type: 'error' })
        return
      }

      const response = await fetch('/api/developer/applications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch applications')
      }

      const data = await response.json()
      setApplications(data.applications)
    } catch (error) {
      console.error('Error fetching applications:', error)
      setToast({ message: 'Failed to fetch applications', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const fetchApiKeys = async (applicationId: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch(`/api/developer/applications/${applicationId}/api-keys`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch API keys')
      }

      const data = await response.json()
      setApiKeys(data.apiKeys)
    } catch (error) {
      console.error('Error fetching API keys:', error)
      setToast({ message: 'Failed to fetch API keys', type: 'error' })
    }
  }

  const createApplication = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setToast({ message: 'Please login first', type: 'error' })
        return
      }

      const response = await fetch('/api/developer/applications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appForm)
      })

      if (!response.ok) {
        throw new Error('Failed to create application')
      }

      const data = await response.json()
      setApplications([...applications, data.application])
      setAppForm({ name: '', description: '', website: '' })
      setShowCreateApp(false)
      
      // Show the API key if it was created
      if (data.apiKey) {
        setNewApiKey(data.apiKey)
      }
      
      setToast({ message: 'Application created successfully with API key', type: 'success' })
    } catch (error) {
      console.error('Error creating application:', error)
      setToast({ message: 'Failed to create application', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const createApiKey = async () => {
    if (!selectedApp) return

    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setToast({ message: 'Please login first', type: 'error' })
        return
      }

      const response = await fetch(`/api/developer/applications/${selectedApp.id}/api-keys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(keyForm)
      })

      if (!response.ok) {
        throw new Error('Failed to create API key')
      }

      const data = await response.json()
      setNewApiKey(data.apiKey)
      setKeyForm({ name: '', expiresInDays: 30, permissions: ['read:devices', 'write:devices'] })
      setShowCreateKey(false)
      fetchApiKeys(selectedApp.id)
      setToast({ message: 'API key created successfully', type: 'success' })
    } catch (error) {
      console.error('Error creating API key:', error)
      setToast({ message: 'Failed to create API key', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const revokeApiKey = async (keyId: string) => {
    if (!selectedApp) return

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setToast({ message: 'Please login first', type: 'error' })
        return
      }

      const response = await fetch(`/api/developer/applications/${selectedApp.id}/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to revoke API key')
      }

      fetchApiKeys(selectedApp.id)
      setToast({ message: 'API key revoked successfully', type: 'success' })
    } catch (error) {
      console.error('Error revoking API key:', error)
      setToast({ message: 'Failed to revoke API key', type: 'error' })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setToast({ message: 'Copied to clipboard', type: 'success' })
  }

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Developer Dashboard</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to access the developer dashboard.</p>
          <div className="flex flex-col items-center gap-4">
            <CustomConnectButton />
            <AuthenticationStatus />
          </div>
        </Card>
      </div>
    )
  }

  if (isConnected && !isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Developer Dashboard</h2>
          <p className="text-gray-600 mb-6">Wallet connected! Please authenticate to access the dashboard.</p>
          <div className="flex flex-col items-center gap-4">
            <CustomConnectButton />
            <AuthenticationStatus />
            <div className="mt-4">
              <ManualAuthenticationTrigger />
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Developer Dashboard</h1>
            <p className="text-gray-600">Manage your applications and API keys for IoT device integration</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <CustomConnectButton />
            <AuthenticationStatus />
          </div>
        </div>
      </div>

      {/* User Info Section */}
      {user && (
        <div className="mb-8">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Welcome, {user.username || user.name || 'Developer'}!</h3>
                <p className="text-sm text-gray-600">
                  Wallet: {user.walletAddress || address}
                </p>
                <p className="text-sm text-gray-600">
                  Role: {user.role === 'DEVELOPER' ? 'Developer' : user.role === 'ADMIN' ? 'Admin' : 'User'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Account Status</p>
                <span className={`px-2 py-1 rounded text-xs ${
                  user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {user.isVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Applications Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Applications</h2>
            <p className="text-gray-600 mt-1">Manage your applications and API keys</p>
          </div>
          <Button 
            onClick={() => setShowCreateApp(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow duration-150 border-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Application
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {applications.map((app) => (
            <Card 
              key={app.id} 
              className={`group relative overflow-hidden transition-all duration-300 cursor-pointer border-2 ${
                selectedApp?.id === app.id 
                  ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' 
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-md hover:scale-102'
              }`}
              onClick={() => {
                setSelectedApp(app)
              }}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {app.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {app.description || 'No description provided'}
                    </p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    app.status === 'ACTIVE' ? 'bg-green-400' : 'bg-gray-400'
                  }`}></div>
                </div>

                {/* API Key Section */}
                {app.apiKey && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-xs font-medium text-green-800">API Key Active</span>
                      </div>
                      <span className="text-xs text-green-600 font-mono">
                        {app.apiKey.substring(0, 12)}...
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-700">Ready for integration</span>
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs text-gray-500">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span>Click to view</span>
                    <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Selection Indicator */}
              {selectedApp?.id === app.id && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {applications.length === 0 && !loading && (
          <Card className="p-12 text-center border-2 border-dashed border-gray-300 bg-gray-50/50">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Yet</h3>
              <p className="text-gray-600 mb-6">Create your first application to start building with our API and manage your IoT devices.</p>
              <Button onClick={() => setShowCreateApp(true)} className="bg-blue-600 hover:bg-blue-700 rounded-md font-semibold px-6 py-3 shadow-md hover:shadow-lg transition-shadow duration-150 border-0">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Application
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* API Key Section */}
      {selectedApp && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">API Key Details</h2>
              <p className="text-gray-600 mt-1">Manage your API key for {selectedApp.name}</p>
            </div>
            {selectedApp.apiKey && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setNewApiKey({
                    key: selectedApp.apiKey!,
                    token: 'JWT token available',
                    name: `${selectedApp.name} API Key`,
                    expiresAt: null,
                    permissions: ['read:devices', 'write:devices']
                  })
                }}
                className="flex items-center gap-2 rounded-md border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 font-semibold px-4 py-2 transition-colors duration-150"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Full Key
              </Button>
            )}
          </div>

          {selectedApp.apiKey ? (
            <Card className="overflow-hidden border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{selectedApp.name} API Key</h3>
                        <p className="text-sm text-gray-600">Ready for integration</p>
                      </div>
                    </div>
                    
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 mb-4 border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">API Key</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-600 font-medium">ACTIVE</span>
                        </div>
                      </div>
                      <div className="font-mono text-sm text-gray-800 bg-gray-100 px-3 py-2 rounded border">
                        {selectedApp.apiKey.substring(0, 30)}...
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs font-medium text-gray-600">Created</span>
                        </div>
                        <p className="text-sm text-gray-800">{new Date(selectedApp.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs font-medium text-gray-600">Permissions</span>
                        </div>
                        <p className="text-sm text-gray-800">2 scopes</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-600 mb-2">Available Permissions</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                          read:devices
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                          write:devices
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3 ml-6">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedApp.apiKey!)
                        setToast({ message: 'API key copied to clipboard', type: 'success' })
                      }}
                      className="flex items-center gap-2 bg-white hover:bg-gray-50 rounded-md border-2 border-gray-300 hover:border-gray-400 font-semibold px-3 py-2 transition-colors duration-150"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Key
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        console.log('Revoke API key for application:', selectedApp.id)
                      }}
                      className="flex items-center gap-2 bg-white hover:bg-red-50 rounded-md border-2 border-red-300 hover:border-red-400 font-semibold px-3 py-2 transition-colors duration-150 text-red-600 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Revoke
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center border-2 border-dashed border-gray-300 bg-gray-50/50">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H3a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No API Key Found</h3>
                <p className="text-gray-600 mb-6">This application doesn't have an API key yet. Create one to start integrating with our services.</p>
                <Button onClick={() => setShowCreateKey(true)} className="bg-blue-600 hover:bg-blue-700 rounded-md font-semibold px-6 py-3 shadow-md hover:shadow-lg transition-shadow duration-150 border-0">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Create API Key
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Create Application Modal */}
      <Modal
        isOpen={showCreateApp}
        onClose={() => setShowCreateApp(false)}
        title=""
      >
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Application</h2>
            <p className="text-gray-600">Set up your application to start integrating with our IoT platform and manage your devices.</p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Application Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Application Name
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  value={appForm.name}
                  onChange={(e) => setAppForm({ ...appForm, name: e.target.value })}
                  placeholder="Enter your application name"
                  className="pl-4 pr-4 py-3 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-0 rounded-xl transition-all duration-200"
                />
                {appForm.name && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">This will be displayed on your application cards and used for identification.</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Description
              </label>
              <textarea
                value={appForm.description}
                onChange={(e) => setAppForm({ ...appForm, description: e.target.value })}
                placeholder="Describe what your application does and how it will use our IoT platform..."
                rows={3}
                className="w-full px-4 py-3 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-0 rounded-xl transition-all duration-200 resize-none"
              />
              <p className="text-xs text-gray-500">Optional: Help others understand your application's purpose.</p>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
                Website URL
              </label>
              <div className="relative">
                <Input
                  value={appForm.website}
                  onChange={(e) => setAppForm({ ...appForm, website: e.target.value })}
                  placeholder="https://your-website.com"
                  className="pl-4 pr-4 py-3 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-0 rounded-xl transition-all duration-200"
                />
                {appForm.website && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">Optional: Link to your application's website or documentation.</p>
            </div>

            {/* API Key Info */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-green-800 mb-1">API Key Included</h4>
                  <p className="text-sm text-green-700">Your application will automatically receive an API key with read and write permissions for IoT devices.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-8 border-t border-gray-200 mt-8">
            <Button 
              onClick={createApplication} 
              disabled={loading || !appForm.name}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md font-semibold shadow-md hover:shadow-lg transition-shadow duration-150 disabled:opacity-50 disabled:cursor-not-allowed border-0"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Creating Application...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Create Application
                </div>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateApp(false)}
              className="px-6 py-3 rounded-md font-semibold border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 transition-colors duration-150"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create API Key Modal */}
      <Modal
        isOpen={showCreateKey}
        onClose={() => setShowCreateKey(false)}
        title=""
      >
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Create API Key</h2>
            <p className="text-gray-600 text-sm">Add an API key to your application for device integration.</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Key Name
                <span className="text-red-500">*</span>
              </label>
              <Input
                value={keyForm.name}
                onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })}
                placeholder="e.g., Production Key, Development Key"
                className="pl-4 pr-4 py-3 text-base border-2 border-gray-200 focus:border-green-500 focus:ring-0 rounded-xl transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Expires In (Days)
              </label>
              <Input
                type="number"
                value={keyForm.expiresInDays}
                onChange={(e) => setKeyForm({ ...keyForm, expiresInDays: parseInt(e.target.value) })}
                placeholder="30"
                className="pl-4 pr-4 py-3 text-base border-2 border-gray-200 focus:border-green-500 focus:ring-0 rounded-xl transition-all duration-200"
              />
              <p className="text-xs text-gray-500">Leave empty for no expiration</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6">
            <Button 
              onClick={createApiKey} 
              disabled={loading || !keyForm.name}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-md font-semibold shadow-md hover:shadow-lg transition-shadow duration-150 disabled:opacity-50 disabled:cursor-not-allowed border-0"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Creating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                  </svg>
                  Create API Key
                </div>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateKey(false)}
              className="px-6 py-3 rounded-md font-semibold border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 transition-colors duration-150"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* New API Key Modal */}
      <Modal
        isOpen={!!newApiKey}
        onClose={() => setNewApiKey(null)}
        title="API Key Created"
      >
        {newApiKey && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <p className="text-sm text-yellow-800 mb-2">
                <strong>Important:</strong> This is the only time you'll see the full API key. Make sure to copy it and store it securely.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">API Key</label>
              <div className="flex gap-2">
                <Input
                  value={newApiKey.key}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button 
                  variant="outline" 
                  onClick={() => copyToClipboard(newApiKey.key)}
                >
                  Copy
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">JWT Token</label>
              <div className="flex gap-2">
                <Input
                  value={newApiKey.token}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button 
                  variant="outline" 
                  onClick={() => copyToClipboard(newApiKey.token)}
                >
                  Copy
                </Button>
              </div>
            </div>
            <div className="pt-4">
              <Button onClick={() => setNewApiKey(null)}>
                I've Saved the Key
              </Button>
            </div>
          </div>
        )}
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
  )
}

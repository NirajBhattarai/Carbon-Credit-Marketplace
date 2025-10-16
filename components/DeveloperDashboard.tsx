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
      setToast({ message: 'Application created successfully', type: 'success' })
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Applications</h2>
          <Button onClick={() => setShowCreateApp(true)}>
            Create Application
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {applications.map((app) => (
            <Card 
              key={app.id} 
              className={`p-4 cursor-pointer transition-colors ${
                selectedApp?.id === app.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => {
                setSelectedApp(app)
                fetchApiKeys(app.id)
              }}
            >
              <h3 className="font-semibold mb-2">{app.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{app.description}</p>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded text-xs ${
                  app.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {app.status}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(app.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Card>
          ))}
        </div>

        {applications.length === 0 && !loading && (
          <Card className="p-8 text-center">
            <p className="text-gray-600 mb-4">No applications found. Create your first application to get started.</p>
            <Button onClick={() => setShowCreateApp(true)}>
              Create Application
            </Button>
          </Card>
        )}
      </div>

      {/* API Keys Section */}
      {selectedApp && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">API Keys for {selectedApp.name}</h2>
            <Button onClick={() => setShowCreateKey(true)}>
              Create API Key
            </Button>
          </div>

          <div className="space-y-4">
            {apiKeys.map((key) => (
              <Card key={key.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{key.name}</h3>
                    <p className="text-sm text-gray-600 font-mono">
                      {key.keyPrefix}...
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        key.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {key.status}
                      </span>
                      {key.lastUsed && (
                        <span className="text-xs text-gray-500">
                          Last used: {new Date(key.lastUsed).toLocaleDateString()}
                        </span>
                      )}
                      {key.expiresAt && (
                        <span className="text-xs text-gray-500">
                          Expires: {new Date(key.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {key.status === 'ACTIVE' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => revokeApiKey(key.id)}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {apiKeys.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-gray-600 mb-4">No API keys found. Create your first API key to start integrating IoT devices.</p>
                <Button onClick={() => setShowCreateKey(true)}>
                  Create API Key
                </Button>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Create Application Modal */}
      <Modal
        isOpen={showCreateApp}
        onClose={() => setShowCreateApp(false)}
        title="Create Application"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Application Name</label>
            <Input
              value={appForm.name}
              onChange={(e) => setAppForm({ ...appForm, name: e.target.value })}
              placeholder="My IoT Application"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Input
              value={appForm.description}
              onChange={(e) => setAppForm({ ...appForm, description: e.target.value })}
              placeholder="Description of your application"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Website (Optional)</label>
            <Input
              value={appForm.website}
              onChange={(e) => setAppForm({ ...appForm, website: e.target.value })}
              placeholder="https://your-website.com"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={createApplication} disabled={loading || !appForm.name}>
              {loading ? 'Creating...' : 'Create Application'}
            </Button>
            <Button variant="outline" onClick={() => setShowCreateApp(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create API Key Modal */}
      <Modal
        isOpen={showCreateKey}
        onClose={() => setShowCreateKey(false)}
        title="Create API Key"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Key Name</label>
            <Input
              value={keyForm.name}
              onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })}
              placeholder="Production Key"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Expires In (Days)</label>
            <Input
              type="number"
              value={keyForm.expiresInDays}
              onChange={(e) => setKeyForm({ ...keyForm, expiresInDays: parseInt(e.target.value) })}
              placeholder="30"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={createApiKey} disabled={loading || !keyForm.name}>
              {loading ? 'Creating...' : 'Create API Key'}
            </Button>
            <Button variant="outline" onClick={() => setShowCreateKey(false)}>
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

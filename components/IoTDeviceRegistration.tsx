'use client'

import { useState } from 'react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Card } from './ui/Card'
import { Modal, ModalHeader, ModalContent, ModalFooter } from './ui/Modal'

// Enhanced Toast component
interface ToastProps {
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  onClose: () => void
}

function Toast({ message, type, onClose }: ToastProps) {
  const variants = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  const icons = {
    success: (
      <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    )
  }

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white border rounded-xl shadow-xl p-4 flex items-start space-x-3 ${variants[type]} animate-in slide-in-from-right-full duration-300`}>
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

interface DeviceRegistrationData {
  deviceId: string
  deviceType: 'SEQUESTER' | 'EMITTER'
  location: string
  projectName: string
  description?: string
}

interface IoTDeviceRegistrationProps {
  onDeviceRegistered?: (device: any) => void
}

export function IoTDeviceRegistration({ onDeviceRegistered }: IoTDeviceRegistrationProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<DeviceRegistrationData>({
    deviceId: '',
    deviceType: 'SEQUESTER',
    location: '',
    projectName: '',
    description: ''
  })
  const [errors, setErrors] = useState<Partial<DeviceRegistrationData>>({})
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const validateForm = (): boolean => {
    const newErrors: Partial<DeviceRegistrationData> = {}

    if (!formData.deviceId.trim()) {
      newErrors.deviceId = 'Device ID is required'
    } else if (!/^[A-Za-z0-9_-]+$/.test(formData.deviceId)) {
      newErrors.deviceId = 'Device ID can only contain letters, numbers, hyphens, and underscores'
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required'
    }

    if (!formData.projectName.trim()) {
      newErrors.projectName = 'Project name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof DeviceRegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/iot/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        setToast({ message: 'Device registered successfully!', type: 'success' })
        setIsModalOpen(false)
        setFormData({
          deviceId: '',
          deviceType: 'SEQUESTER',
          location: '',
          projectName: '',
          description: ''
        })
        onDeviceRegistered?.(result.device)
      } else {
        setToast({ message: result.message || 'Failed to register device', type: 'error' })
      }
    } catch (error) {
      console.error('Device registration error:', error)
      setToast({ message: 'Network error. Please try again.', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const openModal = () => {
    setIsModalOpen(true)
    setErrors({})
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setFormData({
      deviceId: '',
      deviceType: 'SEQUESTER',
      location: '',
      projectName: '',
      description: ''
    })
    setErrors({})
  }

  return (
    <>
      <Button 
        onClick={openModal} 
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200"
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        }
        size="lg"
      >
        Register IoT Device
      </Button>

      <Modal isOpen={isModalOpen} onClose={closeModal} size="lg">
        <ModalHeader onClose={closeModal}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Register IoT Device</h2>
              <p className="text-sm text-gray-500">Add a new device to monitor carbon credits</p>
            </div>
          </div>
        </ModalHeader>

        <ModalContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Device ID */}
            <div className="space-y-2">
              <label htmlFor="deviceId" className="flex items-center text-sm font-medium text-gray-700">
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Device ID *
              </label>
              <Input
                id="deviceId"
                type="text"
                value={formData.deviceId}
                onChange={(e) => handleInputChange('deviceId', e.target.value)}
                placeholder="e.g., SEQUESTER_001, EMITTER_001"
                error={errors.deviceId}
                helperText="Use letters, numbers, hyphens, and underscores only"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                }
              />
            </div>

            {/* Device Type */}
            <div className="space-y-2">
              <label htmlFor="deviceType" className="flex items-center text-sm font-medium text-gray-700">
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                Device Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  formData.deviceType === 'SEQUESTER' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="deviceType"
                    value="SEQUESTER"
                    checked={formData.deviceType === 'SEQUESTER'}
                    onChange={(e) => handleInputChange('deviceType', e.target.value as 'SEQUESTER' | 'EMITTER')}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`p-1 rounded ${formData.deviceType === 'SEQUESTER' ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <svg className={`w-4 h-4 ${formData.deviceType === 'SEQUESTER' ? 'text-green-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className={`font-medium ${formData.deviceType === 'SEQUESTER' ? 'text-green-700' : 'text-gray-700'}`}>
                      SEQUESTER
                    </span>
                  </div>
                  <p className={`text-xs ${formData.deviceType === 'SEQUESTER' ? 'text-green-600' : 'text-gray-500'}`}>
                    Carbon sequestration device
                  </p>
                </label>

                <label className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  formData.deviceType === 'EMITTER' 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="deviceType"
                    value="EMITTER"
                    checked={formData.deviceType === 'EMITTER'}
                    onChange={(e) => handleInputChange('deviceType', e.target.value as 'SEQUESTER' | 'EMITTER')}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`p-1 rounded ${formData.deviceType === 'EMITTER' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                      <svg className={`w-4 h-4 ${formData.deviceType === 'EMITTER' ? 'text-orange-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      </svg>
                    </div>
                    <span className={`font-medium ${formData.deviceType === 'EMITTER' ? 'text-orange-700' : 'text-gray-700'}`}>
                      EMITTER
                    </span>
                  </div>
                  <p className={`text-xs ${formData.deviceType === 'EMITTER' ? 'text-orange-600' : 'text-gray-500'}`}>
                    Carbon emission device
                  </p>
                </label>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label htmlFor="location" className="flex items-center text-sm font-medium text-gray-700">
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Location *
              </label>
              <Input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., Solar Farm Alpha, Wind Turbine Site B"
                error={errors.location}
                helperText="Physical location or site name"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              />
            </div>

            {/* Project Name */}
            <div className="space-y-2">
              <label htmlFor="projectName" className="flex items-center text-sm font-medium text-gray-700">
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Project Name *
              </label>
              <Input
                id="projectName"
                type="text"
                value={formData.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                placeholder="e.g., Green Energy Initiative, Carbon Offset Project"
                error={errors.projectName}
                helperText="Name of the carbon credit project"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                }
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="flex items-center text-sm font-medium text-gray-700">
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Description (Optional)
              </label>
              <div className="relative">
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Additional details about the device, specifications, or project context..."
                  rows={4}
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-start pt-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </form>
        </ModalContent>

        <ModalFooter>
          <div className="flex justify-end space-x-3 w-full">
            <Button
              type="button"
              onClick={closeModal}
              variant="outline"
              disabled={isLoading}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading}
              isLoading={isLoading}
              className="px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              leftIcon={
                !isLoading && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )
              }
            >
              {isLoading ? 'Registering Device...' : 'Register Device'}
            </Button>
          </div>
        </ModalFooter>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}

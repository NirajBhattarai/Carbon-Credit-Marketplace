import { RealTimeDashboard } from '@/components/RealTimeDashboard'
import { MQTTStatusIndicator } from '@/components/MQTTStatusIndicator'

export default function IoTDataPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">IoT Data Monitor</h1>
              <p className="mt-2 text-gray-600">
                Real-time monitoring of carbon credit IoT devices
              </p>
            </div>
            <MQTTStatusIndicator showDetails={true} />
          </div>
        </div>

        {/* Real-time Dashboard */}
        <RealTimeDashboard />
      </div>
    </div>
  )
}

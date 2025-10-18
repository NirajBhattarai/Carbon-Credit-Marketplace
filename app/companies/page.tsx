import { CompaniesDashboard } from '@/components/CompaniesDashboard';
import { MQTTStatusIndicator } from '@/components/MQTTStatusIndicator';
import { MQTTProvider } from '@/lib/mqtt/context';

export default function CompaniesPage() {
  return (
    <MQTTProvider>
      <div className='min-h-screen bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          {/* Page Header */}
          <div className='mb-8'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>
                  Companies & IoT Monitor
                </h1>
                <p className='mt-2 text-gray-600'>
                  View all companies and real-time IoT device monitoring via MQTT
                </p>
              </div>
              <MQTTStatusIndicator showDetails={true} />
            </div>
          </div>

          {/* Companies Dashboard with IoT Data */}
          <CompaniesDashboard />
        </div>
      </div>
    </MQTTProvider>
  );
}

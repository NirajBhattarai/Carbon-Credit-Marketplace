import { TimeSeriesDataPage } from '@/components/TimeSeriesDataPage';
import { MQTTProvider } from '@/lib/mqtt/context';

export default function TimeSeriesPage() {
  return (
    <MQTTProvider>
      <div className='min-h-screen bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <TimeSeriesDataPage />
        </div>
      </div>
    </MQTTProvider>
  );
}

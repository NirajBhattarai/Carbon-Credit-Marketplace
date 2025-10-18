import { CompaniesDashboard } from '@/components/CompaniesDashboard';

export default function CompaniesPage() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Page Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>
            Companies
          </h1>
          <p className='mt-2 text-gray-600'>
            View all companies participating in the carbon credit marketplace
          </p>
        </div>

        {/* Companies Dashboard */}
        <CompaniesDashboard />
      </div>
    </div>
  );
}

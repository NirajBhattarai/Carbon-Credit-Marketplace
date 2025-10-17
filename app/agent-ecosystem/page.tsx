/**
 * Agent Ecosystem Page
 * Displays the carbon credit trading agent ecosystem
 */

import { AgentEcosystemDashboard } from '@/components/AgentEcosystemDashboard';

export default function AgentEcosystemPage() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <AgentEcosystemDashboard />
      </div>
    </div>
  );
}

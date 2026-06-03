import React, { memo } from 'react';
import { BarChart2, Droplets } from 'lucide-react';
import PumpAnalyticsCard from '@/components/PumpAnalyticsCard';
import ConsumptionCard from '@/components/ConsumptionCard';
import SystemHealthCard from '@/components/SystemHealthCard';
import HistoricalAnalyticsCard from '@/components/HistoricalAnalyticsCard';

const IntakeAnalyticsPage = memo(() => {
  return (
    <div className="min-h-screen flex flex-col bg-background grid-pattern">
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-8 opacity-0 animate-fade-in">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/10">
            <Droplets className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Intake Analytics</h2>
            <p className="text-sm text-muted-foreground">Historical performance and system health</p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 ring-1 ring-blue-500/20">
            <BarChart2 className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Intake Section</span>
          </div>
        </div>
        
        <div className="space-y-4 sm:space-y-6 opacity-0 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
            <PumpAnalyticsCard section="intake" pumpIds={['INT-Pump1', 'INT-Pump2']} />
            <ConsumptionCard section="intake" />
          </div>
          <SystemHealthCard section="intake" />
          <HistoricalAnalyticsCard section="intake" />
        </div>
      </main>
    </div>
  );
});

IntakeAnalyticsPage.displayName = 'IntakeAnalyticsPage';
export default IntakeAnalyticsPage;

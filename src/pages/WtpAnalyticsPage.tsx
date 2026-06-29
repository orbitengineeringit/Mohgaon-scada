import React, { memo } from 'react';
import { BarChart2, FlaskConical } from 'lucide-react';
import PumpAnalyticsCard from '@/components/PumpAnalyticsCard';
import ConsumptionCard from '@/components/ConsumptionCard';
import SystemHealthCard from '@/components/SystemHealthCard';
import HistoricalAnalyticsCard from '@/components/HistoricalAnalyticsCard';

const WtpAnalyticsPage = memo(() => {
  return (
    <div className="min-h-screen flex flex-col bg-background grid-pattern">
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-8 opacity-0 animate-fade-in">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/10 ring-1 ring-purple-500/20 shadow-lg shadow-purple-500/10">
            <FlaskConical className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">WTP Analytics</h2>
            <p className="text-sm text-muted-foreground">Production efficiency and plant health</p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 ring-1 ring-purple-500/20">
            <BarChart2 className="h-4 w-4 text-purple-500" />
            <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">WTP Section</span>
          </div>
        </div>
        
        <div className="space-y-4 sm:space-y-6 opacity-0 animate-fade-in" style={{ animationDelay: '250ms' }}>
          <PumpAnalyticsCard section="wtp" pumpIds={['WTP-Pump1', 'WTP-Pump2', 'WTP-Pump3', 'WTP-Pump4']} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
            <ConsumptionCard section="wtp" />
            <SystemHealthCard section="wtp" />
          </div>
          <HistoricalAnalyticsCard section="wtp" />
        </div>
      </main>
    </div>
  );
});

WtpAnalyticsPage.displayName = 'WtpAnalyticsPage';
export default WtpAnalyticsPage;

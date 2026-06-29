import React from 'react';
import PlantAssistant from '@/components/chat/PlantAssistant';
import { Sparkles } from 'lucide-react';

const AssistantPage: React.FC = () => {
  return (
    <div className="h-[calc(100dvh-4rem)] flex flex-col container mx-auto px-3 sm:px-4 py-3 sm:py-4 max-w-4xl overflow-hidden">
      <div className="flex items-center gap-3 mb-3 sm:mb-4 shrink-0">
        <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-foreground leading-tight">Plant Assistant</h1>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
            Ask anything about your plant — pumps, consumption, alarms, levels. Hindi ya English.
          </p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <PlantAssistant variant="full" />
      </div>
    </div>
  );
};

export default AssistantPage;

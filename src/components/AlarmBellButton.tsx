import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AlarmBellButtonProps {
  hasAlarmConfig?: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  iconClassName?: string;
}

export const AlarmBellButton: React.FC<AlarmBellButtonProps> = ({
  onClick,
  className = "h-8 w-8", 
  iconClassName = "h-4 w-4"
}) => {
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`
            transition-all duration-200 shrink-0
            focus-visible:ring-2 focus-visible:ring-primary/30
            hover:bg-primary/10 text-muted-foreground hover:text-primary
            ${className}
          `}
          onClick={onClick}
        >
          <Bell className={`${iconClassName}`} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="z-[100] bg-popover text-popover-foreground border border-border shadow-lg">
        <p className="font-medium text-xs">
          🔔 Configure Alarms
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

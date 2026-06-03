import React from 'react';
import { Radio, Wifi, WifiOff, Loader2, Activity } from 'lucide-react';
import { useMqtt } from '@/contexts/MqttContext';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MqttStatusProps {
  compact?: boolean;
}

export const MqttStatus: React.FC<MqttStatusProps> = ({ compact = false }) => {
  const { isConnected, isConnecting, messagesPerSecond, config, lastMessage } = useMqtt();

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin text-warning" />
            ) : isConnected ? (
              <Radio className="h-4 w-4 text-success animate-pulse" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            )}
            {isConnected && messagesPerSecond > 0 && (
              <span className="text-xs font-mono text-success">{messagesPerSecond}/s</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isConnected ? 'MQTT Connected' : isConnecting ? 'Connecting...' : 'MQTT Disconnected'}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/50 border border-border">
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        {isConnecting ? (
          <Loader2 className="h-4 w-4 animate-spin text-warning" />
        ) : isConnected ? (
          <Wifi className="h-4 w-4 text-success" />
        ) : (
          <WifiOff className="h-4 w-4 text-muted-foreground" />
        )}
        <span className={cn(
          "text-sm font-medium",
          isConnected ? "text-success" : isConnecting ? "text-warning" : "text-muted-foreground"
        )}>
          {isConnecting ? 'Connecting...' : isConnected ? 'MQTT Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Message Rate */}
      {isConnected && (
        <>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-mono text-muted-foreground">
              {messagesPerSecond} msg/s
            </span>
          </div>
        </>
      )}

      {/* Last Message */}
      {isConnected && lastMessage && (
        <>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <div className={cn(
              "w-2 h-2 rounded-full",
              lastMessage.section === 'oht' ? "bg-primary" : "bg-accent"
            )} />
            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
              {lastMessage.topic.split('/').pop()}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

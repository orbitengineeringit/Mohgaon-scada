import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import StatusBar from '@/components/StatusBar';
import GlobalFilterBar, { GlobalFilters, AssetFilter } from '@/components/GlobalFilterBar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Trash2, CheckCircle2, AlertTriangle, BellRing } from 'lucide-react';
import { useAlarm } from '@/contexts/AlarmContext';
import { format, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

const AlarmsPage: React.FC = () => {
    const { alarms, clearAlarms, acknowledgeAll } = useAlarm();
    const [filter, setFilter] = useState<'all' | 'high' | 'low'>('all');
    const [globalFilters, setGlobalFilters] = useState<GlobalFilters>({
      startDate: undefined,
      endDate: undefined,
      assets: ['all'],
      density: 'detailed',
    });

    const sectionFromAsset = (asset: AssetFilter): string[] => {
      if (asset === 'all') return [];
      if (asset === 'intake') return ['intake'];
      if (asset === 'wtp') return ['wtp'];
      return ['oht'];
    };

    const displayedAlarms = useMemo(() => {
        const filtered = alarms.filter(alarm => {
            if (filter !== 'all' && alarm.type.toLowerCase() !== filter) return false;

            // Asset filter
            if (!globalFilters.assets.includes('all')) {
                const allowedSections = globalFilters.assets.flatMap(sectionFromAsset);
                if (allowedSections.length > 0 && !allowedSections.includes(alarm.section || '')) return false;
            }

            // Date filter
            if (globalFilters.startDate) {
                const alarmDate = new Date(alarm.timestamp);
                if (alarmDate < startOfDay(globalFilters.startDate)) return false;
            }
            if (globalFilters.endDate) {
                const alarmDate = new Date(alarm.timestamp);
                if (alarmDate > endOfDay(globalFilters.endDate)) return false;
            }

            return true;
        });

        const limit = globalFilters.density === 'fast' ? 20 : (globalFilters.density === 'analytical' ? 200 : 50);
        return filtered.slice(0, limit);
    }, [alarms, filter, globalFilters]);

    const getAlarmIcon = (type: string) => {
        if (type === 'High') return <AlertTriangle className="h-4 w-4 text-destructive" />;
        return <AlertCircle className="h-4 w-4 text-warning" />;
    };

    return (
        <div className="min-h-screen flex flex-col bg-background grid-pattern">

            <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-6 md:mb-8 opacity-0 animate-fade-in">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-destructive/10">
                            <BellRing className="h-6 w-6 text-destructive" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-foreground">Alarm History</h2>
                            <p className="text-sm text-muted-foreground">Live monitoring of system alerts</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={acknowledgeAll} className="gap-2" disabled={alarms.length === 0}>
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Acknowledge All</span>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={clearAlarms} className="gap-2" disabled={alarms.length === 0}>
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Clear History</span>
                        </Button>
                    </div>
                </div>

                {/* Global Filter Bar */}
                <GlobalFilterBar filters={globalFilters} onFiltersChange={setGlobalFilters} />

                {/* Type Filters */}
                <div className="flex gap-2 mb-4 opacity-0 animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>All Alarms</Button>
                    <Button variant={filter === 'high' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('high')}
                        className={filter === 'high' ? 'bg-destructive hover:bg-destructive/90' : ''}>High Priority</Button>
                    <Button variant={filter === 'low' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('low')}
                        className={filter === 'low' ? 'bg-warning text-warning-foreground hover:bg-warning/90' : ''}>Low Priority</Button>
                </div>

                {/* Alarms Table */}
                <Card className="opacity-0 animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            Recent Alarms
                            {displayedAlarms.length > 0 && (
                                <Badge variant="secondary" className="ml-2 font-normal">{displayedAlarms.length} events</Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {displayedAlarms.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-30 text-success" />
                                <p className="text-lg font-medium">No alarms found</p>
                                <p className="text-sm">System is operating normally.</p>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-border overflow-hidden">
                                <div className="max-h-[600px] overflow-auto">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-card">
                                            <TableRow>
                                                <TableHead className="w-[180px]">Time</TableHead>
                                                <TableHead>Tag</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Value</TableHead>
                                                <TableHead className="w-[40%]">Message</TableHead>
                                                <TableHead className="text-right">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {displayedAlarms.map((alarm) => (
                                                <TableRow key={alarm.id} className={cn("transition-colors", !alarm.acknowledged && "bg-destructive/5")}>
                                                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                                        {format(new Date(alarm.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        <div className="flex flex-col">
                                                            <span>{alarm.label}</span>
                                                            <span className="text-xs text-muted-foreground font-mono">{alarm.tagId}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5">
                                                            {getAlarmIcon(alarm.type)}
                                                            <span className={cn("font-medium text-xs", alarm.type === 'High' ? "text-destructive" : "text-warning")}>
                                                                {alarm.type.toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-mono">
                                                        {alarm.value.toFixed(2)} <span className="text-xs text-muted-foreground">{alarm.unit}</span>
                                                    </TableCell>
                                                    <TableCell className="text-sm">{alarm.message}</TableCell>
                                                    <TableCell className="text-right">
                                                        {alarm.acknowledged ? (
                                                            <Badge variant="outline" className="text-muted-foreground border-border">Ack</Badge>
                                                        ) : (
                                                            <Badge variant="destructive" className="animate-pulse">Active</Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>

            <StatusBar />
        </div>
    );
};

export default AlarmsPage;

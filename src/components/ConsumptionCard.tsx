import React, { memo, useMemo, useId } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, Clock, TrendingUp, Zap, BarChart3, ArrowUp, Gauge } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { logError } from '@/lib/errorLogger';

interface ConsumptionRow {
  id: string;
  section: string;
  date: string;
  hour: number | null;
  hourly_consumption: number;
  daily_consumption: number;
}

interface ConsumptionCardProps {
  section: 'intake' | 'wtp';
}

// Animated bar component for smooth entry
const AnimatedBar: React.FC<{
  heightPct: number;
  color: string;
  delay: number;
  tooltip: string;
  isPeak?: boolean;
  isCurrent?: boolean;
}> = memo(({ heightPct, color, delay, tooltip, isPeak, isCurrent }) => (
  <div className="flex-1 flex flex-col items-center group relative">
    <div
      className="w-full rounded-t-[3px] transition-all duration-500 ease-out origin-bottom"
      style={{
        height: `${heightPct}%`,
        minHeight: heightPct > 0 ? '2px' : '0px',
        backgroundColor: color,
        animation: `barGrow 0.6s ease-out ${delay}s both`,
        boxShadow: isPeak ? `0 0 10px ${color}` : isCurrent ? `0 0 8px ${color}` : 'none',
      }}
    />
    {isPeak && (
      <div className="absolute -top-4">
        <ArrowUp className="h-3 w-3 text-destructive animate-bounce" />
      </div>
    )}
    <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20 border border-border backdrop-blur-sm transition-opacity duration-200">
      {tooltip}
    </div>
  </div>
));
AnimatedBar.displayName = 'AnimatedBar';

const ConsumptionCard: React.FC<ConsumptionCardProps> = memo(({ section }) => {
  const { data: queryData, isLoading } = useQuery({
    queryKey: ['consumption-data', section],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 6);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      const [todayResult, weekResult] = await Promise.all([
        supabase
          .from('consumption_data')
          .select('*')
          .eq('section', section)
          .eq('date', today)
          .order('hour', { ascending: true }),
        supabase
          .from('consumption_data')
          .select('date, hourly_consumption')
          .eq('section', section)
          .gte('date', weekAgoStr)
          .order('date', { ascending: true }),
      ]);

      if (todayResult.error) throw todayResult.error;

      const todayRows = (todayResult.data || []) as ConsumptionRow[];
      const byDate: Record<string, number> = {};
      for (const row of (weekResult.data || [])) {
        byDate[row.date] = (byDate[row.date] || 0) + Number(row.hourly_consumption);
      }
      const weekly = Object.entries(byDate).map(([date, total]) => ({ date, total }));

      return { todayData: todayRows, weeklyData: weekly };
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const todayData = queryData?.todayData ?? [];
  const weeklyData = queryData?.weeklyData ?? [];

  const currentHour = new Date().getHours();
  const hourlyData = todayData.filter(d => d.hour !== null);

  const dailyTotal = useMemo(
    () => hourlyData.reduce((sum, r) => sum + Number(r.hourly_consumption), 0),
    [hourlyData]
  );

  const peakHour = useMemo(() => {
    if (hourlyData.length === 0) return null;
    return hourlyData.reduce((best, cur) =>
      Number(cur.hourly_consumption) > Number(best.hourly_consumption) ? cur : best
    );
  }, [hourlyData]);

  const avgHourly = useMemo(() => {
    const active = hourlyData.filter(d => Number(d.hourly_consumption) > 0);
    if (active.length === 0) return 0;
    return active.reduce((s, d) => s + Number(d.hourly_consumption), 0) / active.length;
  }, [hourlyData]);

  const weeklyAvg = useMemo(() => {
    if (weeklyData.length === 0) return 0;
    return weeklyData.reduce((s, d) => s + d.total, 0) / weeklyData.length;
  }, [weeklyData]);

  const weeklyTotal = useMemo(
    () => weeklyData.reduce((s, d) => s + d.total, 0),
    [weeklyData]
  );

  const hourlyMaxVal = useMemo(
    () => Math.max(...hourlyData.map(d => Number(d.hourly_consumption)), 1),
    [hourlyData]
  );

  const currentHourVal = Number(hourlyData.find(d => d.hour === currentHour)?.hourly_consumption || 0);

  return (
    <Card className="opacity-0 animate-fade-in relative overflow-hidden border-primary/20" style={{ animationDelay: '400ms' }}>
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20 shrink-0">
            <Droplets className="h-5 w-5 text-primary" />
          </div>
          <span className="truncate font-bold">Consumption</span>
          <span className="text-xs font-semibold text-muted-foreground ml-auto px-3 py-1 rounded-full bg-muted/80 ring-1 ring-border/50 shrink-0">
            {section.toUpperCase()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
            <Skeleton className="h-24 rounded-xl" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* ===== PRIMARY STATS — Large, color-coded ===== */}
            <div className="grid grid-cols-2 gap-4">
              {/* Today's Total */}
              <div className="rounded-2xl p-4 text-center relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/3 border-2 border-primary/15 hover:border-primary/25 transition-colors">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <Droplets className="h-4 w-4 text-primary" />
                  <span className="text-xs text-primary/80 uppercase tracking-wider font-bold">Today's Total</span>
                </div>
                <div className="text-3xl font-mono font-bold text-primary tabular-nums leading-none">
                  {dailyTotal.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-medium">m³</div>
              </div>

              {/* Current Hour */}
              <div className={`rounded-2xl p-4 text-center relative overflow-hidden border-2 transition-colors ${
                currentHourVal > 0
                  ? 'bg-gradient-to-br from-success/10 to-success/3 border-success/20 hover:border-success/30'
                  : 'bg-gradient-to-br from-muted/50 to-muted/20 border-border/50 hover:border-primary/20'
              }`}>
                <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent ${
                  currentHourVal > 0 ? 'via-success/50' : 'via-border/50'
                } to-transparent`} />
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <Gauge className={`h-4 w-4 ${currentHourVal > 0 ? 'text-success' : 'text-muted-foreground'}`} />
                  <span className={`text-xs uppercase tracking-wider font-bold ${
                    currentHourVal > 0 ? 'text-success/80' : 'text-muted-foreground'
                  }`}>Current Hour</span>
                </div>
                <div className={`text-3xl font-mono font-bold tabular-nums leading-none ${
                  currentHourVal > 0 ? 'text-success' : 'text-foreground'
                }`}>
                  {currentHourVal.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-medium">m³/hr</div>
              </div>
            </div>

            {/* ===== SECONDARY STATS — 3-column grid ===== */}
            <div className="grid grid-cols-3 gap-3">
              {/* Peak Hour */}
              <div className={`rounded-xl p-3 text-center border transition-colors ${
                peakHour && Number(peakHour.hourly_consumption) > 0
                  ? 'bg-destructive/6 border-destructive/12 hover:border-destructive/20'
                  : 'bg-muted/40 border-border/50 hover:bg-muted/60'
              }`}>
                <div className={`p-1.5 rounded-lg mx-auto w-fit mb-1.5 ${
                  peakHour && Number(peakHour.hourly_consumption) > 0 ? 'bg-destructive/12' : 'bg-muted/60'
                }`}>
                  <Zap className={`h-4 w-4 ${
                    peakHour && Number(peakHour.hourly_consumption) > 0 ? 'text-destructive' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Peak Hour</div>
                <div className={`text-lg font-mono font-bold tabular-nums leading-tight mt-0.5 ${
                  peakHour && Number(peakHour.hourly_consumption) > 0 ? 'text-destructive' : 'text-foreground'
                }`}>
                  {peakHour ? `${peakHour.hour}:00` : '—'}
                </div>
                {peakHour && Number(peakHour.hourly_consumption) > 0 && (
                  <div className="text-[10px] text-destructive/70 font-medium">{Number(peakHour.hourly_consumption).toFixed(1)} m³</div>
                )}
              </div>

              {/* Avg/Hr */}
              <div className={`rounded-xl p-3 text-center border transition-colors ${
                avgHourly > 0
                  ? 'bg-primary/6 border-primary/12 hover:border-primary/20'
                  : 'bg-muted/40 border-border/50 hover:bg-muted/60'
              }`}>
                <div className={`p-1.5 rounded-lg mx-auto w-fit mb-1.5 ${avgHourly > 0 ? 'bg-primary/12' : 'bg-muted/60'}`}>
                  <TrendingUp className={`h-4 w-4 ${avgHourly > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Avg/Hr</div>
                <div className={`text-lg font-mono font-bold tabular-nums leading-tight mt-0.5 ${
                  avgHourly > 0 ? 'text-primary' : 'text-foreground'
                }`}>
                  {avgHourly.toFixed(1)}
                </div>
                <div className="text-[10px] text-muted-foreground font-medium">m³</div>
              </div>

              {/* Week Avg */}
              <div className={`rounded-xl p-3 text-center border transition-colors ${
                weeklyAvg > 0
                  ? 'bg-accent/6 border-accent/12 hover:border-accent/20'
                  : 'bg-muted/40 border-border/50 hover:bg-muted/60'
              }`}>
                <div className={`p-1.5 rounded-lg mx-auto w-fit mb-1.5 ${weeklyAvg > 0 ? 'bg-accent/12' : 'bg-muted/60'}`}>
                  <BarChart3 className={`h-4 w-4 ${weeklyAvg > 0 ? 'text-accent' : 'text-muted-foreground'}`} />
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Week Avg</div>
                <div className={`text-lg font-mono font-bold tabular-nums leading-tight mt-0.5 ${
                  weeklyAvg > 0 ? 'text-accent' : 'text-foreground'
                }`}>
                  {weeklyAvg.toFixed(1)}
                </div>
                <div className="text-[10px] text-muted-foreground font-medium">m³/day</div>
              </div>
            </div>

            {/* Hourly bar chart — always shown */}
              <div className="border-t border-border/50 pt-4">
                <div className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="uppercase tracking-wider font-bold">Hourly Breakdown</span>
                  <span className="ml-auto text-[10px] flex items-center gap-2">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-destructive inline-block" /> Peak</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block" /> Now</span>
                  </span>
                </div>
                <div className="flex items-end gap-[2px] h-20">
                  {Array.from({ length: 24 }, (_, h) => {
                    const hourData = hourlyData.find(d => d.hour === h);
                    const val = hourData ? Number(hourData.hourly_consumption) : 0;
                    const heightPct = hourlyMaxVal > 1 ? (val / hourlyMaxVal) * 100 : 0;
                    const isPeak = peakHour && peakHour.hour === h && val > 0;
                    const isCurrent = h === currentHour;
                    return (
                      <AnimatedBar
                        key={h}
                        heightPct={heightPct > 0 ? heightPct : (isCurrent ? 3 : 1)}
                        delay={h * 0.02}
                        isPeak={!!isPeak}
                        isCurrent={isCurrent}
                        tooltip={`${h}:00 — ${val.toFixed(1)} m³`}
                        color={
                          isPeak
                            ? 'hsl(var(--destructive))'
                            : isCurrent
                              ? 'hsl(var(--primary))'
                              : h <= currentHour && val > 0
                                ? 'hsl(var(--primary) / 0.4)'
                                : 'hsl(var(--muted-foreground) / 0.12)'
                        }
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[9px] text-muted-foreground font-medium">0h</span>
                  <span className="text-[9px] text-muted-foreground font-medium">6h</span>
                  <span className="text-[9px] text-muted-foreground font-medium">12h</span>
                  <span className="text-[9px] text-muted-foreground font-medium">18h</span>
                  <span className="text-[9px] text-muted-foreground font-medium">23h</span>
                </div>
              </div>

            {/* Weekly trend */}
            <div className="border-t border-border/50 pt-4">
              <div className="text-xs text-muted-foreground mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 uppercase tracking-wider font-bold">
                  <BarChart3 className="h-3.5 w-3.5" /> 7-Day Trend
                </span>
                <span className="font-mono font-bold text-foreground text-sm">{weeklyTotal.toFixed(0)} m³</span>
              </div>
              <WeeklyWaveChart data={weeklyData.length > 1 ? weeklyData : Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return { date: d.toISOString().split('T')[0], total: 0 };
              })} />
            </div>
          </div>
        )}
      </CardContent>

      <style>{`
        @keyframes barGrow {
          from { transform: scaleY(0); opacity: 0; }
          to { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </Card>
  );
});

// SVG wave chart for weekly data
const WeeklyWaveChart: React.FC<{ data: { date: string; total: number }[] }> = memo(({ data }) => {
  const uid = useId().replace(/:/g, '');
  const width = 280;
  const height = 52;
  const padding = 4;

  const { linePath, areaPath, dots } = useMemo(() => {
    const maxVal = Math.max(...data.map(d => d.total), 1);
    const points = data.map((d, i) => ({
      x: padding + (i / (data.length - 1)) * (width - padding * 2),
      y: padding + (1 - d.total / maxVal) * (height - padding * 2),
      label: new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      value: d.total,
      isToday: i === data.length - 1,
    }));

    const segments: string[] = [];
    const areaSegs: string[] = [`M ${points[0].x},${height - padding}`, `L ${points[0].x},${points[0].y}`];

    for (let i = 0; i < points.length; i++) {
      if (i === 0) {
        segments.push(`M ${points[i].x},${points[i].y}`);
      } else {
        const cpx = (points[i - 1].x + points[i].x) / 2;
        segments.push(`C ${cpx},${points[i - 1].y} ${cpx},${points[i].y} ${points[i].x},${points[i].y}`);
        areaSegs.push(`C ${cpx},${points[i - 1].y} ${cpx},${points[i].y} ${points[i].x},${points[i].y}`);
      }
    }
    areaSegs.push(`L ${points[points.length - 1].x},${height - padding}`, 'Z');

    return { linePath: segments.join(' '), areaPath: areaSegs.join(' '), dots: points };
  }, [data]);

  return (
    <div className="relative">
      <svg width="100%" viewBox={`0 0 ${width} ${height + 16}`} className="overflow-visible">
        <defs>
          <linearGradient id={`wk-grad-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#wk-grad-${uid})`}>
          <animate attributeName="opacity" from="0" to="1" dur="0.8s" fill="freeze" />
        </path>
        <path d={linePath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm">
          <animate attributeName="opacity" from="0" to="1" dur="0.5s" fill="freeze" />
        </path>
        {dots.map((dot, i) => (
          <g key={i} className="group">
            {dot.isToday && (
              <circle cx={dot.x} cy={dot.y} r="5" fill="hsl(var(--primary))" opacity="0.15">
                <animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={dot.x} cy={dot.y} r={dot.isToday ? 3.5 : 2.5}
              fill={dot.isToday ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.6)'}
              stroke="hsl(var(--background))" strokeWidth="1.5">
              <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin={`${i * 0.08}s`} fill="freeze" />
            </circle>
            <text x={dot.x} y={height + 12} textAnchor="middle" className="fill-muted-foreground" fontSize="7">
              {dot.label}
            </text>
            <title>{`${dot.label}: ${dot.value.toFixed(1)} m³`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
});
WeeklyWaveChart.displayName = 'WeeklyWaveChart';

ConsumptionCard.displayName = 'ConsumptionCard';
export default ConsumptionCard;

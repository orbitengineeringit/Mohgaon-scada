import React, { useMemo, useId } from 'react';

interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

const MiniSparkline: React.FC<MiniSparklineProps> = ({ data, width = 80, height = 30, color = 'hsl(var(--primary))' }) => {
  const uid = useId().replace(/:/g, '');
  
  const { linePath, areaPath } = useMemo(() => {
    if (data.length < 2) return { linePath: '', areaPath: '' };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const points = data.map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 6) - 3;
      return { x, y };
    });

    // Smooth curve using catmull-rom to cardinal spline
    const lineSegments: string[] = [];
    const areaSegments: string[] = [];
    
    for (let i = 0; i < points.length; i++) {
      if (i === 0) {
        lineSegments.push(`M ${points[i].x},${points[i].y}`);
        areaSegments.push(`M ${points[i].x},${height}`);
        areaSegments.push(`L ${points[i].x},${points[i].y}`);
      } else {
        // Cubic bezier for smooth curves
        const prev = points[i - 1];
        const curr = points[i];
        const cpx = (prev.x + curr.x) / 2;
        lineSegments.push(`C ${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`);
        areaSegments.push(`C ${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`);
      }
    }
    
    areaSegments.push(`L ${points[points.length - 1].x},${height}`);
    areaSegments.push('Z');

    return { linePath: lineSegments.join(' '), areaPath: areaSegments.join(' ') };
  }, [data, width, height]);

  if (data.length < 2) return null;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-grad-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-grad-${uid})`}>
        <animate attributeName="opacity" from="0" to="1" dur="0.6s" fill="freeze" />
      </path>
      <path 
        d={linePath} 
        fill="none" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="drop-shadow-sm"
      >
        <animate attributeName="stroke-dashoffset" from="200" to="0" dur="0.8s" fill="freeze" />
        <animate attributeName="opacity" from="0" to="0.8" dur="0.4s" fill="freeze" />
      </path>
      {/* Glowing dot at the end */}
      <circle 
        cx={(data.length - 1) / (data.length - 1) * width} 
        cy={(() => {
          const min = Math.min(...data);
          const max = Math.max(...data);
          const range = max - min || 1;
          return height - ((data[data.length - 1] - min) / range) * (height - 6) - 3;
        })()}
        r="2"
        fill={color}
        className="animate-pulse"
      >
        <animate attributeName="opacity" from="0" to="1" dur="0.8s" fill="freeze" />
      </circle>
    </svg>
  );
};

export default MiniSparkline;

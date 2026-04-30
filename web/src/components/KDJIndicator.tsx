import type { KDJData } from '@/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from 'recharts';

interface KDJIndicatorProps {
  name: string;
  kdj: KDJData | undefined;
}

export function KDJIndicator({ name, kdj }: KDJIndicatorProps) {
  if (!kdj || kdj.j === null) return null;

  const jValue = kdj.j;

  const getSignal = () => {
    if (jValue > 100) return { text: '极度超买', subtext: '准备撤退', level: 'extreme-overbought' as const };
    if (jValue > 90) return { text: '超买区域', subtext: '注意风险', level: 'overbought' as const };
    if (jValue < 0) return { text: '极度超卖', subtext: '不要唱空', level: 'extreme-oversold' as const };
    if (jValue < 20) return { text: '超卖区域', subtext: '关注机会', level: 'oversold' as const };
    return { text: '中性区域', subtext: '继续观察', level: 'neutral' as const };
  };

  const signalStyles: Record<string, { bg: string; border: string; text: string; dot: string; barBg: string; barFill: string }> = {
    'extreme-overbought': { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500', barBg: 'bg-red-100', barFill: 'bg-red-500' },
    'overbought': { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500', barBg: 'bg-orange-100', barFill: 'bg-orange-500' },
    'extreme-oversold': { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', barBg: 'bg-emerald-100', barFill: 'bg-emerald-500' },
    'oversold': { bg: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-200 dark:border-teal-800', text: 'text-teal-700 dark:text-teal-400', dot: 'bg-teal-500', barBg: 'bg-teal-100', barFill: 'bg-teal-500' },
    'neutral': { bg: 'bg-gray-50 dark:bg-gray-900/30', border: 'border-gray-200 dark:border-gray-700', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400', barBg: 'bg-gray-100', barFill: 'bg-gray-400' },
  };

  const signal = getSignal();
  const style = signalStyles[signal.level];

  // J bar position: map J value to 0-100% width (clamp between -20 to 120 range)
  const barPercent = Math.min(100, Math.max(0, ((jValue + 20) / 140) * 100));

  const chartData = (kdj.jHistory || []).map(item => ({
    date: item.date.slice(5),
    j: item.j,
    k: null, // not available in jHistory
    d: null,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-popover border rounded-lg shadow-lg px-3 py-2 text-xs">
        <div className="text-muted-foreground mb-1">{label}</div>
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-1.5">
            <span className="w-2 h-0.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="font-mono font-medium" style={{ color: entry.color }}>
              {entry.dataKey.toUpperCase()} = {entry.value.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`rounded-xl border ${style.border} overflow-hidden`}>
      {/* Header bar */}
      <div className={`px-4 py-2.5 ${style.bg} border-b ${style.border}`}>
        <div className="flex items-center justify-between">
          {/* Left: Title + Signal */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`} />
              <span className="text-xs font-semibold text-muted-foreground tracking-wide">
                KDJ · {name}
              </span>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text} border ${style.border}`}>
              <span>{signal.text}</span>
              <span className="opacity-60">·</span>
              <span className="opacity-80">{signal.subtext}</span>
            </div>
          </div>

          {/* Right: J / K / D values */}
          <div className="flex items-center gap-4 font-mono text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground font-sans">J</span>
              <span className={`font-bold text-base ${style.text}`}>
                {jValue.toFixed(1)}
              </span>
            </div>
            {kdj.k !== null && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground font-sans">K</span>
                <span className="text-muted-foreground">{kdj.k.toFixed(1)}</span>
              </div>
            )}
            {kdj.d !== null && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground font-sans">D</span>
                <span className="text-muted-foreground">{kdj.d.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        {/* J value bar */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground font-mono w-6 text-right">-20</span>
          <div className={`flex-1 h-1.5 rounded-full ${style.barBg} relative overflow-hidden`}>
            {/* Zone markers */}
            <div className="absolute left-[14.3%] top-0 bottom-0 w-px bg-teal-400/40" /> {/* 0 */}
            <div className="absolute left-[28.6%] top-0 bottom-0 w-px bg-teal-300/60" /> {/* 20 */}
            <div className="absolute left-[71.4%] top-0 bottom-0 w-px bg-orange-300/60" /> {/* 90 */}
            <div className="absolute left-[85.7%] top-0 bottom-0 w-px bg-red-400/40" /> {/* 100 */}
            {/* Fill */}
            <div
              className={`absolute top-0 left-0 h-full rounded-full ${style.barFill} transition-all duration-700`}
              style={{ width: `${barPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-mono w-8">120</span>
        </div>
      </div>

      {/* Chart area */}
      {chartData.length > 1 && (
        <div className="h-40 px-2 pt-2 pb-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 2, right: 8, left: -20, bottom: 2 }}>
              {/* Zone fills */}
              <ReferenceArea y1={100} y2={120} fill="#ef4444" fillOpacity={0.06} />
              <ReferenceArea y1={90} y2={100} fill="#f97316" fillOpacity={0.06} />
              <ReferenceArea y1={-20} y2={0} fill="#10b981" fillOpacity={0.06} />
              <ReferenceArea y1={0} y2={20} fill="#14b8a6" fillOpacity={0.06} />

              {/* Reference lines */}
              <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={0.8} opacity={0.6} />
              <ReferenceLine y={90} stroke="#f97316" strokeDasharray="4 3" strokeWidth={0.8} opacity={0.5} />
              <ReferenceLine y={50} stroke="#94a3b8" strokeDasharray="2 4" strokeWidth={0.5} opacity={0.3} />
              <ReferenceLine y={20} stroke="#14b8a6" strokeDasharray="4 3" strokeWidth={0.8} opacity={0.5} />
              <ReferenceLine y={0} stroke="#10b981" strokeDasharray="4 3" strokeWidth={0.8} opacity={0.6} />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                axisLine={{ stroke: '#e2e8f0', strokeWidth: 0.5 }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[-20, 120]}
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                ticks={[0, 20, 50, 90, 100]}
                axisLine={{ stroke: '#e2e8f0', strokeWidth: 0.5 }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="j"
                stroke="#6366f1"
                strokeWidth={1.8}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0, fill: '#6366f1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

import type { KDJData } from '@/types';
import {
  ComposedChart,
  Line,
  Bar,
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

/** Custom shape for rendering a candlestick bar */
function CandlestickShape(props: any) {
  const { x, y, width, height, payload } = props;
  if (!payload?.open || !payload?.close || !payload?.high || !payload?.low) return null;

  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const bodyTop = Math.max(open, close);
  const bodyBottom = Math.min(open, close);
  const bodyRange = bodyTop - bodyBottom || 0.01;

  // Pixel-per-unit ratio from the body bar
  const pxPerUnit = height / bodyRange;

  // Wick pixel positions
  const wickTop = y - (high - bodyTop) * pxPerUnit;
  const wickBottom = y + height + (bodyBottom - low) * pxPerUnit;

  const bodyX = x + width * 0.2;
  const bodyWidth = width * 0.6;
  const wickX = x + width / 2;

  // Chinese market convention: red = up, green = down
  const color = isUp ? '#ef4444' : '#22c55e';

  return (
    <g>
      {/* Wick line (high-low) */}
      <line
        x1={wickX} y1={wickTop}
        x2={wickX} y2={wickBottom}
        stroke={color} strokeWidth={1}
      />
      {/* Body rectangle */}
      <rect
        x={bodyX} y={y}
        width={bodyWidth} height={Math.max(height, 1)}
        fill={isUp ? 'transparent' : color}
        stroke={color} strokeWidth={1}
      />
    </g>
  );
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

  const history = kdj.jHistory || [];
  const highs = history.map(h => h.high);
  const lows = history.map(h => h.low);
  const priceMin = lows.length > 0 ? Math.min(...lows) : 0;
  const priceMax = highs.length > 0 ? Math.max(...highs) : 100;
  const pricePad = (priceMax - priceMin) * 0.08 || 1;

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

  // Prepare chart data with candlestick fields
  const chartData = history.map(item => {
    const bodyBottom = Math.min(item.open, item.close);
    const bodyHeight = Math.abs(item.close - item.open);
    return {
      date: item.date.slice(5),
      j: item.j,
      open: item.open,
      close: item.close,
      high: item.high,
      low: item.low,
      // Stacked bar fields for candlestick positioning
      candleBase: bodyBottom,      // invisible base bar (pushes body up)
      candleBody: bodyHeight,      // visible body bar
    };
  });

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string; payload?: any }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    return (
      <div className="bg-popover border rounded-lg shadow-lg px-3 py-2 text-xs">
        <div className="text-muted-foreground mb-1 font-medium">{label}</div>
        {data && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mb-1">
            <span className="text-muted-foreground">开</span>
            <span className="font-mono">{data.open?.toFixed(2)}</span>
            <span className="text-muted-foreground">高</span>
            <span className="font-mono">{data.high?.toFixed(2)}</span>
            <span className="text-muted-foreground">低</span>
            <span className="font-mono">{data.low?.toFixed(2)}</span>
            <span className="text-muted-foreground">收</span>
            <span className="font-mono">{data.close?.toFixed(2)}</span>
          </div>
        )}
        {payload.filter(p => p.dataKey === 'j').map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-1.5 border-t pt-1 mt-1">
            <span className="w-2 h-0.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="font-mono font-medium" style={{ color: entry.color }}>
              J = {entry.value.toFixed(1)}
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
            <div className="absolute left-[14.3%] top-0 bottom-0 w-px bg-teal-400/40" />
            <div className="absolute left-[28.6%] top-0 bottom-0 w-px bg-teal-300/60" />
            <div className="absolute left-[71.4%] top-0 bottom-0 w-px bg-orange-300/60" />
            <div className="absolute left-[85.7%] top-0 bottom-0 w-px bg-red-400/40" />
            <div
              className={`absolute top-0 left-0 h-full rounded-full ${style.barFill} transition-all duration-700`}
              style={{ width: `${barPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-mono w-8">120</span>
        </div>
      </div>

      {/* Chart area: Candlestick K-line + KDJ J line */}
      {chartData.length > 1 && (
        <div className="h-56 px-2 pt-2 pb-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 2, right: 40, left: -20, bottom: 2 }}>
              {/* KDJ zone fills */}
              <ReferenceArea yAxisId="kdj" y1={100} y2={120} fill="#ef4444" fillOpacity={0.06} />
              <ReferenceArea yAxisId="kdj" y1={90} y2={100} fill="#f97316" fillOpacity={0.06} />
              <ReferenceArea yAxisId="kdj" y1={-20} y2={0} fill="#10b981" fillOpacity={0.06} />
              <ReferenceArea yAxisId="kdj" y1={0} y2={20} fill="#14b8a6" fillOpacity={0.06} />

              {/* KDJ reference lines */}
              <ReferenceLine yAxisId="kdj" y={100} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={0.8} opacity={0.6} />
              <ReferenceLine yAxisId="kdj" y={90} stroke="#f97316" strokeDasharray="4 3" strokeWidth={0.8} opacity={0.5} />
              <ReferenceLine yAxisId="kdj" y={50} stroke="#94a3b8" strokeDasharray="2 4" strokeWidth={0.5} opacity={0.3} />
              <ReferenceLine yAxisId="kdj" y={20} stroke="#14b8a6" strokeDasharray="4 3" strokeWidth={0.8} opacity={0.5} />
              <ReferenceLine yAxisId="kdj" y={0} stroke="#10b981" strokeDasharray="4 3" strokeWidth={0.8} opacity={0.6} />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                axisLine={{ stroke: '#e2e8f0', strokeWidth: 0.5 }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              {/* KDJ Y axis (left) */}
              <YAxis
                yAxisId="kdj"
                domain={[-20, 120]}
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                ticks={[0, 20, 50, 90, 100]}
                axisLine={{ stroke: '#e2e8f0', strokeWidth: 0.5 }}
                tickLine={false}
              />
              {/* Price Y axis (right) */}
              <YAxis
                yAxisId="price"
                orientation="right"
                domain={[priceMin - pricePad, priceMax + pricePad]}
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                axisLine={{ stroke: '#e2e8f0', strokeWidth: 0.5 }}
                tickLine={false}
                tickFormatter={(v: number) => v.toFixed(0)}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Candlestick: invisible base bar + visible body bar */}
              <Bar
                yAxisId="price"
                dataKey="candleBase"
                stackId="candle"
                fill="transparent"
                isAnimationActive={false}
              />
              <Bar
                yAxisId="price"
                dataKey="candleBody"
                stackId="candle"
                shape={<CandlestickShape />}
                fill="transparent"
                isAnimationActive={false}
              />

              {/* J line */}
              <Line
                yAxisId="kdj"
                type="monotone"
                dataKey="j"
                stroke="#6366f1"
                strokeWidth={1.8}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0, fill: '#6366f1' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

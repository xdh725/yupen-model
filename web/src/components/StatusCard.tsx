import type { IndexData } from '@/types';

interface StatusCardProps {
  type: 'yes' | 'no' | 'strongest';
  count?: number;
  total?: number;
  percent?: number;
  strongest?: IndexData | null;
}

export function StatusCard({ type, count = 0, total = 0, percent = 0, strongest }: StatusCardProps) {
  if (type === 'strongest') {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">最强</span>
        <span className="font-medium">{strongest?.name || '-'}</span>
        {strongest && (
          <span className={`font-mono text-xs ${strongest.deviation >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {strongest.deviation >= 0 ? '+' : ''}{strongest.deviation.toFixed(1)}%
          </span>
        )}
      </div>
    );
  }

  if (type === 'yes') {
    return (
      <div className="flex items-center gap-1">
        <span className="text-green-600 font-bold">{count}/{total}</span>
        <span className="text-xs text-muted-foreground">YES({percent.toFixed(0)}%)</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-red-600 font-bold">{count}/{total}</span>
      <span className="text-xs text-muted-foreground">NO({percent.toFixed(0)}%)</span>
    </div>
  );
}

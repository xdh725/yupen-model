import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { IndexData } from '@/types';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

interface IndexTableProps {
  indices: IndexData[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const DEFAULT_COLUMN_WIDTHS = [40, 144, 56, 80, 96, 96, 80, 64, 56, 80, 96, 64];
const DELETE_COLUMN_WIDTH = 40;
const MIN_COLUMN_WIDTH = 48;

export function IndexTable({ indices, onDelete }: IndexTableProps) {
  const widthProfile = useMemo<'withDelete' | 'noDelete'>(
    () => (onDelete ? 'withDelete' : 'noDelete'),
    [onDelete]
  );
  const initialWidths = useMemo(() => {
    const base = [...DEFAULT_COLUMN_WIDTHS];
    if (onDelete) base.push(DELETE_COLUMN_WIDTH);
    return base;
  }, [onDelete]);
  const [columnWidths, setColumnWidths] = useState<number[]>(initialWidths);
  const resizeStateRef = useRef<{ index: number; startX: number; startWidth: number } | null>(null);
  const latestWidthsRef = useRef<number[]>(initialWidths);

  useEffect(() => {
    setColumnWidths(initialWidths);
    latestWidthsRef.current = initialWidths;
  }, [initialWidths]);

  useEffect(() => {
    latestWidthsRef.current = columnWidths;
  }, [columnWidths]);

  const sanitizeWidths = useCallback((widths: number[]) => {
    return widths.map((w, i) => {
      const minWidth = i === 1 ? 70 : MIN_COLUMN_WIDTH;
      return Math.max(minWidth, Math.round(w));
    });
  }, []);

  const persistWidths = useCallback(async (widths: number[]) => {
    try {
      await fetch('/api/index-table-widths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: widthProfile, widths }),
      });
    } catch {
      // ignore save error
    }
  }, [widthProfile]);

  useEffect(() => {
    let canceled = false;
    const loadPersistedWidths = async () => {
      try {
        const resp = await fetch(`/api/index-table-widths?profile=${widthProfile}`);
        if (!resp.ok) return;
        const data = (await resp.json()) as { widths?: unknown };
        if (!Array.isArray(data.widths) || data.widths.length !== initialWidths.length) return;
        const numericWidths = data.widths.map((w) => (typeof w === 'number' ? w : 0));
        const sanitized = sanitizeWidths(numericWidths);
        if (!canceled) setColumnWidths(sanitized);
      } catch {
        // ignore load error
      }
    };
    void loadPersistedWidths();
    return () => {
      canceled = true;
    };
  }, [initialWidths.length, sanitizeWidths, widthProfile]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const state = resizeStateRef.current;
      if (!state) return;
      const delta = event.clientX - state.startX;
      setColumnWidths((prev) => {
        const next = [...prev];
        const minWidth = state.index === 1 ? 70 : MIN_COLUMN_WIDTH;
        next[state.index] = Math.max(minWidth, state.startWidth + delta);
        return next;
      });
    };

    const stopResize = () => {
      const wasResizing = resizeStateRef.current !== null;
      resizeStateRef.current = null;
      document.body.classList.remove('cursor-col-resize', 'select-none');
      if (wasResizing) {
        void persistWidths(latestWidthsRef.current);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResize);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResize);
      document.body.classList.remove('cursor-col-resize', 'select-none');
    };
  }, [persistWidths]);

  const startResize = (index: number, event: ReactMouseEvent<HTMLSpanElement>) => {
    event.preventDefault();
    resizeStateRef.current = {
      index,
      startX: event.clientX,
      startWidth: columnWidths[index] ?? initialWidths[index],
    };
    document.body.classList.add('cursor-col-resize', 'select-none');
  };

  const headers = [
    { label: '#', align: 'text-center' },
    { label: '名称', align: 'text-left' },
    { label: '状态', align: 'text-center' },
    { label: '涨幅', align: 'text-right' },
    { label: '现价', align: 'text-right' },
    { label: 'MA20', align: 'text-right' },
    { label: '偏离度', align: 'text-right' },
    { label: '量比', align: 'text-right' },
    { label: '天数', align: 'text-center' },
    { label: '转变日', align: 'text-center' },
    { label: '区间涨幅', align: 'text-right' },
    { label: '排名变化', align: 'text-center' },
  ];
  if (onDelete) headers.push({ label: '', align: 'text-center' });

  if (indices.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        暂无数据，请生成快照或导入CSV
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table className="table-fixed [&_td]:px-2 [&_td]:py-1 [&_th]:h-8 [&_th]:px-2 [&_th]:py-1" style={{ minWidth: `${columnWidths.reduce((sum, w) => sum + w, 0)}px` }}>
        <colgroup>
          {columnWidths.map((width, idx) => (
            <col key={`col-${idx}`} style={{ width }} />
          ))}
        </colgroup>
        <TableHeader>
          <TableRow className="text-xs">
            {headers.map((header, index) => (
              <TableHead key={`head-${index}`} className={`relative !pr-3 ${header.align}`}>
                {header.label}
                {index < headers.length - 1 && (
                  <span
                    role="presentation"
                    className="group absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    onMouseDown={(event) => startResize(index, event)}
                    title="拖拽调整列宽"
                  >
                    <span className="pointer-events-none absolute right-0 top-1/2 h-5 w-px -translate-y-1/2 bg-border/80 transition-colors group-hover:bg-primary/80" />
                  </span>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {indices.map((idx) => {
            return (
              <TableRow key={idx.id} className="text-sm">
                <TableCell className="text-center text-muted-foreground text-xs">
                  {idx.strength <= 3 ? (
                    <span className={idx.strength === 1 ? 'text-yellow-500 font-bold' : idx.strength === 2 ? 'text-gray-400' : 'text-amber-600'}>
                      {idx.strength}
                    </span>
                  ) : idx.strength}
                </TableCell>
                <TableCell className="truncate">
                  <span className="font-medium truncate block">{idx.name}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className={`text-xs font-bold ${idx.status === 'YES' ? 'text-green-600' : 'text-red-600'}`}>
                    {idx.status}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {idx.changePercent != null ? (
                    <span className={idx.changePercent >= 0 ? 'text-red-600' : 'text-green-600'}>
                      {idx.changePercent >= 0 ? '+' : ''}{idx.changePercent.toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {idx.currentPrice.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {idx.ma20.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right font-mono">
                  <span className={idx.deviation >= 0 ? 'text-red-600' : 'text-green-600'}>
                    {idx.deviation >= 0 ? '+' : ''}{idx.deviation.toFixed(2)}%
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {idx.volumeRatio != null ? idx.volumeRatio.toFixed(2) : '-'}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {idx.duration}
                </TableCell>
                <TableCell className="text-center text-muted-foreground text-xs">
                  {idx.statusChangeDate ? idx.statusChangeDate.slice(5) : '-'}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {idx.periodChangePercent != null ? (
                    <span className={idx.periodChangePercent >= 0 ? 'text-red-600' : 'text-green-600'}>
                      {idx.periodChangePercent >= 0 ? '+' : ''}{idx.periodChangePercent.toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {idx.rankChange != null && idx.rankChange !== 0 ? (
                    <span className={`text-xs font-bold ${idx.rankChange < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {idx.rankChange > 0 ? `+${idx.rankChange}` : idx.rankChange}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>
                {onDelete && (
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(idx.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

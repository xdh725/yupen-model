import { StatusCard } from './StatusCard';
import { IndexTable } from './IndexTable';
import { KDJIndicator } from './KDJIndicator';
import { useYupenStore } from '@/store/yupenStore';
import { getMarketStats } from '@/utils/yupen';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useState, useCallback } from 'react';
import { indexTablePreviewData } from '@/mock/indexTablePreview';

interface DashboardProps {
  onOpenSettings?: () => void;
}

export function Dashboard({ onOpenSettings }: DashboardProps) {
  const {
    indices,
    availableDates,
    selectedDate,
    loadingSnapshot,
    snapshotError,
    loadSnapshotByDate,
    loadSnapshotManifest,
  } = useYupenStore();
  const [selectedCategory, setSelectedCategory] = useState<'market' | 'sector'>('market');
  const [generating, setGenerating] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [debugMode, setDebugMode] = useState(import.meta.env.DEV);
  const [debugLogText, setDebugLogText] = useState('');

  const filteredIndices = indices.filter(idx => (idx.category || 'market') === selectedCategory);
  const previewIndices = indexTablePreviewData.filter(idx => (idx.category || 'market') === selectedCategory);
  const usingPreviewData = import.meta.env.DEV && filteredIndices.length === 0;
  const tableIndices = usingPreviewData ? previewIndices : filteredIndices;
  const stats = getMarketStats(tableIndices);

  const handleRefreshSnapshot = useCallback(async () => {
    setGenerating(true);
    setRefreshMessage(null);
    setDebugLogText('');
    try {
      const resp = await fetch('/api/refresh-snapshot', { method: 'POST' });
      const data = await resp.json();
      setRefreshMessage({ text: data.message, ok: data.status !== 'error' });
      if (debugMode && data.debugLog) {
        const logParts = [
          `[cmd] ${String(data.debugLog.command ?? '-')}`,
          `[start] ${String(data.debugLog.startedAt ?? '-')}`,
          `[elapsed] ${String(data.debugLog.elapsedMs ?? '-')}ms`,
          '',
          '[stdout]',
          String(data.debugLog.stdout ?? '').trim() || '(empty)',
          '',
          '[stderr]',
          String(data.debugLog.stderr ?? '').trim() || '(empty)',
        ];
        setDebugLogText(logParts.join('\n'));
      }
      if (data.status !== 'error' && data.status !== 'already_exists') {
        await loadSnapshotManifest();
      }
    } catch (err) {
      setRefreshMessage({ text: err instanceof Error ? err.message : '请求失败', ok: false });
    } finally {
      setGenerating(false);
      setTimeout(() => setRefreshMessage(null), 5000);
    }
  }, [debugMode, loadSnapshotManifest]);

  // KDJ 数据
  const kdjIndex = indices.find(i => i.id === 'sh000985') || indices.find(i => i.id === 'sh000001');

  return (
    <div className="space-y-3">
      {/* 顶栏：标题 + 日期 + 操作 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-bold">鱼盆模型</h1>
          {selectedDate && (
            <span className="text-sm text-muted-foreground">{selectedDate}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          {availableDates.length > 0 && (
            <select
              className="h-8 rounded border border-input bg-background px-2 text-sm"
              value={selectedDate ?? ''}
              onChange={(e) => { if (e.target.value) void loadSnapshotByDate(e.target.value); }}
            >
              {availableDates.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          <Button size="sm" variant="outline" onClick={() => void loadSnapshotManifest()} disabled={loadingSnapshot}>
            {loadingSnapshot ? '...' : '刷新'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => void handleRefreshSnapshot()} disabled={generating}>
            <RefreshCw className={`h-3 w-3 mr-1 ${generating ? 'animate-spin' : ''}`} />
            {generating ? '生成中' : '生成快照'}
          </Button>
          {import.meta.env.DEV && (
            <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={debugMode}
                onChange={(e) => setDebugMode(e.target.checked)}
              />
              调试模式
            </label>
          )}
          {refreshMessage && (
            <span className={`text-xs ${refreshMessage.ok ? 'text-green-600' : 'text-red-600'}`}>
              {refreshMessage.text}
            </span>
          )}
          {onOpenSettings && (
            <Button size="sm" variant="ghost" onClick={onOpenSettings}>设置</Button>
          )}
        </div>
      </div>

      {/* Tab 切换 + 核心信息栏 */}
      {indices.length > 0 && (
        <div className="flex items-center gap-4 flex-wrap border-b pb-3 text-sm">
          {/* Tab */}
          <div className="flex rounded-md border overflow-hidden text-xs">
            <button
              className={`px-3 py-1 ${selectedCategory === 'market' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
              onClick={() => setSelectedCategory('market')}
            >指数</button>
            <button
              className={`px-3 py-1 ${selectedCategory === 'sector' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
              onClick={() => setSelectedCategory('sector')}
            >板块</button>
          </div>

          <StatusCard type="yes" count={stats.yesCount} total={stats.total} percent={stats.yesPercent} />
          <StatusCard type="no" count={stats.noCount} total={stats.total} percent={stats.noPercent} />
          <StatusCard type="strongest" strongest={stats.strongest} />

          <div className="w-px h-6 bg-border" />

          <div className="flex items-center gap-2">
            <span className={`font-bold ${
              stats.marketStatus === 'bull' ? 'text-green-600' :
              stats.marketStatus === 'bear' ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {stats.marketStatus === 'bull' ? '牛市' :
               stats.marketStatus === 'bear' ? '熊市' : '震荡'}
            </span>
            <span className="text-muted-foreground text-xs">
              {stats.marketStatus === 'bull' && '>60%站上均线'}
              {stats.marketStatus === 'bear' && '>60%跌破均线'}
              {stats.marketStatus === 'neutral' && '多空分歧'}
            </span>
          </div>
        </div>
      )}

      {snapshotError && (
        <div className="text-sm text-red-600">快照加载失败：{snapshotError}</div>
      )}
      {import.meta.env.DEV && debugMode && debugLogText && (
        <div className="rounded border bg-muted/40 p-3">
          <div className="mb-2 text-xs font-medium text-muted-foreground">快照执行日志</div>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all text-xs leading-5">
            {debugLogText}
          </pre>
        </div>
      )}

      {/* 数据表格 */}
      {usingPreviewData && (
        <div className="text-xs text-amber-600">
          当前为开发预览 Mock 数据（真实快照为空时自动展示）
        </div>
      )}
      <IndexTable indices={tableIndices} />

      {/* KDJ 指标 - 底部 */}
      {kdjIndex?.kdj && kdjIndex.kdj.j !== null && (
        <KDJIndicator name={kdjIndex.name} kdj={kdjIndex.kdj} />
      )}
    </div>
  );
}

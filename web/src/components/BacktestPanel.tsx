import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { BacktestResult } from '@/types';
import { parseHistoryData, runBacktest } from '@/utils/backtest';
import { Upload } from 'lucide-react';

interface BacktestPanelProps {
  onClose?: () => void;
}

export function BacktestPanel({ onClose }: BacktestPanelProps) {
  const [results, setResults] = useState<BacktestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const historyMap = parseHistoryData(text);
      const config = { floatRate: 0.02 }; // 2%浮动

      const allResults: BacktestResult[] = [];
      historyMap.forEach((data, code) => {
        const result = runBacktest(code, data.name, data.points, config);
        allResults.push(result);
      });

      setResults(allResults);
    } catch (error) {
      alert('解析文件失败， 请检查格式');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatResult = (result: BacktestResult) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div>
            <span className="font-bold">{result.indexName}</span>
            <span className="text-sm text-muted-foreground ml-2">
              {result.indexId}
            </span>
          </div>
          <span className={"text-lg font-bold " + (result.yesDays > result.noDays ? "text-green-600" : "text-red-600")}>
            {((result.yesDays / result.totalDays) * 100).toFixed(1)}% YES
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">回测期间:</span>
            <span className="font-medium">
              {result.startDate} ~ {result.endDate}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">总交易日:</span>
            <span className="font-medium">{result.totalDays} 天</span>
          </div>
          <div>
            <span className="text-muted-foreground">状态切换:</span>
            <span className="font-medium">{result.statusChanges} 次</span>
          </div>
          <div>
            <span className="text-muted-foreground">交易信号:</span>
            <span className="font-medium">{result.trades.length} 个</span>
          </div>
        </div>
        {result.trades.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">交易信号列表:</div>
            <div className="space-y-1">
              {result.trades.slice(0,5).map((trade, idx) => (
                <div key={idx} className="text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{trade.date}</span>
                    <span className={trade.type === 'BUY' ? 'text-green-600' : 'text-red-600'}>
                      {trade.type}
                    </span>
                  </div>
                  <span className="font-mono">{trade.price.toFixed(2)}</span>
                </div>
              ))}
              {result.trades.length > 5 && (
                <div className="text-xs text-muted-foreground text-center">
                  ... 还有 {result.trades.length - 5} 个交易信号
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">TDD 回测工具</h2>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {loading ? '处理中...' : '导入历史数据'}
          </Button>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              关闭
            </Button>
          )}
        </div>
      </div>

      {results.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Upload className="h-12 w-12 mx-auto mb-4" />
              <p>导入历史数据CSV文件进行回测</p>
              <p className="text-sm mt-2">
                CSV格式: 日期,代码,名称,收盘价,MA20
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {results.map(formatResult)}
        </div>
      )}
    </div>
  );
}

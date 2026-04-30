/**
 * 鱼盆模型回测工具
 * 用于验证策略的历史表现
 */

import type { HistoryPoint, BacktestResult, Trade, BacktestConfig, YupenStatus } from '@/types';

/**
 * 解析历史CSV数据
 * CSV格式: date,code,name,price,ma20
 */
export function parseHistoryData(csvText: string): Map<string, { name: string; points: { date: string; price: number; ma20: number }[] }> {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    return new Map();
  }

  // 解析表头
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('日期'));
  const codeIdx = headers.findIndex(h => h.includes('code') || h.includes('代码'));
  const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('名称'));
  const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('价') || h.includes('收盘'));
  const ma20Idx = headers.findIndex(h => h.includes('ma20') || h.includes('均线') || h.includes('ma'));

  const indexMap = new Map<string, { name: string; points: { date: string; price: number; ma20: number }[] }>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());
    const code = values[codeIdx >= 0 ? codeIdx : 1] || '';
    const name = values[nameIdx >= 0 ? nameIdx : 2] || '';
    const date = values[dateIdx >= 0 ? dateIdx : 0] || '';
    const price = parseFloat(values[priceIdx >= 0 ? priceIdx : 3]) || 0;
    const ma20 = parseFloat(values[ma20Idx >= 0 ? ma20Idx : 4]) || 0;

    if (!code || !date || price <= 0 || ma20 <= 0) continue;

    if (!indexMap.has(code)) {
      indexMap.set(code, { name, points: [] });
    }
    indexMap.get(code)!.points.push({ date, price, ma20 });
  }

  // 按日期排序
  indexMap.forEach(data => {
    data.points.sort((a, b) => a.date.localeCompare(b.date));
  });

  return indexMap;
}

/**
 * 计算单个时间点的鱼盆状态
 */
export function calculateHistoryPoint(
  price: number,
  ma20: number,
  floatRate: number = 0
): { threshold: number; status: YupenStatus; deviation: number } {
  const threshold = ma20 * (1 + floatRate);
  const status: YupenStatus = price > threshold ? 'YES' : 'NO';
  const deviation = threshold > 0 ? ((price - threshold) / threshold) * 100 : 0;

  return { threshold, status, deviation };
}

/**
 * 执行回测
 */
export function runBacktest(
  indexCode: string,
  indexName: string,
  historyPoints: { date: string; price: number; ma20: number }[],
  config: BacktestConfig = {}
): BacktestResult {
  const floatRate = config.floatRate ?? 0;

  // 过滤日期范围
  let points = historyPoints;
  if (config.startDate) {
    points = points.filter(p => p.date >= config.startDate!);
  }
  if (config.endDate) {
    points = points.filter(p => p.date <= config.endDate!);
  }

  if (points.length === 0) {
    return {
      indexId: indexCode,
      indexName,
      startDate: '-',
      endDate: '-',
      totalDays: 0,
      yesDays: 0,
      noDays: 0,
      statusChanges: 0,
      accuracy: 0,
      trades: [],
      history: []
    };
  }

  // 计算历史数据
  const history: HistoryPoint[] = points.map(p => {
    const { threshold, status, deviation } = calculateHistoryPoint(p.price, p.ma20, floatRate);
    return {
      date: p.date,
      price: p.price,
      ma20: p.ma20,
      threshold,
      status,
      deviation
    };
  });

  // 统计
  const totalDays = history.length;
  const yesDays = history.filter(h => h.status === 'YES').length;
  const noDays = totalDays - yesDays;

  // 计算状态切换次数和交易信号
  let statusChanges = 0;
  let prevStatus: YupenStatus | null = null;
  const trades: Trade[] = [];

  for (const h of history) {
    if (prevStatus !== null && h.status !== prevStatus) {
      statusChanges++;
      trades.push({
        date: h.date,
        type: h.status === 'YES' ? 'BUY' : 'SELL',
        price: h.price,
        threshold: h.threshold,
        reason: h.status === 'YES' ? '价格突破临界值' : '价格跌破临界值'
      });
    }
    prevStatus = h.status;
  }

  // 计算准确率（如果有基准数据，这里暂时用状态稳定性作为代理）
  const accuracy = totalDays > 0 ? (1 - statusChanges / totalDays) * 100 : 0;

  return {
    indexId: indexCode,
    indexName,
    startDate: history[0].date,
    endDate: history[history.length - 1].date,
    totalDays,
    yesDays,
    noDays,
    statusChanges,
    accuracy: Math.max(0, Math.min(100, accuracy)),
    trades,
    history
  };
}

/**
 * 批量回测多个指数
 */
export function runBatchBacktest(
  indexData: Map<string, { name: string; points: { date: string; price: number; ma20: number }[] }>,
  config: BacktestConfig = {}
): BacktestResult[] {
  const results: BacktestResult[] = [];

  indexData.forEach((data, code) => {
    const result = runBacktest(code, data.name, data.points, config);
    results.push(result);
  });

  // 按准确率排序
  return results.sort((a, b) => b.accuracy - a.accuracy);
}

/**
 * 生成回测报告
 */
export function generateBacktestReport(results: BacktestResult[]): string {
  const lines: string[] = [
    '# 鱼盆模型回测报告',
    '',
    `生成时间: ${new Date().toISOString().split('T')[0]}`,
    '',
    '## 概览',
    '',
    '| 指数 | 开始日期 | 结束日期 | 总天数 | YES天数 | NO天数 | 切换次数 | 准确率 |',
    '|------|----------|----------|--------|---------|--------|----------|--------|'
  ];

  for (const r of results) {
    lines.push(
      `| ${r.indexName} | ${r.startDate} | ${r.endDate} | ${r.totalDays} | ${r.yesDays} | ${r.noDays} | ${r.statusChanges} | ${r.accuracy.toFixed(1)}% |`
    );
  }

  lines.push('');
  lines.push('## 交易信号详情');
  lines.push('');

  for (const r of results) {
    if (r.trades.length > 0) {
      lines.push(`### ${r.indexName}`);
      lines.push('');
      lines.push('| 日期 | 类型 | 价格 | 临界值 | 原因 |');
      lines.push('|------|------|------|--------|------|');
      for (const t of r.trades) {
        lines.push(`| ${t.date} | ${t.type} | ${t.price.toFixed(2)} | ${t.threshold.toFixed(2)} | ${t.reason} |`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * 导出回测数据为CSV
 */
export function exportBacktestToCsv(result: BacktestResult): string {
  const headers = ['日期', '价格', 'MA20', '临界值', '状态', '偏离度(%)'];
  const lines = [headers.join(',')];

  for (const h of result.history) {
    const deviation = h.deviation >= 0 ? `+${h.deviation.toFixed(2)}` : h.deviation.toFixed(2);
    lines.push([
      h.date,
      h.price.toFixed(2),
      h.ma20.toFixed(2),
      h.threshold.toFixed(2),
      h.status,
      deviation
    ].join(','));
  }

  return lines.join('\n');
}

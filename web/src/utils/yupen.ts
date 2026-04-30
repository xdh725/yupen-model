/**
 * 鱼盆模型计算核心函数
 */

import type { IndexData, AppConfig, YupenStatus } from '@/types';

/**
 * 计算临界值
 * @param ma20 20日均线值
 * @param floatRate 浮动比例 (0-0.03)
 * @returns 临界值
 */
export function calculateThreshold(ma20: number, floatRate: number = 0): number {
  if (ma20 <= 0) return 0;
  return ma20 * (1 + floatRate);
}

/**
 * 判断鱼盆状态
 * @param currentPrice 当前价格
 * @param threshold 临界值
 * @returns YES 或 NO
 */
export function getStatus(currentPrice: number, threshold: number): YupenStatus {
  return currentPrice >= threshold ? 'YES' : 'NO';
}

/**
 * 计算偏离度
 * @param currentPrice 当前价格
 * @param threshold 临界值
 * @returns 偏离度百分比
 */
export function getDeviation(currentPrice: number, threshold: number): number {
  if (threshold === 0) return 0;
  return ((currentPrice - threshold) / threshold) * 100;
}

/**
 * 格式化偏离度显示
 * @param deviation 偏离度
 * @returns 格式化字符串
 */
export function formatDeviation(deviation: number): string {
  const sign = deviation >= 0 ? '+' : '';
  return `${sign}${deviation.toFixed(2)}%`;
}

/**
 * 计算趋势强度排名
 * 按偏离度降序排列，越接近或高于临界值的资产越强
 * 指数(market)与板块(sector)独立计算排名
 * @param indices 指数数组
 * @returns 排名后的指数数组
 */
export function calculateStrength(indices: IndexData[]): IndexData[] {
  const byCategory = new Map<string, IndexData[]>();
  for (const idx of indices) {
    const cat = idx.category || 'market';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(idx);
  }

  const result: IndexData[] = [];
  for (const group of byCategory.values()) {
    const sorted = [...group].sort((a, b) => b.deviation - a.deviation);
    result.push(...sorted.map((index, i) => ({
      ...index,
      strength: i + 1
    })));
  }

  return result;
}

/**
 * 完整计算单个指数的鱼盆数据
 * @param index 指数基础数据
 * @param config 应用配置
 * @returns 完整的指数数据
 */
export function calculateYupenData(
  index: Partial<IndexData>,
  config: AppConfig
): IndexData {
  const threshold = calculateThreshold(index.ma20!, config.floatRate);
  const status = getStatus(index.currentPrice!, threshold);
  const deviation = getDeviation(index.currentPrice!, threshold);

  return {
    id: index.id!,
    code: index.code!,
    name: index.name!,
    category: index.category,
    currentPrice: index.currentPrice!,
    ma20: index.ma20!,
    threshold,
    status,
    deviation,
    strength: 0, // 需要批量计算后更新
    duration: index.duration || 1,
    updatedAt: index.updatedAt || new Date().toISOString().split('T')[0],
    history: index.history || [],
    changePercent: index.changePercent ?? null,
    volumeRatio: index.volumeRatio ?? null,
    statusChangeDate: index.statusChangeDate ?? null,
    periodChangePercent: index.periodChangePercent ?? null,
    rankChange: index.rankChange ?? 0,
  };
}

/**
 * 批量计算所有指数的鱼盆数据（包含强度排名）
 * @param indices 指数数组
 * @param config 应用配置
 * @returns 计算后的指数数组
 */
export function calculateAllIndices(
  indices: Partial<IndexData>[],
  config: AppConfig
): IndexData[] {
  const calculated = indices.map(index => calculateYupenData(index, config));
  return calculateStrength(calculated);
}

/**
 * 统计市场状态
 * @param indices 指数数组
 * @returns 统计结果
 */
export function getMarketStats(indices: IndexData[]) {
  const total = indices.length;
  const yesCount = indices.filter(i => i.status === 'YES').length;
  const noCount = total - yesCount;
  const yesPercent = total > 0 ? (yesCount / total) * 100 : 0;

  // 获取最强指数
  const strongest = indices.length > 0 ? indices[0] : null;

  // 判断市场状态
  let marketStatus: 'bull' | 'bear' | 'neutral' = 'neutral';
  if (yesPercent > 60) {
    marketStatus = 'bull';
  } else if (yesPercent < 40) {
    marketStatus = 'bear';
  }

  return {
    total,
    yesCount,
    noCount,
    yesPercent,
    noPercent: 100 - yesPercent,
    strongest,
    marketStatus
  };
}

/**
 * 获取状态显示文本
 * @param status 状态
 * @returns 显示文本
 */
export function getStatusText(status: YupenStatus): string {
  return status === 'YES' ? '牛市信号' : '熊市信号';
}

/**
 * 获取市场状态文本
 * @param marketStatus 市场状态
 * @returns 显示文本
 */
export function getMarketStatusText(marketStatus: 'bull' | 'bear' | 'neutral'): string {
  switch (marketStatus) {
    case 'bull':
      return '牛市态势';
    case 'bear':
      return '熊市态势';
    default:
      return '震荡态势';
  }
}

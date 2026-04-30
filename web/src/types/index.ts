// 鱼盆模型类型定义

export type YupenStatus = 'YES' | 'NO';

export interface KDJData {
  k: number | null;
  d: number | null;
  j: number | null;
  jHistory: { date: string; j: number }[];
}

export interface IndexData {
  id: string;
  code: string;
  name: string;
  category?: 'market' | 'sector';  // market = 大盘, sector = 板块
  currentPrice: number;
  ma20: number;
  threshold: number;
  status: YupenStatus;
  deviation: number;
  strength: number;
  duration: number;
  updatedAt: string;
  history?: HistoryData[];
  kdj?: KDJData;
  changePercent?: number | null;       // 日涨幅 %
  volumeRatio?: number | null;         // 量比
  statusChangeDate?: string | null;    // 状态转变日期
  periodChangePercent?: number | null; // 区间涨幅(从状态转变开始)
  rankChange?: number;                 // 排序变化(与上一日对比, 负=上升)
}

export interface HistoryData {
  date: string;
  price: number;
  threshold: number;
  status: YupenStatus;
}

export interface IndexConfig {
  id: string;
  code: string;
  name: string;
}

export interface AppConfig {
  floatRate: number;
  indices: IndexConfig[];
}

export interface CsvRow {
  code: string;
  name: string;
  currentPrice: number;
  ma20: number;
  date?: string;
}

export interface SnapshotMeta {
  latest: string;
  dates: string[];
}

export interface SnapshotPayload {
  date: string;
  generatedAt: string;
  count: number;
  indices: IndexData[];
}

export const DEFAULT_INDICES: IndexConfig[] = [
  { id: 'sh000001', code: '000001.SH', name: '上证指数' },
  { id: 'sz399001', code: '399001.SZ', name: '深证成指' },
  { id: 'sz399006', code: '399006.SZ', name: '创业板指' },
  { id: 'sh000300', code: '000300.SH', name: '沪深300' },
  { id: 'sh000905', code: '000905.SH', name: '中证500' },
  { id: 'sh000688', code: '000688.SH', name: '科创50' },
  { id: 'sh000016', code: '000016.SH', name: '上证50' },
  { id: 'sh000852', code: '000852.SH', name: '中证1000' }
];

export const DEFAULT_CONFIG: AppConfig = {
  floatRate: 0,
  indices: DEFAULT_INDICES,
};

/**
 * 历史数据点（用于回测）
 */
export interface HistoryPoint {
  date: string;
  price: number;
  ma20: number;
  threshold: number;
  status: YupenStatus;
  deviation: number;
}

/**
 * 回测结果
 */
export interface BacktestResult {
  indexId: string;
  indexName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  yesDays: number;
  noDays: number;
  statusChanges: number;  // 状态切换次数
  accuracy: number;  // 准确率
  trades: Trade[];  // 交易信号
  history: HistoryPoint[];
}

/**
 * 交易信号
 */
export interface Trade {
  date: string;
  type: 'BUY' | 'SELL';
  price: number;
  threshold: number;
  reason: string;
}

/**
 * 回测配置
 */
export interface BacktestConfig {
  startDate?: string;
  endDate?: string;
  initialCapital?: number;
  floatRate?: number;
}

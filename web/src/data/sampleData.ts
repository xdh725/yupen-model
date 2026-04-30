import type { IndexData } from '../types';

// 礘例数据 - 模拟2024年3月的指数数据
// 注意：这是示例数据，用于演示UI，并非真实数据

export const sampleData: IndexData[] = [
  {
    id: 'sh000001',
    code: '000001.SH',
    name: '上证指数',
    currentPrice: 3250.12,
    ma20: 3200.00,
    threshold: 3200.00,
    status: 'YES',
    deviation: 1.57,
    strength: 2,
    duration: 5,
    updatedAt: '2024-03-15'
  },
  {
    id: 'sz399001',
    code: '399001.SZ',
    name: '深证成指',
    currentPrice: 10800.50,
    ma20: 10700.00,
    threshold: 10700.00,
    status: 'YES',
    deviation: 0.94,
    strength: 5,
    duration: 7,
    updatedAt: '2024-03-15'
  },
  {
    id: 'sz399006',
    code: '399006.SZ',
    name: '创业板指',
    currentPrice: 2250.30,
    ma20: 2200.00,
    threshold: 2200.00,
    status: 'YES',
    deviation: 2.29,
    strength: 1,
    duration: 3,
    updatedAt: '2024-03-15'
  },
  {
    id: 'sh000300',
    code: '000300.SH',
    name: '沪深300',
    currentPrice: 3800.25,
    ma20: 3850.00,
    threshold: 3850.00,
    status: 'NO',
    deviation: -1.29,
    strength: 6,
    duration: 2,
    updatedAt: '2024-03-15'
  },
  {
    id: 'sh000905',
    code: '000905.SH',
    name: '中证500',
    currentPrice: 5800.00,
    ma20: 5750.00,
    threshold: 5750.00,
    status: 'YES',
    deviation: 0.87,
    strength: 4,
    duration: 4,
    updatedAt: '2024-03-15'
  },
  {
    id: 'sh000688',
    code: '000688.SH',
    name: '科创50',
    currentPrice: 980.50,
    ma20: 970.00,
    threshold: 970.00,
    status: 'YES',
    deviation: 1.08,
    strength: 3,
    duration: 2,
    updatedAt: '2024-03-15'
  },
  {
    id: 'sh000016',
    code: '000016.SH',
    name: '上证50',
    currentPrice: 2600.80,
    ma20: 2650.00,
    threshold: 2650.00,
    status: 'NO',
    deviation: -1.85,
    strength: 8,
    duration: 3,
    updatedAt: '2024-03-15'
  },
  {
    id: 'sh000852',
    code: '000852.SH',
    name: '中证1000',
    currentPrice: 6200.00,
    ma20: 6300.00,
    threshold: 6300.00,
    status: 'NO',
    deviation: -1.59,
    strength: 7,
    duration: 1,
    updatedAt: '2024-03-15'
  }
];

// 示例CSV数据 - 可以直接复制粘贴到导入框
export const sampleCsvText = `code, name, currentPrice, ma20, date
000001.SH, 上证指数, 3250.12, 3200.00, 2024-03-15
399001.SZ, 深证成指, 10800.50, 10700.00, 2024-03-15
399006.SZ, 创业板指, 2250.30, 2200.00, 2024-03-15
000300.SH, 沪深300, 3800.25, 3850.00, 2024-03-15
000905.SH, 中证500, 5800.00, 5750.00, 2024-03-15
000688.SH, 科创50, 980.50, 970.00, 2024-03-15
000016.SH, 上证50, 2600.80, 2650.00, 2024-03-15
000852.SH, 中证1000, 6200.00, 6300.00, 2024-03-15`

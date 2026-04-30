import { describe, test, expect } from 'vitest';
import {
  calculateThreshold,
  getStatus,
  getDeviation,
  calculateStrength,
  getMarketStats
} from '../utils/yupen';
import type { IndexData } from '../types';

describe('鱼盆模型核心计算', () => {
  describe('calculateThreshold', () => {
    test('应该正确计算临界值', () => {
      expect(calculateThreshold(100, 0)).toBe(100);
      expect(calculateThreshold(100, 0.02)).toBe(102);
      expect(calculateThreshold(100, -0.02)).toBe(98);
    });

    test('当ma20为0时应该返回0', () => {
      expect(calculateThreshold(0, 0.02)).toBe(0);
      expect(calculateThreshold(-100, 0.02)).toBe(0);
    });
    test('默认浮动比例为0', () => {
      expect(calculateThreshold(100)).toBe(100);
    });
  });

  describe('getStatus', () => {
    test('价格高于临界值应返回YES', () => {
      expect(getStatus(105, 100)).toBe('YES');
      expect(getStatus(100.01, 100)).toBe('YES');
    });

    test('价格等于临界值应返回YES', () => {
      expect(getStatus(100, 100)).toBe('YES');
    });

    test('价格低于临界值应返回NO', () => {
      expect(getStatus(99.99, 100)).toBe('NO');
      expect(getStatus(50, 100)).toBe('NO');
    });
  });

  describe('getDeviation', () => {
    test('应该正确计算偏离度', () => {
      expect(getDeviation(110, 100)).toBe(10);
      expect(getDeviation(90, 100)).toBe(-10);
      expect(getDeviation(105, 100)).toBe(5);
    });

    test('偏离度百分比计算', () => {
      // +5% 偏离
      expect(getDeviation(105, 100)).toBe(5);
      // -5% 偏离
      expect(getDeviation(95, 100)).toBe(-5);
      // +1% 偏离
      expect(getDeviation(101, 100)).toBe(1);
    });

    test('临界值为0时应该返回0', () => {
      expect(getDeviation(100, 0)).toBe(0);
    });
  });

  describe('calculateStrength', () => {
    test('应该按偏离度从高到低排序', () => {
      const indices: IndexData[] = [
        { id: '1', code: 'A', name: 'Index A', currentPrice: 110, ma20: 100, threshold: 100, status: 'YES', deviation: 10, strength: 0, duration: 1, updatedAt: '2024-01-01' },
        { id: '2', code: 'B', name: 'Index B', currentPrice: 95, ma20: 100, threshold: 100, status: 'NO', deviation: -5, strength: 0, duration: 1, updatedAt: '2024-01-01' },
        { id: '3', code: 'C', name: 'Index C', currentPrice: 105, ma20: 100, threshold: 100, status: 'YES', deviation: 5, strength: 0, duration: 1, updatedAt: '2024-01-01' },
      ];

      const result = calculateStrength(indices);

      // 偏离度排序: 10 > 5 > -5
      expect(result[0].strength).toBe(1); // deviation: 10
      expect(result[1].strength).toBe(2); // deviation: 5
      expect(result[2].strength).toBe(3); // deviation: -5
    });

    test('指数与板块应独立计算排名', () => {
      const indices: IndexData[] = [
        { id: '1', code: 'A', name: 'Market A', category: 'market', currentPrice: 110, ma20: 100, threshold: 100, status: 'YES', deviation: 10, strength: 0, duration: 1, updatedAt: '2024-01-01' },
        { id: '2', code: 'B', name: 'Market B', category: 'market', currentPrice: 95, ma20: 100, threshold: 100, status: 'NO', deviation: -5, strength: 0, duration: 1, updatedAt: '2024-01-01' },
        { id: '3', code: 'C', name: 'Sector A', category: 'sector', currentPrice: 108, ma20: 100, threshold: 100, status: 'YES', deviation: 8, strength: 0, duration: 1, updatedAt: '2024-01-01' },
        { id: '4', code: 'D', name: 'Sector B', category: 'sector', currentPrice: 92, ma20: 100, threshold: 100, status: 'NO', deviation: -8, strength: 0, duration: 1, updatedAt: '2024-01-01' },
      ];

      const result = calculateStrength(indices);

      const marketA = result.find(i => i.id === '1')!;
      const marketB = result.find(i => i.id === '2')!;
      const sectorA = result.find(i => i.id === '3')!;
      const sectorB = result.find(i => i.id === '4')!;

      // market 组内独立排名
      expect(marketA.strength).toBe(1); // deviation 10, market最强
      expect(marketB.strength).toBe(2); // deviation -5, market第二

      // sector 组内独立排名
      expect(sectorA.strength).toBe(1); // deviation 8, sector最强
      expect(sectorB.strength).toBe(2); // deviation -8, sector第二
    });
  });

  describe('getMarketStats', () => {
    test('应该正确统计市场状态', () => {
      const indices: IndexData[] = [
        { id: '1', code: 'A', name: 'Index A', currentPrice: 110, ma20: 100, threshold: 100, status: 'YES', deviation: 10, strength: 1, duration: 1, updatedAt: '2024-01-01' },
        { id: '2', code: 'B', name: 'Index B', currentPrice: 95, ma20: 100, threshold: 100, status: 'NO', deviation: -5, strength: 2, duration: 1, updatedAt: '2024-01-01' },
        { id: '3', code: 'C', name: 'Index C', currentPrice: 105, ma20: 100, threshold: 100, status: 'YES', deviation: 5, strength: 3, duration: 1, updatedAt: '2024-01-01' },
      ];

      const stats = getMarketStats(indices);

      expect(stats.total).toBe(3);
      expect(stats.yesCount).toBe(2);
      expect(stats.noCount).toBe(1);
      expect(stats.yesPercent).toBeCloseTo(66.67, 0.1);
    });

    test('牛市判断 - 超过60%为YES', () => {
      const indices: IndexData[] = Array(7).fill(null).map((_, i) => ({
        id: String(i),
        code: 'A',
        name: 'Index',
        currentPrice: 110,
        ma20: 100,
        threshold: 100,
        status: 'YES' as const,
        deviation: 10,
        strength: i + 1,
        duration: 1,
        updatedAt: '2024-01-01'
      }));

      const stats = getMarketStats(indices);
      expect(stats.marketStatus).toBe('bull');
    });

    test('熊市判断 - 低于40%为YES', () => {
      const indices: IndexData[] = Array(7).fill(null).map((_, i) => ({
        id: String(i),
        code: 'A',
        name: 'Index',
        currentPrice: 90,
        ma20: 100,
        threshold: 100,
        status: 'NO' as const,
        deviation: -10,
        strength: i + 1,
        duration: 1,
        updatedAt: '2024-01-01'
      }));

      const stats = getMarketStats(indices);
      expect(stats.marketStatus).toBe('bear');
    });

    test('震荡判断 - 40%-60%为YES', () => {
      const indices: IndexData[] = [
        ...Array(5).fill(null).map((_, i) => ({
          id: String(i),
          code: 'A',
          name: 'Index',
          currentPrice: 110,
          ma20: 100,
          threshold: 100,
          status: 'YES' as const,
          deviation: 10,
          strength: i + 1,
          duration: 1,
          updatedAt: '2024-01-01'
        })),
        ...Array(5).fill(null).map((_, i) => ({
          id: String(i + 5),
          code: 'B',
          name: 'Index',
          currentPrice: 90,
          ma20: 100,
          threshold: 100,
          status: 'NO' as const,
          deviation: -10,
          strength: i + 6,
          duration: 1,
          updatedAt: '2024-01-01'
        })),
      ];

      const stats = getMarketStats(indices);
      expect(stats.marketStatus).toBe('neutral');
    });
  });
});

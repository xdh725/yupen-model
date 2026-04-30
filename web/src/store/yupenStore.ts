/**
 * 鱼盆模型状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IndexData, AppConfig } from '@/types';
import { DEFAULT_CONFIG, DEFAULT_INDICES } from '@/types';
import { calculateYupenData, calculateStrength } from '@/utils/yupen';
import { parseCsv, toCsv } from '@/utils/csv';
import { fetchSnapshotByDate, fetchSnapshotManifest } from '@/utils/snapshots';

interface YupenStore {
  // 状态
  indices: IndexData[];
  config: AppConfig;
  availableDates: string[];
  selectedDate: string | null;
  loadingSnapshot: boolean;
  snapshotError: string | null;

  // 操作
  setIndices: (indices: IndexData[]) => void;
  updateIndex: (id: string, data: Partial<IndexData>) => void;
  addIndex: (index: Partial<IndexData>) => void;
  setFloatRate: (rate: number) => void;
  recalculate: () => void;
  reset: () => void;
  importFromCsv: (csvText: string) => { success: number; failed: number };
  exportToCsv: () => string;
  initializeDefaultIndices: () => void;
  loadSnapshotManifest: () => Promise<void>;
  loadSnapshotByDate: (date: string) => Promise<void>;
}

export const useYupenStore = create<YupenStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      indices: [],
      config: DEFAULT_CONFIG,
      availableDates: [],
      selectedDate: null,
      loadingSnapshot: false,
      snapshotError: null,

      // 设置所有指数数据
      setIndices: (indices) => {
        const { config } = get();
        const recalculated = calculateStrength(
          indices.map(i => calculateYupenData(i, config))
        );
        set({ indices: recalculated });
      },

      // 更新单个指数
      updateIndex: (id, data) => {
        const { indices, config } = get();
        const updated = indices.map(i => {
          if (i.id === id) {
            const merged = { ...i, ...data };
            return calculateYupenData(merged, config);
          }
          return i;
        });
        set({ indices: calculateStrength(updated) });
      },

      // 添加指数
      addIndex: (index) => {
        const { indices, config } = get();
        const newIndex = calculateYupenData(index, config);
        const updated = [...indices, newIndex];
        set({ indices: calculateStrength(updated) });
      },

      // 设置浮动比例
      setFloatRate: (rate) => {
        set({ config: { ...get().config, floatRate: rate } });
        get().recalculate();
      },

      // 重新计算所有数据
      recalculate: () => {
        const { indices, config } = get();
        const recalculated = calculateStrength(
          indices.map(i => calculateYupenData(i, config))
        );
        set({ indices: recalculated });
      },

      // 重置所有数据
      reset: () => {
        set({
          indices: [],
          config: DEFAULT_CONFIG,
          availableDates: [],
          selectedDate: null,
          loadingSnapshot: false,
          snapshotError: null
        });
      },

      // 从CSV导入
      importFromCsv: (csvText: string) => {
        const rows = parseCsv(csvText);
        const { config, indices: existingIndices } = get();

        let success = 0;
        let failed = 0;

        const newIndices = rows.map(row => {
          try {
            const id = row.code.replace(/\./g, '_').toLowerCase();
            const existing = existingIndices.find(i => i.id === id);

            const indexData: Partial<IndexData> = {
              id,
              code: row.code,
              name: row.name,
              currentPrice: row.currentPrice,
              ma20: row.ma20,
              duration: existing ? existing.duration + 1 : 1,
              updatedAt: row.date || new Date().toISOString().split('T')[0]
            };

            if ((indexData.currentPrice ?? 0) > 0 && (indexData.ma20 ?? 0) > 0) {
              success++;
              return indexData;
            } else {
              failed++;
              return null;
            }
          } catch (e) {
            failed++;
            return null;
          }
        }).filter(Boolean) as IndexData[];

        if (newIndices.length > 0) {
          set({ indices: calculateStrength(newIndices.map(i => calculateYupenData(i, config))) });
        }

        return { success, failed };
      },

      // 导出为CSV
      exportToCsv: () => {
        return toCsv(get().indices);
      },

      // 初始化默认指数（空数据，等待用户输入）
      initializeDefaultIndices: () => {
        const { config } = get();
        const defaultIndices: Partial<IndexData>[] = DEFAULT_INDICES.map(idx => ({
          id: idx.id,
          code: idx.code,
          name: idx.name,
          currentPrice: 0,
          ma20: 0,
          duration: 0
        }));
        const calculated = defaultIndices.map(idx => calculateYupenData(idx, config));
        set({ indices: calculateStrength(calculated) });
      },

      loadSnapshotManifest: async () => {
        set({ loadingSnapshot: true, snapshotError: null });
        try {
          const manifest = await fetchSnapshotManifest();
          set({
            availableDates: manifest.dates,
            selectedDate: get().selectedDate ?? manifest.latest
          });
          if (manifest.latest) {
            await get().loadSnapshotByDate(get().selectedDate ?? manifest.latest);
          } else {
            set({ loadingSnapshot: false });
          }
        } catch (error) {
          set({
            loadingSnapshot: false,
            snapshotError: error instanceof Error ? error.message : '加载快照目录失败'
          });
        }
      },

      loadSnapshotByDate: async (date) => {
        set({ loadingSnapshot: true, snapshotError: null });
        try {
          const snapshot = await fetchSnapshotByDate(date);
          // 确保 category 字段存在，如果没有则默认为 market
          const indicesWithCategory = snapshot.indices.map(idx => ({
            ...idx,
            category: idx.category || 'market'
          }));
          set({
            indices: calculateStrength(indicesWithCategory),
            selectedDate: snapshot.date,
            loadingSnapshot: false
          });
        } catch (error) {
          set({
            loadingSnapshot: false,
            snapshotError: error instanceof Error ? error.message : `加载 ${date} 快照失败`
          });
        }
      }
    }),
    {
      name: 'yupen-storage',
      version: 1
    }
  )
);

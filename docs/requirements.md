# 鱼盆模型 Web 应用 - 需求文档

## 一、项目概述

### 1.1 项目背景

鱼盆模型是由猫笔刀提出的基于**20日均线**的股票趋势分析模型。本应用旨在构建一个**纯前端Web应用**，帮助用户快速判断市场"大势"，识别强弱板块。

### 1.2 核心特点

- ✅ **纯前端**：无需后端服务，可直接部署到 GitHub Pages / Vercel
- ✅ **本地存储**：使用 localStorage 存储数据，数据安全可控
- ✅ **灵活输入**：支持手动输入、CSV导入等多种数据录入方式
- ✅ **可视化**：直观展示市场趋势和板块强弱

### 1.3 目标用户

- 个人投资者
- 使用鱼盆模型进行趋势跟踪的用户
- 希望快速了解市场整体态势的投资者

---

## 二、功能需求

### 2.1 核心功能模块

#### 模块1：仪表盘（Dashboard）

| 功能点 | 描述 | 优先级 |
|--------|------|--------|
| 状态统计卡片 | 显示 YES/NO 数量，判断牛熊状态 | P0 |
| 指数数据表格 | 展示所有指数的鱼盆数据 | P0 |
| 强度排名 | 按偏离度排序，标识最强/最弱板块 | P0 |
| 趋势图表 | 价格与临界值的走势对比 | P1 |

#### 模块2：数据管理

| 功能点 | 描述 | 优先级 |
|--------|------|--------|
| 手动输入 | 手动填写指数的当前价和20日均线 | P0 |
| CSV导入 | 从文件导入批量数据 | P0 |
| CSV导出 | 导出当前数据为CSV文件 | P1 |
| 数据编辑 | 编辑已有数据 | P0 |
| 数据删除 | 删除指数数据 | P0 |

#### 模块3：设置

| 功能点 | 描述 | 优先级 |
|--------|------|--------|
| 临界值浮动 | 配置临界值上下浮动比例（0%~3%） | P0 |
| 指数管理 | 添加/删除/排序监控的指数 | P0 |
| 数据重置 | 清空所有数据恢复默认 | P1 |
| 主题切换 | 亮色/暗色模式 | P2 |

### 2.2 数据字段

每个指数包含以下字段：

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| id | string | 唯一标识 | "sh000001" |
| code | string | 指数代码 | "000001.SH" |
| name | string | 指数名称 | "上证指数" |
| currentPrice | number | 当前收盘价 | 3250.12 |
| ma20 | number | 20日均线值 | 3200.00 |
| threshold | number | 临界值（计算得出） | 3200.00 |
| status | 'YES' \| 'NO' | 鱼盆状态 | "YES" |
| deviation | number | 偏离度（百分比） | 1.56 |
| strength | number | 趋势强度排名 | 1 |
| duration | number | 状态持续天数 | 5 |
| updatedAt | string | 数据更新时间 | "2024-03-16" |

### 2.3 计算规则

#### 临界值计算

```
临界值 = 20日均线 × (1 + 浮动比例)

// 示例：浮动比例为 0%
threshold = 3200 × (1 + 0) = 3200

// 示例：浮动比例为 1%
threshold = 3200 × (1 + 0.01) = 3232
```

#### 状态判断

```
状态 = 当前价 > 临界值 ? "YES" : "NO"
```

#### 偏离度计算

```
偏离度 = (当前价 - 临界值) / 临界值 × 100

// 示例
deviation = (3250 - 3200) / 3200 × 100 = 1.56%
```

#### 趋势强度排名

```
1. 计算所有指数偏离度的绝对值
2. 按绝对值降序排列
3. 绝对值最大的排在第1位（最强）
```

---

## 三、界面设计

### 3.1 整体布局

```
┌──────────────────────────────────────────────────────────────┐
│  🐟 鱼盆模型 - 市场趋势分析                   [导入] [设置]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐              │
│  │ ✅ YES     │  │ ❌ NO      │  │ 📊 最强    │              │
│  │    5 / 8   │  │    3 / 8   │  │   创业板   │              │
│  │   牛市信号 │  │   熊市信号 │  │   +2.27%   │              │
│  └────────────┘  └────────────┘  └────────────┘              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  📈 指数趋势分析                                             │
│  ┌───┬──────────┬────────┬────────┬────────┬────────┬─────┐ │
│  │ # │ 指数名称 │ 状态   │ 现价   │ 临界值 │ 偏离度 │天数 │ │
│  ├───┼──────────┼────────┼────────┼────────┼────────┼─────┤ │
│  │ 1 │ 创业板指 │ ✅ YES │ 2250   │ 2200   │ +2.27% │  5  │ │
│  │ 2 │ 上证指数 │ ✅ YES │ 3250   │ 3200   │ +1.56% │  3  │ │
│  │...│   ...    │  ...   │  ...   │  ...   │  ...   │ ... │ │
│  └───┴──────────┴────────┴────────┴────────┴────────┴─────┘ │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  📊 趋势图表                                                 │
│  ┌──────────────────────────────────────────────────────────┐│
│  │              价格 vs 临界值 走势图                       ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

### 3.2 状态卡片设计

#### YES 卡片（牛市信号）

```
┌────────────────┐
│  ✅ YES        │
│      5 / 8     │
│   牛市信号     │
│                │
│  超过半数指数  │
│  站上临界值    │
└────────────────┘
```

- 背景色：绿色渐变
- 当 YES 数量 > 总数 50% 时，显示"牛市信号"

#### NO 卡片（熊市信号）

```
┌────────────────┐
│  ❌ NO         │
│      3 / 8     │
│   熊市信号     │
│                │
│  超过半数指数  │
│  跌破临界值    │
└────────────────┘
```

- 背景色：红色渐变
- 当 NO 数量 > 总数 50% 时，显示"熊市信号"

#### 最强板块卡片

```
┌────────────────┐
│  📊 最强板块   │
│    创业板指    │
│    +2.27%      │
│                │
│  趋势强度 #1   │
└────────────────┘
```

- 显示偏离度绝对值最大的指数
- 背景色：蓝色渐变

### 3.3 数据表格设计

| 列名 | 宽度 | 对齐 | 说明 |
|------|------|------|------|
| # | 50px | 居中 | 强度排名，前3名显示奖牌 |
| 指数名称 | 120px | 左对齐 | 指数中文名称 |
| 状态 | 80px | 居中 | YES(绿色) / NO(红色) |
| 现价 | 100px | 右对齐 | 当前收盘价 |
| 临界值 | 100px | 右对齐 | 计算后的临界值 |
| 偏离度 | 80px | 右对齐 | 正数绿色，负数红色 |
| 持续天数 | 80px | 居中 | 当前状态持续天数 |

### 3.4 颜色规范

| 元素 | 颜色 | 用途 |
|------|------|------|
| YES 状态 | #10B981 (绿色) | 表示站上临界值 |
| NO 状态 | #EF4444 (红色) | 表示跌破临界值 |
| 主色调 | #3B82F6 (蓝色) | 品牌色、强调色 |
| 背景 | #F9FAFB | 页面背景 |
| 卡片背景 | #FFFFFF | 卡片背景 |
| 文字主色 | #111827 | 主要文字 |
| 文字次色 | #6B7280 | 次要文字 |

---

## 四、技术方案

### 4.1 技术栈

| 层级 | 技术选型 | 版本 | 理由 |
|------|----------|------|------|
| 框架 | React | 18.x | 主流、生态丰富 |
| 语言 | TypeScript | 5.x | 类型安全 |
| 构建 | Vite | 5.x | 快速、现代 |
| 样式 | Tailwind CSS | 3.x | 高效开发 |
| UI组件 | shadcn/ui | latest | 美观、可定制 |
| 图表 | Recharts | 2.x | React生态、轻量 |
| 状态管理 | Zustand | 4.x | 轻量级 |
| 工具库 | date-fns | 3.x | 日期处理 |

### 4.2 目录结构

```
web/
├── src/
│   ├── components/           # UI组件
│   │   ├── ui/               # shadcn/ui 组件
│   │   ├── Dashboard.tsx     # 仪表盘主页
│   │   ├── StatusCard.tsx    # 状态统计卡片
│   │   ├── IndexTable.tsx    # 指数数据表格
│   │   ├── TrendChart.tsx    # 趋势图表
│   │   ├── DataInput.tsx     # 数据输入/导入
│   │   └── Settings.tsx      # 设置页面
│   ├── hooks/                # 自定义Hooks
│   │   └── useYupenData.ts   # 数据管理Hook
│   ├── store/                # 状态管理
│   │   └── yupenStore.ts     # Zustand Store
│   ├── utils/                # 工具函数
│   │   ├── yupen.ts          # 鱼盆计算逻辑
│   │   ├── storage.ts        # 本地存储
│   │   └── csv.ts            # CSV解析
│   ├── types/                # 类型定义
│   │   └── index.ts
│   ├── lib/                  # 工具库
│   │   └── utils.ts          # 通用工具
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── components.json           # shadcn/ui 配置
```

### 4.3 核心代码设计

#### 类型定义 (types/index.ts)

```typescript
// 指数数据
export interface IndexData {
  id: string;
  code: string;
  name: string;
  currentPrice: number;
  ma20: number;
  threshold: number;
  status: 'YES' | 'NO';
  deviation: number;
  strength: number;
  duration: number;
  updatedAt: string;
  history?: HistoryData[];
}

// 历史数据
export interface HistoryData {
  date: string;
  price: number;
  threshold: number;
  status: 'YES' | 'NO';
}

// 应用配置
export interface AppConfig {
  floatRate: number;          // 临界值浮动比例 (0-0.03)
  indices: IndexConfig[];     // 监控的指数列表
}

export interface IndexConfig {
  id: string;
  code: string;
  name: string;
}
```

#### 鱼盆计算 (utils/yupen.ts)

```typescript
import { IndexData, AppConfig } from '../types';

// 计算临界值
export function calculateThreshold(ma20: number, floatRate: number): number {
  return ma20 * (1 + floatRate);
}

// 判断状态
export function getStatus(currentPrice: number, threshold: number): 'YES' | 'NO' {
  return currentPrice > threshold ? 'YES' : 'NO';
}

// 计算偏离度
export function getDeviation(currentPrice: number, threshold: number): number {
  if (threshold === 0) return 0;
  return ((currentPrice - threshold) / threshold) * 100;
}

// 计算趋势强度排名
export function calculateStrength(indices: IndexData[]): IndexData[] {
  const sorted = [...indices].sort((a, b) => {
    return Math.abs(b.deviation) - Math.abs(a.deviation);
  });
  return sorted.map((index, i) => ({
    ...index,
    strength: i + 1
  }));
}

// 完整计算
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
    currentPrice: index.currentPrice!,
    ma20: index.ma20!,
    threshold,
    status,
    deviation,
    strength: 0, // 需要批量计算后更新
    duration: index.duration || 1,
    updatedAt: new Date().toISOString().split('T')[0]
  };
}
```

#### 状态管理 (store/yupenStore.ts)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IndexData, AppConfig } from '../types';
import { calculateYupenData, calculateStrength } from '../utils/yupen';

interface YupenStore {
  // 状态
  indices: IndexData[];
  config: AppConfig;

  // 操作
  setIndices: (indices: IndexData[]) => void;
  updateIndex: (id: string, data: Partial<IndexData>) => void;
  addIndex: (index: IndexData) => void;
  deleteIndex: (id: string) => void;
  setFloatRate: (rate: number) => void;
  recalculate: () => void;
  reset: () => void;
}

const defaultConfig: AppConfig = {
  floatRate: 0,
  indices: [
    { id: 'sh000001', code: '000001.SH', name: '上证指数' },
    { id: 'sz399001', code: '399001.SZ', name: '深证成指' },
    { id: 'sz399006', code: '399006.SZ', name: '创业板指' },
    { id: 'sh000300', code: '000300.SH', name: '沪深300' },
    { id: 'sh000905', code: '000905.SH', name: '中证500' },
    { id: 'sh000688', code: '000688.SH', name: '科创50' },
    { id: 'sh000016', code: '000016.SH', name: '上证50' },
    { id: 'sh000852', code: '000852.SH', name: '中证1000' }
  ]
};

export const useYupenStore = create<YupenStore>()(
  persist(
    (set, get) => ({
      indices: [],
      config: defaultConfig,

      setIndices: (indices) => {
        const recalculated = calculateStrength(
          indices.map(i => calculateYupenData(i, get().config))
        );
        set({ indices: recalculated });
      },

      updateIndex: (id, data) => {
        const indices = get().indices.map(i =>
          i.id === id ? { ...i, ...data } : i
        );
        const recalculated = calculateStrength(
          indices.map(i => calculateYupenData(i, get().config))
        );
        set({ indices: recalculated });
      },

      addIndex: (index) => {
        const indices = [...get().indices, index];
        const recalculated = calculateStrength(
          indices.map(i => calculateYupenData(i, get().config))
        );
        set({ indices: recalculated });
      },

      deleteIndex: (id) => {
        set({ indices: get().indices.filter(i => i.id !== id) });
      },

      setFloatRate: (rate) => {
        set({ config: { ...get().config, floatRate: rate } });
        get().recalculate();
      },

      recalculate: () => {
        const { indices, config } = get();
        const recalculated = calculateStrength(
          indices.map(i => calculateYupenData(i, config))
        );
        set({ indices: recalculated });
      },

      reset: () => {
        set({ indices: [], config: defaultConfig });
      }
    }),
    {
      name: 'yupen-storage'
    }
  )
);
```

---

## 五、数据交互

### 5.1 本地存储

使用 localStorage 存储以下数据：

```typescript
// 存储键
const STORAGE_KEYS = {
  INDICES: 'yupen_indices',      // 指数数据
  CONFIG: 'yupen_config',        // 应用配置
  HISTORY: 'yupen_history'       // 历史数据
};
```

### 5.2 CSV 格式

#### 导入格式

```csv
代码,名称,当前价,20日均线,日期
000001.SH,上证指数,3250.12,3200.00,2024-03-16
399001.SZ,深证成指,10800.50,10700.00,2024-03-16
399006.SZ,创业板指,2250.30,2200.00,2024-03-16
```

#### 导出格式

```csv
排名,代码,名称,状态,当前价,临界值,偏离度(%),持续天数,更新日期
1,399006.SZ,创业板指,YES,2250.30,2200.00,2.27,5,2024-03-16
2,000001.SH,上证指数,YES,3250.12,3200.00,1.56,3,2024-03-16
...
```

---

## 六、开发计划

### 6.1 阶段划分

| 阶段 | 内容 | 预计工时 | 依赖 |
|------|------|----------|------|
| Phase 1 | 项目初始化 | 1h | - |
| Phase 2 | 核心计算逻辑 | 1h | Phase 1 |
| Phase 3 | 数据管理 | 2h | Phase 2 |
| Phase 4 | 仪表盘UI | 3h | Phase 3 |
| Phase 5 | 图表可视化 | 2h | Phase 4 |
| Phase 6 | 设置与优化 | 2h | Phase 5 |
| Phase 7 | 测试与文档 | 1h | Phase 6 |

**总计：约12小时**

### 6.2 详细任务

#### Phase 1: 项目初始化 (1h)

- [ ] 创建 Vite + React + TypeScript 项目
- [ ] 配置 Tailwind CSS
- [ ] 安装 shadcn/ui 组件库
- [ ] 安装 Zustand、Recharts 等依赖
- [ ] 创建目录结构

#### Phase 2: 核心计算逻辑 (1h)

- [ ] 定义类型 (types/index.ts)
- [ ] 实现鱼盆计算函数 (utils/yupen.ts)
- [ ] 实现本地存储 (utils/storage.ts)
- [ ] 实现 CSV 解析 (utils/csv.ts)
- [ ] 创建 Zustand Store (store/yupenStore.ts)

#### Phase 3: 数据管理 (2h)

- [ ] 创建数据输入组件 (DataInput.tsx)
- [ ] 实现手动输入功能
- [ ] 实现 CSV 导入功能
- [ ] 实现 CSV 导出功能
- [ ] 实现数据编辑/删除功能

#### Phase 4: 仪表盘UI (3h)

- [ ] 创建状态卡片组件 (StatusCard.tsx)
- [ ] 创建数据表格组件 (IndexTable.tsx)
- [ ] 创建仪表盘页面 (Dashboard.tsx)
- [ ] 实现响应式布局
- [ ] 添加加载/空状态处理

#### Phase 5: 图表可视化 (2h)

- [ ] 创建趋势图表组件 (TrendChart.tsx)
- [ ] 实现价格 vs 临界值走势图
- [ ] 添加图表交互（选择指数）
- [ ] 优化图表样式

#### Phase 6: 设置与优化 (2h)

- [ ] 创建设置页面 (Settings.tsx)
- [ ] 实现临界值浮动配置
- [ ] 实现指数管理（添加/删除）
- [ ] 实现数据重置功能
- [ ] 实现暗色模式（可选）

#### Phase 7: 测试与文档 (1h)

- [ ] 添加示例数据
- [ ] 功能测试
- [ ] 编写使用文档
- [ ] 打包构建测试

---

## 七、部署方案

### 7.1 构建命令

```bash
# 开发环境
npm run dev

# 生产构建
npm run build

# 预览构建结果
npm run preview
```

### 7.2 部署选项

| 平台 | 步骤 | 特点 |
|------|------|------|
| GitHub Pages | push 到 gh-pages 分支 | 免费、自动部署 |
| Vercel | 连接 GitHub 仓库 | 免费、自动部署 |
| Netlify | 连接 GitHub 仓库 | 免费、自动部署 |
| 本地 | 直接打开 index.html | 无需服务器 |

---

## 八、风险与约束

### 8.1 已知限制

| 限制 | 说明 | 应对措施 |
|------|------|----------|
| 无实时数据 | 需要用户手动更新 | 支持CSV批量导入 |
| localStorage 限制 | 约5MB存储空间 | 定期清理历史数据 |
| 跨域问题 | 部分API可能无法调用 | 以手动输入为主 |

### 8.2 未来扩展

- [ ] 支持更多数据源（如 akshare API）
- [ ] 添加状态变化通知
- [ ] 支持自选股管理
- [ ] 添加回测功能
- [ ] 移动端适配优化

---

## 九、附录

### 9.1 默认监控指数

| 代码 | 名称 | 说明 |
|------|------|------|
| 000001.SH | 上证指数 | 上海证券交易所综合指数 |
| 399001.SZ | 深证成指 | 深圳证券交易所成份指数 |
| 399006.SZ | 创业板指 | 创业板综合指数 |
| 000300.SH | 沪深300 | 沪深两市300只龙头股 |
| 000905.SH | 中证500 | 中盘股代表指数 |
| 000688.SH | 科创50 | 科创板50只代表股 |
| 000016.SH | 上证50 | 上海50只大盘股 |
| 000852.SH | 中证1000 | 小盘股代表指数 |

### 9.2 参考资料

- [鱼盆模型理论基础](./theory.md)
- [鱼盆模型操作规则](./rules.md)
- [React 官方文档](https://react.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [Recharts 文档](https://recharts.org/)

# Project Structure

## Directory Organization

```
yupen-model/
├── docs/                          # 项目文档
│   ├── theory.md                  # 鱼盆模型理论基础
│   └── rules.md                   # 模型操作规则
│
├── web/                           # Web 前端应用
│   ├── src/                       # 源代码
│   │   ├── components/            # UI 组件
│   │   │   ├── ui/                # 基础 UI 组件 (shadcn/ui 风格)
│   │   │   │   ├── button.tsx     # 按钮组件
│   │   │   │   ├── card.tsx       # 卡片组件
│   │   │   │   ├── input.tsx      # 输入框组件
│   │   │   │   └── table.tsx      # 表格组件
│   │   │   ├── Dashboard.tsx      # 主仪表盘组件
│   │   │   ├── StatusCard.tsx     # 状态卡片组件
│   │   │   ├── IndexTable.tsx     # 指数表格组件
│   │   │   └── BacktestPanel.tsx  # 回测面板组件
│   │   │
│   │   ├── utils/                 # 工具函数
│   │   │   ├── yupen.ts           # 鱼盆模型核心计算逻辑
│   │   │   ├── csv.ts             # CSV 文件处理
│   │   │   └── backtest.ts        # 回测逻辑
│   │   │
│   │   ├── store/                 # 状态管理
│   │   │   └── yupenStore.ts      # Zustand store
│   │   │
│   │   ├── types/                 # TypeScript 类型定义
│   │   │   └── index.ts           # 全局类型
│   │   │
│   │   ├── data/                  # 静态数据
│   │   │   └── sampleData.ts      # 示例数据
│   │   │
│   │   ├── __tests__/             # 测试文件
│   │   │   └── yupen.test.ts      # 鱼盆模型测试
│   │   │
│   │   ├── lib/                   # 工具库
│   │   │   └── utils.ts           # 通用工具函数
│   │   │
│   │   ├── assets/                # 静态资源
│   │   │   └── *.png/svg          # 图片资源
│   │   │
│   │   ├── App.tsx                # 应用入口组件
│   │   ├── main.tsx               # 应用入口
│   │   ├── index.css              # 全局样式
│   │   └── App.css                # 应用样式
│   │
│   ├── public/                    # 公共静态资源
│   ├── node_modules/              # 依赖包
│   ├── package.json               # 项目配置
│   ├── tsconfig.json              # TypeScript 配置
│   ├── tsconfig.node.json         # Node TypeScript 配置
│   ├── vite.config.ts             # Vite 配置
│   ├── eslint.config.js           # ESLint 配置
│   └── index.html                 # HTML 入口
│
├── .spec-workflow/                # Spec Workflow 目录
│   ├── templates/                 # 默认模板
│   ├── user-templates/            # 用户自定义模板
│   ├── steering/                  # 项目指导文档
│   │   ├── product.md             # 产品概述
│   │   ├── tech.md                # 技术栈
│   │   └── structure.md           # 项目结构
│   ├── specs/                     # 规格文档
│   ├── approvals/                 # 审批请求
│   └── archive/                   # 归档文档
│
├── data/                          # 数据目录 (预留)
│   ├── stocks/                    # 股票数据
│   └── sectors/                   # 板块数据
│
├── analysis/                      # 分析记录 (预留)
│   ├── daily/                     # 日常分析
│   └── weekly/                    # 周度总结
│
├── reports/                       # 报告输出 (预留)
│   ├── signals/                   # 交易信号
│   └── reviews/                   # 复盘报告
│
└── README.md                      # 项目说明
```

## Naming Conventions

### Files
- **Components**: `PascalCase.tsx` (如 `Dashboard.tsx`, `StatusCard.tsx`)
- **Utilities**: `camelCase.ts` (如 `yupen.ts`, `csv.ts`)
- **Types**: `index.ts` (统一导出)
- **Tests**: `[filename].test.ts` (如 `yupen.test.ts`)
- **Styles**: `kebab-case.css` (如 `index.css`)

### Code
- **Components/Types**: `PascalCase` (如 `IndexData`, `Dashboard`)
- **Functions/Methods**: `camelCase` (如 `calculateThreshold`, `getMarketStats`)
- **Constants**: `UPPER_SNAKE_CASE` (如 `DEFAULT_INDICES`, `DEFAULT_CONFIG`)
- **Variables**: `camelCase` (如 `currentPrice`, `ma20`)

## Import Patterns

### Import Order
```typescript
// 1. React 相关
import { useState, useEffect } from 'react'

// 2. 外部依赖
import { LineChart, Line, XAxis, YAxis } from 'recharts'
import { useStore } from 'zustand'

// 3. 内部模块 (使用 @/ 别名)
import type { IndexData, YupenStatus } from '@/types'
import { useYupenStore } from '@/store/yupenStore'
import { calculateThreshold } from '@/utils/yupen'

// 4. 相对导入
import { Button } from './ui/button'
import { Card } from './ui/card'

// 5. 样式导入
import './index.css'
```

### Module/Package Organization
- 使用 `@/` 别名指向 `src/` 目录
- 类型统一从 `@/types` 导入
- 组件使用相对路径或 `@/components` 导入
- 工具函数从 `@/utils` 导入

## Code Structure Patterns

### Component Organization
```typescript
// 1. Imports
import { useState } from 'react'
import type { IndexData } from '@/types'

// 2. Types/Interfaces (如果仅组件内使用)
interface ComponentProps {
  data: IndexData[]
}

// 3. Component Definition
export function Component({ data }: ComponentProps) {
  // 3.1 State/Hooks
  const [state, setState] = useState()

  // 3.2 Effects
  useEffect(() => {}, [])

  // 3.3 Handlers
  const handleClick = () => {}

  // 3.4 Render
  return (
    <div>...</div>
  )
}

// 4. Sub-components (如果需要)
function SubComponent() {}

// 5. Exports
export default Component
```

### Utility Function Organization
```typescript
// 1. Type imports
import type { IndexData } from '@/types'

// 2. Constants
const DEFAULT_VALUE = 0

// 3. Helper functions (private)
function helperFunction() {}

// 4. Main exported functions
export function mainFunction() {}

// 5. Type exports
export type { SomeType }
```

### File Organization Principles
- 一个组件一个文件
- 相关功能可以放在同一目录
- 公共 API 在文件顶部或底部导出
- 实现细节封装在模块内部

## Code Organization Principles

1. **Single Responsibility**: 每个文件/组件有单一明确的职责
   - `yupen.ts` - 核心计算逻辑
   - `csv.ts` - CSV 处理
   - `backtest.ts` - 回测逻辑

2. **Modularity**: 代码组织为可复用的模块
   - `utils/` - 纯函数工具
   - `components/` - UI 组件
   - `store/` - 状态管理

3. **Testability**: 结构便于测试
   - 纯函数易于单元测试
   - 组件与逻辑分离

4. **Consistency**: 遵循已建立的模式
   - 统一的导入顺序
   - 统一的命名规范
   - 统一的文件结构

## Module Boundaries

### 依赖方向
```
components/ → store/ → types/
     ↓          ↓
   utils/ ←─────┘
```

### 边界规则
- **components/**: 可依赖 `store/`, `utils/`, `types/`, `ui/`
- **store/**: 可依赖 `utils/`, `types/`
- **utils/**: 可依赖 `types/`，应保持纯函数
- **types/**: 无依赖，纯类型定义
- **ui/**: 基础 UI 组件，尽量独立

### 公共 vs 内部
- **公共 API**: 通过 `index.ts` 导出的内容
- **内部实现**: 不导出的辅助函数和类型

## Code Size Guidelines

- **File size**: 建议不超过 300 行
- **Function/Method size**: 建议不超过 50 行
- **Component complexity**: 保持单一职责，必要时拆分
- **Nesting depth**: 建议不超过 3 层嵌套

## Documentation Standards

- **公共 API**: 必须有 JSDoc 注释
- **复杂逻辑**: 添加内联注释解释
- **类型定义**: 关键字段添加说明
- **组件**: Props 需要有类型和注释

### Example
```typescript
/**
 * 计算临界值
 * @param ma20 20日均线值
 * @param floatRate 浮动比例 (0-0.03)
 * @returns 临界值
 */
export function calculateThreshold(ma20: number, floatRate: number = 0): number {
  // ...
}
```

# Technology Stack

## Project Type

**Web Application** - 单页应用 (SPA)，基于 React 构建的前端应用，用于股票市场趋势分析和可视化展示。

## Core Technologies

### Primary Language(s)
- **Language**: TypeScript 5.9
- **Runtime**: 浏览器 (ES2020+)
- **Package Manager**: npm

### Key Dependencies/Libraries

#### 前端框架
- **React 19.2.4**: UI 组件库，用于构建用户界面
- **React DOM 19.2.4**: React 的浏览器渲染器

#### 构建工具
- **Vite 8.0.0**: 下一代前端构建工具，提供快速的开发服务器和构建
- **TypeScript 5.9.3**: 类型安全的 JavaScript 超集

#### 样式
- **Tailwind CSS 4.2.1**: 实用优先的 CSS 框架
- **@tailwindcss/postcss 4.2.1**: Tailwind CSS 的 PostCSS 插件
- **PostCSS 8.5.8**: CSS 转换工具
- **Autoprefixer 10.4.27**: 自动添加 CSS 前缀

#### UI 组件
- **Radix UI**:
  - `@radix-ui/react-dialog 1.1.15`: 对话框组件
  - `@radix-ui/react-dropdown-menu 2.1.16`: 下拉菜单组件
  - `@radix-ui/react-tabs 1.1.13`: 标签页组件
  - `@radix-ui/react-tooltip 1.2.8`: 工具提示组件
  - `@radix-ui/react-slot 1.2.4`: 组件插槽
- **class-variance-authority 0.7.1**: CSS 类变体管理
- **clsx 2.1.1**: 条件类名工具
- **tailwind-merge 3.5.0**: Tailwind 类名合并工具

#### 状态管理
- **Zustand 5.0.12**: 轻量级状态管理库

#### 图表可视化
- **Recharts 3.8.0**: React 图表库，用于数据可视化

#### 工具库
- **date-fns 4.1.0**: 日期处理库
- **lucide-react 0.577.0**: 图标库

### Application Architecture

**组件化单页应用架构 (Component-based SPA)**

```
┌─────────────────────────────────────────────────────┐
│                    App.tsx                          │
│                 (应用入口组件)                        │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                  Dashboard.tsx                      │
│                 (主仪表盘组件)                        │
└─────────────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  StatusCard  │ │  IndexTable  │ │BacktestPanel │
│  (状态卡片)   │ │  (指数表格)   │ │  (回测面板)  │
└──────────────┘ └──────────────┘ └──────────────┘
         │              │              │
         └──────────────┼──────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│              Zustand Store (yupenStore)             │
│                  (全局状态管理)                       │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              Utils (yupen.ts, csv.ts)               │
│                 (核心计算逻辑)                        │
└─────────────────────────────────────────────────────┘
```

### Data Storage
- **Primary storage**: 浏览器内存 (Zustand store)
- **Persistence**: 无持久化（刷新后数据丢失）
- **Data formats**: JSON (内部状态), CSV (数据导入)

### External Integrations (if applicable)
- **APIs**: 无（当前版本为纯前端应用）
- **Protocols**: 无
- **Authentication**: 无

### Monitoring & Dashboard Technologies
- **Dashboard Framework**: React 19
- **Real-time Communication**: 无（手动刷新/CSV 导入）
- **Visualization Libraries**: Recharts 3
- **State Management**: Zustand 5

## Development Environment

### Build & Development Tools
- **Build System**: Vite 8
- **Package Management**: npm
- **Development workflow**: `npm run dev` 启动热重载开发服务器

### Code Quality Tools
- **Static Analysis**: ESLint 9.39.4
  - `@eslint/js`
  - `typescript-eslint 8.56.1`
  - `eslint-plugin-react-hooks 7.0.1`
  - `eslint-plugin-react-refresh 0.5.2`
- **Formatting**: 无专用格式化工具（依赖 IDE 配置）
- **Testing Framework**: Vitest 4.1.0
- **Documentation**: 无专用文档工具

### Version Control & Collaboration
- **VCS**: Git（推荐）
- **Branching Strategy**: 未定义
- **Code Review Process**: 未定义

## Deployment & Distribution
- **Target Platform(s)**: 现代浏览器 (Chrome, Firefox, Safari, Edge)
- **Distribution Method**: 静态文件部署（可部署到任何静态托管服务）
- **Installation Requirements**: Node.js 18+ (开发环境)
- **Update Mechanism**: 重新部署

## Technical Requirements & Constraints

### Performance Requirements
- **响应时间**: 页面加载 < 3秒
- **交互响应**: 用户操作 < 100ms
- **内存使用**: 轻量级，无需大量内存

### Compatibility Requirements
- **Platform Support**: 现代浏览器 (ES2020+)
- **Dependency Versions**: 见 package.json
- **Standards Compliance**: 无特定标准要求

### Security & Compliance
- **Security Requirements**: 无敏感数据处理
- **Compliance Standards**: 无
- **Threat Model**: 纯前端应用，无后端安全风险

### Scalability & Reliability
- **Expected Load**: 单用户本地使用
- **Availability Requirements**: 无
- **Growth Projections**: 可扩展为多用户、有后端的完整应用

## Technical Decisions & Rationale

### Decision Log

1. **React 19 + TypeScript**: 选择 React 生态系统，配合 TypeScript 提供类型安全和良好的开发体验。React 社区活跃，组件库丰富。

2. **Vite 8**: 相比 Webpack，Vite 提供更快的开发服务器启动和热更新速度，基于 ESM 的构建方式更现代。

3. **Zustand 5**: 相比 Redux，Zustand 更轻量、API 更简洁，适合中小型应用的状态管理。无 boilerplate 代码。

4. **Tailwind CSS 4**: 实用优先的 CSS 方案，快速构建 UI，无需维护单独的 CSS 文件。

5. **Recharts 3**: 基于 React 和 D3 的图表库，组件化 API，易于集成到 React 应用。

6. **Vitest**: 与 Vite 深度集成的测试框架，配置简单，运行快速。

7. **Radix UI**: 无样式的可访问性组件库，与 Tailwind CSS 完美配合，提供底层交互逻辑。

## Known Limitations

- **无数据持久化**: 当前版本刷新后数据丢失，需要实现 localStorage 或后端存储
- **无实时数据**: 需要手动导入 CSV，未来可接入第三方 API
- **无用户系统**: 单用户模式，无登录/权限管理
- **测试覆盖**: 当前只有基础测试，需要增加更多测试用例
- **国际化**: 未实现多语言支持

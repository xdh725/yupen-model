# 鱼盆模型 (Yupen Model) 跟踪系统

## 概述

鱼盆模型是猫笔刀提出的一个股票板块分析模型。本文件夹用于系统化跟踪和分析该模型的应用。

## 目录结构

```
yupen-model/
├── docs/           # 文档和理论说明
│   ├── theory.md   # 模型理论基础
│   └── rules.md    # 模型规则和条件
├── data/           # 数据存储
│   ├── stocks/     # 股票数据
│   └── sectors/    # 板块数据
├── analysis/       # 分析记录
│   ├── daily/      # 日常分析
│   └── weekly/     # 周度总结
└── reports/        # 报告输出
    ├── signals/    # 交易信号
    └── reviews/    # 复盘报告
```

## 模型简介

鱼盆模型是一个基于板块轮动的股票投资模型，通过识别市场中的强势板块和个股来指导投资决策。

## 使用说明

1. **docs/** - 存放模型的理论文档和操作规则
2. **data/** - 存储历史数据和实时数据
3. **analysis/** - 记录分析过程和结论
4. **reports/** - 生成交易信号和复盘报告

## 更新日志

- 2026-03-16: 创建项目结构

## 每日快照

项目已支持将每日鱼盆模型数据生成为静态快照，并由网页按日期展示。

### 生成方式

- 手动生成一次:
  `python3 scripts/generate_daily_yupen_snapshot.py`
- 指定日期生成:
  `python3 scripts/generate_daily_yupen_snapshot.py --date 2026-03-31`

生成结果会写入:

- `data/yupen-snapshot-YYYY-MM-DD.csv`
- `web/public/data/manifest.json`
- `web/public/data/snapshots/YYYY-MM-DD.json`

### 网页展示

- 前端会优先读取 `web/public/data/manifest.json`
- 如果存在快照，页面顶部可切换日期查看历史数据
- 如果快照不存在，则回退到本地默认空数据

### 定时运行

仓库中提供了 macOS `launchd` 模板:

- `scripts/daily_snapshot.launchd.plist`

默认每天 `18:10` 运行一次。使用前请确认其中的项目路径与 Python 路径正确，再复制到:

- `~/Library/LaunchAgents/com.yupen-model.daily-snapshot.plist`

然后执行:

- `launchctl load ~/Library/LaunchAgents/com.yupen-model.daily-snapshot.plist`

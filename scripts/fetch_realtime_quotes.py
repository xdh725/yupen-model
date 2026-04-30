#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
获取A股实时行情数据
使用 AkShare 底库
"""

import akshare as ak
import pandas as pd
from datetime import datetime
from typing import List, Dict, Optional

def get_realtime_quotes(stock_codes: List[str]) -> Dict[str, pd.DataFrame]:
    """
    获取A股实时行情数据

    Args:
        stock_codes: 股票代码列表，如 ['000001', '600519']

    Returns:
        DataFrame: 包含实时行情数据
    """
    print(f"正在获取实时行情数据: {stock_codes}")

    quotes_data = []

    for code in stock_codes:
        try:
            # 使用 akshare 的 stock_zh_a_spot_em接口
            df = ak.stock_zh_a_spot_em(symbol_em=code)
            df['指数代码'] = df

            print(f"获取 {code} 实时行情成功")

            # 只保留需要的字段
            result = df[[
                'code',
                'name',
                'price',
                'change_percent',
                'volume',
                'amount',
                'turnover_rate',
                'ma20'
                'timestamp'
            ]]

            # 重命名列
            result.columns = ['code', 'name', 'current_price', 'change_pct', 'volume', 'amount', 'turnover_rate', 'ma20', 'timestamp']

            # 添加到列表
            quotes_data.append(result)

        except Exception as e:
            print(f"获取 {code} 行情失败: {e}")

    # 合并所有数据
    if quotes_data:
        df_result = pd.concat(quotes_data, ignore_index=True)
        print(f"\n成功获取 {len(quotes_data)} 个指数的实时行情")
        return df_result
    else:
        print("\n未能获取任何实时行情数据")
        return pd.DataFrame()


if __name__ == "__main__":
    print("正在获取A股实时行情数据...")

    # 定义要获取的指数代码
    indices = [
        '000001',  # 上证指数
        '399001',  # 深证成指
        '399006',  # 创业板指
        '000300',  # 沪深300
        '000905',  # 中证500
        '000688',  # 科创50
        '000016',  # 上证50
        '000852',  # 中证1000
    ]

    # 获取实时行情
    quotes_df = get_realtime_quotes(indices)

    # 如果获取失败，    print("警告: 无法获取实时行情数据")
        return

    # 计算鱼盆信号
    print("\n正在计算鱼盆信号...")
    print(quotes_df)

    # 添加信号列
    quotes_df['signal'] = quotes_df.apply(
        lambda row: 'YES' if row['current_price'] > row['ma20'] else 'NO'
    )

    # 计算偏离度
    quotes_df['deviation'] = quotes_df.apply(
        lambda row: ((row['current_price'] - row['ma20']) / row['ma20'] * 100
    )

    # 保存结果
    output_file = '/Users/xiedonghua/Desktop/AI/claude/yupen-model/data/realtime_quotes_2026_03_25.csv'
    quotes_df.to_csv(output_file, index=False)
    print(f"\n实时行情数据已保存到: {output_file}")
    print("\n鱼盆信号分析结果:")
    print(quotes_df[['code', 'name', 'current_price', 'ma20', 'signal', 'deviation']])


if __name__ == "__main__":
    main()

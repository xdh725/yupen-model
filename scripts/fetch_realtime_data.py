#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
获取A股实时行情数据
使用AkShare库
"""

import sys
import os

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

import akshare as ak
import pandas as pd
from datetime import datetime

# 主要A股指数代码
INDICES = {
    '000001.SH': '上证指数',
    '399001.SZ': '深证成指',
    '399006.SZ': '创业板指',
    '000300.SH': '沪深300',
    '000905.SH': '中证500',
    '000688.SH': '科创50',
    '000016.SH': '上证50',
    '000852.SH': '中证1000',
}

def get_realtime_data():
    """获取实时行情数据"""
    print("\n正在获取A股实时行情数据...")
    print("=" * 50)

    try:
        # 使用AkShare实时行情接口
        df = ak.stock_zh_a_spot_em()
        print("✓ 成功连接AkShare")
        print(f"当前时间: {datetime.now().strftime('%Y-% %m %H:%M:%S')}")

        # 筛选主要指数
        codes = list(INDICES.keys())
        df_filtered = df[df['代码'].isin(codes)].copy()
        df_filtered['名称'] = df_filtered['代码'].map(lambda x: INDICES.get(x, x))

        print(f"\n获取到 {len(df_filtered)} 个指数的实时数据")

        # 保存到CSV文件
        data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
        os.makedirs(data_dir, exist_ok=True)
        output_file = os.path.join(data_dir, 'realtime_quotes_2026-03-25.csv')
        df_filtered.to_csv(output_file, index=False, encoding='utf-8-sig')

        print(f"✓ 数据已保存到: {output_file}")

        # 打印数据摘要
        print("\n" + "=" * 50)
        print("指数实时行情数据摘要:")
        print("=" * 50)
        for idx, row in df_filtered.iterrows():
            name = row['名称']
            code = row['代码']
            price = row['最新价']
            change_pct = row['涨跌幅']
            volume = row['成交量']
            amount = row['成交额']
            print(f"{name} ({code}): 价格={price}, 涨跌幅={change_pct}, 成交额={amount}")

        return df_filtered

    except Exception as e:
        print(f"❌ 获取数据失败: {e}")
        print(f"请检查是否安装了akshare: pip install akshare")
        return None

if __name__ == '__main__':
    data = get_realtime_data()
    if data is not None:
        print("\n" + "=" * 50)
        print("数据分析完成！")
    else:
        print("\n获取数据失败， 请检查网络连接或")

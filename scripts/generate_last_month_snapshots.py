#!/usr/bin/env python3
"""
批量生成最近一个月的快照数据（包括今天）
"""
from datetime import datetime, timedelta
import subprocess
import sys

def generate_dates_last_month():
    """生成从今天往前推30天的日期列表"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)

    dates = []
    current = start_date
    while current <= end_date:
        dates.append(current.strftime("%Y-%m-%d"))
        current += timedelta(days=1)

    return dates

def main():
    dates = generate_dates_last_month()
    print(f"将生成 {len(dates)} 天的快照数据")
    print(f"日期范围: {dates[0]} 到 {dates[-1]}")
    print("-" * 50)

    success_count = 0
    error_count = 0

    for i, date in enumerate(dates, 1):
        print(f"[{i}/{len(dates)}] 正在生成 {date} 的快照...")
        try:
            result = subprocess.run(
                ["python3", "generate_daily_yupen_snapshot.py", "--date", date],
                cwd="/Users/xiedonghua/Desktop/AI/claude/yupen-model/scripts",
                capture_output=True,
                text=True,
                timeout=60
            )

            if result.returncode == 0:
                print(f"  ✓ 成功")
                success_count += 1
            else:
                print(f"  ✗ 失败: {result.stderr}")
                error_count += 1
        except Exception as e:
            print(f"  ✗ 错误: {e}")
            error_count += 1

    print("-" * 50)
    print(f"完成！成功: {success_count}, 失败: {error_count}")

if __name__ == "__main__":
    main()

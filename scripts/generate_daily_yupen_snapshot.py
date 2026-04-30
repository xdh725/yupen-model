from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Callable

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DATA_DIR = ROOT / "web" / "public" / "data"
SNAPSHOT_DIR = PUBLIC_DATA_DIR / "snapshots"
MANIFEST_PATH = PUBLIC_DATA_DIR / "manifest.json"


@dataclass(frozen=True)
class IndexConfig:
    id: str
    code: str
    name: str
    source: str
    symbol: str
    category: str = "market"  # market 或 sector


# 大盘指数配置
MARKET_INDEX_CONFIGS: list[IndexConfig] = [
    IndexConfig("sh000001", "000001.SH", "上证指数", "ak_tx", "sh000001", "market"),
    IndexConfig("sz399001", "399001.SZ", "深证成指", "ak_tx", "sz399001", "market"),
    IndexConfig("sz399006", "399006.SZ", "创业板指", "ak_tx", "sz399006", "market"),
    IndexConfig("sh000300", "000300.SH", "沪深300", "ak_tx", "sh000300", "market"),
    IndexConfig("sh000905", "000905.SH", "中证500", "csindex", "000905", "market"),
    IndexConfig("sh000688", "000688.SH", "科创50", "ak_tx", "sh000688", "market"),
    IndexConfig("sh000016", "000016.SH", "上证50", "ak_tx", "sh000016", "market"),
    IndexConfig("sh000852", "000852.SH", "中证1000", "csindex", "000852", "market"),
    IndexConfig("sh000985", "000985.SH", "中证全指", "csindex", "000985", "market"),
]

# 板块指数配置（重点关注的行业板块）
SECTOR_INDEX_CONFIGS: list[IndexConfig] = [
    IndexConfig("sw801081", "801081.SI", "半导体", "sw_hist", "801081", "sector"),
    IndexConfig("cs000941", "000941.SH", "新能源", "csindex", "000941", "sector"),
    IndexConfig("cs000813", "000813.SH", "细分化工", "csindex", "000813", "sector"),
    IndexConfig("sw801741", "801741.SI", "商业航天", "sw_hist", "801741", "sector"),
    IndexConfig("sw801738", "801738.SI", "电网设备", "sw_hist", "801738", "sector"),
    IndexConfig("sz399998", "399998.SZ", "中证煤炭", "ak_tx", "sz399998", "sector"),
    IndexConfig("sw801192", "801192.SI", "有色金属", "sw_hist", "801192", "sector"),
    IndexConfig("cs931775", "931775.SH", "房地产", "csindex", "931775", "sector"),
    IndexConfig("cs000922", "000922.SH", "中证红利", "csindex", "000922", "sector"),
    IndexConfig("sw801735", "801735.SI", "光伏设备", "sw_hist", "801735", "sector"),
    IndexConfig("sz399975", "399975.SZ", "证券公司", "ak_tx", "sz399975", "sector"),
    IndexConfig("sz399989", "399989.SZ", "中证医疗", "ak_tx", "sz399989", "sector"),
    IndexConfig("cs931787", "931787.SH", "港股创新药", "csindex", "931787", "sector"),
]

# 合并所有配置
INDEX_CONFIGS = MARKET_INDEX_CONFIGS + SECTOR_INDEX_CONFIGS


def fetch_ak_tx(symbol: str, target_date: str) -> pd.DataFrame:
    import akshare as ak

    df = ak.stock_zh_index_daily_tx(symbol=symbol)
    if df.empty:
        raise ValueError(f"{symbol} returned empty history")
    result = df[["date", "open", "close", "high", "low", "amount"]].copy()
    result.columns = ["date", "open", "close", "high", "low", "volume"]
    result["date"] = pd.to_datetime(result["date"])
    for col in ["open", "close", "high", "low", "volume"]:
        result[col] = result[col].astype(float)
    return result[result["date"] <= pd.Timestamp(target_date)].sort_values("date").reset_index(drop=True)


def fetch_csindex(symbol: str, target_date: str) -> pd.DataFrame:
    import akshare as ak

    start_date = (pd.Timestamp(target_date) - pd.Timedelta(days=120)).strftime("%Y%m%d")
    end_date = target_date.replace("-", "")
    df = ak.stock_zh_index_hist_csindex(symbol=symbol, start_date=start_date, end_date=end_date)
    if df.empty:
        raise ValueError(f"{symbol} returned empty history")
    result = pd.DataFrame({
        "date": pd.to_datetime(df["日期"]),
        "open": df["开盘"].astype(float),
        "close": df["收盘"].astype(float),
        "high": df["最高"].astype(float),
        "low": df["最低"].astype(float),
        "volume": pd.to_numeric(df["成交量"], errors="coerce").fillna(0).astype(float),
    })
    return result[result["date"] <= pd.Timestamp(target_date)].sort_values("date").reset_index(drop=True)


def fetch_sw_hist(symbol: str, target_date: str) -> pd.DataFrame:
    """获取申万行业指数数据（使用 index_hist_sw）"""
    import akshare as ak

    df = ak.index_hist_sw(symbol=symbol)
    if df.empty:
        raise ValueError(f"{symbol} returned empty history")
    vol_col = df["成交量"] if "成交量" in df.columns else df.get("成交金额", 0)
    result = pd.DataFrame({
        "date": pd.to_datetime(df["日期"]),
        "open": df["开盘"].astype(float),
        "close": df["收盘"].astype(float),
        "high": df["最高"].astype(float),
        "low": df["最低"].astype(float),
        "volume": pd.to_numeric(vol_col, errors="coerce").fillna(0).astype(float),
    })
    return result[result["date"] <= pd.Timestamp(target_date)].sort_values("date").reset_index(drop=True)


FETCHERS: dict[str, Callable[[str, str], pd.DataFrame]] = {
    "ak_tx": fetch_ak_tx,
    "csindex": fetch_csindex,
    "sw_hist": fetch_sw_hist,
}


def calculate_kdj(history: pd.DataFrame, n: int = 9, k_period: int = 3, d_period: int = 3) -> dict:
    """计算 KDJ 指标，返回最新一天的 K, D, J 值及 J 值历史序列。

    KDJ 经典算法:
      RSV = (C - Ln) / (Hn - Ln) * 100
      K   = (2/3) * prev_K + (1/3) * RSV
      D   = (2/3) * prev_D + (1/3) * K
      J   = 3*K - 2*D
    """
    if len(history) < n:
        return {"k": None, "d": None, "j": None, "jHistory": []}

    df = history.copy()
    low_n = df["low"].rolling(window=n, min_periods=n).min()
    high_n = df["high"].rolling(window=n, min_periods=n).max()
    rsv = (df["close"] - low_n) / (high_n - low_n) * 100
    rsv = rsv.fillna(50)

    k_vals = [50.0]
    d_vals = [50.0]
    for i in range(1, len(df)):
        k_vals.append((2 / 3) * k_vals[-1] + (1 / 3) * rsv.iloc[i])
        d_vals.append((2 / 3) * d_vals[-1] + (1 / 3) * k_vals[-1])

    j_vals = [3 * k_vals[i] - 2 * d_vals[i] for i in range(len(k_vals))]

    # 生成最近 30 天的 J 值历史（用于前端图表）
    lookback = min(30, len(j_vals))
    j_history: list[dict] = []
    for i in range(len(j_vals) - lookback, len(j_vals)):
        j_history.append({
            "date": pd.Timestamp(df["date"].iloc[i]).strftime("%Y-%m-%d"),
            "j": round(j_vals[i], 2),
        })

    return {
        "k": round(k_vals[-1], 2),
        "d": round(d_vals[-1], 2),
        "j": round(j_vals[-1], 2),
        "jHistory": j_history,
    }


def calculate_status_change(history: pd.DataFrame, current_status: str) -> tuple[str | None, float | None]:
    """从历史数据中推算最近一次状态转变日期和区间涨幅。

    遍历历史数据，从最新往前回溯，找到状态首次切换的那一天。
    返回 (转变日期, 区间涨幅%) ，若历史不足则返回 (None, None)。
    """
    if len(history) < 21:
        return None, None

    dates = history["date"].values
    closes = history["close"].values

    # 从最新一天往前看，逐日判断 status
    status = current_status
    change_idx = None
    for i in range(len(history) - 1, -1, -1):
        ma20_val = float(history["close"].iloc[max(0, i - 19):i + 1].mean())
        s = "YES" if closes[i] >= ma20_val else "NO"
        if s != status:
            change_idx = i + 1  # 状态切换后的第一天
            break
        if i == 0:
            change_idx = 0  # 从头到尾没变过

    if change_idx is None:
        return None, None

    change_date = pd.Timestamp(dates[change_idx]).strftime("%Y-%m-%d")
    change_close = float(closes[change_idx])
    current_close = float(closes[-1])
    period_change = ((current_close - change_close) / change_close) * 100 if change_close else 0.0

    return change_date, round(period_change, 2)


def calculate_snapshot(target_date: str) -> tuple[str, list[dict]]:
    items: list[dict] = []
    for config in INDEX_CONFIGS:
        history = FETCHERS[config.source](config.symbol, target_date)
        if len(history) < 20:
            print(f"Warning: {config.code} history shorter than 20 rows, skipping...")
            continue

        last_row = history.iloc[-1]
        ma20 = float(history["close"].tail(20).mean())
        current = float(last_row["close"])
        deviation = ((current - ma20) / ma20) * 100 if ma20 else 0.0
        updated_at = pd.Timestamp(last_row["date"]).strftime("%Y-%m-%d")
        status = "YES" if current >= ma20 else "NO"

        # 计算 KDJ
        kdj = calculate_kdj(history)

        # 涨幅 = (今日收盘 - 昨日收盘) / 昨日收盘 * 100
        change_percent = None
        if len(history) >= 2:
            prev_close = float(history["close"].iloc[-2])
            if prev_close > 0:
                change_percent = round(((current - prev_close) / prev_close) * 100, 2)

        # 量比 = 今日成交量 / 前5日平均成交量
        volume_ratio = None
        vol = float(last_row["volume"])
        if len(history) >= 6 and vol > 0:
            avg_vol_5 = float(history["volume"].iloc[-6:-1].mean())
            if avg_vol_5 > 0:
                volume_ratio = round(vol / avg_vol_5, 2)

        # 状态转变时间 & 区间涨幅
        status_change_date, period_change = calculate_status_change(history, status)

        items.append(
            {
                "id": config.id,
                "code": config.code,
                "name": config.name,
                "category": config.category,
                "currentPrice": round(current, 2),
                "ma20": round(ma20, 2),
                "threshold": round(ma20, 2),
                "status": status,
                "deviation": round(deviation, 2),
                "strength": 0,
                "duration": 1,
                "updatedAt": updated_at,
                "kdj": kdj,
                "changePercent": change_percent,
                "volumeRatio": volume_ratio,
                "statusChangeDate": status_change_date,
                "periodChangePercent": period_change,
                "rankChange": 0,
            }
        )

    if not items:
        raise ValueError("No valid data fetched")

    snapshot_date = max(item["updatedAt"] for item in items)

    # 分类别排名：指数(market)与板块(sector)互不混排
    category_buckets: dict[str, list[dict]] = {}
    for item in items:
        category = item.get("category", "market")
        category_buckets.setdefault(category, []).append(item)

    for bucket in category_buckets.values():
        bucket.sort(key=lambda item: item["deviation"], reverse=True)
        for idx, item in enumerate(bucket, start=1):
            item["strength"] = idx

    # 写入快照时保持每个类别内部按强度排序，类别顺序固定 market -> sector -> others
    ordered: list[dict] = []
    for category in ("market", "sector"):
        ordered.extend(category_buckets.pop(category, []))
    for bucket in category_buckets.values():
        ordered.extend(bucket)

    items = ordered
    return snapshot_date, items


def load_previous_snapshot(previous_date: str | None) -> dict[str, dict]:
    if not previous_date:
        return {}
    path = SNAPSHOT_DIR / f"{previous_date}.json"
    if not path.exists():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    return {item["id"]: item for item in data.get("indices", [])}


def update_durations(indices: list[dict], previous_indices: dict[str, dict]) -> None:
    for item in indices:
        previous = previous_indices.get(item["id"])
        if previous and previous.get("status") == item["status"]:
            item["duration"] = int(previous.get("duration", 0)) + 1
        else:
            item["duration"] = 1


def update_rank_changes(indices: list[dict], previous_indices: dict[str, dict]) -> None:
    """计算排名变化：当前排名 - 之前排名，负数表示上升。"""
    for item in indices:
        previous = previous_indices.get(item["id"])
        if previous and previous.get("strength"):
            item["rankChange"] = item["strength"] - int(previous["strength"])
        else:
            item["rankChange"] = 0


def save_snapshot(snapshot_date: str, indices: list[dict]) -> Path:
    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "date": snapshot_date,
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "count": len(indices),
        "indices": indices,
    }
    path = SNAPSHOT_DIR / f"{snapshot_date}.json"
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def save_csv(snapshot_date: str, indices: list[dict]) -> Path:
    data_dir = ROOT / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    path = data_dir / f"yupen-snapshot-{snapshot_date}.csv"
    df = pd.DataFrame(
        [
            {
                "日期": snapshot_date,
                "代码": item["code"],
                "名称": item["name"],
                "当前价格": item["currentPrice"],
                "MA20": item["ma20"],
                "临界值": item["threshold"],
                "偏离度(%)": item["deviation"],
                "信号状态": item["status"],
                "趋势强度": item["strength"],
                "持续天数": item["duration"],
            }
            for item in indices
        ]
    )
    df.to_csv(path, index=False, encoding="utf-8-sig")
    return path


def update_manifest(snapshot_date: str) -> Path:
    if MANIFEST_PATH.exists():
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    else:
        manifest = {"latest": snapshot_date, "dates": []}

    dates = set(manifest.get("dates", []))
    dates.add(snapshot_date)
    ordered_dates = sorted(dates, reverse=True)
    manifest["latest"] = ordered_dates[0]
    manifest["dates"] = ordered_dates
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return MANIFEST_PATH


def resolve_previous_date(manifest: dict, snapshot_date: str) -> str | None:
    """确定用于对比的上一交易日。

    规则：
    1) 若 latest 不是当前快照日，优先使用 latest。
    2) 若 latest 与当前快照日相同，则从 manifest.dates 中回退到第一个不同日期。
    """
    latest = manifest.get("latest")
    if latest and latest != snapshot_date:
        return latest

    for day in manifest.get("dates", []):
        if day != snapshot_date:
            return day
    return None


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate daily yupen snapshot")
    parser.add_argument("--date", dest="target_date", default=datetime.now().strftime("%Y-%m-%d"))
    args = parser.parse_args()

    previous_date = None
    if MANIFEST_PATH.exists():
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        previous_date = resolve_previous_date(manifest, args.target_date)

    snapshot_date, indices = calculate_snapshot(args.target_date)
    previous_indices = load_previous_snapshot(previous_date)
    update_durations(indices, previous_indices)
    update_rank_changes(indices, previous_indices)
    snapshot_path = save_snapshot(snapshot_date, indices)
    csv_path = save_csv(snapshot_date, indices)
    manifest_path = update_manifest(snapshot_date)

    print(f"snapshot={snapshot_path}")
    print(f"csv={csv_path}")
    print(f"manifest={manifest_path}")


if __name__ == "__main__":
    main()

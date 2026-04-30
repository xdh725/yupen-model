from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Optional

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_CSV = ROOT / "analysis" / "api-compare-2026-03-31.csv"


@dataclass
class ReferenceRow:
    code: str
    name: str
    market: str
    provided_close: float
    provided_change_pct: float
    source: str
    symbol: str


REFERENCE_ROWS: list[ReferenceRow] = [
    ReferenceRow("SPY", "标普500ETF", "global", 650.00, 2.91, "yfinance", "SPY"),
    ReferenceRow("QQQ", "纳指100ETF", "global", 577.00, 3.41, "yfinance", "QQQ"),
    ReferenceRow("HSI", "恒生指数", "hk", 24788.00, 0.15, "hk_sina", "HSI"),
    ReferenceRow("HSCEI", "国企指数", "hk", 8374.00, -0.30, "hk_sina", "HSCEI"),
    ReferenceRow("N225", "日经225", "jp", 51063.00, -1.58, "yfinance", "^N225"),
    ReferenceRow("399006", "创业板指", "cn_index", 3184.00, -2.70, "ak_tx", "sz399006"),
    ReferenceRow("399300", "沪深300", "cn_index", 4450.00, -0.93, "ak_tx", "sh000300"),
    ReferenceRow("1B0016", "上证50", "cn_index", 2826.00, -0.25, "ak_tx", "sh000016"),
    ReferenceRow("000510", "中证A500", "cn_index", 5526.00, -1.20, "csindex", "000510"),
    ReferenceRow("932000", "中证2000", "cn_index", 3242.00, -1.67, "csindex", "932000"),
    ReferenceRow("1B0852", "中证1000", "cn_index", 7619.00, -1.91, "csindex", "000852"),
    ReferenceRow("399905", "中证500", "cn_index", 7617.00, -1.76, "csindex", "000905"),
    ReferenceRow("1B0688", "科创50", "cn_index", 1347.00, -2.59, "ak_tx", "sh000688"),
    ReferenceRow("399989", "中证医疗", "cn_index", 6562.00, -0.04, "ak_tx", "sz399989"),
    ReferenceRow("000922", "中证红利", "cn_index", 5727.00, -1.17, "csindex", "000922"),
    ReferenceRow("399998", "中证煤炭", "cn_index", 2342.00, -3.96, "ak_tx", "sz399998"),
    ReferenceRow("399941", "新能源", "cn_index", 2708.00, -3.56, "csindex", "399941"),
    ReferenceRow("000813", "细分化工", "ths", 4013.00, -2.75, "ths", "细分化工"),
    ReferenceRow("886078", "商业航天", "ths", 2249.00, -0.99, "ths", "商业航天"),
    ReferenceRow("931775", "房地产", "ths", 2844.00, -1.13, "ths", "房地产"),
    ReferenceRow("399975", "证券公司", "ths", 722.00, -0.80, "ths", "证券公司"),
    ReferenceRow("1B0819", "有色金属", "ths", 9616.00, -1.47, "ths", "有色金属"),
    ReferenceRow("881121", "半导体", "ths", 1234.00, -2.95, "ths", "半导体"),
    ReferenceRow("H30590", "机器人", "ths", 1721.00, -1.03, "ths", "机器人"),
    ReferenceRow("881278", "电网设备", "ths", 7192.00, -1.48, "ths", "电网设备"),
    ReferenceRow("881279", "光伏设备", "ths", 9151.00, -3.31, "ths", "光伏设备"),
]


def fetch_with_yfinance(symbol: str, target_date: str) -> dict:
    import yfinance as yf

    target = pd.Timestamp(target_date)
    end = (target + pd.Timedelta(days=2)).strftime("%Y-%m-%d")
    hist = yf.download(
        symbol,
        start=(target - pd.Timedelta(days=7)).strftime("%Y-%m-%d"),
        end=end,
        auto_adjust=False,
        progress=False,
        threads=False,
    )
    if hist.empty:
        raise ValueError(f"{symbol} returned empty history")

    hist = hist.reset_index()
    hist["Date"] = pd.to_datetime(hist["Date"]).dt.strftime("%Y-%m-%d")
    row = hist.loc[hist["Date"] == target_date]
    if row.empty:
        raise ValueError(f"{symbol} missing row for {target_date}")
    idx = row.index[0]
    if idx == 0:
        raise ValueError(f"{symbol} has no prior row to compute change pct")

    current_close = float(hist.loc[idx, "Close"])
    prev_close = float(hist.loc[idx - 1, "Close"])
    change_pct = round((current_close / prev_close - 1) * 100, 2)
    return {"api_close": round(current_close, 2), "api_change_pct": change_pct, "raw_source": symbol}


def fetch_with_ak_index(symbol: str, target_date: str) -> dict:
    import akshare as ak

    df = ak.stock_zh_index_daily_em(
        symbol=symbol,
        start_date=target_date.replace("-", ""),
        end_date=target_date.replace("-", ""),
    )
    if df.empty:
        raise ValueError(f"{symbol} returned empty history")
    row = df.iloc[-1]
    return {
        "api_close": round(float(row["收盘"]), 2),
        "api_change_pct": round(float(row["涨跌幅"]), 2),
        "raw_source": symbol,
    }


def fetch_with_ak_tx(symbol: str, target_date: str) -> dict:
    import akshare as ak

    df = ak.stock_zh_index_daily_tx(symbol=symbol)
    if df.empty:
        raise ValueError(f"{symbol} returned empty history")
    df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
    row = df.loc[df["date"] == target_date]
    if row.empty:
        raise ValueError(f"{symbol} missing row for {target_date}")
    idx = row.index[0]
    if idx == 0:
        raise ValueError(f"{symbol} has no prior row to compute change pct")
    current_close = float(df.loc[idx, "close"])
    prev_close = float(df.loc[idx - 1, "close"])
    return {
        "api_close": round(current_close, 2),
        "api_change_pct": round((current_close / prev_close - 1) * 100, 2),
        "raw_source": symbol,
    }


def fetch_with_csindex(symbol: str, target_date: str) -> dict:
    import akshare as ak

    start_date = (pd.Timestamp(target_date) - pd.Timedelta(days=7)).strftime("%Y%m%d")
    end_date = target_date.replace("-", "")
    df = ak.stock_zh_index_hist_csindex(symbol=symbol, start_date=start_date, end_date=end_date)
    if df.empty:
        raise ValueError(f"{symbol} returned empty history")
    df["日期"] = pd.to_datetime(df["日期"]).dt.strftime("%Y-%m-%d")
    row = df.loc[df["日期"] == target_date]
    if row.empty:
        raise ValueError(f"{symbol} missing row for {target_date}")
    item = row.iloc[-1]
    return {
        "api_close": round(float(item["收盘"]), 2),
        "api_change_pct": round(float(item["涨跌幅"]), 2),
        "raw_source": symbol,
    }


def fetch_with_hk_sina(symbol: str, target_date: str) -> dict:
    import akshare as ak

    df = ak.stock_hk_index_daily_sina(symbol=symbol)
    if df.empty:
        raise ValueError(f"{symbol} returned empty history")
    df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
    row = df.loc[df["date"] == target_date]
    if row.empty:
        raise ValueError(f"{symbol} missing row for {target_date}")
    idx = row.index[0]
    if idx == 0:
        raise ValueError(f"{symbol} has no prior row to compute change pct")
    current_close = float(df.loc[idx, "close"])
    prev_close = float(df.loc[idx - 1, "close"])
    return {
        "api_close": round(current_close, 2),
        "api_change_pct": round((current_close / prev_close - 1) * 100, 2),
        "raw_source": symbol,
    }


def fetch_with_ths(symbol: str, target_date: str) -> dict:
    import akshare as ak

    start_date = (pd.Timestamp(target_date) - pd.Timedelta(days=14)).strftime("%Y%m%d")
    end_date = target_date.replace("-", "")
    fetchers: list[tuple[str, Callable[..., pd.DataFrame]]] = [
        ("industry", ak.stock_board_industry_index_ths),
        ("concept", ak.stock_board_concept_index_ths),
    ]
    last_error: Optional[Exception] = None
    for kind, fetcher in fetchers:
        try:
            df = fetcher(symbol=symbol, start_date=start_date, end_date=end_date)
            if df.empty:
                continue
            df["日期"] = pd.to_datetime(df["日期"]).dt.strftime("%Y-%m-%d")
            row = df.loc[df["日期"] == target_date]
            if row.empty:
                continue
            idx = row.index[-1]
            if idx == 0:
                raise ValueError(f"{symbol} has no prior row to compute change pct")
            item = row.iloc[-1]
            prev_close = float(df.loc[idx - 1, "收盘价"])
            return {
                "api_close": round(float(item["收盘价"]), 2),
                "api_change_pct": round((float(item["收盘价"]) / prev_close - 1) * 100, 2),
                "raw_source": f"{kind}:{symbol}",
            }
        except Exception as exc:  # pragma: no cover - network/parser variability
            last_error = exc
    if last_error:
        raise last_error
    raise ValueError(f"{symbol} not found in THS industry/concept boards")


FETCHERS: dict[str, Callable[[str, str], dict]] = {
    "yfinance": fetch_with_yfinance,
    "ak_index": fetch_with_ak_index,
    "ak_tx": fetch_with_ak_tx,
    "csindex": fetch_with_csindex,
    "hk_sina": fetch_with_hk_sina,
    "ths": fetch_with_ths,
}


def compare(target_date: str = "2026-03-31") -> pd.DataFrame:
    rows: list[dict] = []
    for ref in REFERENCE_ROWS:
        item = {
            "date": target_date,
            "code": ref.code,
            "name": ref.name,
            "market": ref.market,
            "provided_close": ref.provided_close,
            "provided_change_pct": ref.provided_change_pct,
            "source": ref.source,
            "symbol": ref.symbol,
        }
        try:
            fetched = FETCHERS[ref.source](ref.symbol, target_date)
            item.update(fetched)
            item["close_diff"] = round(item["api_close"] - item["provided_close"], 2)
            item["change_pct_diff"] = round(item["api_change_pct"] - item["provided_change_pct"], 2)
            item["close_match"] = abs(item["close_diff"]) <= 2.0
            item["change_pct_match"] = abs(item["change_pct_diff"]) <= 0.3
            item["status"] = "ok"
            item["error"] = ""
        except Exception as exc:  # pragma: no cover - network variability
            item["api_close"] = None
            item["api_change_pct"] = None
            item["close_diff"] = None
            item["change_pct_diff"] = None
            item["close_match"] = False
            item["change_pct_match"] = False
            item["status"] = "error"
            item["error"] = str(exc)
            item["raw_source"] = ""
        rows.append(item)
    return pd.DataFrame(rows)


def main() -> None:
    df = compare()
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8-sig")
    ok_df = df[df["status"] == "ok"]
    print(f"saved: {OUTPUT_CSV}")
    print(f"total={len(df)} ok={len(ok_df)} error={(df['status'] == 'error').sum()}")
    if not ok_df.empty:
        print(
            ok_df[
                [
                    "code",
                    "name",
                    "provided_close",
                    "api_close",
                    "close_diff",
                    "provided_change_pct",
                    "api_change_pct",
                    "change_pct_diff",
                ]
            ].to_string(index=False)
        )
    failed = df[df["status"] == "error"][["code", "name", "symbol", "error"]]
    if not failed.empty:
        print("\nfailed:")
        print(failed.to_string(index=False))


if __name__ == "__main__":
    main()

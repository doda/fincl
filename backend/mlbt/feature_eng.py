# AUTOGENERATED! DO NOT EDIT! File to edit: dev/08_feature_eng.ipynb (unless otherwise specified).

__all__ = ['roll_measure', 'roll_impact', 'kyle', 'amihud', 'autocorr', 'rolling_stdev', 'rolling_max', 'rolling_mean',
           'ewm_stdev', 'ewm_mean', 'int_ret', 'log_ret', 'ffd', 'volratio', 'binary_encoding', 'quantile_encoding',
           'sigma_encoding', 'entropy', 'close', 'lag', 'lag_change', 'lag_diff', 'clip', 'sadf', 'month', 'week',
           'day', 'weekday', 'hour', 'tick_bars', 'make_bars', 'run_feature_engineering', 'get_bars', 'fill_out_symbol',
           'engineer_feature', 'compute_feature', 'define_feature_configs', 'ENCODERS', 'ENTROPY_FUNS', 'FEATURES']

# Cell

import pandas as pd
import numpy as np
import logging
import string
from copy import deepcopy
from itertools import combinations

from mlfinlab.microstructural_features import (
    get_roll_measure,
    get_roll_impact,
    get_bar_based_kyle_lambda,
    get_bar_based_amihud_lambda,
)
from mlfinlab.microstructural_features.entropy import (
    get_shannon_entropy,
    get_lempel_ziv_entropy,
    get_plug_in_entropy,
    get_konto_entropy
)
from mlfinlab.structural_breaks import get_sadf

from .frac_diff import frac_diff_ffd
from .load_data import load_feat, save_feat, get_data, safe_feat_name, process_bars


def roll_measure(df, window, price="Close"):
    """The Roll measure attempts to estimate the bid-ask spread (i.e. liquidity) of an instrument"""
    return get_roll_measure(df[price], window)


def roll_impact(df, window, price="Close", dollar_volume="Dollar Volume"):
    """The Roll measure divided by dollar volume"""
    return roll_measure(df, window, price) / df[dollar_volume] * 1e9


def kyle(df, window, price="Close", volume="Volume"):
    """A measure of market impact cost (i.e. liquidity) from Kyle (1985)"""
    return get_bar_based_kyle_lambda(df[price], df[volume], window) * 1e9


def amihud(df, window, price="Close", dollar_volume="Dollar Volume"):
    """A measure of market impact cost (i.e. liquidity) from Amihud (2002)"""
    return get_bar_based_amihud_lambda(df[price], df[dollar_volume], window) * 1e9


def autocorr(df, window, lag, column="Close"):
    """The raw price series' serial correlation"""
    return df[column].rolling(window).apply(lambda x: x.autocorr(lag=lag), raw=False)


def rolling_stdev(df, window, column="Close"):
    """The series' rolling standard deviation"""
    return df[column].rolling(window).std()


def rolling_max(df, window, column="Close"):
    return df[column].rolling(window).max()


def rolling_mean(df, window, column="Close"):
    return df[column].rolling(window).mean()


def ewm_stdev(df, window, column="Close"):
    return df[column].ewm(com=window).std()


def ewm_mean(df, window, column="Close"):
    return df[column].ewm(com=window).mean()


def int_ret(df, periods=1, column="Close"):
    """First difference of log-transformed prices"""
    return df[column].pct_change(periods=periods)


def log_ret(df, periods=1, column="Close"):
    """First difference of log-transformed prices"""
    return np.log(df[column]).diff(periods=periods)


def ffd(df, d, column="Close"):
    """Fractionally differentiated prices"""
    return frac_diff_ffd(np.log(df[column].to_frame('Close')), d)['Close']


def volratio(df, volume="Volume", buy_volume="Buy Volume"):
    """
    EWM of bar-by-bar buy volume divided by total volume
    (i.e. a value >0.50 would indicate buyers driving the market)
    """
    return df[buy_volume] / df[volume]


def binary_encoding(returns):
    return np.sign(returns).map({-1: 'a', 1: 'b'})


def quantile_encoding(returns, q=10):
    return pd.qcut(returns, q=q, labels=list(string.printable[:q]), duplicates='drop')


def sigma_encoding(returns):
    stdev = returns.std()

    nbins = int((returns.max() - returns.min()) / stdev)
    min_ = returns.min()

    bins = pd.IntervalIndex.from_tuples([
        (
            min_+ (stdev * i), min_+ (stdev * (i + 1))
        ) for i in range(nbins + 1)
    ])
    x = pd.cut(returns, bins)

    mapper = dict(zip(bins, list(string.printable)[:nbins]))
    sigma_q = x.values.map(mapper)
    return pd.Series(sigma_q, index=returns.index)

ENCODERS = {
    'binary': binary_encoding,
    'quantile': quantile_encoding,
    'sigma': sigma_encoding,
}


ENTROPY_FUNS = {
    'shannon': get_shannon_entropy,
    'plugin': get_plug_in_entropy,
    'konto': get_konto_entropy,
    'lz': get_lempel_ziv_entropy,
}

def entropy(df, method, encoding, window, column="Close", konto_len=None):
    encoder = ENCODERS[encoding]
    entropy_fun = ENTROPY_FUNS[method]
    kwargs = {"window": konto_len} if konto_len is not None else {}
    encoded = encoder(df[column]).dropna()
    rolling = encoded.rolling(window)

    ss = pd.Series([
        ''.join(encoded.values[max(i-window+1, 0): i+1])
        for i in range(len(encoded.values))
    ])

    entropies = ss.apply(lambda x: entropy_fun(x, **kwargs))
    entropies.index = encoded.index

    entropies[:window-1]=np.nan
    assert entropies.index.is_unique
    return entropies


def close(df, column="Close"):
    return df[column]


def lag(df, lag, column="Close"):
    return df[column].shift(lag)


def lag_change(df, lag, column="Close"):
    return df[column].pct_change(lag)


def lag_diff(df, lag, column="Close"):
    col = df[column]
    return col - col.shift(lag)


def clip(df, lower, upper, column="Close"):
    return df[column].clip(lower, upper)


def sadf(df, model="linear", min_length=20, lags=5, column="Close"):
    return get_sadf(df[column], model=model, add_const=True, min_length=min_length, lags=lags, num_threads=1)


# Dates
def month(df, column="Time"):
    return df[column].dt.month


def week(df, column="Time"):
    return df[column].dt.week


def day(df, column="Time"):
    return df[column].dt.day


def weekday(df, column="Time"):
    return df[column].dt.weekday


def hour(df, column="Time"):
    return df[column].dt.hour


def tick_bars(df, size, column="Close"):
    return process_bars(df, size, type_="tick")[column]


def make_bars(df, type_, size, resolution="MIN", column="Close"):
    return process_bars(df, size, type_, resolution)[column]



FEATURES = {
    "auto": autocorr,
    "rolling_stdev": rolling_stdev,
    "rolling_mean": rolling_mean,
    "rolling_max": rolling_max,
    "ewm_stdev": ewm_stdev,
    "ewm_mean": ewm_mean,
    "roll": roll_measure,
    "rollimp": roll_impact,
    "kyle": kyle,
    "amihud": amihud,
    "volratio": volratio,
    "entropy": entropy,
    "int_ret": int_ret,
    "log_ret": log_ret,
    "ffd": ffd,
    "close": close,
    "lag": lag,
    "lag_change": lag_change,
    "clip": clip,

    "sadf": sadf,

    "time_bars": tick_bars,
    "make_bars": make_bars,

    "weekday": weekday,
    "hour": hour,
}

def run_feature_engineering(config, deck):
    """Load already-engineered features or engineer if we can't"""
    for symbol, symbol_deck in deck.items():
        logging.debug(f"{symbol}: Feature engineering for {len(config['features'])} features")
        bars = symbol_deck['bars']
        feats = []
        for feat_config in config["features"]:
            # We pass a copy in so the feat_eng code can modify that to its hearts content,
            # while for us the information remains non-redundant
            name = safe_feat_name(feat_config, safe_for_fs=False)
            feat = engineer_feature(deck, symbol, config, feat_config)["Close"]
#             logging.debug(f'Got {feat.shape} shape for feature: {name}')
            feat.name = name
            bars_index = deck[symbol]['bars'].index
            if feat.index.shape != bars_index.shape:
                # We're only interested in values we have prices for
                # Do this now so concat below is fast (and has the same set of indices across)
                feat = feat.reindex(index=bars_index, method='ffill')

            feats.append(feat)
        feats2 = pd.concat(feats, axis=1)
        logging.debug(f"Joined {len(feats)} features into {feats2.shape} shape")
        # Reindex in case of outside feats
        deck[symbol]['feats'] = feats2
    return deck

def get_bars(deck, symbol, config, feat_conf):
    # We can either compute something on already sampled bars,
    # but if we're making bars we'd likely want raw data
    if symbol in deck and not feat_conf['name'] == 'make_bars':
        # TODO: Remove deep copy
        bars = deck[symbol]['bars'].copy(deep=True)
    else:
        # We're loading a feature external to the price data of our trading universe
        bars = get_data(config, symbol, "minutely", config["start_date"], config["end_date"])

    return bars

def fill_out_symbol(feat_conf, for_symbol):
    symbol = feat_conf['symbol'] = feat_conf.get('symbol', for_symbol)
    if isinstance(symbol, dict):
        feat_conf['symbol'] = fill_out_symbol(symbol, for_symbol)
    return feat_conf


def engineer_feature(deck, for_symbol, config, feat_conf):
    """Parse and compute a feature"""
    feat_conf = deepcopy(feat_conf)
    fill_out_symbol(feat_conf, for_symbol)

    symbol = feat_conf['symbol']

    feat = load_feat(config, feat_conf)
    if feat is not None:
        return feat


    if isinstance(symbol, dict):
        # We're computing a feature on a feature
        df = engineer_feature(deck, for_symbol, config, symbol)
    else:
        df = get_bars(deck, symbol, config, feat_conf)

    feat = compute_feature(deck, for_symbol, config, feat_conf, symbol, df)

    if config["save_to_disk"]:
        save_feat(config, feat_conf, feat)
    return feat

def compute_feature(deck, for_symbol, config, feat_conf, symbol, df):
    logging.debug(f"Computing {feat_conf['name']} for {for_symbol}: {feat_conf}")
    drop = ['name', 'symbol']
    params = {k:v for k, v in feat_conf.items() if not k in drop}

    feat_name = feat_conf['name']
    feat = FEATURES[feat_name](df, **params)

    # Every feature's column is called Close to enable easy recursion
    feat = feat.to_frame("Close")
    logging.debug(f'Computed {feat.shape} shape for feature: {feat_name}')

    return feat


def define_feature_configs():
    """Stake out the list of features that is the basis for our features matrix"""
    VIX = 'VIX.XO'
    ES = '@ES#C'
    TY = '@TY#C'

    ffd_f = {"name": "ffd", "d": 0.3}
    log_ret = {"name": "log_ret"}
    vix_1h = {"name": "make_bars", "type_": "time", "size": 60, "symbol": VIX}
    log_ret_vix = {"name": "log_ret", "symbol": vix_1h}

    es_1h = {"name": "make_bars", "type_": "time", "size": 60, "symbol": ES}
    ty_1h = {"name": "make_bars", "type_": "time", "size": 60, "symbol": TY}
    log_ret_es_1h = {"name": "log_ret", "symbol": es_1h}
    log_ret_ty_1h = {"name": "log_ret", "symbol": ty_1h}

    volratio = {"name": "volratio"}
    es_sadf = {"name": "sadf", "symbol": {"name": "make_bars", "type_": "time", "size": 1, "resolution": "D", "symbol": '@ES#C'}}

    put_call_ratio = {"name": "clip", "lower": 0, "upper": 10, "symbol": "PCRATIO.Z"}

    features = [
        ffd_f,
    ]

    windows = [25, 50, 250, 500]

    # Dollar bar basis (roughly hourly)
    for window in windows:
        features.append({"name": "log_ret", "periods": window})

        roll = {"name": "roll", "window": window}
        features.append(roll)
#         features.append({"name": "rolling_stdev", "window": window, "symbol": roll})

        rollimp = {"name": "rollimp", "window": window}
        features.append(rollimp)
#         features.append({"name": "rolling_stdev", "window": window, "symbol": rollimp})

        amihud = {"name": "amihud", "window": window}
        features.append(amihud)
#         features.append({"name": "rolling_stdev", "window": window, "symbol": amihud})

        kyle = {"name": "kyle", "window": window}
        features.append(kyle)
#         features.append({"name": "rolling_stdev", "window": window, "symbol": kyle})

        volratio_ewm_mean = {"name": "ewm_mean", "window": window, "symbol": volratio}
        features.append(volratio_ewm_mean)

        features.append({"name": "rolling_stdev", "window": window, "symbol": volratio})
        features.append({"name": "lag", "lag": window, "symbol": volratio_ewm_mean})

        # Volatilty
        features.append({"name": "rolling_stdev", "window": window, "symbol": log_ret_vix})
        rolling_stdev_log_ret = {"name": "rolling_stdev", "window": window, "symbol": log_ret}

        features.append(rolling_stdev_log_ret)

        features.append({"name": "rolling_stdev", "window": window, "symbol": rolling_stdev_log_ret})
        features.append({"name": "rolling_stdev", "window": window, "symbol": ffd_f})


#     # Dollar bar basis (roughly hourly)
#     windows_ent = [250, 500]
#     for window in windows_ent:
#         features.append({"name": "entropy", "method": "lz", "encoding": "sigma", "window": window, "symbol": log_ret})
#         features.append({"name": "entropy", "method": "konto", "encoding": "sigma", "window": window, "symbol": log_ret, "konto_len": (window // 10) + 1})


#     # Minutely basis
#     windows_pcr = [1800, 3600, 7200]
#     for pc_window in windows_pcr:
#         # PCRATIO #
#         put_call_ratio_ewm = {"name": "ewm_mean", "window": pc_window, "symbol": put_call_ratio}
#         features.append(put_call_ratio_ewm)
#         # lags
#         features.append({"name": "lag", "lag": pc_window, "symbol": put_call_ratio_ewm})


#     # SADF calculated on a daily basis
#     sadf_ewm = {"name": "ewm_mean", "window": 5, "symbol": es_sadf}
#     features.append(sadf_ewm)
#     features.append({"name": "lag", "lag": 5, "symbol": sadf_ewm})
#     features.append({"name": "lag", "lag": 50, "symbol": sadf_ewm})


    return features

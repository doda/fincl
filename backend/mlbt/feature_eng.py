# AUTOGENERATED! DO NOT EDIT! File to edit: dev/08_feature_eng.ipynb (unless otherwise specified).

__all__ = ['roll_measure', 'roll_impact', 'kyle', 'amihud', 'autocorr', 'stdev', 'log', 'ffd', 'volratio',
           'engineer_features', 'define_features', 'FEATURES']

# Cell
from mlfinlab.microstructural_features import (
    get_roll_measure,
    get_roll_impact,
    get_bar_based_kyle_lambda,
    get_bar_based_amihud_lambda,
)
import numpy as np
import logging
from .frac_diff import frac_diff_ffd


def roll_measure(df, window=20):
    """The Roll measure attempts to estimate the bid-ask spread (i.e. liquidity) of an instrument"""
    return get_roll_measure(df["Close"], window)


def roll_impact(df, window=20):
    """The Roll measure divided by dollar volume"""
    return roll_measure(df, window) / df["Dollar Volume"] * 1e9


def kyle(df, window=20):
    """A measure of market impact cost (i.e. liquidity) from Kyle (1985)"""
    return get_bar_based_kyle_lambda(df["Close"], df["Volume"], window) * 1e9


def amihud(df, window=20):
    """A measure of market impact cost (i.e. liquidity) from Amihud (2002)"""
    return get_bar_based_amihud_lambda(df["Close"], df["Dollar Volume"], window) * 1e9


def autocorr(df, window, lag):
    """The raw price series' serial correlation"""
    return df["Close"].rolling(window).apply(lambda x: x.autocorr(lag=lag), raw=False)


def stdev(df, window):
    """The raw price series' standard deviation"""
    return df["Close"].rolling(window).std()


def log(df):
    """First difference of log-transformed prices"""
    return np.log(df["Close"]).diff()


def ffd(df, d):
    """Fractionally differentiated prices"""
    return frac_diff_ffd(np.log(df[["Close"]]), d)["Close"]


def volratio(df, d):
    """
    EWM of bar-by-bar buy volume divided by total volume
    (i.e. a value >0.50 would indicate buyers driving the market)
    """
    buy_vol, vol = df["Buy Volume"], df["Volume"]
    return (buy_vol / vol).ewm(d).mean()


FEATURES = {
    "auto": autocorr,
    "stdev": stdev,
    "roll": roll_measure,
    "rollimp": roll_impact,
    "kyle": kyle,
    "amihud": amihud,
    "volratio": volratio,
    "log": log,
    "ffd": ffd,
}


def engineer_features(bars, features):
    """Parse and compute features"""
    df = bars.copy(deep=True)
    parse_num = lambda x: float(x) if "." in x else int(x)

    for feature in features:
        logging.debug(feature)
        name, *params = feature.split("_")
        params = map(parse_num, params)
        df[feature] = FEATURES[name](df, *params)

    return df.drop(columns=bars.columns)


def define_features():
    """Stake out the list of features that is the basis for our features matrix"""
    features = ["log", "ffd_0.5"]

    for d in [50, 250, 500, 1000]:
        for lag in [25, 50, 250, 500, 1000]:
            if lag < d:
                features.append(f"auto_{d}_{lag}")

        features.append(f"stdev_{d}")
        features.append(f"roll_{d}")
        features.append(f"rollimp_{d}")
        features.append(f"amihud_{d}")
        features.append(f"kyle_{d}")
        features.append(f"volratio_{d}")

    return features
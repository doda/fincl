import numpy as np
import pandas as pd
import pytest

from mlbt.feature_eng import engineer_feature

def test_engineer_feature_simple(deck, config):
	symbol = list(deck.keys())[0]
	feat_config = {'name': 'log_ret'}
	close = engineer_feature(deck, symbol, config, feat_config)["Close"]
	log_returns = np.log(deck[symbol]['bars']['Close']).diff()
	assert close.equals(log_returns)


def test_engineer_feature_nested(deck, config):
	symbol = list(deck.keys())[0]
	log_ret = {'name': 'log_ret'}
	feat_config = {'name': 'lag', 'lag':1, 'symbol': log_ret}
	close = engineer_feature(deck, symbol, config, feat_config)["Close"]
	log_returns = np.log(deck[symbol]['bars']['Close']).diff()
	assert close.equals(log_returns.shift())


def test_engineer_feature_load_external(deck, config):
	symbol = list(deck.keys())[0]
	feat_config = {'name': 'close', 'symbol': '@NQ#C'}
	close = engineer_feature(deck, symbol, config, feat_config)["Close"]
	log_returns = np.log(deck[symbol]['bars']['Close']).diff()
	assert close.iloc[0] == 2630.25
	assert close.iloc[-1] == 8160.25


def test_engineer_feature_make_bars(deck, config):
	symbol = list(deck.keys())[0]
	feat_config = {'name': 'make_bars', 'type_': 'tick', 'size': 10, 'symbol': '@NQ#C'}
	close = engineer_feature(deck, symbol, config, feat_config)["Close"]
	assert close.iloc[-3:].to_dict() == {
		pd.Timestamp('2019-10-02 00:00:00'): 7546.25,
		pd.Timestamp('2019-10-16 00:00:00'): 7948.5,
		pd.Timestamp('2019-10-30 00:00:00'): 8111.25,	
	}

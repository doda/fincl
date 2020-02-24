import pytest
import pandas as pd
import numpy as np

from path import Path
from datetime import date

from mlbt.run_bt import parse_config
from mlbt.feature_eng import define_feature_configs

from sklearn.datasets import make_classification
from path import Path

# Modify these or pass them into the config
DATA_DIR = Path(__file__).parent.parent.parent / 'data'
F_PAYLOAD_DIR = DATA_DIR / 'f_payloads'

def get_test_data(n_features=40, n_informative=10, n_redundant=10, n_samples=10000):
    # generate a random dataset for a classification problem
    X, cont = make_classification(n_samples=n_samples, n_features=n_features, n_informative=n_informative, n_redundant=n_redundant, random_state=0, shuffle=False)
    df = pd.date_range(periods=n_samples, freq=pd.tseries.offsets.Minute(), end=pd.datetime.today())
    X = pd.DataFrame(X, index=df)
    cont = pd.Series(cont, index=df).to_frame('bin')
    df = ['I_%s' % i for i in range(n_informative)] + ['R_%s' % i for i in range(n_redundant)]
    df += ['N_%s' % i for i in range(n_features - len(df))]
    X.columns = df
    cont['w'] = 1.0 / cont.shape[0]
    cont['t1'] = pd.Series(cont.index, index=cont.index)
    return X, cont


@pytest.fixture
def raw_config():
	features = define_feature_configs()
	return {
		"DATA_DIR": DATA_DIR,
		"F_PAYLOAD_DIR": F_PAYLOAD_DIR,

	    "start_date": date(2000, 1, 1),
	    "end_date": date(2021, 1, 1),
	    "data_freq": "daily",
	    "symbols": ['@ES#C', '@FV#C'],
	    # "symbols": symbols,
	    "bar_type": "dollar",
	    "binarize": "fixed_horizon",
	    "binarize_params": 50,
	    "alpha": "none",
	    "features": features[:1],
	    "classifier": "xgboost",
	    "num_threads": 32,
	    "n_jobs": 32,
	    "feat_imp_n_estimators": 10,
	    "feat_imp_cv": 10,
	#     "feature_calc_only": True,
	#     "feature_imp_only": True,
	#     "check_completed": False,
	#     "optimize_hypers": False,
	#     "reuse_hypers": False,
	    "load_from_disk": False,
	#     "skip_feature_imp": True,
	}

@pytest.fixture
def config(raw_config):
	return parse_config(raw_config)


@pytest.fixture
def test_data():
	return get_test_data(n_features=3, n_informative=2, n_redundant=0, n_samples=1000)



@pytest.fixture
def deck(test_data):
	X, cont = test_data
	return {k:{'bars': pd.DataFrame({'Close': X[k].abs()})} for k in X.columns}



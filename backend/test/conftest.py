import pytest
from path import Path
from datetime import date

from mlbt.run_bt import parse_config
from mlbt.feature_eng import define_feature_configs

#export
from path import Path

# Modify these or pass them into the config
DATA_DIR = Path(__file__).parent.parent.parent / 'data'
F_PAYLOAD_DIR = DATA_DIR / 'f_payloads'


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

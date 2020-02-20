import pytest
from datetime import date

from mlbt.run_bt import parse_config
from mlbt.feature_eng import define_feature_configs


@pytest.fixture
def config():
	features = define_feature_configs()

	config_data = {
	    "start_date": date(2000, 1, 1),
	    "end_date": date(2021, 1, 1),
	    "symbols": ['@ES#C', '@NQ#C'],
	    # "symbols": symbols,
	    "bar_type": "dollar",
	    "binarize": "fixed_horizon",
	    "binarize_params": 50,
	    "alpha": "none",
	    "features": features,
	    "classifier": "lgbm",
	    "num_threads": 32,
	    "n_jobs": 32,
	    "feat_imp_n_estimators": 1000,
	    "feat_imp_cv": 5,
	#     "feature_calc_only": True,
	    "feature_imp_only": True,
	    "check_completed": False,
	#     "optimize_hypers": False,
	#     "reuse_hypers": False,
	    "load_from_disk": False,
	#     "skip_feature_imp": True,
	}

	return parse_config(config_data)
import numpy as np
import pytest

from mlbt.feature_importance import feat_importance


def test_feature_importance_simple(config, test_data):
	np.random.seed(0)
	X, cont = test_data
	imp = feat_importance(
	    cont,
	    X,
	    cont['bin'],
	    n_estimators=config["feat_imp_n_estimators"],
	    cv=config["feat_imp_cv"],
	    method=config["feat_imp_method"],
	    n_jobs=config["n_jobs"],
	)

	expected = {
		'mean': {'N_0': -0.005036630036629894, 'I_0': 0.11762679937022064, 'I_1': 0.2120098039215686},
		'std': {'N_0': 0.10274743930189172, 'I_0': 0.11044901162498243, 'I_1': 0.154414323732988},
		'oos': {'I_0': 0.946, 'I_1': 0.946, 'N_0': 0.946},
	}

	for k, v in expected.items():
		for k2,v2  in v.items():
			assert v2 == pytest.approx(imp[k][k2])

import numpy as np
import pandas as pd
import pytest

from mlbt.feature_importance import feat_importance
from sklearn.datasets import make_classification

def get_test_data(n_features=40, n_informative=10, n_redundant=10, n_samples=10000):
    # generate a random dataset for a classification problem
    trnsX, cont = make_classification(n_samples=n_samples, n_features=n_features, n_informative=n_informative, n_redundant=n_redundant, random_state=0, shuffle=False)
    df0 = pd.date_range(periods=n_samples, freq=pd.tseries.offsets.Minute(), end=pd.datetime.today())
    trnsX = pd.DataFrame(trnsX, index=df0)
    cont = pd.Series(cont, index=df0).to_frame('bin')
    df0 = ['I_%s' % i for i in range(n_informative)] + ['R_%s' % i for i in range(n_redundant)]
    df0 += ['N_%s' % i for i in range(n_features - len(df0))]
    trnsX.columns = df0
    cont['w'] = 1.0 / cont.shape[0]
    cont['t1'] = pd.Series(cont.index, index=cont.index)
    return trnsX, cont


@pytest.fixture
def test_data():
	return get_test_data(n_features=3, n_informative=2, n_redundant=0, n_samples=1000)


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

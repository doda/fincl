import numpy as np
import pandas as pd
import pytest

from mlbt.run_bt import run_bt


def test_run_bt_primary_simple(raw_config):
	np.random.seed(0)
	raw_config['load_from_disk'] = True
	payload = run_bt(**raw_config)

	assert len(payload['config'].keys()) > 20
	assert isinstance(payload['feature_importance'], dict)
	assert payload['feature_importance']['mean']

	assert payload['symbols'] == raw_config['symbols']
	assert payload['secondary'] is None

	for key in ['classification_report_str', 'classification_report', 'f1_score', 'confusion_matrix', 'roc_curve', 'roc_auc_score', 'hyper_params']:
		assert key in payload['primary']
	for key in ['trgt', 't1', 'ret', 'bin', 'close_p', 'y_pred_proba', 'y_pred']:
		assert key in payload['events']


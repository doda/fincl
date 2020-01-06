import numpy as np
import pandas as pd

from path import Path

from .sampling import volume_bars, dollar_bars
from .filters import cusum
from .multiprocess import mpPandasObj
from .load_data import load_contracts

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score, classification_report, confusion_matrix, accuracy_score


CUTOFF = 0.8

def getDailyVol(close, span0=100):
    # daily vol, reindexed to cloes
    df0 = close.index.searchsorted(close.index - pd.Timedelta(days=1))
    df0 = df0[df0>0]
    df0 = pd.Series(close.index[df0 - 1], index=close.index[close.shape[0] - df0.shape[0]:])
    df0 = close.loc[df0.index] / close.loc[df0.values].values - 1 # daily returns
    df0 = df0.ewm(span=span0).std()
    return df0


def sample_bars(bars, type_, size):
	fun = {
		'volume': volume_bars,
		'dollar': dollar_bars
	}[type_]

	return fun(bars, size)


def downsample(bars, type_):
	if type_ == 'cusum':
		daily_vol = getDailyVol(bars['Close'])

		daily_vol_mean = daily_vol.mean()
		return cusum(bars['Close'], daily_vol_mean)

	return bars.index

def getVerticalBarriers(close, tEvents, numDays):
    t1 = close.index.searchsorted(tEvents+pd.Timedelta(days=numDays))
    t1 = t1[t1 < close.shape[0]]
    t1 = pd.Series(close.index[t1], index=tEvents[:t1.shape[0]]) # NaNs at the end
    return t1


def getEvents(close, tEvents, ptSl, trgt, minRet, numThreads=1, t1=False, side=None):
    # 1) get target
    trgt = trgt.loc[tEvents]
    trgt = trgt[trgt > minRet]
    # 2) get t1 (max holding period)
    if t1 is False:
        t1 = pd.Series(pd.NaT, index=tEvents)
    # 3) form events object, apply stop loss on t1
    if side is None:
        side_, ptSl_ = pd.Series(1.0, index=trgt.index), [ptSl[0], ptSl[0]]
    else:
        side_, ptSl_ = side.loc[trgt.index], ptSl[:2]
    events = pd.concat({'t1': t1, 'trgt': trgt, 'side': side_}, axis=1).dropna(subset=['trgt'])
    df0 = mpPandasObj(func=applyPtSlOnT1, pdObj=('molecule', events.index), numThreads=numThreads, close=close, events=events, ptSl=ptSl_)
    events['t1'] = df0.dropna(how='all').min(axis=1) # pd.min ignores NaN
    if side is None:
        events = events.drop('side', axis=1)

    # store for later
    events['pt'] = ptSl[0]
    events['sl'] = ptSl[1]

    return events

    
def applyPtSlOnT1(close, events, ptSl, molecule):
    # apply stop loss/profit taking, if it takes place before t1 (end of event)
    events_ = events.loc[molecule]
    out = events_[['t1']].copy(deep=True)

    if ptSl[0] > 0:
        pt = ptSl[0] * events_['trgt']
    else:
        pt = pd.Series(index=events.index) # NaNs

    if ptSl[1] > 0:
        sl = - ptSl[1] * events_['trgt']
    else:
        sl = pd.Series(index=events.index) # 'mo NaNs

    for loc, t1 in events_['t1'].fillna(close.index[-1]).iteritems():
        df0 = close[loc:t1] # path prices
        df0 = (df0 / close[loc] - 1) * events_.at[loc, 'side'] # path returns
        out.loc[loc, 'sl'] = df0[df0<sl[loc]].index.min() # earliest stop loss
        out.loc[loc, 'pt'] = df0[df0>pt[loc]].index.min() # earliest profit take
    return out


def getBins(events, close):
    '''
    Compute event's outcome (including side information, if provided).
    events is a DataFrame where:
    -events.index is event's starttime
    -events['t1'] is event's endtime
    -events['trgt'] is event's target
    -events['side'] (optional) implies the algo's position side
    Case 1: ('side' not in events): bin in (-1, 1) <- label by price action
    Case 2: ('side' in events): bin in (0, 1) <- label by pnl (meta-labeling)
    '''
    # 1) prices aligned with events
    events_ = events.dropna(subset=['t1'])
    px = events_.index.union(events_['t1'].values).drop_duplicates()
    px = close.reindex(px, method='bfill')
    # 2) create out object
    out = pd.DataFrame(index=events_.index)

    out['ret'] = px.loc[events_['t1'].values].values / px.loc[events_.index] - 1
    if 'side' in events_:
        out['ret'] *= events_['side']  # meta-labeling

    out['trgt'] = events_['trgt']
    out['bin'] = np.sign(out['ret'])

    if 'side' in events_:
        out.loc[out['ret'] <= 0, 'bin'] = 0
        out['side'] = events_['side']

    return out


def dropLabels(events, mitPct=0.05):
    # apply weights, drop labels with insufficient examples
    while True:
        df0 = events['bin'].value_counts(normalize=True)
        if df0.min() > mitPct or df0.shape[0] < 3:
            break
        print("Dropped label", df0.idxmin(), df0.min())
        events = events[events['bin'] != df0.idxmin()]
    return events


def binarize(bars, tEvents, type_, binarize_window):
	if type_ == 'triple_barrier_method':
		return triple_barrier_method(bars, tEvents)
	if type_ == 'fixed':
		return fixed_horizon(bars, binarize_window)


def triple_barrier_method(bars, tEvents):
	num_days = 1
	t1 = getVerticalBarriers(bars['Close'], tEvents, num_days)
	daily_vol = getDailyVol(bars['Close'])

	events = getEvents(
		bars['Close'],
		tEvents=tEvents,
		ptSl=[1,1],
		t1=t1,
		numThreads=1,
		trgt=daily_vol,
		minRet=0.01
	)

	return events


# def getEvents(close, tEvents, ptSl, trgt, minRet, numThreads=1, t1=False, side=None):
#     # 1) get target
#     trgt = trgt.loc[tEvents]
#     trgt = trgt[trgt > minRet]
#     # 2) get t1 (max holding period)
#     if t1 is False:
#         t1 = pd.Series(pd.NaT, index=tEvents)
#     # 3) form events object, apply stop loss on t1
#     if side is None:
#         side_, ptSl_ = pd.Series(1.0, index=trgt.index), [ptSl[0], ptSl[0]]
#     else:
#         side_, ptSl_ = side.loc[trgt.index], ptSl[:2]
#     events = pd.concat({'t1': t1, 'trgt': trgt, 'side': side_}, axis=1).dropna(subset=['trgt'])
#     df0 = mpPandasObj(func=applyPtSlOnT1, pdObj=('molecule', events.index), numThreads=numThreads, close=close, events=events, ptSl=ptSl_)
#     events['t1'] = df0.dropna(how='all').min(axis=1) # pd.min ignores NaN
#     if side is None:
#         events = events.drop('side', axis=1)

#     # store for later
#     events['pt'] = ptSl[0]
#     events['sl'] = ptSl[1]

#     return events

def fixed_horizon(bars, binarize_window):
	t1 = pd.Series(bars.index.values, index=bars.index).shift(binarize_window)

	events = pd.concat({'trgt': pd.Series(0, index=bars.index), 't1': t1})

	return events


def ma_alpha(bars, events, fast=10, slow=100):
	close = bars['Close']
	slow_ma = close.rolling(slow).mean()
	fast_ma = close.rolling(fast).mean()

	long_signals = (fast_ma >= slow_ma)
	short_signals = (fast_ma < slow_ma)

	events.loc[long_signals, 'side'] = 1
	events.loc[short_signals, 'side'] = -1
	events['side'] = events['side'].shift() # Use signal from yesterday's close

	return events, long_signals, short_signals


def alpha(bars, events, type_):
	if type_ == 'ma_crossover':
		return ma_alpha(bars, events)


def get_bins(bars, events):
	bins = getBins(events, bars['Close'])
	bins = dropLabels(bins)
	return bins


def prepare_additional_data(bars, long_signals, short_signals):
	df = bars.copy(deep=True)

	# We'll use the features described in 3.5b (vol, serial corr., ma crosses)
	df['log_ret'] = np.log(bars['Close']).diff()
	df['vol5'] = df['log_ret'].rolling(5).std()
	df['vol10'] = df['log_ret'].rolling(10).std()
	df['vol15'] = df['log_ret'].rolling(15).std()

	df['serialcorr20-1'] = df['log_ret'].rolling(20).apply(lambda x: x.autocorr(lag=1), raw=False)
	df['serialcorr20-2'] = df['log_ret'].rolling(20).apply(lambda x: x.autocorr(lag=2), raw=False)
	df['serialcorr20-3'] = df['log_ret'].rolling(20).apply(lambda x: x.autocorr(lag=3), raw=False)

	df.loc[long_signals, 'side'] = 1
	df.loc[short_signals, 'side'] = -1
	# We're using calculations from the previous close for the then following trade
	df['side'] = df['side'].shift()

	return df


def get_model(events, df, bins, type_):
	X_train = df.loc[events.index][['side', 'vol5', 'vol10', 'vol15', 'serialcorr20-1', 'serialcorr20-2', 'serialcorr20-3']]
	y_train = bins['bin']
	merged = pd.merge(X_train, y_train.to_frame(), left_index=True, right_index=True).dropna()

	X_train = merged.drop(columns='bin')
	y_train = merged['bin']

	if type_ == 'random_forest':
		model = RandomForestClassifier(n_estimators=1000, max_depth=5, random_state=42)
		return model, X_train, y_train


def simple_split(clf, use_metalabeling, X_train, y_train):
	cutoff = int(X_train.shape[0] * CUTOFF)

	X_test = X_train.iloc[cutoff:]
	X_train = X_train.iloc[:cutoff]

	y_test = y_train.iloc[cutoff:]
	y_train = y_train.iloc[:cutoff]

	if use_metalabeling:
		clf.fit(X_train, y_train)

		y_pred = clf.predict(X_test)
		y_pred_proba = clf.predict_proba(X_test)[:, 1]
	else:
		y_pred = y_pred_proba = pd.Series(1, index=X_test)

	return y_test, y_pred, y_pred_proba


def get_classification_report(clf, test_procedure, use_metalabeling, X_train, y_train):
	if test_procedure == 'simple':
		y_test, y_pred, y_pred_proba = simple_split(clf, use_metalabeling, X_train, y_train)

	print(classification_report(y_true=y_test, y_pred=y_pred))

	print("Confusion Matrix")
	print(confusion_matrix(y_test, y_pred))

	print('')
	print("Accuracy")
	print(accuracy_score(y_test, y_pred))
	print('')

	return roc_auc_score(y_test, y_pred_proba)


def get_report(clf, X_train, y_train, test_procedure, type_, use_metalabeling):
	if type_ == 'classification':
		return get_classification_report(clf, test_procedure, use_metalabeling, X_train, y_train)


def run_bt(cleaned_data):
	contract_data = load_contracts('@ES', 'daily')

	bars = sample_bars(contract_data, cleaned_data['bar_type'], 100000000)

	tEvents = downsample(bars, cleaned_data['downsampling'])

	events = binarize(bars, tEvents, cleaned_data['binarize'], cleaned_data['binarize_window'], )

	events, long_signals, short_signals = alpha(bars, events, cleaned_data['alpha'])

	bins = get_bins(bars, events)

	df = prepare_additional_data(bars, long_signals, short_signals)

	model, X_train, y_train = get_model(events, df, bins, cleaned_data['classifier'])

	report = get_report(model, X_train, y_train, cleaned_data['test_procedure'], cleaned_data['report'], cleaned_data['use_metalabeling'], )

	return "Results: " + str(report)


def run_test():
	data = {
		'downsampling': 'none',
		'binarize': 'fixed',
		'binarize_window': 20,
		'classifier': 'random_forest',
		'alpha': 'ma_crossover',
		'bar_type': 'dollar',
		'ticker': 'spy',
		'start_year': 2001,
		'end_year': 2019,
		'test_procedure': 'simple',
		'transform': 'returns',
		'report': 'classification',
		'use_metalabeling': False,
	}
	print(run_bt(data))


if __name__ == '__main__':
	run_test()

import React from 'react'
import _ from 'lodash'
import Plot from 'react-plotly.js'

const getFIPlotData = (imps) => {
  if (_.isEmpty(imps)) {
    return {}
  }
  return [{
    type: 'bar',
    orientation: 'h',
    x: _.map(imps, 'mean'),
    y: _.map(imps, 'k'),
    error_x: {
      type: "data",
      visible: true,
      array: _.map(imps, 'std'),
    },
  }]
}


class FeatureImportance extends React.Component {
  renderPlot = ([name, imps]) => {
    if (imps.length < 2) {
      return null
    }

    return (
      <div key={name}>
        <h3>Window: {name} bars</h3>
        <Plot
          data={getFIPlotData(imps)}
          layout={{width: 800, height: 400, }}
        />
      </div>
    )
  }

  render () {
    if (_.isEmpty(this.props.data)) {
      return null
    }
    const featImp = this.props.data
    const keys = _.keys(featImp.mean)

    let imps = _.map(keys, (k) => ({
      k: k,
      mean: featImp.mean[k],
      std: featImp.std[k]
    }))
    imps = _.sortBy(imps, ['mean'])

    const imp_groups = _.toPairs(_.groupBy(imps, (it) => _.split(it.k, '_')[1]))


    return (
      <div>
        <h2>All feature importances</h2>
        <p>Feature importances are calculated in a parallelized manner (MDA feature importances calculated per instrument and then averaged). All features with a feature importance greater than 0 are then used for model training & evaluation.</p>
        <Plot
          data={getFIPlotData(imps)}
          layout={{width: 800, height: 1000, }}
        />

        <h2>Feature Importances grouped by lookback window</h2>
        {_.map(imp_groups, this.renderPlot)}

        <dl className="dl-horizontal">
          <h3>Feature definitions</h3>
          <dt><code>roll(window)</code></dt>
          <dd><strong>Roll measure: </strong>The Roll measure attempts to estimate the bid-ask spread (i.e. liquidity) of an instrument</dd>
          <dt><code>rollimp(window)</code></dt>
          <dd><strong>Roll Impact: </strong>The Roll measure divided by dollar volume</dd>
          <dt><code>kyle(window)</code></dt>
          <dd><strong>Kyle's lambda: </strong>A measure of market impact cost (i.e. liquidity) from Kyle (1985)</dd>
          <dt><code>amihud(window)</code></dt>
          <dd><strong>Amihud's lambda: </strong>A measure of market impact cost (i.e. liquidity) from Amihud (2002)</dd>
          <dt><code>auto(window, lag)</code></dt>
          <dd><strong>Autocorrelation: </strong>The raw price series' serial correlation</dd>
          <dt><code>stdev(window)</code></dt>
          <dd><strong>Standard deviation: </strong>The raw price series' standard deviation</dd>
          <dt><code>log()</code></dt>
          <dd><strong>Log prices: </strong>First difference of log-transformed prices</dd>
          <dt><code>ffd(d)</code></dt>
          <dd><strong>Fractionally differentiated prices: </strong>Achieving stationary in price series while preserving memory</dd>
          <dt><code>volratio(window)</code></dt>
          <dd><strong>Volume ratio: </strong>Exponentially weighted MA of buy volume (as estimated by the tick rule on 1-minute bars) divided by total volume (i.e. a value greather than 0.50 indicates buyers are driving the market)</dd>
        </dl>
      </div>
    )
  }
}

export default FeatureImportance

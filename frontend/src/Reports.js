import Plot from 'react-plotly.js'
import React from 'react'
import _ from 'lodash'

import './App.css'
import schema from './schema.js'

import { Row, Col, Table, Panel, Glyphicon } from 'react-bootstrap'
import SYMBOLS_JSON from './symbols.json'

const QUESTIONS = schema.questionSets[0].questions

const QUESTIONS_MAPPED = _.fromPairs(_.map(QUESTIONS, (val) => [val.questionId, val]))
const CLASSIFIER_OPTIONS = _.fromPairs(_.map(QUESTIONS_MAPPED.classifier.input.options, (val) => [val.value, val.text]))

const isInt = (n) => n % 1 === 0


const getUpdateMenus = (data) => {
  const sectors = _.uniq(_.values(SYMBOLS_JSON.Sector))
  const buttons = sectors.map(sector => {
    // debugger
    return {
        args: [{'visible': data.map(x => SYMBOLS_JSON.Sector[x.symbol] === sector)}],
        label: sector,
        method: 'update',
    }
  })
  const allButton = {
      args: [{'visible': data.map(x => true)}],
      label: 'Show all',
      method: 'update',
  }
  return [
      {
          buttons: _.concat([allButton], buttons),
          direction: 'left',
          pad: {'r': 10, 't': -50},
          showactive: true,
          type: 'buttons',
          x: 10,
          xanchor: 'left',
          y: 20,
          yanchor: 'top',
      }
  ]
}

const getSignalsPlotData = (signals) => {
  if (_.isEmpty(signals)) {
    return {}
  }
  const symbols = _.filter(_.keys(signals.data[0]))
  const x_rows = []
  const y_rows = _.fromPairs(_.map(symbols, (s) => [s, []]))


  _.forEach(signals.data, (row) => {
    x_rows.push(row[""])
    _.forEach(symbols, (symbol) => {
      y_rows[symbol].push(row[symbol])
    })
  })

  const traces = _.map(symbols, (symbol) => {
    const v = _.replace(symbol, '#C', '')

    return {
      x: x_rows,
      y: y_rows[symbol].map(x => x === 0 ? null : x),
      type: 'scatter',
      name: SYMBOLS_JSON.Bloomberg[v] || v,
      symbol: v,
    }
  })

  return traces
}

class ConfusionMatrixTable extends React.Component {
  render () {
    if (_.isEmpty(this.props.data)) {
      return null
    }
    const rep = this.props.data.confusion_matrix
    const c_rep = this.props.data.classification_report
    const [k1, k2] = _.has(c_rep, '0.0') ? ['0.0', '1.0'] : ['-1.0', '1.0']
    const [l1, l2] = [_.split(k1, '.')[0], _.split(k2, '.')[0]]
    return (
      <Table striped bordered condensed hover>
        <thead>
          <tr>
            <th></th>
            <th>Predicted {l1}</th>
            <th>Predicted {l2}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Label {l1}</td>
            <td>{rep[0][0]}</td>
            <td>{rep[0][1]}</td>
          </tr>
          <tr>
            <td>Label {l2}</td>
            <td>{rep[1][0]}</td>
            <td>{rep[1][1]}</td>
          </tr>
        </tbody>
      </Table>
    )
  }
}

class ClassificationReportTable extends React.Component {
  render () {
    if (_.isEmpty(this.props.data)) {
      return null
    }

    const rep = this.props.data
    const [k1, k2] = _.has(rep, '0.0') ? ['0.0', '1.0'] : ['-1.0', '1.0']
    const [l1, l2] = [_.split(k1, '.')[0], _.split(k2, '.')[0]]
    return (
      <Table striped bordered condensed hover>
        <thead>
          <tr>
            <th></th>
            <th>Precision</th>
            <th>Recall</th>
            <th>F1-score</th>
            <th>Support</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{l1}</td>
            <td>{rep[k1].precision.toFixed(3)}</td>
            <td>{rep[k1].recall.toFixed(3)}</td>
            <td>{rep[k1]['f1-score'].toFixed(3)}</td>
            <td>{rep[k1].support}</td>
          </tr>
          <tr>
            <td>{l2}</td>
            <td>{rep[k2].precision.toFixed(3)}</td>
            <td>{rep[k2].recall.toFixed(3)}</td>
            <td>{rep[k2]['f1-score'].toFixed(3)}</td>
            <td>{rep[k2].support}</td>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td>Accuracy</td>
            <td></td>
            <td></td>
            <td>{rep.accuracy.toFixed(3)}</td>
            <td>{rep['macro avg'].support}</td>
          </tr>
          <tr>
            <td>Macro Avg.</td>
            <td>{rep['macro avg'].precision.toFixed(3)}</td>
            <td>{rep['macro avg'].recall.toFixed(3)}</td>
            <td>{rep['macro avg']['f1-score'].toFixed(3)}</td>
            <td>{rep['macro avg'].support}</td>
          </tr>
          <tr>
            <td>Weighted Avg.</td>
            <td>{rep['weighted avg'].precision.toFixed(3)}</td>
            <td>{rep['weighted avg'].recall.toFixed(3)}</td>
            <td>{rep['weighted avg']['f1-score'].toFixed(3)}</td>
            <td>{rep['weighted avg'].support}</td>
          </tr>
        </tbody>
      </Table>
    )
  }
}

class ClassificationReportScoresTable extends React.Component {
  render () {
    return (
      <Table striped bordered condensed hover >
        <tbody>
          <tr>
            {!_.isNull(this.props.roc_auc_score) ? <td className="col-md-3">ROC AUC Score</td> : null}
            {!_.isNull(this.props.roc_auc_score) ? <td className="col-md-3">{this.props.roc_auc_score.toFixed(3)}</td> : null}
          </tr>
          <tr>
            {!_.isNull(this.props.f1_score) ? <td className="col-md-3">F1 Score</td> : null}
            {!_.isNull(this.props.f1_score) ? <td className="col-md-3">{this.props.f1_score.toFixed(3)}</td> : null}
          </tr>
        </tbody>
      </Table>
    )
  }
}

class SimpleTable extends React.Component {
  render () {
    return (
      <Table striped bordered condensed hover>
        <tbody>
          {_.map(this.props.data, (value, key) => {
            return (
              <tr key={key}>
                <td className="col-md-3">{key}</td>
                <td className="col-md-3">{value}</td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    )
  }
}

class MultiTable extends React.Component {
  render () {
    const data = this.props.data
    const cols = _.keys(data)
    const indices = _.keys(data[cols[0]])

    let PERC_COLS = ['Net drawdown in %']
    let DATE_COLS = ['Peak date', 'Valley date', 'Recovery date']
    const format_num = (v, col) => {
      if (_.includes(v, '0001-01-01')) return 'TBD'
      if (_.includes(DATE_COLS, col)) return _.split(v, 'T')[0]
      if (_.includes(PERC_COLS, col)) return v.toFixed(2) + '%'
      return v
    }

    return (
      <Table striped bordered condensed hover>
        <thead>
          <tr>
            {_.map(cols, (value, key) => <th key={key}>{value}</th>)}
          </tr>
        </thead>
        <tbody>
          {_.map(indices, (row) => {
            return (
              <tr key={row}>
                {_.map(cols, (col) => <td key={col}>{format_num(data[col][row], col)}</td>) }
              </tr>
            )
          })}
        </tbody>
      </Table>
    )
  }
}


class MultiTableSymbols extends React.Component {
  render () {
    const data = this.props.data
    const cols = _.keys(data)
    const indices = _.keys(data[cols[0]])

    return (
      <Table striped bordered condensed hover>
        <thead>
          <tr>
            {_.map(cols, (value, key) => <th key={key}>{_.startCase(value)}</th>)}
          </tr>
        </thead>
        <tbody>
          {_.map(indices, (row) => {
            return (
              <tr key={row}>
                {_.map(cols, (col) => <td key={col}>{data[col][row]}</td>) }
              </tr>
            )
          })}
        </tbody>
      </Table>
    )
  }
}

class HidablePanel extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      open: !!props.defaultOpen,
    }
  }

  render () {
    return (
      <Panel key={this.props.title} expanded={this.state.open} onToggle={() => {}}>
        <Panel.Heading>
          <Panel.Title className="clicky-hover" onClick={() => this.setState({ open: !this.state.open })}>
            <h3>{this.props.title} <Glyphicon style={{float: "right"}} glyph={`chevron-${this.state.open ? "up" : "down"}`} /></h3>
          </Panel.Title>
        </Panel.Heading>
        <Panel.Collapse>
          {this.props.children}
        </Panel.Collapse>
      </Panel>
    )
  }
}


class PnLReport extends React.Component {
  render () {
    if (_.isEmpty(this.props.data)) {
      return null
    }

    const url = process.env.PUBLIC_URL + '/payloads/' + this.props.data.fig_file_name
    let { p_stats, dd_table } = this.props.data
    let PERC_STATS = ['Annual return', 'Cumulative returns', 'Annual volatility', 'Max drawdown', 'Daily value at risk']
    const format_num = (k, v) => {
      if (!v) return ''
      return _.includes(PERC_STATS, k) ? (v * 100).toFixed(2) + '%' : v.toFixed(2)
    }
    p_stats = _.fromPairs(_.map(
      p_stats, (v,k) => ([k, format_num(k, v)])
    ))

    return (
      <div className="pnl_report">
        <Row key="pstats">
          <Col md={12}>
            <HidablePanel title="Performance stats" defaultOpen>
              <Row key="pstats">
                <Col md={6}>
                  <SimpleTable data={p_stats} />
                </Col>
              </Row>
              <h4>Drawdowns</h4>
              <MultiTable data={dd_table} />
              <p>Performance stats and tearsheet are calculated from EOD (end-of-day) returns series</p>
            </HidablePanel>
          </Col>
        </Row>
        <Row key="symbols">
          <Col md={12}>
            <HidablePanel title="Symbols table">
              <MultiTableSymbols data={SYMBOLS_JSON} />
            </HidablePanel>
          </Col>
        </Row>
        <Row key="tearsheet">
          <Col md={12}>
            <HidablePanel title="Tearsheet" defaultOpen>
              <img alt="tearsheet" src={url} width="100%" style={{padding: '20px'}} />
            </HidablePanel>
          </Col>
        </Row>
      </div>
    )
  }
}

class ClassificationReportExplanation extends React.Component {
  render () {
    if (_.isEmpty(this.props.data)) {
      return null
    }
    let classifier = _.get(this.props, 'data.classifier', 'random_forest')

    let classifier_str = CLASSIFIER_OPTIONS[classifier]
    return <p>The classification report describes the signal generated by a <strong>{classifier_str}</strong> classifier. The predictions fall between <code>{"{-1,1} {short,long}"}</code>,
    with label targets <code>{"{-1,1} {negative,positive}"}</code> indicating the returns over the forecast horizon. The average active signal is then used as final trading signal.</p>
  }
}

class ClassificationReportData extends React.Component {
  render () {
    if (_.isEmpty(this.props.data)) {
      return null
    }
    let hyper_params = _.omit(this.props.data.hyper_params, ['n_jobs'])
    hyper_params = _.fromPairs(_.map(hyper_params, (value, key) => [key, isInt(value) ? value : value.toFixed(2)] ))

    return (
      <div>
        <ClassificationReportTable data={this.props.data.classification_report} />
        <h5>Confusion Matrix:</h5>
        <ConfusionMatrixTable data={this.props.data} />
        <Row>
          <Col md={6}>
            <h5>Scores:</h5>
            <ClassificationReportScoresTable roc_auc_score={this.props.data.roc_auc_score} f1_score={this.props.data.f1_score} />
          </Col>
          <Col md={6}>
            <h5>Hyper Parameters:</h5>
            <SimpleTable data={hyper_params} />
          </Col>
        </Row>
  </div>
    )
  }
}

class ClassificationReport extends React.Component {
  render () {
    if (_.isEmpty(this.props.data)) {
      return null
    }
    const displayClassificationReport = this.props.form_data.classifier !== 'all_models'

    let classificationReportTables = null
    if (displayClassificationReport) {
      classificationReportTables = (
        <HidablePanel title="Classification report" defaultOpen>
         <ClassificationReportExplanation data={this.props.form_data} />
         <ClassificationReportData data={this.props.data} />
        </HidablePanel>
      )
    }

    const signalsPlotData = getSignalsPlotData(this.props.data.pnl.signal)
    const updateMenus = getUpdateMenus(signalsPlotData)

    return (
        <Row key="pstats">
          <Col md={12}>
            {classificationReportTables}
            <HidablePanel title="Signals plot" defaultOpen>
              <Plot
                data={signalsPlotData}
                layout={{width: 700, height: 500, updatemenus: updateMenus}}
              />
            </HidablePanel>
          </Col>
        </Row>
    )
  }
}

export {ClassificationReport, PnLReport}

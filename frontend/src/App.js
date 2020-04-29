import React from 'react'
import Winterfell from 'winterfell'
import axios from 'axios'
import Papa from 'papaparse'
import _ from 'lodash'

import './App.css'
import schema from './schema.js'
import Intro from './Intro.js'
import {ClassificationReport, PnLReport} from './Reports.js'
import FeatureImportance from './FeatureImportance.js'
import { css } from "@emotion/core";

import { Grid, Row, Col, Tabs, Tab } from 'react-bootstrap'
import GridLoader from "react-spinners/GridLoader"

const makePayloadStringObj = (p) => `${p.forecast_horizon}_none_[]_${p.classifier}`


class Form extends React.Component {
  shouldComponentUpdate() {
    // the moment Winterfell rerenders, it causes formData state to disappear
    return false;
  }
  render () {
    return (
      <Winterfell
        schema={this.props.schema}
        disableSubmit={true}
        onUpdate={this.props.onUpdate}
        onSubmit={this.props.onSubmit}
      />
    )
  }
}

class Loader extends React.Component {
  render () {
    const override = css`
      display: block;
      margin: 0 auto;
      position: absolute;
      top: -5px;
      right: 0;
      z-index: 100000;
    `
    return (
      <GridLoader
        css={override}
        size={10}
        color={"#ffaa00"}
        loading={this.props.loading}
      />
    )
  }
}


const parseBackendData = (data) => {
  if (!_.get(data, 'primary.pnl.signal')) {
    return {}
  }
  data.primary.pnl.signal = Papa.parse(data.primary.pnl.signal, {
    header: true,
    dynamicTyping: true,
  })
  if (!_.isEmpty(_.get(data, 'secondary.pnl.signal', {}))) {
    data.secondary.pnl.signal = Papa.parse(data.secondary.pnl.signal, {
      header: true,
      dynamicTyping: true,
    })
  }
  return data
}


class Reports extends React.Component {
  render () {
    if (_.isEmpty(this.props.data)) {
      return null
    }

    return (
      <div style={{position: "relative"}}>
        <Loader loading={this.props.loading} />
        <Tabs  className={this.props.loading ? "loading" : ""} defaultActiveKey={1} id="uncontrolled-tab-example">
          <Tab eventKey={1} title="Intro">
            <Intro />
          </Tab>
          <Tab eventKey={2} title="Feature Importance">
            <FeatureImportance data={this.props.data.feature_importance} />
          </Tab>
          <Tab eventKey={3} title="Classification Report">
            <ClassificationReport data={this.props.data.primary} form_data={this.props.form_data} />
            <PnLReport data={this.props.data.primary.pnl} />
          </Tab>
        </Tabs>
      </div>
    )
  }
}


const INIT_STATE = {
  form_data: {},
  reports: {},
  loading: false,
}

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = INIT_STATE
  }

  onUpdate = (form_data) => {
    let str, file_name
    console.log(form_data)
    if (form_data.classifier === 'all_models') {
        file_name = 'f_payload_MULTI_15.json'
    } else {
        str = makePayloadStringObj(form_data)
        if (_.includes(str, 'undefined')) return
        file_name = 'f_payload_agriculture-currency-energy-equity_index-interest_rate-metals_dollar_' + str + '.json'
    }

    const url = process.env.PUBLIC_URL + '/payloads/' + file_name
    const that = this
    that.setState({
      loading: true,
    })
    axios.get(url)
    .then((response) => {
      const data = parseBackendData(response.data)
      that.setState({
        form_data: form_data,
        reports: data,
        loading: false,
      })
    }, () => {
    })

  }

  render() {
    return (
    <div className="container-fluid">
      <div className="App row justify-content-md-center">
      <Grid>
        <Row>
          <Col key="left" md={2}>
          </Col>
          <Col key="mid" md={8}>
            <div style={{margin: '30px 0 20px 0', textAlign: 'center'}}>
              <img alt="logo" src={process.env.PUBLIC_URL + '/fincl-logo.png'} height={40} />
            </div>
            <Form
              schema={schema}
              onUpdate={this.onUpdate}
              onSubmit={() => {}}
            />
            <Reports form_data={this.state.form_data} data={this.state.reports} loading={this.state.loading} />
          </Col>
          <Col key="right" md={2}>
          </Col>
        </Row>
      </Grid>
      </div>
      <br/><br/><br/><br/><br/>
    </div>

    )
  }
}

export default App

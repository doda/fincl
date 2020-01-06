import React from 'react';
import logo from './logo.svg';
import './App.css';

import 'semantic-ui-css/semantic.min.css';

import { Formik, Field, ErrorMessage } from 'formik';
import {
  Button,
  Dropdown,
  Form,
  Input,
  Checkbox,
  Radio,
} from 'formik-semantic-ui';

/*
TICKER_CHOICES = (("spy", "SPY"), )
BAR_TYPE_CHOICES = (
    # ("time", "Time Bars"),
    ("volume", "Volume Bars"),
    ("dollar", "Dollar Bars")
)

DOWNSAMPLING_CHOICES = (("none", "None"), ("cusum", "CUSUM"))
BINARIZE_CHOICES = (("triple_barrier_method", "Triple-Barrier method"), ("fixed_horizon", "Fixed Horizon"))
TRANSFORM_CHOICES = (("returns", "Returns"), ("log", "Log prices"), ("fracdiff", "Fractionally Differentiated prices"))
PROCEDURE_CHOICES = (("simple", "Simple split"), ("walk_forward", "Walk Forward Cross-validation"), ("cpcv", "Combinatorial Purged Cross-validation"))
ALPHA_CHOICES = (("ma_crossover", "MA Crossover"), )
CLASSIFIER_CHOICES = (("random_forest", "Random Forest"), ("xgb", "XGBoost"), ("lgbm", "LightGBM"))
REPORT_CHOICES = (("classification", "Classification Report"), ("pnl", "PnL"), )
USE_METALABELING_CHOICES =  ((True, "Yes"), (False, "No"), )
*/
const CURRENT_YEAR = (new Date()).getFullYear();

const TICKER_OPTIONS = [{value: "spy", text: "SPY"}, ]
const BAR_TYPE_OPTIONS = [{value: "volume", text: "Volume Bars"}, {value: "dollar", text: "Dollar Bars"} ]
const DOWNSAMPLING_OPTIONS = [{value: "none", text: "None"}, {value: "cusum", text: "CUSUM"}]
const BINARIZE_OPTIONS = [{value: "triple_barrier_method", text: "Triple-Barrier method"}, {value: "fixed_horizon", text: "Fixed Horizon"}]
const TRANSFORM_OPTIONS = [{value: "returns", text: "Returns"}, {value: "log", text: "Log prices"}, {value: "fracdiff", text: "Fractionally Differentiated prices"}]
const PROCEDURE_OPTIONS = [{value: "simple", text: "Simple split"}, {value: "walk_forward", text: "Walk Forward Cross-validation"}, {value: "cpcv", text: "Combinatorial Purged Cross-validation"}]
const ALPHA_OPTIONS = [{value: "ma_crossover", text: "MA Crossover"}, ]
const CLASSIFIER_OPTIONS = [{value: "random_forest", text: "Random Forest"}, {value: "xgb", text: "XGBoost"}, {value: "lgbm", text: "LightGBM"}]
const REPORT_OPTIONS = [{value: "classification", text: "Classification Report"}, {value: "pnl", text: "PnL"}, ]
const USE_METALABELING_OPTIONS = [{value: true, text: "Yes"}, {value: false, text:"No"}, ]

const SCHEMA = {
  ticker: {
    label: 'Ticker',
    type: 'dropdown',
    options: TICKER_OPTIONS,
    value: TICKER_OPTIONS[0].value,
  },
  start_year: {
    label: 'Start year',
    type: 'text',
    value: '2000',
  },
  end_year: {
    label: 'End year',
    type: 'text',
    value: CURRENT_YEAR,
  },
  bar_type: {
    label: 'Bar type',
    type: 'dropdown',
    options: BAR_TYPE_OPTIONS,
    value: BAR_TYPE_OPTIONS[0].value,
  },
  downsampling: {
    label: 'Downsampling',
    type: 'dropdown',
    options: DOWNSAMPLING_OPTIONS,
    value: DOWNSAMPLING_OPTIONS[0].value,
  },
  binarize: {
    label: 'Binarize',
    type: 'dropdown',
    options: BINARIZE_OPTIONS,
    value: BINARIZE_OPTIONS[0].value,
  },
  binarize_window: {
    label: 'Binarize Window',
    type: 'text',
    value: 20,
  },
  transform: {
    label: 'Transform',
    type: 'dropdown',
    options: TRANSFORM_OPTIONS,
    value: TRANSFORM_OPTIONS[0].value,
  },
  alpha: {
    label: 'Alpha',
    type: 'dropdown',
    options: ALPHA_OPTIONS,
    value: ALPHA_OPTIONS[0].value,
  },
  use_metalabeling: {
    label: 'Use metalabeling',
    type: 'checkbox',
  },
  classifier: {
    label: 'Classifier',
    type: 'dropdown',
    options: CLASSIFIER_OPTIONS,
    value: CLASSIFIER_OPTIONS[0].value,
  },
  test_procedure: {
    label: 'Test Procedure',
    type: 'dropdown',
    options: PROCEDURE_OPTIONS,
    value: PROCEDURE_OPTIONS[0].value,
  },
  report: {
    label: 'Report',
    type: 'dropdown',
    options: REPORT_OPTIONS,
    // fieldProps: {
    //   width: 8,
    // },
    value: REPORT_OPTIONS[0].value,
  },
}

class SimpleForm extends React.Component {
  static defaultProps = {
    person: {
      emailAddress: '',
      firstName: '',
      lastName: '',
      checkbox: true,
      radio: undefined,
      dropdown: undefined,
    },
  };
  _handleSubmit = (values, formikApi) => {
    // Make API Call
    console.log(values, formikApi);
    // Handle response / Errors
    formikApi.setFieldError('emailAddress', 'Invalid Email');
    formikApi.setFieldError('firstName', 'Invalid Name');
    formikApi.setFieldError('checkbox', 'Invalid Check Box');
    formikApi.setFieldError('radio', 'Invalid Radio');
    formikApi.setFieldError('dropdown', 'Invalid Dropdown');
    formikApi.setSubmitting(false);
    this._email.focus();
  };

  render() {
    return (
        <Form
          onSubmit={this._handleSubmit}
          schema={SCHEMA}
        >
          <Button.Submit>Submit</Button.Submit>
          <Button.Reset>Cancel</Button.Reset>
        </Form>
    );
  }
}



const Basic = () => (
  <div>
    <SimpleForm />
  </div>
);




function App() {
  return (
    <div className="App">
      <Basic />
    </div>
  );
}

export default App;

var TF_question = {
  "questionId" : "forecast_horizon",
  "question" : "Forecast horizon",
  "input" : {
    "type" : "selectInput",
    "options" : [
    {
      "text" : "6 CUSUM downsampled Dollar Bars",
      "value" : "fixed_horizon_6",
    },
    {
      "text" : "12 CUSUM downsampled Dollar Bars",
      "value" : "fixed_horizon_12",
    },
    // {
    //   "text" : "25 CUSUM downsampled Dollar Bars",
    //   "value" : "fixed_horizon_25",
    // },
    {
      "text" : "50 CUSUM downsampled Dollar Bars",
      "value" : "fixed_horizon_50",
    },
    {
      "text" : "100 CUSUM downsampled Dollar Bars",
      "value" : "fixed_horizon_100",
    },
    {
      "text" : "200 CUSUM downsampled Dollar Bars",
      "value" : "fixed_horizon_200",
    },
    ]
  }
}

module.exports = {
  "classes" : {
    "input" : "form-control",
    "select" : "form-control",
    "question" : "form-group",
    "radioListItem" : "radio",
    "radioList" : "clean-list",
    "checkboxInput" : "checkbox",
    "checkboxListItem" : "checkbox",
    "checkboxList" : "clean-list",
    "controlButton" : "btn btn-primary pull-right",
    "backButton" : "btn btn-default pull-left",
    "errorMessage" : "alert alert-danger",
    "questionPostText" : "push-top",
    "buttonBar" : "button-bar"
  },
  "formPanels" : [{
    "index" : 1,
    "panelId" : "final-panel"
  }],
  "questionPanels" : [{
    "panelId" : "final-panel",
    "action" : {
      "conditions" : [],
      "default" : {
        "action" : "SUBMIT",
      }
    },
    "button" : {
      "text" : "Submit"
    },
    "questionSets" : [{
      "index" : 1,
      "questionSetId" : "info-set"
    }]
  }],
  "questionSets" : [{
    "questionSetId" : "info-set",
    "questions" : [
    {
      "questionId" : "classifier",
      "question" : "ML Classifier",
      "input" : {
        "type" : "selectInput",
        "options" : [{
          "text" : "Random Forest",
          "value" : "random_forest",
          "conditionalQuestions": [TF_question],
        }, {
          "text" : "XGBoost",
          "value" : "xgboost",
          "conditionalQuestions": [TF_question],
        }, {
          "text" : "LightGBM",
          "value" : "lgbm",
          "conditionalQuestions": [TF_question],
        }, {
          "text" : "Dummy (random) classifier",
          "value" : "dummy",
          "conditionalQuestions": [TF_question],
        }]
      }
    },
  ]
  }]
};
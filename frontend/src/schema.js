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
        }, {
          "text" : "XGBoost",
          "value" : "xgboost",
        }, {
          "text" : "LightGBM",
          "value" : "lgbm",
        }, {
          "text" : "KNN",
          "value" : "knn",
        }, {
          "text" : "Dummy (random) classifier",
          "value" : "dummy",
        }]
      }
    },

    {
      "questionId" : "forecast_horizon",
      "question" : "Forecast horizon",
      "input" : {
        "type" : "selectInput",
        "options" : [{
          "text" : "10 CUSUM downsampled Dollar Bars",
          "value" : "fixed_horizon_10",
        }, {
          "text" : "25 CUSUM downsampled Dollar Bars",
          "value" : "fixed_horizon_25",
        }, {
          "text" : "50 CUSUM downsampled Dollar Bars",
          "value" : "fixed_horizon_50",
        }, {
          "text" : "100 CUSUM downsampled Dollar Bars",
          "value" : "fixed_horizon_100",
        }]
      }
    },
  ]
  }]
};
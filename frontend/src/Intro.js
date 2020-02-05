import React from 'react'
import { ProgressBar } from 'react-bootstrap'

class Intro extends React.Component {
  render () {
    return (
      <div>
        <h3>Introduction</h3>

        <p>After reading <a target="_blank" rel="noopener noreferrer" href="https://www.amazon.com/Advances-Financial-Machine-Learning-Marcos/dp/1119482089">Advances in Financial Machine Learning</a> by Marcos Lopez de Prado I was incredibly motivated to further explore machine learning applications in  finance. I built <code>fincl</code> (the web app you're looking at right now) to encapsulate some of those learnings and buildings. The complete source code lives also on <a target="_blank" rel="noopener noreferrer" href="https://github.com/dodafin/fincl">GitHub</a>.</p>

        <p>The cool thing about <code>fincl</code> is that it basically functions as one complete "automated financial ML pipeline". It doesn't need much more than the inputs in the header (choosing a classifier and forecast horizon) to sample bars, compute features & feature importances, select a subset of them, binarize the price series, and then hyper-parameter optimize, train, and detailed reports evaluating the out-of-sample predictions.</p>

        <p>In addition to the standard ML classification report are also included a historical backtest and tearsheet for people not familiar with machine learning.</p>
        <p>The frontend and backend are fully capable of both <strong>classical labeling</strong> (a ML classifier generates a trading signal) and <strong>meta-labeling</strong> (a ML classifier filters a trading signal) and while both methods managed to produce similar prediction scores, inconsistent results in the walk-forward PnL simulation of meta-labeling combined with a self-imposed deadline have made me include only the classical labeling results herein for the time being.</p>

       <h3>Findings</h3>
       <ul>
        <li>Volume Ratio, Fractionally Differentiated Prices, Variance are the most important features over short forecast horizons (10 & 25 bars). (Further info under the "Feature Importance" tab)</li>
        <li>Volume Ratio is the most important feature for almost all forecast horizons and lookback windows, except for 100 bar forecast horizons where most features except serial correlation perform well.</li>
        <li>Rather than having learned exploitable patterns in the market data that is exploitable cross-asset, the ML models seem to have learned to differentiate between assets and go consistently long / short certain assets.</li>
        <li>Tree-based models (RF, XGBoost, LGBM) all our Dummy classifier and the "Long All" baseline.</li>
        <li>Models tend to have higher prediction scores on shorter forecast horizons, however likely do not outperform due to higher slippage & trading costs.</li>
        <li>The training data starts in 2007, which might be a reason for the models exhibiting a short bias (going short roughly 50%-100% more than going long).</li>
        <li>The models perform surprisingly well despite beginning training during GFC and being evaluated exclusively in a bull market (2014-2020).</li>

       </ul>
        <h3>Methods</h3>
        <p>I'll briefly describe the <code>fincl</code> pipeline, from the original 1-minute bars all the way through label generation, model fitting and validation as well as PnL simulation.</p>
        <p>Results or methodologies are indicated via the colored bars below each step.</p>
        <p>To make the tool quick & easy-to-use I've precomputed all results and included them in the frontend payload.</p>
        <h4>1. Load & sample bars</h4>
        <p>
            Load our bars, chunk them into dollar bars aiming to have 25 bars per day per symbol for the year 2019.
        </p>
        <ProgressBar now={100} label={"Dollar bars"} />
        <h4>2. Downsample</h4>
        <p>
          A 100-day volatility estimate is taken and used as the basis for a symmetric CUSUM filter. This reduces the amount of rows to be evaluated by our models by e.g. roughly 50% on equity indices. This means that a forecast horizon of 10 bars on the E-Mini futures in the year 2019 would equate to roughly 20 hourly time bars (25 volume bars per day downsampled to 12.5 bars per day) or a forecast horizon of about a day.
        </p>
        <ProgressBar striped now={100} label={"Downsampled events"} />
        <h4>3. Binarize</h4>
        <p>
            Binarize the rows, i.e. for every row determine a forward returns window which is then used to calculate that row's label (i.e. positive returns over the forward looking window as a <code>{1}</code> for the classifier).
        </p>
        <ProgressBar striped now={100} label={"Downsampled events with fixed horizon timestamps into the future"} />
        <h4>4. Feature engineering</h4>
        <p>
          A features matrix is constructed. Further information on the specific features, their definitions and parameters can be found under the "Feature Importance" tab.
        </p>
        <ProgressBar now={100} label={"Features computed on full dataset"} />
        <h4>5. Label data</h4>
        <p>
          <code>{"{Negative,positive}"}</code> returns over the forward forecast horizon are used to generate <code>{"{1,-1}"}</code> labels.
        </p>
        <ProgressBar now={100} label={"Full dataset with features & truth labels"} />
        <h4>6. Train/Test split</h4>
        <p>
            Exclude rows from our engineered features which haven't completed the warmup for all feature columns
            and split the set 50/50 into train & test set.
        </p>
        <ProgressBar>
          <ProgressBar bsStyle="success" now={50} key={1} label={"Train set"} />
          <ProgressBar bsStyle="danger" now={50} key={2} label={"Test set"} />
        </ProgressBar>
        <h4>7. Feature importances</h4>
        <p>
          We calculate parallelized MDA feature importances. This means that for every symbol we run a loop excluding one of the features and comparing how much worse our predictions get without that feature.
        </p>
        <p>
          This is done with purged K-Fold CV and the calculated feature importances are therefore out-of-sample and predictive (rather than explanatory like MDI feature importances).
          The per-symbol calculated features are then combined into one general set of feature importances across the investment universe.
        </p>
        <ProgressBar>
          <ProgressBar bsStyle="success" now={40} key={1} label={"Train set"} />
          <ProgressBar bsStyle="info" now={10} key={2} label={"Val. set"} />
        </ProgressBar>
        <ProgressBar>
          <ProgressBar bsStyle="success" now={30} key={1} label={"Train set"} />
          <ProgressBar bsStyle="info" now={10} key={2} label={"Val. set"} />
          <ProgressBar bsStyle="success" now={10} key={3} label={"Train set"} />
        </ProgressBar>
        <ProgressBar>
          <ProgressBar bsStyle="success" now={20} key={1} label={"Train set"} />
          <ProgressBar bsStyle="info" now={10} key={2} label={"Val. set"} />
          <ProgressBar bsStyle="success" now={20} key={3} label={"Train set"} />
        </ProgressBar>
        <ProgressBar>
          <ProgressBar bsStyle="success" now={10} key={1} label={"Train set"} />
          <ProgressBar bsStyle="info" now={10} key={2} label={"Val. set"} />
          <ProgressBar bsStyle="success" now={30} key={3} label={"Train set"} />
        </ProgressBar>
        <ProgressBar>
          <ProgressBar bsStyle="info" now={10} key={1} label={"Val. set"} />
          <ProgressBar bsStyle="success" now={40} key={2} label={"Train set"} />
        </ProgressBar>
        <h4>8. Pick important features </h4>
        <p>
            Join the feature importances computed parallelized & per-symbol into one dataframe
            Pick features that help our classifier's predictive abilities
        </p>
        <ProgressBar>
          <ProgressBar bsStyle="success" now={50} key={1} label={"Train set without unimportant features"} />
          <ProgressBar bsStyle="danger" now={50} key={2} label={"Test set without unimportant features"} />
        </ProgressBar>
        <h4>9. Model</h4>
        <p>
          Using Purged K-Fold CV on the train set alone we run a randomized Grid search to find the best set of hyper parameters which are then used for the final walk-forward validation run.
          The cross-validation strategy is the same as for the calculation of feature importances above.
        </p>
        <h4>10. Reports</h4>
        <p>
          The final model validation is done via purged walk-forward cross-validation. Any rows overlapping train & test sets are purged.
        </p>
        <p>
          Classification reports, F1 scores and confusion matrixes are generated.
        </p>
        <ProgressBar>
          <ProgressBar bsStyle="success" now={59} key={1} label={"Train set"} />
          <ProgressBar bsStyle="warning" now={1} key={2} />
          <ProgressBar bsStyle="danger" now={10} key={3} label={"Test set"} />
        </ProgressBar>
        <ProgressBar>
          <ProgressBar bsStyle="success" now={69} key={1} label={"Train set"} />
          <ProgressBar bsStyle="warning" now={1} key={2} />
          <ProgressBar bsStyle="danger" now={10} key={3} label={"Test set"} />
        </ProgressBar>
        <ProgressBar>
          <ProgressBar bsStyle="success" now={79} key={1} label={"Train set"} />
          <ProgressBar bsStyle="warning" now={1} key={2} />
          <ProgressBar bsStyle="danger" now={10} key={3} label={"Test set"} />
        </ProgressBar>
        <ProgressBar>
          <ProgressBar bsStyle="success" now={89} key={1} label={"Train set"} />
          <ProgressBar bsStyle="warning" now={1} key={2} />
          <ProgressBar bsStyle="danger" now={10} key={3} label={"Test set"} />
        </ProgressBar>
        <h4>11. Tearsheets</h4>
        <p>
          The average active signal is calculated and that series is then turned into a PnL graph with the trading logic / position sizing inspired by <a target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/pulse/implement-cta-less-than-10-lines-code-thomas-schmelzer/">Thomas Schmelzer's 10-line-CTA</a>.
          Performance stats, a drawndown table and a <code>pyfolio</code> returns tear-sheet are then generated (comparing results to a "long-all" Risk Parity like strategy).
        </p>
        <ProgressBar>
          <ProgressBar className="progress-bar-gray" now={60} key={1} label={""} />
          <ProgressBar bsStyle="danger" now={40} key={2} label={"PnL report on test set"} />
        </ProgressBar>

        <h3>Weaknesses</h3>
        <ul>
          <li>Large amounts of trials means a false discovery is likely</li>
          <li>Trading costs are estimated rather optimistically at $1 per contract + a slippage of 25% of the <code>mintick</code></li>
          <li>No roll cost simulation</li>
          <li>Differing base currencies are not taken into account</li>
          <li>Coarse 1-minute bars are used as a base</li>
          <li>Cross-validation is purged but not embargoed</li>
          <li>Likely bugs in code (code was tested in units by hand only)</li>
          <li>This being a learning project and the involved large amount of data accesses make a false discovery likely</li>
        </ul>


        <h3>Ideas for improvement</h3>

        <ul>
          <li>Automatically verify stationarity of features (only done so by hand)</li>
          <li>Dimensionality reduction (PCA, t-SNE)</li>
          <li><strong>Develop &amp; combine models:</strong>
            <ul>
              <li>Develop additional models for time periods where the first round of models perform poorly</li>
              <li>Develop additional models for different asset classes</li>
              <li>Develop additional models that only go long / only go short</li>
              <li>Develop additional models for different market regimes</li>
              <li>Develop additional models that target different labels (such as change in volatility, skewness / kurtosis of returns, serial correlation)</li>
              <li>Develop additional models with varying subsets of additional features</li>
              <li>Use clustering to find unique models and select a diverse subset</li>
              <li>Explore blending / stacking for all the above</li>
            </ul>
          </li>
          <li>Auto-ML libraries (such as <a target="_blank" rel="noopener noreferrer" href="https://github.com/EpistasisLab/tpot">tpot</a>)</li>
          <li>Alternative Hyperparameter Optimization strategies (such as <a target="_blank" rel="noopener noreferrer" href="https://ml.dask.org/modules/generated/dask_ml.model_selection.HyperbandSearchCV.html">Hyperband search</a>)</li>
          <li>Compute Feature Importance in a stacked, rather than parallelized manner</li>
          <li>Include non-micro-structural features (such as Entropy or <a target="_blank" rel="noopener noreferrer" href="https://mlfinlab.readthedocs.io/en/latest/implementations/structural_breaks.html">Structural Breaks</a>), in general the area of feature engineering has remained almost entirely unoptimized in an effort to get the general shape of the pipeline correct</li>
          <li><a target="_blank" rel="noopener noreferrer" href="https://medium.com/@samuel.monnier/cross-validation-tools-for-time-series-ffa1a5a09bf9">CPCV</a> on test set (Walk-Forward is chosen for simplicity' sake / to be reusable for the historical backtest)</li>
          <li>Re-calculate feature importances and hyper parameters during final test set evaluation as well</li>
          <li>Sample weighting (uniqueness weighting, sequential bootstrapping)</li>
          <li>Use tick data rather than sampling from 1-minute bars</li>
          <li>Add more data sources (such as VIX, options market data, fundamental data, shape of the yield curve, etc.)</li>
          <li>Try out different bar sampling methods (such as <a target="_blank" rel="noopener noreferrer" href="https://mlfinlab.readthedocs.io/en/latest/implementations/data_structures.html#information-driven-bars">Dollar Imbalance Bars</a>)</li>
          <li>Try different roll methods for the futures contracts (IQFeed default continuous contract data is used)</li>
          <li>Try further <code>d</code> values for Fractionally Differentiated Features (0.5 is used as a catch-all)</li>
          <li>Try <a target="_blank" rel="noopener noreferrer" href="https://medium.com/datadriveninvestor/improve-your-classification-models-using-mean-target-encoding-a3d573df31e8">Target/Mean Encoding</a> (i.e. a given feature is computed from a larger subset of the data rather than just the current instrument, say returns of the sector, or returns relative to the sector)</li>
          <li>Try different targets for CUSUM downsampling (currently a 100-day EWM of the return's standard deviation is used)</li>
          <li>Try a different bet sizing strategy (currently the average of active signals is used)</li>
          <li>Explore different strategies/composed instruments (calendar spreads, curve steepeners, options structures etc.)</li>
          <li>Explore <a target="_blank" rel="noopener noreferrer" href="https://dask-ml.readthedocs.io/en/latest/">dask-ml</a> and GPU-accelerated learning (e.g. <a target="_blank" rel="noopener noreferrer" href="https://github.com/rapidsai/cuml">cuML</a>, or GPU modes for XGBoost, LightGBM)</li>
          <li>Browse Kaggle ML competitions / academic literature for new techniques to try</li>
        </ul>

         <h3>Inspiration &amp; Thanks</h3>
        <ul>
          <li>Marcel Lopez de Prado for his work on <a target="_blank" rel="noopener noreferrer" href="https://www.amazon.com/Advances-Financial-Machine-Learning-Marcos/dp/1119482089">Advances in Financial Machine Learning</a>. Learning &amp; applying machine learning and the techniques in his book has consumed most my every working minute in the past 3 months. :)</li>
          <li>Thomas Schmelzer for his work on <a target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/pulse/implement-cta-less-than-10-lines-code-thomas-schmelzer/">10 line CTA</a>. His code opened my eyes to the fact that (rough) PnL simulations can be done in a lot less code than libraries like quantopian's <code>zipline</code> implied</li>
          <li>Hudson &amp; Thames for their work on <a target="_blank" rel="noopener noreferrer" href="https://github.com/hudson-and-thames/mlfinlab/">mlfinlab</a> which I used for their implementations of volume bar sampling &amp; a few micro-structural features</li>
          <li>Samuel Monnier for his work on <a target="_blank" rel="noopener noreferrer" href="https://github.com/sam31415/timeseriescv">timeseriescv</a> which I used for walk-forward testing</li>
          <li>
            Ernest Chan for his tip in one of his podcasts (I don't recall which one) that he's found it a lot better to a beefy workstation at home than trying to do computations in the cloud.
            When you're renting spot instances in the cloud you're always asking yourself "is it worth it?"... In the process of working on <code>fincl</code> I upgraded my 6-core Intel with the newly released 16-core AMD CPU.
            I love having this thick workhorse sitting under my desk and it motivates me to always have some computation running over night :)
        </li>
        </ul>

      </div>
    )
  }
}

export default Intro
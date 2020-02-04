# [fincl](https://dodafin.github.io/fincl/)

## Introduction

After reading [Advances in Financial Machine Learning](https://www.amazon.com/Advances-Financial-Machine-Learning-Marcos/dp/1119482089) by Marcos Lopez de Prado I was incredibly motivated to further explore machine learning applications in finance. I built `fincl` to encapsulate some of those learnings and buildings.

Automating the entire pipeline like I've done here is likely not the way an actual trading strategy would be implemented (unless attempting to build an automated ML platform like [H2O Driverless AI](https://www.h2o.ai/products/h2o-driverless-ai/)) but I chose the mantra of "build to learn" for the techniques described in and learn I did while combining the various disparate techniques described in the book.

I've also included a historical backtest and tearsheet for people not familiar with ML classification reports (despite the many problems with such an evaluation method).

The frontend and backend are fully capable of both **classical labeling** (a ML classifier generates a trading signal) and **meta-labeling** (a ML classifier filters a trading signal) and while both methods managed to produce similar prediction scores, inconsistent results in the walk-forward PnL simulation of meta-labeling combined with a self-imposed deadline have made me include only the classical labeling results herein for the time being.


## Installation
### Backend

I recommend installing via [anaconda](https://www.anaconda.com/), I used `anaconda 4.8.2` on Windows 10 to generate and test the enclosed `environment.yml`:

To create a Python 3.6 environment and install the required dependencies:
```
conda env create -n fincl -f backend/environment.yml
```

I used [nbdev](http://nbdev.fast.ai/) to develop the backend, which means code lives in `.ipynb` files certain cells are marked to be included in the final `.py` package. I.e. you develop your functions inside `jupyter notebook` and then use `nbdev_build_lib` to build your library.

### Frontend

I used [yarn](https://yarnpkg.com/) version `1.12.1` to manage & develop the frontend, installation and running the dev server should be as simple as

```
cd frontend/
yarn
yarn start
```

### Inspiration & Thanks

*   Marcel Lopez de Prado for his work on [Advances in Financial Machine Learning](https://www.amazon.com/Advances-Financial-Machine-Learning-Marcos/dp/1119482089). Learning & applying machine learning and the techniques in his book has consumed most my every working minute in the past 3 months. :)
*   Thomas Schmelzer for his work on [10 line CTA](https://www.linkedin.com/pulse/implement-cta-less-than-10-lines-code-thomas-schmelzer/). His code opened my eyes to the fact that (rough) PnL simulations can be done in a lot less code than libraries like quantopian's `zipline` implied
*   Hudson & Thames for their work on [mlfinlab](https://github.com/hudson-and-thames/mlfinlab/) which I used for their implementations of volume bar sampling & a few micro-structural features
*   Samuel Monnier for his work on [timeseriescv](https://github.com/sam31415/timeseriescv) which I used for walk-forward testing
*   Ernest Chan for his tip in one of his podcasts (I don't recall which one) that he's found it a lot better to a beefy workstation at home than trying to do computations in the cloud. When you're renting spot instances in the cloud you're always asking yourself "is it worth it?"... In the process of working on `fincl` I upgraded my 6-core Intel with the newly released 16-core AMD CPU. I love having this thick workhorse sitting under my desk and it motivates me to always have some computation running over night :)
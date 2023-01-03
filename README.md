# bitcoin-dashboard

* Front-end project used to display information from
[bitcoin-internals](https://github.com/alex-lt-kong/bitcoin-internals)

* It requires a hacky version of react-open-weather to work `git clone https://github.com/farahat80/react-open-weather.git ./src/`
    * Currently, we add the repository as a plain directory, so we remove its `.git`: `rm ./src/react-open-weather/.git -r`
    * Transpile the project into `./dashboard/src/react-open-weather/lib/ReactWeather.js`: `./node_modules/.bin/webpack --config webpack.config.build.js`
    * Copy the transpiled file to `./src/private/`: `cp ./lib/ReactWeather.js ../private/`
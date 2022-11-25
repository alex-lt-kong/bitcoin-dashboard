# dashboard

* It requires a hacky version of react-open-weather to work `git clone https://github.com/farahat80/react-open-weather.git ./src/`
    * Transpile the project into `./dashboard/src/react-open-weather/lib/ReactWeather.js`: `./node_modules/.bin/webpack --config webpack.config.build.js`
    * Copy the transpiled file to `./src/private/`: `cp ./react-open-weather/lib/ReactWeather.js ./private/`
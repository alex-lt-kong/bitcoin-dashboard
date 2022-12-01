import * as React from 'react';
import ReactDOM from 'react-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import axios from 'axios';
import moment from 'moment';
import JSONPretty from 'react-json-pretty';
import ReactWeather, { useOpenWeather } from './ReactWeather.js';

const WeatherPrimary = (props) => {
  const { data, isLoading, errorMessage } = useOpenWeather(props.weatherData);
  if (typeof data !== 'undefined' && data !== null) {
    data.current.date = moment().format("YYYY-MM-DD HH:mm:ss");
  }
  return (
      <ReactWeather
        isLoading={isLoading}
        errorMessage={errorMessage}
        data={data}
        lang="en"
        locationLabel={`${props.weatherData.locationLabel}`}
        tempSensorReading={props.tempSensorReading}
        unitsLabels={{ temperature: `°C` , windSpeed: 'Km/h' }}
        showForecast={true}
      />
  );
};


const WeatherSecondary = (props) => {
  const { data, isLoading, errorMessage } = useOpenWeather(props.weatherData);
  if (typeof data !== 'undefined' && data !== null) {
    data.current.date = moment().format("YYYY-MM-DD HH:mm:ss");
  }
  return (
      <ReactWeather
        isLoading={isLoading}
        errorMessage={errorMessage}
        data={data}
        lang="en"
        locationLabel={props.weatherData.locationLabel}
        unitsLabels={{ temperature: '°C', windSpeed: 'Km/h' }}
        showForecast={false}
      />
  );
};

class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tempSensorReading: 3276.7,
      weatherData: null,
      blockData: null
    }
  }

  getBlockData() {
    axios.get(`../getBlockData`)
    .then((response) => {
      this.setState({blockData: response.data});
      console.log(this.state.blockData);
    })
    .catch((error) => {
      console.log(error);
    });
  }

  getExtWeatherData() {
    axios.get(`../configWeatherData/`)
    .then((response) => {
      this.setState({weatherData: response.data});
    })
    .catch((error) => {
      console.log(error);
    });
  }

  getIntTempData() {
    axios.get(`../getTempSensorReading/`)
    .then((response) => {
      this.setState({tempSensorReading: response.data.data});
    })
    .catch((error) => {
      console.log(error);
    });
  }

  componentWillUnmount() {
    clearInterval(this.extWeatherPollInterval);
    clearInterval(this.intWeatherPollInterval);
    clearInterval(this.blockDataPollInterval);
  }

  componentDidMount() {

    this.getExtWeatherData();
    this.getIntTempData();
    this.getBlockData();

    this.extWeatherPollInterval = setInterval(
      () => {
        this.getExtWeatherData();
      },
      3600 * 1000
    );

    this.intWeatherPollInterval = setInterval(
      () => {
        this.getIntTempData();
      },
      10 * 1000
    );

    this.blockDataPollInterval = setInterval(
      () => {
        this.getBlockData();
      },
      60 * 1000
    );
  }

  render() {
    
    if (this.state === null) {
      return null;
    }
    if (this.state.weatherData === null || this.state.blockData === null) {
      console.warn("Nothing is render()'ed");
      return null;
    }
    // The theme follows Firefox's JSON style
    let jsonPrettyTheme = {
      main: 'line-height:1.3; color:#0675d3; background:#ffffff; overflow:auto;',
      error: 'line-height:1.3; color:#66d9ef; background:#272822; overflow:auto;',
      key: 'color:#0675d3;',
      string: 'color:#dd00a9;',
      value: 'color:#058b00;',
      boolean: 'color:#058b00;',
    };
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={2}>
          <Grid item md={6}>
            <div>
              <WeatherPrimary
                weatherData={this.state.weatherData.primary} tempSensorReading={this.state.tempSensorReading}
              /> 
              <WeatherSecondary weatherData={this.state.weatherData.secondary} />
            </div>
          </Grid>
          <Grid item md={6}>
            <JSONPretty id="json-pretty" data={this.state.blockData} theme={jsonPrettyTheme}></JSONPretty>
          </Grid>
        </Grid>
      </Box>
    );
  }
}

const container = document.getElementById('root');
ReactDOM.render(<Index />, container);

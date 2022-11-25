import * as React from 'react';
import ReactDOM from 'react-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import axios from 'axios';

import ReactWeather, { useOpenWeather } from './ReactWeather.js';

const WeatherPrimary = (props) => {
  const { data, isLoading, errorMessage } = useOpenWeather(props.weatherData);
  console.log(props);
  return (
      <ReactWeather
        isLoading={isLoading}
        errorMessage={errorMessage}
        data={data}
        lang="en"
        locationLabel={`${props.weatherData.locationLabel} (${props.tempSensorReading}°C)`}
        sensorReading={props.tempSensorReading}
        unitsLabels={{ temperature: `°C` , windSpeed: 'Km/h' }}
        showForecast={true}
      />
  );
};


const WeatherSecondary = (props) => {
  const { data, isLoading, errorMessage } = useOpenWeather(props.weatherData);
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
      weatherData: null
    }
  }

  componentDidMount() {
    axios.get(`../configWeatherData/`)
        .then((response) => {
          this.setState({weatherData: response.data});
        })
        .catch((error) => {
          console.log(error);
        });
    axios.get(`../getTempSensorReading/`)
        .then((response) => {
          this.setState({tempSensorReading: response.data.data});
        })
        .catch((error) => {
          console.log(error);
        });
  }
  render() {
    
    if (this.state === null) {
      return null;
    }
    if (this.state.weatherData === null) {
      return null;
    }

    console.log(this.state.weatherData);
    console.log(this.state.tempSensorReading);
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={2}>
          <Grid item md={5}>
            <div>
              <WeatherPrimary
                weatherData={this.state.weatherData.primary} tempSensorReading={this.state.tempSensorReading}
              /> 
              <WeatherSecondary weatherData={this.state.weatherData.secondary} />
            </div>
          </Grid>
          <Grid item md={7}>
            Empty
          </Grid>
        </Grid>
      </Box>
    );
  }
}

const container = document.getElementById('root');
ReactDOM.render(<Index />, container);

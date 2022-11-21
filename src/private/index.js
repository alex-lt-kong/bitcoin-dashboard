import * as React from 'react';
import ReactDOM from 'react-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import axios from 'axios';

import ReactWeather, { useOpenWeather } from 'react-open-weather';

const WeatherPrimary = (d) => {
  const { data, isLoading, errorMessage } = useOpenWeather(d.d);
  return (
      <ReactWeather
        isLoading={isLoading}
        errorMessage={errorMessage}
        data={data}
        lang="en"
        locationLabel={d.d.locationLabel}
        unitsLabels={{ temperature: '°C', windSpeed: 'Km/h' }}
        showForecast={true}
      />
  );
};


const WeatherSecondary = (d1) => {
  const { data, isLoading, errorMessage } = useOpenWeather(d1.d);
  return (
      <ReactWeather
        isLoading={isLoading}
        errorMessage={errorMessage}
        data={data}
        lang="en"
        locationLabel={d1.d.locationLabel}
        unitsLabels={{ temperature: '°C', windSpeed: 'Km/h' }}
        showForecast={false}
      />
  );
};

class Index extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    axios.get(`../configWeatherData/`)
        .then((response) => {
          this.setState({weatherData: response.data});
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
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={2}>
          <Grid item md={4}>
            <div>
              <WeatherPrimary d={this.state.weatherData.primary} /> 
              <WeatherSecondary d={this.state.weatherData.secondary} />
            </div>
          </Grid>
          <Grid item md={8}>
            Empty
          </Grid>
        </Grid>
      </Box>
    );
  }
}

const container = document.getElementById('root');
ReactDOM.render(<Index />, container);

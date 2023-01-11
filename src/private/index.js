import * as React from 'react';
import ReactDOM from 'react-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import axios from 'axios';
import moment from 'moment';
import JSONPretty from 'react-json-pretty';
import ReactWeather, { useOpenWeather } from './ReactWeather.js';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import ProgressBar from 'react-bootstrap/ProgressBar';


const Weather = (props) => {
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

class Index extends React.Component {

  onKafkaMessageReceived(msg) {
    console.log(msg);
    let ctData = this.state.continuousTestingData;
    for (let i = 0; i < ctData.length; ++i) {
      if (ctData[i].host === msg.host) {
        if (typeof ctData[i].since_unix_ts !== 'undefined' && ctData[i].block_height < msg.block_height) {
          msg.since_unix_ts = ctData[i].since_unix_ts;
          msg.since_block_height = ctData[i].since_block_height;
        }
        ctData.splice(i, 1);
      }
    }
    if (typeof msg.since_unix_ts === 'undefined') {
      msg.since_unix_ts = msg.unix_ts;
      msg.since_block_height = msg.block_height;
    }
    ctData.push(msg);
    this.setState({continuousTestingData: ctData});
  }

  constructor(props) {
    super(props);
    this.state = {
      tempSensorReading: 3276.7,
      weatherData: null,
      blockData: null,
      progressData: null,
      continuousTestingData: []
    };
    const createConnection = () => {
      const wss_url = `wss://${window.location.hostname}:8080`;
      console.log("WebSocket client starting...");
      var ws = new WebSocket(wss_url);
      console.log("WebSocket client started");
      ws.onmessage = (event) => {
        this.onKafkaMessageReceived(JSON.parse(event.data));
      };
      ws.onerror = (event) => {
        console.error(event);
      };
      
      ws.onclose = () =>{
        // connection closed, discard old websocket and create a new one in 5s
        ws = null
        const timeout_ms = 30 * 1000;
        console.warn(
          `WebSocket client disconnected from server, ` +
          `will retry after ${timeout_ms}ms...`
        );
        setTimeout(createConnection, timeout_ms);
        // will this cause stack overflow if onclose() is called multiple times?
        // seems the answer is no as setTimeout() is not the same as 
        // recursive function call...
      }
    }

    createConnection();
  }

  getTestProgressData() {
    axios.get(`../getTestProgress/`)
    .then((response) => {
      this.setState({progressData: response.data.progress});
    })
    .catch((error) => {
      console.log(error);
    });
  }

  getTestProgressBar() {
    return (
      <ProgressBar>
        {this.state.progressData.map((row) => (
          <ProgressBar variant={row.flag == 1 ? 'primary': 'light'} now={row.value} />
        ))}
      </ProgressBar>
    );
  }

  getContinuousTestingStatusTable() {
    const StyledTableCell = styled(TableCell)(({ theme }) => ({
      [`&.${tableCellClasses.head}`]: {
        backgroundColor: `rgb(1, 129, 194)`,
        color: theme.palette.common.white,
        fontSize: '1.4rem',
        fontWeight:' bold'
      },
      [`&.${tableCellClasses.body}`]: {
        fontSize: '1.4rem',
      },
    }));

    const StyledTableRow = styled(TableRow)(({ theme }) => ({
      '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
      },
      // hide last border
      '&:last-child td, &:last-child th': {
        border: 0,
      },
    }));

    return (
      <TableContainer component={Paper} style={{fontSize: '2rem'}}>
        <Table sx={{ minWidth: 460 }}>
          <TableHead>
          <TableRow>
            <StyledTableCell>Hostname</StyledTableCell>
            <StyledTableCell align="right">Updated at</StyledTableCell>
            <StyledTableCell align="right">Block Height</StyledTableCell>
            <StyledTableCell align="right">Tx Count</StyledTableCell>
            <StyledTableCell align="right">Avg Time<br/>per Block</StyledTableCell>
            <StyledTableCell align="right">Status</StyledTableCell>
          </TableRow>
          </TableHead>
          <TableBody>
          {this.state.continuousTestingData.map((row) => (
            <StyledTableRow
            key={row.host}
            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <StyledTableCell component="th" scope="row">
                {row.host}
              </StyledTableCell>
              <StyledTableCell align="right">
                {moment.unix(row.unix_ts).format("YYYY-MM-DD")}<br/>
                {moment.unix(row.unix_ts).format("HH:mm")}
              </StyledTableCell>
              <StyledTableCell align="right">
                {row.block_height.toLocaleString('en-US')}<br/>
                ({moment.unix(row.block_ts).format('YYYY-MM-DD')})
              </StyledTableCell>
              <StyledTableCell align="right">
                {typeof row.tx_count === 'undefined' ? -1 : row.tx_count.toLocaleString('en-US')}
              </StyledTableCell>
              <StyledTableCell align="right">
                {
                  (row.block_height - row.since_block_height) > 0 ?
                  Math.round((row.unix_ts - row.since_unix_ts) / (row.block_height - row.since_block_height)):
                  'NaN'
                } sec
              </StyledTableCell>
              <StyledTableCell
                align="right" style={{ 
                  color: (row.status == 'okay' ? "green" : "red"),
                  fontWeight: "bold"
                }}
              >
                {row.status == 'okay' ? 'okay' : 'ERROR!'}
              </StyledTableCell>
            </StyledTableRow>
          ))}
          </TableBody>
        </Table>
    </TableContainer>
    );
  }

  getBlockData() {
    axios.get(`../getBlockData`)
    .then((response) => {
      this.setState({blockData: response.data});
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
    this.getTestProgressData();

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
    if (this.state.weatherData === null || this.state.blockData === null || this.state.progressData === null) {
      console.warn("Nothing is render()'ed as some data are not ready");
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
      <>
        {this.getContinuousTestingStatusTable()}
        {this.getTestProgressBar()}
        <img style={{width: '100%'}}src="../img/chart.png"/>
        <JSONPretty id="json-pretty-blockdata" data={this.state.blockData} theme={jsonPrettyTheme}></JSONPretty>
        <Box sx={{ flexGrow: 1, width: '99%', position: 'fixed', bottom: 0}}>
          <Grid container spacing={2}>
            <Grid item md={6}>
              <Weather
                weatherData={this.state.weatherData.primary} tempSensorReading={this.state.tempSensorReading}
              />
            </Grid>
            <Grid item md={6}>
              <Weather weatherData={this.state.weatherData.secondary} />
            </Grid>
          </Grid>
        </Box>
      </>
    );
  }
}

const container = document.getElementById('root');
ReactDOM.render(<Index />, container);

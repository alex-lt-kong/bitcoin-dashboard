
const express = require('express');
const execSync = require('child_process').execSync;
const https = require('https');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const app = express()
const configs = require('./config.js').configs;
const temp_sensor = require('../libiotctrl/src/bindings/node/temp_sensor.node');
const moment = require('moment');


https.createServer({
    key: fs.readFileSync(configs.ssl.key),
    cert: fs.readFileSync(configs.ssl.crt)
  },
  app)
.listen(configs.port, function() {
  console.log(
    `dashboard.js listening on https://0.0.0.0:${configs.port}!`
  );
});

app.use('/', express.static(path.join(__dirname, 'public/')));

app.use('/configWeatherData/', (req, res) => {
  res.json(configs.weatherData);
});

app.use('/getTempSensorReading/', (req, res) => {
  let result = temp_sensor.get_temperature(configs.tempSensorPath, 0);
  // let result = execSync(`${__dirname}/usb-iot-device-control/temp-sensor.out ${configs.tempSensorPath} 0`).toString();
  if (result == 32767) {
  //  result = Math.random() * 1000;
  }
  res.json({data: parseInt(result)/10.0});
});

app.use('/getBlockData', async (req, res) => {
  let payload = {};
  try {
    // console.log("axios.get()'ing latestblock...");
    let response = await axios.get('https://blockchain.info/latestblock');
    // console.log("axios.get()'ing block by height...");
    response = await axios.get(`https://blockchain.info/block-height/${response.data.height}`);
    const block = response.data.blocks[0];
    // console.log(block);
    
    payload['hash'] = block['hash'];
    payload['mrkl_root'] = block['mrkl_root'];
    payload['height'] = block['height'];
    payload['n_tx'] = block['n_tx'];
    payload['time'] = moment.unix(block['time']).format();
    payload['tx'] = [];
    for (let i = 0; i < (block['n_tx'] > 3 ? 3 : block['n_tx']); ++i) {
      payload['tx'].push({});
      payload['tx'][i]['vin_sz'] = block['tx'][i]['vin_sz'];
      payload['tx'][i]['inputs'] = [];
      for (let j = 0; j < block['tx'][i]['vin_sz']; ++j) {
        payload['tx'][i]['inputs'].push({});
        payload['tx'][i]['inputs'][j]['sequence'] = block['tx'][i]['inputs'][j]['sequence'];
        payload['tx'][i]['inputs'][j]['prev_out'] = block['tx'][i]['inputs'][j]['prev_out'];
      }   

      payload['tx'][i]['vout_sz'] = block['tx'][i]['vout_sz'];
      payload['tx'][i]['out'] = [];
      for (let j = 0; j < block['tx'][i]['vout_sz']; ++j) {
        payload['tx'][i]['out'].push({});
        payload['tx'][i]['out'][j]['value'] = block['tx'][i]['out'][j]['value'];
        payload['tx'][i]['out'][j]['script'] = block['tx'][i]['out'][j]['script'];
      }    
    }
  } catch (error) {
    payload = {'error': error}
  }
  
  res.json(payload);
});

app.use('/', (req, res) => {
  return res.redirect('/html/index.html');
});

app.get('*', function(req, res) {
  res.status(404).send('This is a naive 404 page--the URL you try to access does not exist!');
});

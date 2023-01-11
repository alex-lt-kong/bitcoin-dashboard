
const CryptoJS = require("crypto-js");
const https = require('https');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const configs = require('./config.js').configs;
const temp_sensor = require('../libiotctrl/src/bindings/node/temp_sensor.node');
const moment = require('moment');
const databasePath = path.join(__dirname, 'block-stat.sqlite');
const os = require("os");
const enc_key = CryptoJS.enc.Utf8.parse(configs.kafka.enc_key);

async function initKafkaAndWebSocket() {
  const { Kafka } = require('kafkajs');
  const kafka = new Kafka(configs.kafka.KafkaConfig);
  const consumer = kafka.consumer({ groupId: os.hostname() })

  await consumer.connect();
  await consumer.subscribe({
    topic: configs.kafka.topic, fromBeginning: false
  });

  const WebSocket = require('ws');
  const wss = new WebSocket.Server({server: https.createServer({
    key: fs.readFileSync(configs.ssl.key),
    cert: fs.readFileSync(configs.ssl.crt)
  }).listen(8080)});
  
  wss.on('connection', (ws) => {
    console.log(
      `A new client connected, current connections: ${wss.clients.size}`
    );
  });

  consumer.run({
    eachMessage: async ({ topic, partition, message }) => {      
      var decrypted =  CryptoJS.AES.decrypt(message.value.toString('base64'), enc_key, {mode:CryptoJS.mode.ECB});
      let decrypted_msg = (decrypted.toString(CryptoJS.enc.Utf8));

      wss.clients.forEach(function each(ws) {
        ws.send(decrypted_msg);
      });
      const msgJson = JSON.parse(decrypted_msg);
      const db = require('better-sqlite3')(databasePath);
      db.pragma('journal_mode = WAL');
      let stmt = db.prepare('SELECT * FROM block_test_result WHERE block_height = @block_height');
      rows = stmt.all({'block_height': msgJson.block_height});
      if (rows.length == 0) {
        stmt = db.prepare(`
          INSERT INTO block_test_result (script_test_unix_ts, test_host, block_height, tx_count)
          VALUES (@script_test_unix_ts, @test_host, @block_height, @tx_count)
        `);
      } else {
        stmt = db.prepare(`
          UPDATE block_test_result
          SET script_test_unix_ts=@script_test_unix_ts, test_host=@test_host, tx_count=@tx_count
          WHERE block_height=@block_height
        `);
        
      }
      stmt.run({
        'script_test_unix_ts': Math.floor(+new Date() / 1000),
        'test_host': msgJson.host,
        'tx_count': msgJson.tx_count,
        'block_height': msgJson.block_height
      });
      db.close();
      
    },
  });
}

function initHTTPServer() {
  const express = require('express');
  const app = express()
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
    if (typeof configs.tempSensorPath === 'undefined' || configs.tempSensorPath === '') {
      res.json({data: 32767/10.0});
    } else {
      let result = temp_sensor.get_temperature(configs.tempSensorPath, 0);
      res.json({data: parseInt(result)/10.0});
    }
  });

  app.use('/getBlockData', async (req, res) => {
    let payload = {};
    try {
      // console.log("axios.get()'ing latestblock...");
      let response = await axios.get(
        'https://blockchain.info/latestblock'
      );
      // console.log("axios.get()'ing block by height...");
      response = await axios.get(
        `https://blockchain.info/block-height/${response.data.height}`
      );
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
  app.use('/getTestProgress', async (req, res) => {
    let response = await axios.get(
      'https://blockchain.info/latestblock'
    );
    const latestBlockHeight = response.data.height;
    const oneHundredthBlockCount = Math.floor(latestBlockHeight / 100);
    let progressFlag = Array(100);
    const db = require('better-sqlite3')(databasePath, { readonly: true });
    let stmt = db.prepare(`
      SELECT COUNT(*) FROM block_test_result
      WHERE block_height >= @block_height_min AND block_height < @block_height_max
    `);      
    for (let i = 0; i < 100; ++i) {
      rows = stmt.all({
        'block_height_min': oneHundredthBlockCount * i,
        'block_height_max': oneHundredthBlockCount * (i+1),
      });
      console.log(i, rows[0]['COUNT(*)'] / oneHundredthBlockCount);
      progressFlag[i] = Math.round(rows[0]['COUNT(*)'] / oneHundredthBlockCount);
    }

    db.close();
    console.log(progressFlag);
    let payload = Array(1);
    let sectionCount = 0;

    payload[sectionCount] = {
      flag: progressFlag[0],
      value: 1
    };
    for (let i = 1; i < 100; ++i) {
      if (progressFlag[i] == progressFlag[i - 1]) {
        payload[sectionCount].value += 1;
      } else {
        sectionCount += 1;
        payload.push({
          flag: progressFlag[i],
          value: 1
        });
      }
    }
    res.json({'progress': payload});

  });

  app.use('/', (req, res) => {
    return res.redirect('/html/index.html');
  });

  app.get('*', function(req, res) {
    res.status(404).send(
      'This is a naive 404 page--the URL does not exist!'
    );
  });
}


initKafkaAndWebSocket();
initHTTPServer();


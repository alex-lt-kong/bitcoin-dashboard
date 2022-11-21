
const express = require('express');
const https = require('https');
const fs = require('fs');
const app = express()
const configs = require('./config.js').configs;
const path = require('path');

https.createServer(
  {
    key: fs.readFileSync(configs.ssl.key),
    cert: fs.readFileSync(configs.ssl.crt)
  },
  app
).listen(configs.port, function() {
console.log(
    `dashboard.js listening on https://0.0.0.0:${configs.port}!`
);
});

app.use('/', express.static(path.join(__dirname, 'public/')));

app.use('/configWeatherData/', (req, res) => {
  res.json(configs.weatherData);
});

app.use('/', (req, res) => {
  return res.redirect('/html/index.html');
});

app.get('*', function(req, res) {
  res.status(404).send('This is a naive 404 page--the URL you try to access does not exist!');
});

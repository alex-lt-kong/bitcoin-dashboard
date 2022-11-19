
const express = require('express')
const app = express()
const port = 81

app.get('/', (req, res) => {
  console.log(JSON.stringify(req.headers));
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

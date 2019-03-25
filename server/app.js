const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const allRoutes = require("./routes/allRoutes");
const cron = require('node-cron');

const app = express();
const port = 3000;

const Scrapper = require("./scrapper/scrapper");

// activate scrapper every day at 10:00
//cron.schedule('00 10 * * *', function () {
  console.log('running a task at 10:00');
  const scrapper = new Scrapper();
//});


// Add CORS headers
app.use(cors());

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static(path.join(__dirname, '../dist')));


//Router Middleware
app.use(allRoutes);

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
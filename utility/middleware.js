const express = require('express');
const helmet = require('helmet')
const bodyParser = require('body-parser');
const compression = require('compression')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const path = require('path');

const corsOption = require('../utility/corsOption')

module.exports = [
  cors(corsOption),
  helmet(),
  compression(),
  cookieParser(),
  bodyParser.json({limit: "50mb"}),
  bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000})  
]

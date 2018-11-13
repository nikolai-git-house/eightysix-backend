const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const config = require('../config');
const log = require('./helpers/logger');
const bodyParser = require('body-parser');
const {ApiError} = require('./helpers/server-error');
const API = require('./controllers/index');

const PORT = config.api.port;

const app = express();

app.use(cors({origin: config.app.url,
  credentials: true,
  allowedHeaders: [
    'Content-Type',
    'Authorization'
  ]}));
app.use(helmet());
app.use(morgan('dev', {stream: log.stream}));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({extended: true, limit: '50mb'}));

API.init(app);

app.use(ApiError.ApiErrorMiddleware);
app.use(ApiError.LastErrorMiddleware);
app.use(ApiError.NotFoundMiddleware);

function startServer() {
  app.listen(PORT, () => log.info(`Server listening on port ${PORT}`));
}

module.exports = {
  startServer,
  app
};

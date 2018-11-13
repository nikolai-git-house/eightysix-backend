const fs = require('fs');
const path = require('path');

const PREFIX = '/api';

module.exports = {
  init(app) {
    fs.readdirSync(__dirname)
      .filter(file => file.indexOf('.') !== 0 && file !== 'index.js')
      .forEach(file => app.use(PREFIX, require(path.join(__dirname, file))));
  }
};


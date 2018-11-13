const Sequelize = require('sequelize');
const Umzug = require('umzug');
const {readdirSync} = require('fs');
const path = require('path');
const _ = require('lodash');
const config = require('../../config');
const log = require('../helpers/logger');
const Knex = require('knex');

const sequelize = new Sequelize({
  ...config.db,
  dialect: 'postgres',
  dialectOptions: {
    ssl: config.db.sslEnabled
  },
  seederStorage: 'sequelize',
  migrationStorage: 'sequelize',
  operatorsAliases: false,
  logging: _.ary(log.verbose, 1),
  define: {
    timestamps: false
  }
});

const umzug = new Umzug({
  storage: 'sequelize',
  storageOptions: {sequelize},
  migrations: {
    params: [sequelize.getQueryInterface(), Sequelize],
    path: path.join(__dirname, '../../db/migrations')
  }
});

const db = {};

// Transform models' fields to snake_case
sequelize.addHook('beforeDefine', attributes => {
  Object.keys(attributes).forEach(key => {
    let field = _.snakeCase(key);
    if (typeof attributes[key] === 'function' || typeof attributes[key] === 'string') {
      attributes[key] = {type: attributes[key], field};
    } else {
      attributes[key].field = field;
    }
  });
});

readdirSync(__dirname)
  .filter(fileName => fileName.indexOf('.') !== 0 && fileName !== 'index.js')
  .forEach(fileName => {
    let filePath = path.join(__dirname, fileName);
    let model = sequelize.import(filePath);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

sequelize.knex = Knex({client: 'pg'});
db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.migrateUp = () => umzug.up();
db.migrateDown = () => umzug.down();

module.exports = db;

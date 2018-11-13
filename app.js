const app = require('./app/express');
const config = require('./config');
const log = require('./app/helpers/logger');
const db = require('./app/models');

async function main() {
  log.info(`Starting app in ${config.env} env`);

  log.info('Running pending migrations');
  let appliedMigrations = await db.migrateUp();
  if (appliedMigrations.length) {
    log.info('Applied migrations:', appliedMigrations.map(m => m.file).join(', '));
  }

  app.startServer();
}

main();

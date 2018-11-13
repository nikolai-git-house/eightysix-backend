module.exports = {
  up(queryInterface) {
    return queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize
        .query('CREATE EXTENSION IF NOT EXISTS pg_trgm;', {transaction});
      await queryInterface.sequelize
        .query('CREATE INDEX idx_trgm_customer_title ON customers USING GIN (title gin_trgm_ops);', {transaction});
      await queryInterface.sequelize
        .query('CREATE INDEX idx_trgm_customer_code ON customers USING GIN (code gin_trgm_ops);', {transaction});
    });
  },

  down(queryInterface) {
    return queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query('DROP INDEX idx_trgm_customer_title;', {transaction});
      await queryInterface.sequelize.query('DROP INDEX idx_trgm_customer_code;', {transaction});
      await queryInterface.sequelize.query('DROP EXTENSION pg_trgm;', {transaction});
    });
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('suppliers', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      title: Sequelize.STRING,
      code: Sequelize.STRING
    });
    return queryInterface.addIndex('suppliers', ['code']);
  },
  down(queryInterface) {
    return queryInterface.dropTable('suppliers');
  }
};

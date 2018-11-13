module.exports = {
  up(queryInterface, Sequelize) {
    return queryInterface.createTable('applications', {
      id: {
        type: Sequelize.INTEGER,
        unique: true,
        autoIncrement: true,
        allowNull: false
      },
      email: Sequelize.STRING,
      name: Sequelize.STRING,
      message: Sequelize.TEXT,
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down(queryInterface) {
    return queryInterface.dropTable('applications');
  }
};

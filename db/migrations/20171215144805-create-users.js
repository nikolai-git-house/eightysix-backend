module.exports = {
  up(queryInterface, Sequelize) {
    return queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        unique: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      phone: Sequelize.STRING,
      cognito_username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      }
    });
  },

  down(queryInterface) {
    return queryInterface.dropTable('users');
  }
};

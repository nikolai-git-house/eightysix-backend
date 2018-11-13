module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface
      .createTable('customer_users', {
        id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true
        },
        customer_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'customers',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        }
      });
    await queryInterface.addIndex('customer_users', ['customer_id']);
    return queryInterface.addIndex('customer_users', ['user_id']);
  },
  down(queryInterface) {
    return queryInterface.dropTable('customer_users');
  }
};

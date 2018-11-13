module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('supplier_users', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      supplier_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'suppliers',
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
    await queryInterface.addIndex('supplier_users', ['supplier_id']);
    return queryInterface.addIndex('supplier_users', ['user_id']);
  },
  down(queryInterface) {
    return queryInterface.dropTable('supplier_users');
  }
};

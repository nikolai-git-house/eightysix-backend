module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      cost: Sequelize.NUMERIC(10, 2),
      delivered: {
        type: Sequelize.DATE,
        allowNull: false
      },
      price: Sequelize.NUMERIC(10, 2),
      quantity: Sequelize.FLOAT,
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
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      modified: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(0)')
      }
    });
    await queryInterface.addIndex('transactions', ['customer_id']);
    await queryInterface.addIndex('transactions', ['product_id']);
    return queryInterface.addIndex(
      'transactions',
      {
        fields: ['customer_id', 'product_id', 'delivered'],
        unique: true
      },
    );
  },
  down(queryInterface) {
    return queryInterface.dropTable('transactions');
  }
};

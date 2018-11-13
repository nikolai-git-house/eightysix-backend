module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('customer_products', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      last_delivered: Sequelize.DATE,
      margin: Sequelize.FLOAT,
      period: Sequelize.INTEGER,
      outlier: Sequelize.INTEGER,
      month_value: Sequelize.NUMERIC(10, 2),
      price: Sequelize.NUMERIC(10, 2),
      growth: Sequelize.FLOAT,
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
    await queryInterface.addIndex('customer_products', ['customer_id']);
    await queryInterface.addIndex('customer_products', ['product_id']);
    return queryInterface.addIndex(
      'customer_products',
      {
        fields: ['customer_id', 'product_id'],
        unique: true
      },
    );
  },
  down(queryInterface) {
    return queryInterface.dropTable('customer_products');
  }
};

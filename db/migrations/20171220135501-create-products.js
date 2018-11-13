module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false
      },
      list_price: Sequelize.NUMERIC(10, 2),
      title: Sequelize.STRING,
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
      modified: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(0)')
      }
    });
    await queryInterface.addIndex('products', ['supplier_id']);
    return queryInterface.addIndex(
      'products',
      {
        fields: ['supplier_id', 'code'],
        unique: true
      },
    );
  },
  down(queryInterface) {
    return queryInterface.dropTable('products');
  }
};

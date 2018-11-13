module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('customers', {
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
      title: Sequelize.STRING,
      address: Sequelize.STRING,
      last_delivered: Sequelize.DATE,
      month_value: Sequelize.NUMERIC(10, 2),
      threatened_value: Sequelize.NUMERIC(10, 2),
      growth: Sequelize.FLOAT,
      currency: {
        type: Sequelize.STRING,
        allowNull: false
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
      modified: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(0)')
      }
    });
    await queryInterface.addIndex('customers', ['supplier_id']);
    return queryInterface.addIndex(
      'customers',
      {
        fields: ['supplier_id', 'code'],
        unique: true
      }
    );
  },
  down(queryInterface) {
    return queryInterface.dropTable('customers');
  }
};

module.exports = (sequelize, DataTypes) => {
  const Note = sequelize.define('Note', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    note: DataTypes.STRING,
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'notes'
  });

  Note.associate = ({User, Customer}) => {
    Note.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user',
      targetKey: 'id'
    });
    Note.belongsTo(Customer, {
      foreignKey: 'customerId',
      as: 'customer',
      targetKey: 'id'
    });
    Note.addScope('defaultScope', {
      attributes: ['id', 'note', 'timestamp']
    }, {override: true});
  };

  return Note;
};

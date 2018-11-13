module.exports = (sequelize, DataTypes) => {
  const Application = sequelize.define('Application', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      defaultValue: '',
      validate: {
        notEmpty: {msg: 'Please, fill your email'}
      }
    },
    name: {
      type: DataTypes.STRING,
      defaultValue: '',
      validate: {
        notEmpty: {msg: 'Please, fill your name'}
      }
    },
    message: {
      type: DataTypes.TEXT,
      defaultValue: '',
      validate: {
        notEmpty: {msg: 'Please, fill message'}
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'applications'
  });

  return Application;
};

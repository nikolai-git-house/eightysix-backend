module.exports = (sequelize, DataTypes) => {
  const DownloadKey = sequelize.define('DownloadKey', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    file: {
      type: DataTypes.STRING,
      allowNull: false
    },
    is_deletable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'download_keys'
  });

  DownloadKey.associate = ({User}) => {
    DownloadKey.belongsTo(User, {
      foreignKey: 'userId',
      targetKey: 'id'
    });
  };


  return DownloadKey;
};

module.exports = (sequelize, DataTypes) => {
  const ORDER_FIELDS_ADMIN = ['code', 'title', 'password'];
  const Supplier = sequelize.define('Supplier', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    title: DataTypes.STRING,
    code: DataTypes.STRING
  }, {
    tableName: 'suppliers'
  });

  Supplier.associate = ({Product, Customer}) => {
    Supplier.hasMany(Product, {
      foreignKey: 'supplierId',
      targetKey: 'id'
    });
    Supplier.hasMany(Customer, {
      foreignKey: 'supplierId',
      targetKey: 'id'
    });
  };

  Supplier.listForAdmin = async params => {
    let {searchTitle, searchCode, orderField, orderType} = params;
    orderField = ORDER_FIELDS_ADMIN.indexOf(orderField) !== -1 ? orderField : null;

    let query = sequelize.knex.select()
      .from('suppliers');

    if (searchTitle) {
      query.where(q => q.whereRaw('"title" % ?', searchTitle).orWhere('title', 'ILIKE', `%${searchTitle}%`));
    }

    if (searchCode) {
      query.where('code', 'ILIKE', searchCode);
    }

    if (orderField) {
      orderType = String(orderType).toLowerCase() === 'desc' ? 'desc' : 'asc';
      query.orderBy(orderField, orderType);
    }

    let sql = query.toString();

    return sequelize.query(sql, {type: sequelize.QueryTypes.SELECT});
  };

  return Supplier;
};

module.exports = (sequelize, DataTypes) => {
  const ORDER_FIELDS_ADMIN = ['code', 'title', 'list_price', 'supplierCode', 'supplierTitle'];

  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false
    },
    listPrice: {
      type: DataTypes.NUMERIC(10, 2)
    },
    title: DataTypes.STRING,
    supplierId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'products'
  });

  Product.associate = ({Supplier}) => {
    Product.belongsTo(Supplier, {
      foreignKey: 'supplierId',
      targetKey: 'id'
    });
  };

  Product.listForAdmin = async params => {
    let {searchTitle, searchCode, searchSupplierCode, searchSupplierTitle, orderField, orderType} = params;
    orderField = ORDER_FIELDS_ADMIN.indexOf(orderField) !== -1 ? orderField : null;

    let query = sequelize.knex.select([
      'p.*',
      's.code as supplierCode',
      's.title as supplierTitle'
    ])
      .from('products as p')
      .join('suppliers as s', 'p.supplier_id', 's.id');

    if (searchTitle) {
      query.where(q => q.whereRaw('p."title" % ?', searchTitle).orWhere('p.title', 'ILIKE', `%${searchTitle}%`));
    }

    if (searchCode) {
      query.where('p.code', 'ILIKE', searchCode);
    }

    if (searchSupplierTitle) {
      query.where(q => q.whereRaw('s."title" % ?', searchSupplierTitle).orWhere('s.title', 'ILIKE', `%${searchSupplierTitle}%`));
    }

    if (searchSupplierCode) {
      query.where('s.code', 'ILIKE', searchSupplierCode);
    }

    if (orderField) {
      orderType = String(orderType).toLowerCase() === 'desc' ? 'desc' : 'asc';
      query.orderBy(orderField, orderType);
    }

    let sql = query.toString();

    return sequelize.query(sql, {type: sequelize.QueryTypes.SELECT});
  };

  return Product;
};

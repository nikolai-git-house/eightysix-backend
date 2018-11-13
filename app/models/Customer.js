module.exports = (sequelize, DataTypes) => {
  const ORDER_FIELDS = ['code', 'title', 'currency', 'month_value', 'threatened_value', 'growth', 'u_id'];
  const ORDER_FIELDS_ADMIN = ['code', 'title', 'currency', 'month_value', 'threatened_value', 'growth', 'supplierCode', 'supplierTitle'];

  const Customer = sequelize.define('Customer', {
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
    currency: DataTypes.STRING,
    address: DataTypes.STRING,
    lastDelivered: DataTypes.DATE,
    title: DataTypes.STRING,
    monthValue: DataTypes.DOUBLE,
    growth: DataTypes.DOUBLE,
    threatenedValue: DataTypes.DOUBLE,
    supplierId: DataTypes.INTEGER
  }, {
    tableName: 'customers'
  });


  Customer.associate = ({Supplier}) => {
    Customer.belongsTo(Supplier, {
      foreignKey: 'supplierId',
      targetKey: 'id'
    });
  };

  Customer.listForSupplier = async (userId, params) => {
    let {searchTitle, searchCode, offset, limit, sortBy, descending} = params;
    offset = Math.abs(Number(offset) || 0);
    limit = Math.abs(Number(limit) || 50);
    sortBy = ORDER_FIELDS.indexOf(sortBy) !== -1 ? sortBy : null;

    let query = sequelize.knex.select([
      'c.*', 'cu.user_id as u_id'
    ])
      .from('customers as c')
      .join('supplier_users as su', 'c.supplier_id', 'su.supplier_id')
      .leftOuterJoin('customer_users as cu', 'c.id', 'cu.customer_id')
      .where('su.user_id', userId);

    if (searchTitle) {
      query.where(q => q.whereRaw('"title" % ?', searchTitle).orWhere('title', 'ILIKE', `%${searchTitle}%`));
    }

    if (searchCode) {
      query.where('code', 'ILIKE', searchCode);
    }

    if (sortBy) {
      query.orderBy(sortBy, JSON.parse(descending) === true ? 'desc' : 'asc');
    }

    let sql = query.limit(limit).offset(offset).toString();

    return sequelize.query(sql, {type: sequelize.QueryTypes.SELECT});
  };

  Customer.countForSupplier = async (userId, params) => {
    let {searchTitle, searchCode} = params;

    let query = sequelize.knex.count()
      .from('customers as c')
      .join('supplier_users as su', 'c.supplier_id', 'su.supplier_id')
      .where('su.user_id', userId);

    if (searchTitle) {
      query.where(q => q.whereRaw('"title" % ?', searchTitle).orWhere('title', 'ILIKE', `%${searchTitle}%`));
    }

    if (searchCode) {
      query.where('code', 'ILIKE', searchCode);
    }

    let [{count}] = await sequelize.query(query.toString(), {type: sequelize.QueryTypes.SELECT});

    return +count;
  };

  Customer.updateProjections = async customerId => {
    sequelize.query(
      [
        'UPDATE customers',
        'SET',
        '"month_value" = "src"."month_value",',
        '"modified" = NOW()',
        'FROM (',
        'SELECT',
        'COALESCE(SUM("month_value"), 0) AS month_value',
        'FROM "customer_products"',
        'WHERE "active" = true',
        'AND "customer_id" = :customerId',
        ') src',
        'WHERE "id" = :customerId'].join(' '),
      {replacements: {customerId}, type: sequelize.QueryTypes.UPDATE}
    ).then(sequelize.query(
      [
        'UPDATE "customers"',
        'SET',
        '"threatened_value" = "src"."threatened_value",',
        '"modified" = NOW()',
        'FROM (',
        'SELECT',
        'COALESCE(SUM("month_value"), 0) AS threatened_value',
        'FROM (',
        'SELECT',
        '"month_value"',
        'FROM "customer_products"',
        'WHERE (NOW()::DATE - "last_delivered"::DATE) > "outlier"',
        'AND "active" = true',
        'AND "customer_id" = :customerId',
        ') AS threat',
        ') AS src',
        'WHERE "id" = :customerId'].join(' '),
      {replacements: {customerId}, type: sequelize.QueryTypes.UPDATE}
    ));
  };

  Customer.getByIdForSupplier = async (supplierUserId, customerId) => {
    let query = sequelize.knex.select(['c.*'])
      .from('customers as c')
      .join('customer_users', 'c.id', 'customer_id')
      .where('user_id', supplierUserId)
      .where('c.id', customerId);

    let [customer] = await sequelize.query(query.toString(), {type: sequelize.QueryTypes.SELECT});

    return customer;
  };

  Customer.listForAdmin = async params => {
    let {searchTitle, searchCode, searchSupplierCode, searchSupplierTitle, sortBy, descending} = params;
    sortBy = ORDER_FIELDS_ADMIN.indexOf(sortBy) !== -1 ? sortBy : null;

    let query = sequelize.knex.select([
      'c.*',
      's.code as supplierCode',
      's.title as supplierTitle'
    ])
      .from('customers as c')
      .join('suppliers as s', 'c.supplier_id', 's.id');

    if (searchTitle) {
      query.where(q => q.whereRaw('c."title" % ?', searchTitle).orWhere('c.title', 'ILIKE', `%${searchTitle}%`));
    }

    if (searchCode) {
      query.where('c.code', 'ILIKE', searchCode);
    }

    if (searchSupplierTitle) {
      query.where(q => q.whereRaw('s."title" % ?', searchSupplierTitle).orWhere('s.title', 'ILIKE', `%${searchSupplierTitle}%`));
    }

    if (searchSupplierCode) {
      query.where('s.code', 'ILIKE', searchSupplierCode);
    }

    if (sortBy) {
      query.orderBy(sortBy, JSON.parse(descending) === true ? 'desc' : 'asc');
    }

    let sql = query.toString();

    return sequelize.query(sql, {type: sequelize.QueryTypes.SELECT});
  };

  return Customer;
};

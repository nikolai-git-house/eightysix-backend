module.exports = (sequelize, DataTypes) => {
  const ORDER_FIELDS_ADMIN = [
    'supplierTitle',
    'supplierCode',
    'role',
    'email',
    'phone'
  ];
  const SupplierUser = sequelize.define('SupplierUser', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    userId: DataTypes.INTEGER,
    supplierId: DataTypes.INTEGER
  }, {
    tableName: 'supplier_users'
  });

  SupplierUser.associate = ({Supplier, User}) => {
    SupplierUser.belongsTo(Supplier, {
      foreignKey: 'supplierId',
      targetKey: 'id'
    });
    SupplierUser.belongsTo(User, {
      foreignKey: 'userId',
      targetKey: 'id'
    });
  };

  SupplierUser.listForAdmin = params => {
    let {searchRole, searchSupplierTitle, searchSupplierCode, orderField, orderType} = params;
    orderField = ORDER_FIELDS_ADMIN.indexOf(orderField) !== -1 ? orderField : null;
    let query = sequelize.knex.select([
      'su.*',
      'u.email',
      'u.phone',
      's.title as supplierTitle',
      's.code as supplierCode',
      'ur.title as role'
    ])
      .from('supplier_users as su')
      .join('suppliers as s', 'su.supplier_id', 's.id')
      .join('users as u', 'su.user_id', 'u.id')
      .join('user_roles as ur', 'u.role_id', 'ur.id');

    if (searchSupplierTitle) {
      query.where(q => q.whereRaw('s.title % ?', searchSupplierTitle).orWhere('s.title', 'ILIKE', `%${searchSupplierTitle}%`));
    }

    if (searchSupplierCode) {
      query.where('s.code', 'ILIKE', searchSupplierCode);
    }

    if (searchRole) {
      query.where('ur.title', 'ILIKE', searchRole);
    }

    if (orderField) {
      orderType = String(orderType).toLowerCase() === 'desc' ? 'desc' : 'asc';
      query.orderBy(orderField, orderType);
    }

    return sequelize.query(query.toString(), {type: sequelize.QueryTypes.SELECT});
  };

  SupplierUser.getByIdForAdmin = async supplierUserId => {
    let query = sequelize.knex.select([
      'su.id',
      'u.email',
      'u.phone',
      's.title as supplierTitle',
      's.code as supplierCode',
      'ur.title as role'
    ])
      .from('supplier_users as su')
      .join('suppliers as s', 'su.supplier_id', 's.id')
      .join('users as u', 'su.user_id', 'u.id')
      .join('user_roles as ur', 'u.role_id', 'ur.id')
      .where('su.id', supplierUserId);

    let [supplierUser] = await sequelize.query(query.toString(), {type: sequelize.QueryTypes.SELECT});

    return supplierUser;
  };

  return SupplierUser;
};

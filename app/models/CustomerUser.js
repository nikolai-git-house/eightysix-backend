module.exports = (sequelize, DataTypes) => {
  const ORDER_FIELDS = [
    'code',
    'title',
    'currency',
    'month_value',
    'threatened_value',
    'growth',
    'address',
    'last_delivered'
  ];
  const CustomerUser = sequelize.define('CustomerUser', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    userId: DataTypes.INTEGER,
    customerId: DataTypes.INTEGER
  }, {
    tableName: 'customer_users'
  });

  CustomerUser.associate = ({Customer, User}) => {
    CustomerUser.belongsTo(Customer, {
      foreignKey: 'customerId',
      targetKey: 'id'
    });
    CustomerUser.belongsTo(User, {
      foreignKey: 'userId',
      targetKey: 'id'
    });
  };

  CustomerUser.listForSupplier = async (userId, params) => {
    let {searchTitle, searchCode, offset, limit, sortBy, descending} = params;
    offset = Math.abs(Number(offset) || 0);
    limit = Math.abs(Number(limit) || 50);
    sortBy = ORDER_FIELDS.indexOf(sortBy) !== -1 ? sortBy : null;

    let query = sequelize.knex.select([
      'c.id',
      'code',
      'title',
      'currency',
      'month_value',
      'threatened_value',
      'growth',
      'n.note AS lastNote',
      'n.timestamp as lastNoteTimestamp',
      'users.name as lastNoteBy'
    ])
      .from('customer_users as cu')
      .join('customers as c', 'c.id', 'cu.customer_id')
      .joinRaw('LEFT JOIN notes n ON n.id = (SELECT id FROM notes WHERE notes.customer_id = c.id ORDER BY timestamp DESC LIMIT 1)')
      .leftJoin('users', 'users.id', 'n.user_id')
      .where('cu.user_id', userId);

    if (searchTitle) {
      query.where(q => q.whereRaw('c."title" % ?', searchTitle).orWhere('c.title', 'ILIKE', `%${searchTitle}%`));
    }

    if (searchCode) {
      query.where('c.code', 'ILIKE', `%${searchCode}%`);
    }

    if (sortBy) {
      query.orderBy(sortBy, JSON.parse(descending) === true ? 'desc' : 'asc');
    }

    let sql = query.limit(limit).offset(offset).toString();

    return sequelize.query(sql, {type: sequelize.QueryTypes.SELECT, replacements: {userId}});
  };

  CustomerUser.countForSupplier = async (userId, params) => {
    let {searchTitle, searchCode} = params;

    let query = sequelize.knex.count()
      .from('customer_users as cu')
      .join('customers as c', 'c.id', 'cu.customer_id')
      .where('cu.user_id', userId);

    if (searchTitle) {
      query.where(q => q.whereRaw('c."title" % ?', searchTitle).orWhere('c.title', 'ILIKE', `%${searchTitle}%`));
    }

    if (searchCode) {
      query.where('c.code', 'ILIKE', searchCode);
    }

    let [{count}] = await sequelize.query(query.toString(), {type: sequelize.QueryTypes.SELECT, replacements: {userId}});

    return +count;
  };

  CustomerUser.getByIdForSupplier = async (supplierUserId, customerId) => {
    let query = sequelize.knex.select([
      'c.*',
      sequelize.knex.raw('exists(SELECT * FROM customer_users AS cu WHERE cu.customer_id = c.id AND cu.user_id = :supplierUserId) AS subscribed')
    ])
      .from('customers as c')
      .join('suppliers as s', 'c.supplier_id', 's.id')
      .join('supplier_users as su', 's.id', 'su.supplier_id')
      .where('su.user_id', supplierUserId)
      .where('c.id', customerId);

    let [customerUser] = await sequelize.query(query.toString(), {type: sequelize.QueryTypes.SELECT, replacements: {supplierUserId}});

    return customerUser;
  };

  return CustomerUser;
};

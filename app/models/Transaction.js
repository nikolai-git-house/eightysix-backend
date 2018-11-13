const _ = require('lodash');

module.exports = (sequelize, DataTypes) => {
  const ORDER_FIELDS = [
    'cost',
    'delivered',
    'price',
    'quantity',
    'title',
    'code'
  ];
  const ORDER_FIELDS_ADMIN = [
    'cost',
    'delivered',
    'price',
    'quantity',
    'title',
    'stopped',
    'productTitle',
    'productCode',
    'customerTitle',
    'customerCode'
  ];
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    cost: DataTypes.NUMERIC(10, 2),
    delivered: {
      type: DataTypes.TIME,
      allowNull: false
    },
    price: DataTypes.NUMERIC(10, 2),
    quantity: DataTypes.DOUBLE,
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    stopped: {
      type: DataTypes.BOOLEAN
    }
  }, {
    tableName: 'transactions'
  });

  Transaction.associate = ({Customer, Product}) => {
    Transaction.belongsTo(Customer, {
      foreignKey: 'customerId',
      targetKey: 'id'
    });
    Transaction.belongsTo(Product, {
      foreignKey: 'productId',
      targetKey: 'id'
    });
  };

  Transaction.listForSupplierCustomer = async (supplierUserId, customerId, params) => {
    let {searchTitle, searchCode, offset, limit, sortBy, descending} = params;
    offset = Math.abs(Number(offset) || 0);
    limit = Math.abs(Number(limit) || 10);
    sortBy = ORDER_FIELDS.indexOf(sortBy) !== -1 ? sortBy : null;

    let query = sequelize.knex.select([
      't.id',
      't.cost',
      't.delivered',
      't.price',
      't.quantity',
      'p.title',
      'p.code'
    ])
      .from('transactions as t')
      .join('products as p', 't.product_id', 'p.id')
      .join('customer_users as cu', 'cu.customer_id', 't.customer_id')
      .where('cu.user_id', supplierUserId)
      .where('cu.customer_id', customerId);

    if (searchTitle) {
      query.where(q => q.whereRaw('p."title" % ?', searchTitle).orWhere('p.title', 'ILIKE', `%${searchTitle}%`));
    }

    if (searchCode) {
      query.where('p.code', 'ILIKE', searchCode);
    }

    if (sortBy) {
      query.orderBy(sortBy, JSON.parse(descending) === true ? 'desc' : 'asc');
    }

    let sql = query.limit(limit).offset(offset).toString();

    return sequelize.query(sql, {type: sequelize.QueryTypes.SELECT});
  };

  Transaction.countForSupplierCustomer = async (supplierUserId, customerId, params) => {
    let {searchTitle, searchCode} = params;

    let query = sequelize.knex.count()
      .from('transactions as t')
      .join('products as p', 't.product_id', 'p.id')
      .join('customer_users as cu', 'cu.customer_id', 't.customer_id')
      .where('cu.user_id', supplierUserId)
      .where('cu.customer_id', customerId);

    if (searchTitle) {
      query.where(q => q.whereRaw('p."title" % ?', searchTitle).orWhere('p.title', 'ILIKE', `%${searchTitle}%`));
    }

    if (searchCode) {
      query.where('p.code', 'ILIKE', searchCode);
    }

    let [{count}] = await sequelize.query(query.toString(), {type: sequelize.QueryTypes.SELECT});

    return +count;
  };

  Transaction.getByIdForSupplier = async (supplierUserId, transactionId) => {
    let query = sequelize.knex.select([
      't.id',
      't.cost',
      't.delivered',
      't.price',
      't.quantity',
      'p.title',
      'p.code'
    ])
      .from('transactions as t')
      .join('products as p', 't.product_id', 'p.id')
      .join('customer_users as cu', 'cu.customer_id', 't.customer_id')
      .where('cu.user_id', supplierUserId)
      .where('t.id', transactionId);

    let [transaction] = await sequelize.query(query.toString(), {type: sequelize.QueryTypes.SELECT});

    return transaction;
  };

  Transaction.listForAdmin = async params => {
    let {searchCustomerCode, searchProductCode, searchCustomerTitle, searchProductTitle, orderField, orderType} = params;
    orderField = ORDER_FIELDS_ADMIN.indexOf(orderField) !== -1 ? orderField : null;

    let query = sequelize.knex.select([
      't.*',
      'p.code as productCode',
      'p.title as productTitle',
      'c.code as customerCode',
      'c.title as customerTitle'
    ])
      .from('transactions as t')
      .join('products as p', 't.product_id', 'p.id')
      .join('customers as c', 't.customer_id', 'c.id');

    if (searchCustomerTitle) {
      query.where(q => q.whereRaw('c."title" % ?', searchCustomerTitle).orWhere('c.title', 'ILIKE', `%${searchCustomerTitle}%`));
    }

    if (searchCustomerCode) {
      query.where('c.code', 'ILIKE', searchCustomerCode);
    }

    if (searchProductTitle) {
      query.where(q => q.whereRaw('p."title" % ?', searchProductTitle).orWhere('p.title', 'ILIKE', `%${searchProductTitle}%`));
    }

    if (searchProductCode) {
      query.where('p.code', 'ILIKE', searchProductCode);
    }

    if (orderField) {
      orderType = String(orderType).toLowerCase() === 'desc' ? 'desc' : 'asc';
      query.orderBy(orderField, orderType);
    }

    let sql = query.toString();

    return sequelize.query(sql, {type: sequelize.QueryTypes.SELECT});
  };

  Transaction.listOrdersForSupplierCustomer = async (supplierUserId, customerId, params) => {
    let {searchTitle, searchCode, offset, limit} = params;
    offset = Math.abs(Number(offset) || 0);
    limit = Math.abs(Number(limit) || 10);

    let query = sequelize.knex.select([
      't1.id',
      't1.cost',
      't1.delivered',
      't1.price',
      't1.quantity',
      'p.title',
      'p.code',
      't2.totalValue',
      't2.delivered',
      sequelize.knex.raw('t1.price * t1.quantity AS value')
    ])
      .from('transactions as t1')
      .joinRaw(`JOIN (
         SELECT
           delivered::DATE AS delivered,
           customer_id,
           sum(price*quantity) AS "totalValue"
         FROM transactions
         WHERE customer_id = :customerId
         GROUP BY delivered, customer_id
         ORDER BY delivered DESC
         OFFSET :offset LIMIT :limit
       ) as t2 ON t1.delivered::DATE = t2.delivered::DATE AND t1.customer_id = t2.customer_id`)
      .join('customer_users as cu', 'cu.customer_id', 't1.customer_id')
      .join('products as p', 't1.product_id', 'p.id')
      .where('cu.user_id', supplierUserId)
      .where('t1.customer_id', customerId);


    if (searchTitle) {
      query.where(q => q.whereRaw('"title" % ?', searchTitle).orWhere('title', 'ILIKE', `%${searchTitle}%`));
    }

    if (searchCode) {
      query.where('code', 'ILIKE', searchCode);
    }

    query.orderBy('t2.delivered', 'DESC');

    let sql = query.toString();

    let transactions = await sequelize.query(sql, {type: sequelize.QueryTypes.SELECT, replacements: {offset, limit, customerId}});

    let orders = [];

    let ordersMap = _.groupBy(transactions, 'delivered');

    for (let key of _.keys(ordersMap)) {
      orders.push({
        delivered: key,
        totalValue: ordersMap[key][0].totalValue,
        items: ordersMap[key]
      });
    }

    return orders;
  };

  Transaction.countOrdersForSupplierCustomer = async (supplierUserId, customerId) => {
    let [{count}] = await sequelize.query(`
      SELECT count(*)
      FROM
        (
          SELECT DISTINCT
            delivered :: DATE AS date,
            t1.customer_id
          FROM transactions AS t1
            INNER JOIN "customer_users" AS "cu" ON "cu"."customer_id" = "t1"."customer_id"
            INNER JOIN "products" AS "p" ON "t1"."product_id" = "p"."id"
          WHERE "cu"."user_id" = :supplierUserId AND "t1"."customer_id" = :customerId
        ) AS t
    `, {type: sequelize.QueryTypes.SELECT, replacements: {supplierUserId, customerId}});

    return +count;
  };

  return Transaction;
};

module.exports = (sequelize, DataTypes) => {
  const ORDER_FIELDS_ADMIN = [
    'last_delivered',
    'margin',
    'outlier',
    'growth',
    'period',
    'price',
    'active',
    'modified',
    'month_value',
    'productTitle',
    'productCode',
    'customerTitle',
    'customerCode'
  ];
  const CustomerProduct = sequelize.define(
    'CustomerProduct',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      lastDelivered: DataTypes.TIME,
      margin: DataTypes.DOUBLE,
      outlier: DataTypes.INTEGER,
      growth: DataTypes.FLOAT,
      period: DataTypes.INTEGER,
      price: DataTypes.NUMERIC(10, 2),
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      modified: {
        type: DataTypes.DATE,
        defaultValue: sequelize.fn('now')
      },
      monthValue: {
        type: DataTypes.NUMERIC(10, 2),
        defaultValue: sequelize.fn('now')
      }
    },
    {
      tableName: 'customer_products'
    }
  );

  CustomerProduct.associate = ({Customer, Product}) => {
    CustomerProduct.belongsTo(Customer, {
      foreignKey: 'customerId',
      targetKey: 'id'
    });
    CustomerProduct.belongsTo(Product, {
      foreignKey: 'productId',
      targetKey: 'id'
    });
  };

  CustomerProduct.listForSupplierCustomer = async (
    supplierUserId,
    customerId,
    params
  ) => {
    let {
      searchTitle,
      searchCode,
      offset,
      limit,
      sortBy,
      descending,
      overdue
    } = params;
    offset = Math.abs(Number(offset) || 0);
    limit = Math.abs(Number(limit) || 10);

    let query = sequelize.knex
      .select([
        'cp.id',
        'cp.last_delivered',
        'cp.month_value',
        'cp.margin',
        'cp.outlier',
        'cp.growth',
        'cp.period',
        'cp.price',
        'cp.active',
        'cp.modified',
        'p.title',
        'p.code'
      ])
      .from('customer_products as cp')
      .join('products as p', 'cp.product_id', 'p.id')
      .join('customer_users as cu', 'cu.customer_id', 'cp.customer_id')
      .where('cu.user_id', supplierUserId)
      .where('cu.customer_id', customerId);

    if (overdue === 'true') {
      query.whereRaw('EXTRACT(DAY FROM CURRENT_TIMESTAMP - cp.last_delivered) > cp.period');
      query.where('cp.active', '=', true);
    }

    if (searchTitle) {
      query.where(q =>
        q
          .whereRaw('p."title" % ?', searchTitle)
          .orWhere('p.title', 'ILIKE', `%${searchTitle}%`));
    }

    if (searchCode) {
      query.where('p.code', 'ILIKE', searchCode);
    }

    if (sortBy) {
      query.orderBy(sortBy, JSON.parse(descending) === true ? 'desc' : 'asc');
    }

    let sql = query
      .limit(limit)
      .offset(offset)
      .toString();

    return sequelize.query(sql, {type: sequelize.QueryTypes.SELECT});
  };

  CustomerProduct.countForSupplierCustomer = async (
    supplierUserId,
    customerId,
    params
  ) => {
    let {searchTitle, searchCode, overdue} = params;

    let query = sequelize.knex
      .count()
      .from('customer_products as cp')
      .join('products as p', 'cp.product_id', 'p.id')
      .join('customer_users as cu', 'cu.customer_id', 'cp.customer_id')
      .where('cu.user_id', supplierUserId)
      .where('cu.customer_id', customerId);

    if (overdue === 'true') {
      query.whereRaw('EXTRACT(DAY FROM CURRENT_TIMESTAMP - cp.last_delivered) > cp.period');
      query.where('cp.active', '=', true);
    }

    if (searchTitle) {
      query.where(q =>
        q
          .whereRaw('p."title" % ?', searchTitle)
          .orWhere('p.title', 'ILIKE', `%${searchTitle}%`));
    }

    if (searchCode) {
      query.where('p.code', 'ILIKE', searchCode);
    }

    let [{count}] = await sequelize.query(query.toString(), {
      type: sequelize.QueryTypes.SELECT
    });

    return +count;
  };

  CustomerProduct.getByIdForSupplier = async (
    supplierUserId,
    customerProductId
  ) => {
    let query = sequelize.knex
      .select([
        'cp.id',
        'cp.last_delivered',
        'cp.margin',
        'cp.outlier',
        'cp.growth',
        'cp.period',
        'cp.price',
        'cp.active',
        'cp.modified',
        'p.title',
        'p.code'
      ])
      .from('customer_products as cp')
      .join('products as p', 'cp.product_id', 'p.id')
      .join('customer_users as cu', 'cu.customer_id', 'cp.customer_id')
      .where('cu.user_id', supplierUserId)
      .where('cp.id', customerProductId);

    let [customerProduct] = await sequelize.query(query.toString(), {
      type: sequelize.QueryTypes.SELECT
    });

    return customerProduct;
  };

  CustomerProduct.listForAdmin = async params => {
    let {
      searchCustomerCode,
      searchProductCode,
      searchCustomerTitle,
      searchProductTitle,
      sortBy,
      orderType
    } = params;
    sortBy = ORDER_FIELDS_ADMIN.indexOf(sortBy) !== -1 ? sortBy : null;

    let query = sequelize.knex
      .select([
        'cp.*',
        'p.code as productCode',
        'p.title as productTitle',
        'c.code as customerCode',
        'c.title as customerTitle'
      ])
      .from('customer_products as cp')
      .join('products as p', 'cp.product_id', 'p.id')
      .join('customers as c', 'cp.customer_id', 'c.id');

    if (searchCustomerTitle) {
      query.where(q =>
        q
          .whereRaw('c."title" % ?', searchCustomerTitle)
          .orWhere('c.title', 'ILIKE', `%${searchCustomerTitle}%`));
    }

    if (searchCustomerCode) {
      query.where('c.code', 'ILIKE', searchCustomerCode);
    }

    if (searchProductTitle) {
      query.where(q =>
        q
          .whereRaw('p."title" % ?', searchProductTitle)
          .orWhere('p.title', 'ILIKE', `%${searchProductTitle}%`));
    }

    if (searchProductCode) {
      query.where('p.code', 'ILIKE', searchProductCode);
    }

    if (sortBy) {
      orderType = String(orderType).toLowerCase() === 'desc' ? 'desc' : 'asc';
      query.orderBy(sortBy, orderType);
    }

    let sql = query.toString();

    return sequelize.query(sql, {type: sequelize.QueryTypes.SELECT});
  };

  return CustomerProduct;
};

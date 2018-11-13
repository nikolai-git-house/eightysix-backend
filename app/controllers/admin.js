const _ = require('lodash');
const {Router} = require('express');
const db = require('../models');
const {ApiError, E} = require('../helpers/server-error');
const middlewares = require('../middlewares');

const router = Router();

/**
 * @api {get} /api/admin/supplier-users Get supplier-users
 * @apiName AdminSupplierUsers
 * @apiGroup Admin
 * @apiPermission admin
 *
 * @apiExample {curl} Sample request
 * /api/admin/supplier-users?orderField=supplierCode&searchRole=supplier
 * @apiSuccess (200) {json} Success Data fetched successfully

 * @apiParam {String} [searchSupplierTitle] string for fuzzy search by title
 * @apiParam {String} [searchSupplierCode] string for strict search by code
 * @apiParam {String} [searchRole] string for strict search by role
 * @apiParam {String = "supplierTitle","supplierCode","role","email","phone"} [orderField] name of column to order by
 * @apiParam {String = "asc","desc"} [orderType = asc] order direction
 */

router.get(
  '/admin/supplier-users',
  ...middlewares('readAny', 'supplier-user'),
  async (req, res, next) => {
    try {
      let supplierUsers = await db.SupplierUser.listForAdmin(req.query);

      return res.json({data: supplierUsers});
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * @api {post} /api/admin/supplier-user/:supplierUserId Update supplier-user
 * @apiName AdminSupplierUserUpdate
 * @apiGroup Admin
 * @apiPermission admin
 *
 * @apiExample {curl} Sample request
 * /api/admin/supplier-user/1
 * @apiSuccess (200) {json} Success Data updated successfully
 *
 * @apiParam {Number} supplierUserId Id of entry
 * @apiParamExample {json} Sample-Request
  {
    "email": "user@gmail.com",
    "phone": "000111222"
  }
 * @apiError (ApiError) USER_NOT_FOUND Entry by id not found
 */

router.post(
  '/admin/supplier-user/:supplierUserId',
  ...middlewares('updateAny', 'supplier-user'),
  async (req, res, next) => {
    try {
      let {supplierUserId} = req.params;
      let {email, phone, supplier_id: supplierId} = req.body;
      let supplierUser = await db.SupplierUser.findById(supplierUserId);
      if (!supplierUser) {
        return next(new ApiError(E.USER_NOT_FOUND));
      }

      if (_.isUndefined(supplierId)) {
        supplierId = supplierUser.supplierId;
      }

      let user = await db.User.findById(supplierUser.userId);
      await user.update({email, phone});

      return res.sendStatus(200);
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * @api {post} /api/admin/supplier-user Create supplier-user
 * @apiName AdminSupplierUserCreate
 * @apiGroup Admin
 * @apiPermission admin
 *
 * @apiExample {curl} Sample request
 * /api/admin/supplier-user
 * @apiSuccess (200) {json} Success Created successfully
 *
 * @apiParamExample {json} Sample-Request
 {
   "email": "user@gmail.com",
   "phone": "000111222",
   "supplier_id": 2
 }
 * @apiError (ApiError) UNIQUE_CONSTRAINT_ERROR Email already exists
 */

router.post(
  '/admin/supplier-user',
  ...middlewares('createAny', 'supplier-user'),
  async (req, res, next) => {
    try {
      let {email, phone, name, supplier_id: supplierId} = req.body;

      if (!supplierId) {
        return next(new ApiError(E.NO_SUPPLIER_ID));
      }

      let newSupplierUser = await db.sequelize.transaction(async transaction => {
        let user = await db.User.create(
          {email, phone, name},
          {transaction}
        );

        return db.SupplierUser.create(
          {userId: user.id, supplierId},
          {transaction}
        );
      });

      newSupplierUser = await db.SupplierUser.getByIdForAdmin(newSupplierUser.id);

      return res.json({data: newSupplierUser});
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * @api {post} /api/auth/set-user-supplier Set User Supplier Link
 * @apiName SetUserSupplier
 * @apiGroup Auth
 * @apiSuccess (200) Success Email sent successfully
 *
 * @apiParam {Integer} UserId
 * @apiParamExample {json} Request-Example:
 * {
 *  "userId": 1
 * }
 * @apiParam {Integer} SupplierId
 * @apiParamExample {json} Request-Example:
 * {
 *  "supplierId": 1
 * }
 */
router.post(
  '/auth/set-user-supplier',
  ...middlewares('createAny', 'supplier-user'),
  async (req, res, next) => {
    try {
      let user = await db.User.find({where: {email: req.body.email}});
      if (!user) {
        return next(new ApiError(E.USER_NOT_FOUND));
      }
      let supplier = await db.Supplier.find({
        where: {code: req.body.supplier}
      });
      if (!supplier) {
        return next(new ApiError(E.SUPPLIER_NOT_FOUND));
      }
      await db.sequelize.transaction(async transaction => {
        const response = await db.SupplierUser.create(
          {
            userId: user.id,
            supplierId: supplier.id
          },
          {transaction}
        );

        return res.status(200).json(response);
      });
      return next();
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * @api {post} /api/auth/drop-user-supplier Drop User Supplier Link
 * @apiName DropUserSupplier
 * @apiGroup Auth
 * @apiSuccess (200) Success Email sent successfully
 *
 * @apiParam {Integer} UserId
 * @apiParamExample {json} Request-Example:
 * {
 *  "userId": 1
 * }
 * @apiParam {Integer} SupplierId
 * @apiParamExample {json} Request-Example:
 * {
 *  "supplierId": 1
 * }
 */
router.post(
  '/auth/drop-user-supplier',
  ...middlewares('deleteAny', 'supplier-user'),
  async (req, res, next) => {
    try {
      let user = await db.User.find({where: {email: req.body.email}});
      if (!user) {
        return next(new ApiError(E.USER_NOT_FOUND));
      }
      let supplier = await db.Supplier.find({
        where: {code: req.body.supplier}
      });
      if (!supplier) {
        return next(new ApiError(E.SUPPLIER_NOT_FOUND));
      }
      await db.sequelize.transaction(async transaction => {
        const customerResponse = await db.CustomerUser.destroy(
          {
            where: {userId: user.id},
            include: [
              {
                model: db.Customer,
                where: {supplierId: supplier.id}
              }
            ]
          },
          {transaction}
        );
        const supplierResponse = await db.SupplierUser.destroy(
          {
            where: {userId: user.id, supplierId: supplier.id}
          },
          {transaction}
        );
        return res
          .status(200)
          .json({customers: customerResponse, suppliers: supplierResponse});
      });

      return next();
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * @api {get} /api/admin/customers Get customers
 * @apiName AdminCustomers
 * @apiGroup Admin
 * @apiPermission admin
 *
 * @apiExample {curl} Sample request
 * /api/admin/customers?searchSupplierCode=aaa&orderField=supplierTitle
 * @apiSuccess (200) {json} Success Data fetched successfully
 * @apiParam {String} [searchTitle] string for fuzzy search by title
 * @apiParam {String} [searchCode] string for strict search by code
 * @apiParam {String} [searchSupplierTitle] string for fuzzy search by title
 * @apiParam {String} [searchSupplierCode] string for strict search by code
 * @apiParam {String = "code","title","currency","month_value","threatened_value","growth","supplierCode","supplierTitle"} [orderField]
 * name of column to order by
 * @apiParam {String = "asc","desc"} [orderType = asc] order direction
 */

router.get(
  '/admin/customers',
  ...middlewares('readAny', 'customer'),
  async (req, res, next) => {
    try {
      let customers = await db.Customer.listForAdmin(req.query);

      return res.json({data: customers});
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * @api {post} /api/admin/customer/:customerId Update customer
 * @apiName AdminCustomerUpdate
 * @apiGroup Admin
 * @apiPermission admin
 *
 * @apiExample {curl} Sample request
 * /api/admin/customer/1
 * @apiSuccess (200) {json} Success Data updated successfully
 *
 * @apiParam {Number} customerId Id of entry
 * @apiParamExample {json} Sample-Request
 {
    "code":"SM24",
    "title":"Supermarket 24",
    "currency":"UAH",
    "address": "Ukraine",
    "last_delivered": "2017-05-02",
    "month_value": 1.5,
    "threatened_value": 3.3,
    "growth": 2.6
 }
 * @apiError (ApiError) CUSTOMER_NOT_FOUND Entry by id not found
 */

router.post(
  '/admin/customer/:customerId',
  ...middlewares('updateAny', 'customer'),
  async (req, res, next) => {
    try {
      let {customerId} = req.params;
      let customer = await db.Customer.findById(customerId);
      if (!customer) {
        return next(new ApiError(E.CUSTOMER_NOT_FOUND));
      }

      let {
        code,
        title,
        currency,
        month_value: monthValue,
        threatened_value: threatenedValue,
        growth,
        address,
        last_delivered: lastDelivered,
        supplier_id: supplierId
      } = req.body;

      if (_.isUndefined(supplierId)) {
        supplierId = customer.supplierId;
      }

      await customer.update({
        code,
        title,
        currency,
        monthValue,
        threatenedValue,
        growth,
        address,
        lastDelivered
      });

      return res.sendStatus(200);
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * @api {get} /api/admin/products Get products
 * @apiName AdminProducts
 * @apiGroup Admin
 * @apiPermission admin
 *
 * @apiExample {curl} Sample request
 * /api/admin/products?orderField=supplierTitle
 * @apiSuccess (200) {json} Success Data fetched successfully

 * @apiParam {String} [searchSupplierTitle] string for fuzzy search by title
 * @apiParam {String} [searchTitle] string for fuzzy search by title
 * @apiParam {String} [searchSupplierCode] string for strict search by code
 * @apiParam {String} [searchCode] string for strict search by code
 * @apiParam {String = "code","title","list_price","supplierCode","supplierTitle"} [orderField] name of column to order by
 * @apiParam {String = "asc","desc"} [orderType = asc] order direction
 */

router.get(
  '/admin/products',
  ...middlewares('readAny', 'product'),
  async (req, res, next) => {
    try {
      let products = await db.Product.listForAdmin(req.query);

      return res.json({data: products});
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * @api {post} /api/admin/product/:productId Update product
 * @apiName AdminProductUpdate
 * @apiGroup Admin
 * @apiPermission admin
 *
 * @apiExample {curl} Sample request
 * /api/admin/product/1
 * @apiSuccess (200) {json} Success Data updated successfully
 *
 * @apiParam {Number} productId Id of entry
 * @apiParamExample {json} Sample-Request
 {
   "code":"SWTS",
   "list_price":2.3,
   "title":"Sweets",
   "supplier_id": 4,
   "supplierCode":"AAA",
   "supplierTitle":"Roshen"
 }
 * @apiError (ApiError) PRODUCT_NOT_FOUND Entry by id not found
 */

router.post(
  '/admin/product/:productId',
  ...middlewares('updateAny', 'product'),
  async (req, res, next) => {
    try {
      let {productId} = req.params;
      let product = await db.Product.findById(productId);
      if (!product) {
        return next(new ApiError(E.PRODUCT_NOT_FOUND));
      }

      let {
        code,
        title,
        list_price: listPrice,
        supplier_id: supplierId
      } = req.body;

      if (_.isUndefined(supplierId)) {
        supplierId = product.supplierId;
      }

      await product.update({code, title, listPrice, supplierId});

      return res.sendStatus(200);
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * @api {get} /api/admin/customer-products Get customer-products
 * @apiName AdminCustomerProducts
 * @apiGroup Admin
 * @apiPermission admin
 *
 * @apiExample {curl} Sample request
 * /api/admin/customer-products?orderField=supplierTitle
 * @apiSuccess (200) {json} Success Data fetched successfully

 * @apiParam {String} [searchSupplierTitle] string for fuzzy search by title
 * @apiParam {String} [searchProductTitle] string for fuzzy search by title
 * @apiParam {String} [searchSupplierCode] string for strict search by code
 * @apiParam {String} [searchProductCode] string for strict search by code
 * @apiParam {String = "last_delivered","margin","outlier","growth","period","price","active","modified","month_value","productTitle","productCode","customerTitle","customerCode"} [orderField] name of column to order by
 * @apiParam {String = "asc","desc"} [orderType = asc] order direction
 */

router.get(
  '/admin/customer-products',
  ...middlewares('readAny', 'customer-product'),
  async (req, res, next) => {
    try {
      let customerProducts = await db.CustomerProduct.listForAdmin(req.query);

      return res.json({data: customerProducts});
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * @api {post} /api/admin/customer-product/:customerProductId Update customer product
 * @apiName AdminCustomerProductUpdate
 * @apiGroup Admin
 * @apiPermission admin
 *
 * @apiExample {curl} Sample request
 * /api/admin/customer-product/1
 * @apiSuccess (200) {json} Success Data updated successfully
 *
 * @apiParam {Number} customerProductId Id of entry
 * @apiParamExample {json} Sample-Request
 {
   "last_delivered":"2018-12-28T14:19:16.473Z",
   "margin":2,
   "outlier":3,
   "period":3,
   "price":"5.23",
   "customer_id":2,
   "product_id":1,
   "modified":"2017-12-27T12:20:52.186Z",
   "month_value":25,
   "growth":26
 }
 * @apiError (ApiError) PRODUCT_NOT_FOUND Entry by id not found
 */

router.post(
  '/admin/customer-product/:customerProductId',
  ...middlewares('updateAny', 'customer-product'),
  async (req, res, next) => {
    try {
      let {customerProductId} = req.params;
      let customerProduct = await db.CustomerProduct.findById(customerProductId);
      if (!customerProduct) {
        return next(new ApiError(E.PRODUCT_NOT_FOUND));
      }

      let {
        last_delivered: lastDelivered,
        margin,
        outlier,
        growth,
        period,
        price,
        active,
        modified,
        month_value: monthValue,
        customer_id: customerId,
        product_id: productId
      } = req.body;
      if (_.isUndefined(active)) {
        active = customerProduct.active;
      }
      if (_.isUndefined(customerId)) {
        customerId = customerProduct.customerId;
      }
      if (_.isUndefined(productId)) {
        productId = customerProduct.productId;
      }

      await customerProduct.update({
        lastDelivered,
        margin,
        outlier,
        growth,
        period,
        price,
        active,
        modified,
        monthValue,
        productId,
        customerId
      });

      return res.sendStatus(200);
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * @api {get} /api/admin/transactions Get transactions
 * @apiName AdminTransactions
 * @apiGroup Admin
 * @apiPermission admin
 *
 * @apiExample {curl} Sample request
 * /api/admin/transactions?orderField=supplierTitle
 * @apiSuccess (200) {json} Success Data fetched successfully

 * @apiParam {String} [searchSupplierTitle] string for fuzzy search by title
 * @apiParam {String} [searchProductTitle] string for fuzzy search by title
 * @apiParam {String} [searchSupplierCode] string for strict search by code
 * @apiParam {String} [searchProductCode] string for strict search by code
 * @apiParam {String = "cost","delivered","price","quantity","title","stopped","productTitle","productCode","customerTitle","customerCode"} [orderField] name of column to order by
 * @apiParam {String = "asc","desc"} [orderType = asc] order direction
 */

router.get(
  '/admin/transactions',
  ...middlewares('readAny', 'transaction'),
  async (req, res, next) => {
    try {
      let transactions = await db.Transaction.listForAdmin(req.query);

      return res.json({data: transactions});
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * @api {post} /api/admin/transaction/:transactionId Update transaction
 * @apiName AdminTransactionUpdate
 * @apiGroup Admin
 * @apiPermission admin
 *
 * @apiExample {curl} Sample request
 * /api/admin/transaction/1
 * @apiSuccess (200) {json} Success Data updated successfully
 *
 * @apiParam {Number} transactionId Id of entry
 * @apiParamExample {json} Sample-Request
 {
    "cost": 32.00,
    "delivered": "2014-12-27T15:16:39.415Z",
    "customer_id": 2,
    "product_id": 1,
    "price": 3000.0,
    "quantity": 22,
    "stopped": false
 }
 * @apiError (ApiError) TRANSACTION_NOT_FOUND Entry by id not found
 */

router.post(
  '/admin/transaction/:transactionId',
  ...middlewares('updateAny', 'transaction'),
  async (req, res, next) => {
    try {
      let {transactionId} = req.params;
      let transaction = await db.Transaction.findById(transactionId);
      if (!transaction) {
        return next(new ApiError(E.TRANSACTION_NOT_FOUND));
      }

      let {
        cost,
        delivered,
        price,
        quantity,
        stopped,
        customer_id: customerId,
        product_id: productId
      } = req.body;
      if (_.isUndefined(delivered)) {
        delivered = transaction.delivered;
      }
      if (_.isUndefined(customerId)) {
        customerId = transaction.customerId;
      }
      if (_.isUndefined(productId)) {
        productId = transaction.productId;
      }
      await transaction.update({
        cost,
        delivered,
        price,
        quantity,
        stopped,
        customerId,
        productId
      });

      return res.sendStatus(200);
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * @api {get} /admin/suppliers Get suppliers
 * @apiName AdminSuppliers
 * @apiGroup Admin
 * @apiPermission admin
 *
 * @apiExample {curl} Sample request
 * /api/admin/suppliers?orderField=title
 * @apiSuccess (200) {json} Success Data fetched successfully

 * @apiParam {String} [searchTitle] string for fuzzy search by title
 * @apiParam {String} [searchCode] string for strict search by code
 * @apiParam {String = "code","title","password"} [orderField] name of column to order by
 * @apiParam {String = "asc","desc"} [orderType = asc] order direction
 */

router.get(
  '/admin/suppliers',
  ...middlewares('readAny', 'supplier'),
  async (req, res, next) => {
    try {
      let suppliers = await db.Supplier.listForAdmin(req.query);

      return res.json({data: suppliers});
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * @api {post} /api/admin/supplier/:supplierId Update supplier
 * @apiName AdminSupplierUpdate
 * @apiGroup Admin
 * @apiPermission admin
 *
 * @apiExample {curl} Sample request
 * /api/admin/supplier/1
 * @apiSuccess (200) {json} Success Data updated successfully
 *
 * @apiParam {Number} supplierId Id of entry
 * @apiParamExample {json} Sample-Request
 {
   "title":"Supplier Inc",
   "code":"AAA",
   "password":"122"
 }
 * @apiError (ApiError) SUPPLIER_NOT_FOUND Entry by id not found
 */

router.post(
  '/admin/supplier/:supplierId',
  ...middlewares('updateAny', 'supplier'),
  async (req, res, next) => {
    try {
      let {supplierId} = req.params;
      let supplier = await db.Supplier.findById(supplierId);
      if (!supplier) {
        return next(new ApiError(E.SUPPLIER_NOT_FOUND));
      }

      let {title, code, password} = req.body;
      await supplier.update({title, code, password});

      return res.sendStatus(200);
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * @api {post} /api/admin/supplier Create supplier
 * @apiName AdminSupplierCreate
 * @apiGroup Admin
 * @apiPermission admin
 *
 * @apiExample {curl} Sample request
 * /api/admin/supplier
 * @apiSuccess (200) {json} Success Created successfully
 *
 * @apiParamExample {json} Sample-Request
 {
   "title":"Supplier Inc",
   "code":"AAA",
   "password":"122"
 }
 */

router.post(
  '/admin/supplier',
  ...middlewares('createAny', 'supplier'),
  async (req, res, next) => {
    try {
      let {title, code, password} = req.body;
      let newSupplier = await db.Supplier.create({title, code, password});

      return res.json(newSupplier);
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;

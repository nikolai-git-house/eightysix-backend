const Promise = require('bluebird');
const {Router} = require('express');
const db = require('../models');
const {ApiError, E} = require('../helpers/server-error');
const middlewares = require('../middlewares');
const {Cognito} = require('../services/Cognito');
const moment = require('moment');

const router = Router();

/**
 * @api {get} /api/supplier/customers Get customers
 * @apiName SupplierCustomers
 * @apiGroup Supplier
 * @apiPermission supplier
 *
 * @apiExample {curl} Sample request
 * /api/supplier/customers?offset=0&limit=10&searchTitle=John&searchCode=A8DF&sortBy=code&descending=desc
 * @apiSuccess (200) {json} Success Data fetched successfully
 * @apiSuccessExample {json} Response-Example
 {
   "totalCount": 1,
   "customers": [
       {
           "id": 1,
           "code": "A8DF",
           "title": "John Doe Inc",
           "address": "Main Street",
           "last_delivered": "2018-06-01T00:00:00.000Z",
           "month_value": 12.3,
           "threatened_value": 0.5,
           "growth": 0.2,
           "currency": "USD",
           "supplier_id": 1,
           "modified": "2018-06-01T19:55:43.000Z",
           "user_id": 1
       }
   ]
 }
 *
 * @apiParam {Number} [offset = 0]
 * @apiParam {Number} [limit = 10]
 * @apiParam {String} [searchTitle] string for fuzzy search by title
 * @apiParam {String} [searchCode] string for strict search by code
 * @apiParam {String = "code","title","currency","month_value","threatened_value","growth"} [sortBy]
 * name of column to order by
 * @apiParam {String = "asc","desc"} [descending = asc] order direction
 */

router.get('/supplier/customers', ...middlewares('readOwn', 'customer'), async (req, res, next) => {
  try {
    let [data, count] = await Promise.all([
      db.Customer.listForSupplier(req.user.id, req.query),
      db.Customer.countForSupplier(req.user.id, req.query)
    ]);
    return res.json({totalCount: count, customers: data});
  } catch (err) {
    return next(err);
  }
});

/**
 * @api {get} /api/supplier/customer/:customerId Get customer details
 * @apiName SupplierCustomer
 * @apiGroup Supplier
 * @apiPermission supplier
 *
 * @apiExample {curl} Sample request
 * /api/supplier/customer/1
 * @apiSuccess (200) {json} Success Data fetched successfully
 * @apiSuccessExample {json} Response-Example
 {
  "customer": {
      "id": 1,
      "code": "A8DF",
      "title": "John Doe Inc",
      "address": "San Francisco",
      "last_delivered": "2017-09-13T00:00:00Z",
      "month_value": 12.3,
      "threatened_value": 0.5,
      "growth": 2,
      "currency": "USD",
      "supplier_id": 1,
      "modified": "2017-09-13T11:16:33.862Z"
  }
}
 *
 * @apiParam {Number} customerId Id of customer
 * @apiError (ApiError) CUSTOMER_NOT_FOUND Customer id related to supplier not found
 */

router.get('/supplier/customer/:customerId', ...middlewares('readOwn', 'customer'), async (req, res, next) => {
  try {
    let {customerId} = req.params;
    let customer = await db.Customer.getByIdForSupplier(req.user.id, customerId);

    if (!customer) {
      return next(new ApiError(E.CUSTOMER_NOT_FOUND));
    }

    return res.json({customer});
  } catch (err) {
    return next(err);
  }
});

/**
 * @api {get} /api/supplier/customer/:customerId/notes Get customer notes
 * @apiName SupplierCustomerNotes
 * @apiGroup Supplier
 * @apiPermission supplier
 *
 * @apiExample {curl} Sample request
 * /api/supplier/customer/1/notes?offset=0&limit=10&searchUser=John
 * @apiSuccess (200) {json} Success Data fetched successfully
 * @apiSuccessExample {json} Response-Example
 {
   "notes": [
       {
           "id": 1,
           "note": "Good customer!",
           "timestamp": "2017-12-27T11:30:36.330Z",
           "customer": {
              "code": "AAAA",
              "title": "Customer A"
           },
           "user": {
              "name": "John"
           }
       },
       {
           "id": 6,
           "note": "Best customer ever!",
           "timestamp": "2017-12-27T11:45:11.172Z",
           "customer": {
              "code": "AAAA",
              "title": "Customer B"
           },
           "user": {
              "name": "Frank"
           }
       }
   ]
 }
 *
 * @apiParam {Number} [offset = 0]
 * @apiParam {Number} [limit = 10]
 * @apiParam {String} [searchUser] string for fuzzy search by username
 * @apiParam {Number} customerId Id of customer
 */

router.get('/supplier/customer/:customerId/notes', ...middlewares('readOwn', 'customer-note'), async (req, res, next) => {
  try {
    let {customerId} = req.params;
    let {offset, limit, searchUser} = req.query;
    searchUser = String(searchUser || '').trim();
    offset = Math.abs(Number(offset) || 0);
    limit = Math.abs(Number(limit) || 10);

    let customer = await db.Customer.getByIdForSupplier(req.user.id, customerId);

    if (!customer) {
      return next(new ApiError(E.CUSTOMER_NOT_FOUND));
    }

    let query = [{customerId, userId: req.user.id}];

    if (searchUser) {
      searchUser = searchUser.match(/(([^\x00-\x7F]|\w))+/gi).join(' ');
      query.push(db.sequelize.literal(`("user"."name" ILIKE '%${searchUser}%' OR "user"."name" % '${searchUser}')`));
    }

    let notes = await db.Note.findAll({
      where: db.Sequelize.and(...query),
      include: [{
        model: db.Customer,
        as: 'customer',
        attributes: ['code', 'title']
      }, {
        model: db.User,
        as: 'user',
        attributes: ['name']
      }],
      limit,
      offset
    });

    return res.json({notes});
  } catch (err) {
    return next(err);
  }
});

/**
 * @api {post} /api/supplier/note/:id Update customer note
 * @apiName SupplierUpdateCustomerNote
 * @apiGroup Supplier
 * @apiPermission supplier
 *
 * @apiExample {curl} Sample request
 * /api/supplier/note/1
 * @apiSuccess (200) {json} Success Customer note updated successfully
 *
 * @apiParam {Number} id Id of note
 * @apiParam {Boolean} note Value to be set
 * @apiParamExample {json} Sample-Request
 {
  "note": "Some new note"
 }
 * @apiError (ApiError) NOTE_NOT_FOUND Customer note id not found
 */
router.post('/supplier/note/:id', ...middlewares('updateOwn', 'customer-note'), async (req, res, next) => {
  try {
    let {id} = req.params;
    let note = await db.Note.find({
      where: {id, userId: req.user.id},
      include: [{
        model: db.Customer,
        as: 'customer',
        attributes: ['code', 'title']
      }, {
        model: db.User,
        as: 'user',
        attributes: ['name']
      }]
    });

    if (!note) {
      return next(new ApiError(E.NOTE_NOT_FOUND));
    }

    note.note = req.body.note;

    await note.save();

    return res.json({note});
  } catch (err) {
    return next(err);
  }
});

/**
 * @api {delete} /api/supplier/:id Delete Supplier
 * @apiName SupplierDelete
 * @apiGroup Supplier
 * @apiPermission supplier
 *
 * @apiExample {curl} Sample request
 * /api/supplier/note/1
 * @apiSuccess (200) {json} Success Supplier deleted successfully
 *
 * @apiParam {Number} id Id of note
 * @apiError (ApiError) NOTE_NOT_FOUND Customer note id not found
 */
router.delete('/supplier/:id', ...middlewares('deleteAny', 'supplier-user'), async (req, res, next) => {
  try {
    let {id} = req.params;

    let user = await db.User.find({where: {id}});

    if (!user) {
      return next(new ApiError(E.USER_NOT_FOUND));
    }

    // NOTE: Database should cascade detlet this

    // Delete from supplier users.
    let supplierUsers = await db.SupplierUser.find({user_id: id});

    if (supplierUsers) {
      await supplierUsers.destroy();
    }

    // Delete from customer users.
    let customerUsers = await db.CustomerUser.find({user_id: id});

    if (customerUsers) {
      await customerUsers.destroy();
    }

    await user.destroy();

    let response = await Cognito.deleteUser(user.email, user.cognitoUsername);

    return res.status(200).json(response);
  } catch (err) {
    return next(err);
  }
});

/**
 * @api {delete} /api/supplier/note/:id Delete customer note
 * @apiName SupplierDeleteCustomerNote
 * @apiGroup Supplier
 * @apiPermission supplier
 *
 * @apiExample {curl} Sample request
 * /api/supplier/note/1
 * @apiSuccess (200) {json} Success Customer note deleted successfully
 *
 * @apiParam {Number} id Id of note
 * @apiError (ApiError) NOTE_NOT_FOUND Customer note id not found
 */
router.delete('/supplier/note/:id', ...middlewares('deleteOwn', 'customer-note'), async (req, res, next) => {
  try {
    let {id} = req.params;
    let note = await db.Note.find({where: {id, userId: req.user.id}});

    if (!note) {
      return next(new ApiError(E.NOTE_NOT_FOUND));
    }

    await note.destroy();

    return res.sendStatus(200);
  } catch (err) {
    return next(err);
  }
});

/**
 * @api {post} /api/supplier/customer/:customerId/note Add customer note
 * @apiName SupplierCustomerAddNote
 * @apiGroup Supplier
 * @apiPermission supplier
 *
 * @apiExample {curl} Sample request
 * /api/supplier/customer/1/note
 * @apiSuccess (200) {json} Success Note added successfully
 *
 * @apiParam {Number} customerId Id of customer
 * @apiParam {String} note Note to be added
 * @apiParamExample {json} Sample-Request
 {
  "note": "Best customer ever!"
 }
 * @apiError (ApiError) CUSTOMER_NOT_FOUND Customer id related to supplier not found
 */

router.post('/supplier/customer/:customerId/note', ...middlewares('createOwn', 'customer-note'), async (req, res, next) => {
  try {
    let {customerId} = req.params;
    let customer = await db.Customer.getByIdForSupplier(req.user.id, customerId);

    if (!customer) {
      return next(new ApiError(E.CUSTOMER_NOT_FOUND));
    }

    let {id} = await db.Note.create({customerId, userId: req.user.id, note: req.body.note});

    let newNote = await db.Note.find({
      where: {id},
      include: [{
        model: db.Customer,
        as: 'customer',
        attributes: ['code', 'title']
      }, {
        model: db.User,
        as: 'user',
        attributes: ['name']
      }]
    });

    return res.json({note: newNote});
  } catch (err) {
    return next(err);
  }
});

/**
 * @api {get} /api/supplier/customer/1/products Get customer's products
 * @apiName SupplierCustomerProducts
 * @apiGroup Supplier
 * @apiPermission supplier
 *
 * @apiExample {curl} Sample request
 * /api/supplier/customer/1/products?offset=0&limit=10&searchTitle=popcorn&searchCode=HJLp&sortBy=margin&overdue=true
 * @apiSuccess (200) {json} Success Data fetched successfully
 * @apiSuccessExample {json} Response-Example
 {
    "totalCount": 1,
    "products": [
        {
            "id": 1,
            "last_delivered": "2017-12-28T14:19:16.473Z",
            "margin": 2,
            "outlier": 3,
            "month_value": 12,
            "period": 3,
            "price": 5.2,
            "active": true,
            "modified": "2017-12-27T12:20:52.186Z",
            "title": "Pop Corn",
            "code": "HJLP",
            "list_price": 12
        }
    ]
}
 *
 * @apiParam {Number} [offset = 0]
 * @apiParam {Number} [limit = 10]
 * @apiParam {Boolean="true"} [overdue] show only active records with overdue
 * @apiParam {String} [searchTitle] string for fuzzy search by title
 * @apiParam {String} [searchCode] string for strict search by code
 * @apiParam {String = "code","last_delivered","margin","outlier","growth","period","price","active","modified","title"} [sortBy]
 * name of column to order by
 * @apiParam {String = "asc","desc"} [descending = asc] order direction
 */

router.get('/supplier/customer/:customerId/products', ...middlewares('readOwn', 'customer-product'), async (req, res, next) => {
  try {
    let {customerId} = req.params;

    let [products, count] = await Promise.all([
      db.CustomerProduct.listForSupplierCustomer(req.user.id, customerId, req.query),
      db.CustomerProduct.countForSupplierCustomer(req.user.id, customerId, req.query)
    ]);

    return res.json({totalCount: count, products});
  } catch (err) {
    return next(err);
  }
});

/**
 * @api {get} /api/supplier/customer/:customerId/transactions Get customer's transactions
 * @apiName SupplierCustomerTransactions
 * @apiGroup Supplier
 * @apiPermission supplier
 *
 * @apiExample {curl} Sample request
 * /api/supplier/customer/1/transactions?offset=0&limit=10&orderField=delivered&orderType=desc
 * @apiSuccess (200) {json} Success Data fetched successfully
 * @apiSuccessExample {json} Response-Example
 {
   "totalCount": 1,
   "data": [
       {
           "id": 4,
           "cost": 30,
           "delivered": "2017-12-27T15:16:39.415Z",
           "price": 3,
           "quantity": 2,
           "title": "Pop Corn",
           "code": "HJLP",
           "list_price": 12
       }
   ]
 }
 *
 * @apiParam {Number} [offset = 0]
 * @apiParam {Number} [limit = 10]
 * @apiParam {String} [searchTitle] string for fuzzy search by title
 * @apiParam {String} [searchCode] string for strict search by code
 * @apiParam {String = "cost","delivered","price","quantity","title","code"} [orderField]
 * name of column to order by
 * @apiParam {String = "asc","desc"} [orderType = asc] order direction
 */

router.get('/supplier/customer/:customerId/transactions', ...middlewares('readOwn', 'customer-transaction'), async (req, res, next) => {
  try {
    let {customerId} = req.params;

    let [transactions, count] = await Promise.all([
      db.Transaction.listForSupplierCustomer(req.user.id, customerId, req.query),
      db.Transaction.countForSupplierCustomer(req.user.id, customerId, req.query)
    ]);

    return res.json({totalCount: count, data: transactions});
  } catch (err) {
    return next(err);
  }
});

/**
 * @api {get} /api/supplier/customer/:customerId/orders Get customer's orders
 * @apiName SupplierCustomerOrders
 * @apiGroup Supplier
 * @apiPermission supplier
 *
 * @apiExample {curl} Sample request
 * /api/supplier/customer/1/orders?offset=0&limit=10
 * @apiSuccess (200) {json} Success Data fetched successfully
 * @apiSuccessExample {json} Response-Example
 {
   "totalCount": 1,
   "data": [
       {
           "id": 4,
           "cost": 30,
           "delivered": "2017-12-27T15:16:39.415Z",
           "price": 3,
           "quantity": 2,
           "title": "Pop Corn",
           "code": "HJLP",
           "list_price": 12
       }
   ]
 }
 *
 * @apiParam {Number} [offset = 0]
 * @apiParam {Number} [limit = 10]
 */

router.get('/supplier/customer/:customerId/orders', ...middlewares('readOwn', 'customer-transaction'), async (req, res, next) => {
  try {
    let {customerId} = req.params;

    let [orders, count] = await Promise.all([
      db.Transaction.listOrdersForSupplierCustomer(req.user.id, customerId, req.query),
      db.Transaction.countOrdersForSupplierCustomer(req.user.id, customerId, req.query)
    ]);

    return res.json({totalCount: count, orders});
  } catch (err) {
    return next(err);
  }
});

/**
 * @api {get} /api/supplier/customer-users Get customer users
 * @apiName SupplierCustomerUsers
 * @apiGroup Supplier
 * @apiPermission supplier
 *
 * @apiExample {curl} Sample request
 * /api/supplier/customer-users
 * @apiSuccess (200) {json} Success Data fetched successfully
 * @apiSuccessExample {json} Response-Example
 {
   "totalCount": 2,
   "data": [
       {
           "id": 1,
           "code": "A8DF",
           "currency": "USD",
           "title": "John Doe Inc",
           "supplier_id": 1,
           "address": "San Francisco",
           "last_delivered": "2017-09-13T11:16:33.862Z",
           "month_value": 12.3,
           "threatened_value": 0.5,
           "growth": 2,
           "subscribed": true
       }
   ]
 }
 * @apiParam {Number} [offset = 0]
 * @apiParam {Number} [limit = 10]
 * @apiParam {String} [searchTitle] string for fuzzy search by title
 * @apiParam {String} [searchCode] string for strict search by code
 * @apiParam {String = "code","title","currency","month_value","threatened_value","growth"} [sortBy]
 * name of column to order by
 * @apiParam {String = "asc","desc"} [descending = true] order direction
 */

router.get('/supplier/customer-users', ...middlewares('readOwn', 'customer-user'), async (req, res, next) => {
  try {
    let [data, count] = await Promise.all([
      db.CustomerUser.listForSupplier(req.user.id, req.query),
      db.CustomerUser.countForSupplier(req.user.id, req.query)
    ]);
    return res.json({totalCount: count, customers: data});
  } catch (err) {
    return next(err);
  }
});

/**
 * @api {post} /api/supplier/customer-user/:customerId/subscribe Subscribe to customer
 * @apiName SupplierCustomerUserSubscribe
 * @apiGroup Supplier
 * @apiPermission supplier
 *
 * @apiExample {curl} Sample request
 * /api/supplier/customer-user/1/subscribe
 * @apiSuccess (200) {json} Success Subscribed successfully
 *
 * @apiParam {Number} customerId Id of customer
 * @apiError (ApiError) CUSTOMER_NOT_FOUND Customer id related to supplier not found
 */

router.post('/supplier/customer-user/:customerId/subscribe', ...middlewares('updateOwn', 'customer-user'), async (req, res, next) => {
  try {
    let {customerId} = req.params;
    let userId = req.user.id;

    let customerUser = await db.CustomerUser.getByIdForSupplier(userId, customerId);

    if (!customerUser) {
      return next(new ApiError(E.CUSTOMER_NOT_FOUND));
    }

    await db.CustomerUser.findOrCreate({
      where: {userId, customerId},
      defaults: {userId, customerId}
    });

    return res.sendStatus(200);
  } catch (err) {
    return next(err);
  }
});

/**
 * @api {post} /api/supplier/customer-user/:customerId/unsubscribe Unsubscribe from customer
 * @apiName SupplierCustomerUserUnsubscribe
 * @apiGroup Supplier
 * @apiPermission supplier
 *
 * @apiExample {curl} Sample request
 * /api/supplier/customer-user/1/unsubscribe
 * @apiSuccess (200) {json} Success Unsubscribe successful
 *
 * @apiParam {Number} customerId Id of customer
 * @apiError (ApiError) CUSTOMER_NOT_FOUND Customer id related to supplier not found
 */

router.post('/supplier/customer-user/:customerId/unsubscribe', ...middlewares('updateOwn', 'customer-user'), async (req, res, next) => {
  try {
    let {customerId} = req.params;
    let userId = req.user.id;

    let customerUser = await db.CustomerUser.getByIdForSupplier(userId, customerId);

    if (!customerUser) {
      return next(new ApiError(E.CUSTOMER_NOT_FOUND));
    }

    await db.CustomerUser.destroy({where: {userId, customerId}});

    return res.sendStatus(200);
  } catch (err) {
    return next(err);
  }
});

/**
 * @api {post} /api/supplier/transaction/:transactionId Update transaction status
 * @apiName SupplierUpdateTransaction
 * @apiGroup Supplier
 * @apiPermission supplier
 *
 * @apiExample {curl} Sample request
 * /supplier/transaction/1
 * @apiSuccess (200) {json} Success Transaction status updated successfully
 *
 * @apiParam {Number} transactionId Id of transaction
 * @apiParam {Boolean} stopped Value to be set
 * @apiParamExample {json} Sample-Request
 {
  "stopped": true
 }
 * @apiError (ApiError) TRANSACTION_NOT_FOUND Transaction id related to supplier-user not found
 */

router.post('/supplier/transaction/:transactionId', ...middlewares('updateOwn', 'customer-transaction'), async (req, res, next) => {
  try {
    let {transactionId} = req.params;
    let transaction = await db.Transaction.getByIdForSupplier(req.user.id, transactionId);

    if (!transaction) {
      return next(new ApiError(E.TRANSACTION_NOT_FOUND));
    }

    transaction = await db.Transaction.findById(transactionId);
    transaction.stopped = !!req.body.stopped;
    await transaction.save();

    return res.sendStatus(200);
  } catch (err) {
    return next(err);
  }
});

/**
 * @api {post} /api/supplier/customer-product/:customerProductId Update customer product status
 * @apiName SupplierUpdateCustomerProduct
 * @apiGroup Supplier
 * @apiPermission supplier
 *
 * @apiExample {curl} Sample request
 * /supplier/customer-product/1
 * @apiSuccess (200) {json} Success Customer product status updated successfully
 *
 * @apiParam {Number} customerProductId Id of customer product
 * @apiParam {Boolean} active Value to be set
 * @apiParamExample {json} Sample-Request
 {
  "active": true
 }
 * @apiError (ApiError) PRODUCT_NOT_FOUND Customer product id related to supplier-user not found
 */

router.post('/supplier/customer-product/:customerProductId', ...middlewares('updateOwn', 'customer-product'), async (req, res, next) => {
  try {
    let {customerProductId} = req.params;
    let customerProduct = await db.CustomerProduct.getByIdForSupplier(req.user.id, customerProductId);

    if (!customerProduct) {
      return next(new ApiError(E.PRODUCT_NOT_FOUND));
    }

    customerProduct = await db.CustomerProduct.findById(customerProductId);
    customerProduct.active = req.body.active;
    customerProduct.modified = moment();
    await customerProduct.save();

    await db.Customer.updateProjections(customerProduct.dataValues.customerId);

    return res.sendStatus(200);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

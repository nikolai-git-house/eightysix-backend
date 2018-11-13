const AccessControl = require('accesscontrol');

const ac = new AccessControl();

ac.grant('supplier')
  .readOwn('customer')
  .readOwn('customer-user')
  .updateOwn('customer-user')
  .readOwn('customer-note')
  .createOwn('customer-note')
  .updateOwn('customer-note')
  .deleteOwn('customer-note')
  .readOwn('customer-product')
  .updateOwn('customer-product')
  .readOwn('customer-transaction')
  .updateOwn('customer-transaction');

ac.grant('admin')
  .readAny('supplier-user')
  .createAny('supplier-user')
  .updateAny('supplier-user')
  .deleteAny('supplier-user')
  .readAny('customer-user')
  .createAny('customer-user')
  .updateAny('customer-user')
  .deleteAny('customer-user')
  .readAny('customer')
  .updateAny('customer')
  .readAny('product')
  .updateAny('product')
  .readAny('customer-product')
  .updateAny('customer-product')
  .readAny('transaction')
  .updateAny('transaction')
  .readAny('supplier')
  .createAny('supplier')
  .updateAny('supplier');

module.exports = {ac};

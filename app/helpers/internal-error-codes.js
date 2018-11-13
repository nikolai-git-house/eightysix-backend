module.exports = {
  BAD_REQUEST: {
    code: 4000,
    error: 'BAD_REQUEST',
    responseCode: 400,
    message: 'No email provided'
  },
  EMAIL_NOT_EXISTS: {
    code: 4001,
    error: 'EMAIL_NOT_EXISTS',
    responseCode: 400,
    message: 'This email does not exist'
  },
  VERIFICATION_CODE_NOT_FOUND: {
    code: 4002,
    error: 'VERIFICATION_CODE_NOT_FOUND',
    responseCode: 400,
    message: 'Did not recognise the given verification code.'
  },
  EMAIL_TOKEN_EXPIRED: {
    code: 4003,
    error: 'EMAIL_TOKEN_EXPIRED',
    responseCode: 400,
    message: 'Email token expired'
  },
  NO_SUPPLIER_ID: {
    code: 4005,
    error: 'NO_SUPPLIER_ID',
    responseCode: 400,
    message: 'No supplier id specified'
  },
  UNAUTHORIZED: {
    code: 4010,
    error: 'UNAUTHORIZED',
    responseCode: 401,
    message: 'You do not have permission.'
  },
  INCORRECT_CREDENTIALS: {
    code: 4011,
    error: 'INCORRECT_CREDENTIALS',
    responseCode: 401,
    message: 'Incorrect username or password.'
  },
  LIMIT_EXCEEDED: {
    code: 4012,
    error: 'LIMIT_EXCEEDED',
    responseCode: 401,
    message: 'Attempt limit exceeded, please try after some time.'
  },
  NOT_FOUND: {
    code: 4040,
    error: 'NOT_FOUND',
    responseCode: 404,
    message: 'Not found.'
  },
  CUSTOMER_NOT_FOUND: {
    code: 4041,
    error: 'CUSTOMER_NOT_FOUND',
    responseCode: 404,
    message: 'Customer not found.'
  },
  TRANSACTION_NOT_FOUND: {
    code: 4042,
    error: 'TRANSACTION_NOT_FOUND',
    responseCode: 404,
    message: 'Transaction not found.'
  },
  USER_NOT_FOUND: {
    code: 4043,
    error: 'USER_NOT_FOUND',
    responseCode: 404,
    message: 'User not found.'
  },
  PRODUCT_NOT_FOUND: {
    code: 4043,
    error: 'PRODUCT_NOT_FOUND',
    responseCode: 404,
    message: 'Product not found.'
  },
  SUPPLIER_NOT_FOUND: {
    code: 4044,
    error: 'SUPPLIER_NOT_FOUND',
    responseCode: 404,
    message: 'Supplier not found.'
  },
  NOTE_NOT_FOUND: {
    code: 4045,
    error: 'NOTE_NOT_FOUND',
    responseCode: 404,
    message: 'Note not found.'
  },
  VALIDATION_ERRORS: {
    code: 4220,
    error: 'VALIDATION_ERRORS',
    responseCode: 422,
    message: 'Validation errors.'
  },
  UNIQUE_EMAIL_ERROR: {
    code: 4221,
    error: 'UNIQUE_EMAIL_ERROR',
    responseCode: 422,
    message: 'This email is in use with another account.'
  },
  UNIQUE_CONSTRAINT_ERROR: {
    code: 4222,
    error: 'UNIQUE_CONSTRAINT_ERROR',
    responseCode: 422,
    message: 'Value already exists'
  },
  INTERNAL_SERVER_ERROR: {
    code: 5000,
    error: 'INTERNAL_SERVER_ERROR',
    responseCode: 500,
    message: 'Internal server error'
  }
};

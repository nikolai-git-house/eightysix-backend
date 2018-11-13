const _ = require('lodash');
const Sequelize = require('sequelize');
const E = require('./internal-error-codes');
const log = require('./logger');

class ExtendError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    Error.captureStackTrace(this, this.constructor.name);
  }
}

class ApiError extends ExtendError {
  constructor(customError, extra) {
    super(customError.message);
    _.assign(this, customError, {extra});
  }

  get response() {
    return {
      message: this.message,
      code: this.code,
      error: this.error,
      extra: this.extra
    };
  }

  static ApiErrorMiddleware(err, req, res, next) {
    if (err instanceof ApiError) {
      return res.status(err.responseCode).json(err.response);
    }
    if (err instanceof Sequelize.UniqueConstraintError) {
      return res
        .status(E.UNIQUE_CONSTRAINT_ERROR.responseCode)
        .send({
          code: E.UNIQUE_CONSTRAINT_ERROR.code,
          error: E.UNIQUE_CONSTRAINT_ERROR.error,
          message: E.UNIQUE_CONSTRAINT_ERROR.message,
          extra: err.message
        });
    }
    if (err instanceof Sequelize.ValidationError) {
      let validationErrors = err.errors.map(error => ({
        field: error.path,
        message: error.message
      }));
      return res
        .status(E.VALIDATION_ERRORS.responseCode)
        .send({
          code: E.VALIDATION_ERRORS.code,
          error: E.VALIDATION_ERRORS.error,
          message: E.VALIDATION_ERRORS.message,
          fields: validationErrors
        });
    }
    return next(err);
  }

  static LastErrorMiddleware(err, req, res, next) {
    log.error(err);
    res
      .status(E.INTERNAL_SERVER_ERROR.responseCode)
      .send({
        code: E.INTERNAL_SERVER_ERROR.code,
        error: E.INTERNAL_SERVER_ERROR.error,
        message: E.INTERNAL_SERVER_ERROR.message,
        extra: err.message
      });
  }

  static NotFoundMiddleware(req, res) {
    let err = new ApiError(E.NOT_FOUND);
    res.status(err.responseCode).json(err.response);
  }
}

module.exports = {ApiError, E};

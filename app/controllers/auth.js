const {Router} = require('express');
const db = require('../models/index');
const {ApiError, E} = require('../helpers/server-error');
const {Cognito} = require('../services/Cognito');

const router = Router();

/**
 * @api {post} /api/auth/sign-up Create User account in User Pool
 * @apiName SignUp
 * @apiGroup Auth
 * @apiSuccess (200) Success Email sent successfully
 *
 * @apiParam {String} email User's email
 * @apiParamExample {json} Request-Example:
 * {
 *  "email": "email@example.com"
 * }
 * @apiParam {String} password User's password
 * @apiParamExample {json} Request-Example:
 * {
 *  "password": "Test@123"
 * }
 * @apiParam {String} phoneNumber User's Phone Number
 * @apiParamExample {json} Request-Example:
 * {
 *  "phone": "+14325551212"
 * }
 * @apiParam {String} name User's Name
 * @apiParamExample {json} Request-Example:
 * {
 *  "name": "John Doe"
 * }
 *
 */
/*eslint-disable*/
router.post("/auth/sign-up", async (req, res, next) => {
  try {
    let response = await Cognito.signUp({
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone,
      name: req.body.name
    });

    await db.sequelize.transaction(async transaction => {
      await db.User.create(
        {
          email: req.body.email,
          phone: req.body.phone,
          name: req.body.name,
          cognitoUsername: response.userSub
        },
        { transaction }
      );

      return res.status(200).json(response);
    });
  } catch (err) {
    if (err.code === "UsernameExistsException") {
      return next(new ApiError(E.UNIQUE_EMAIL_ERROR));
    }
    if (err.code === "InvalidParameterException") {
      return next(new ApiError(E.VALIDATION_ERRORS));
    }
    return next(new ApiError(E.INTERNAL_SERVER_ERROR));
  }
});

/**
 * @api {post} /api/auth/sign-up-verification Verify email account in User Pool
 * @apiName SignUpVerification
 * @apiGroup Auth
 * @apiSuccess (200) Success Code sent successfully
 *
 * @apiParam {String} email User's email
 * @apiParamExample {json} Request-Example:
 * {
 *  "email": "email@example.com"
 * }
 * @apiParam {String} code User's verification code
 * @apiParamExample {json} Request-Example:
 * {
 *  "code": "123456"
 * }
 *
 */

router.post("/auth/sign-up-verification", async (req, res, next) => {
  try {
    const response = await Cognito.signUpVerification(
      req.body.email,
      req.body.code
    );

    return res.status(200).json(response);
  } catch (err) {
    if (err.code === "SerializationException") {
      return next(new ApiError(E.VALIDATION_ERRORS));
    }
    if (err.code === "UserNotFoundException") {
      return next(new ApiError(E.USER_NOT_FOUND));
    }
    if (err.code === "NotAuthorizedException") {
      return next(new ApiError(E.UNAUTHORIZED));
    }
    return next(new ApiError(E.INTERNAL_SERVER_ERROR));
  }
});

/**
 * @api {post} /api/auth/sign-in Sign in to application
 * @apiName SignIn
 * @apiGroup Auth
 * @apiSuccess (200) Success Signed User In
 *
 * @apiParam {String} email User's email
 * @apiParamExample {json} Request-Example:
 * {
 *  "email": "email@example.com"
 * }
 * @apiParam {String} password User's password
 * @apiParamExample {json} Request-Example:
 * {
 *  "password": "secret_password"
 * }
 *
 * @apiError (ApiError) SUPPLIER_NOT_FOUND No supplier associated to user
 * @apiErrorExample {json} Error-Example:
 * {
 *  "message": "Supplier not found.",
 *  "code": 4044,
 *  "error": "SUPPLIER_NOT_FOUND"
 * }
 * @apiError (ApiError) INCORRECT_CREDENTIALS Uncorrect login credentials provided
 * @apiErrorExample {json} Error-Example:
 * {
 *  "message": "Incorrect username or password.",
 *  "code": 4001,
 *  "error": "INCORRECT_CREDENTIALS"
 * }
 */

router.post("/auth/sign-in", async (req, res, next) => {
  try {
    let response = await Cognito.signIn({
      email: req.body.email,
      password: req.body.password
    });

    let user = await db.User.find({ where: { email: req.body.email } });
    if (!user) {
      return next(new ApiError(E.SUPPLIER_NOT_FOUND));
    }
    response.user_id = user.id;
    return res.status(200).json(response);
  } catch (err) {
    if (
      err.code === "UserNotFoundException" ||
      err.code === "NotAuthorizedException"
    ) {
      return next(new ApiError(E.INCORRECT_CREDENTIALS));
    }
    if (err.code === "LimitExceededException") {
      return next(new ApiError(E.LIMIT_EXCEEDED));
    }
    return next(new ApiError(E.INTERNAL_SERVER_ERROR));
  }
});

/**
 * @api {post} /api/auth/sign-out Sign Out User
 * @apiName SignOut
 * @apiGroup Auth
 * @apiSuccess (200) Success Email sent successfully
 *
 * @apiParam {String} email User's email
 * @apiParamExample {json} Request-Example:
 * {
 *  "email": "email@example.com"
 * }
 *
 */

router.post("/auth/sign-out", async (req, res, next) => {
  try {
    const user = await db.User.find({ where: { id: req.body.userId } });
    const response = await Cognito.signOut(user.email);

    return res.status(200).json(response);
  } catch (err) {
    return next(new ApiError(E.INTERNAL_SERVER_ERROR));
  }
});

/**
 * @api {post} /api/auth/password-reset Reset user's password
 * @apiName PasswordReset
 * @apiGroup Auth
 * @apiSuccess (200) Success Password Reset for User.
 *
 * @apiParam {String} email User's email
 * @apiParamExample {json} Request-Example:
 * {
 *  "email": "email@example.com"
 * }
 *
 * @apiError (ApiError) EMAIL_NOT_EXISTS User with email not found
 * @apiErrorExample {json} Error-Example:
 * {
 *  "message": "This email does not exist",
 *  "code": 4001,
 *  "error": "EMAIL_NOT_EXISTS"
 * }
 */

router.post("/auth/password-reset", async (req, res, next) => {
  try {
    const response = await Cognito.forgotPassword(req.body.email);

    return res.status(200).json(response);
  } catch (err) {
    if (err.code === "SerializationException") {
      return next(new ApiError(E.VALIDATION_ERRORS));
    }
    if (err.code === "UserNotFoundException") {
      return next(new ApiError(E.USER_NOT_FOUND));
    }
    if (err.code === "LimitExceededException") {
      return next(new ApiError(E.LIMIT_EXCEEDED));
    }
    return next(new ApiError(E.INTERNAL_SERVER_ERROR));
  }
});

/**
 * @api {post} /api/auth/password-confirm Confirm user's new password
 * @apiName PasswordConfirm
 * @apiGroup Auth
 * @apiSuccess (200) Success Password Confirm for User.
 *
 * @apiParam {String} email User's email
 * @apiParamExample {json} Request-Example:
 * {
 *  "email": "email@example.com",
 *  "newPassword": "Test@123",
 *  "verificationCode": "1234"
 * }
 *
 * @apiError (ApiError) EMAIL_NOT_EXISTS User with email not found
 * @apiErrorExample {json} Error-Example:
 * {
 *  "message": "This email does not exist",
 *  "code": 4001,
 *  "error": "EMAIL_NOT_EXISTS"
 * }
 */

router.post("/auth/password-confirm", async (req, res, next) => {
  try {
    const response = await Cognito.confirmPassword(
      req.body.email,
      req.body.newpassword,
      req.body.verificationcode
    );

    return res.status(200).json(response);
  } catch (err) {
    if (err.code === "InvalidParameterException") {
      return next(new ApiError(E.VALIDATION_ERRORS));
    }
    if (err.code === "ExpiredCodeException") {
      return next(new ApiError(E.VERIFICATION_CODE_NOT_FOUND));
    }
    if (err.code === "UserNotFoundException") {
      return next(new ApiError(E.USER_NOT_FOUND));
    }
    return next(new ApiError(E.INTERNAL_SERVER_ERROR));
  }
});

module.exports = router;

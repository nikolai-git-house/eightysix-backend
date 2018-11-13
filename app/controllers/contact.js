const {Router} = require('express');
const db = require('../models/index');
const config = require('../../config');

const {mailer, MailTemplates} = require('../services/Mailer');

const router = Router();

/**
 * @api {post} /api/contact/form Send contact form
 * @apiName ContactForm
 * @apiGroup Contact
 * @apiSuccess (200) Success Application sent successfully
 *
 * @apiParam {String} email email
 * @apiParam {String} name name
 * @apiParam {String} message message
 * @apiParamExample {json} Request-Example:
 * {
 *  "email": "email@example.com",
 *  "name": "John Doe",
 *  "message": "Hello world!"
 * }
 *
 * @apiError (ApiError) VALIDATION_ERRORS Request validation errors
 * @apiErrorExample {json} Error-Example:
 * {
 *  "code": 4220,
 *  "error": "VALIDATION_ERRORS",
 *  "message": "Validation errors",
 *  "fields": [
 *   {
 *       "field": "email",
 *       "message": "Please, fill your email"
 *   }
 *  ]
 * }
 */

router.post('/contact/form', async (req, res, next) => {
  try {
    let {email, name, message} = req.body;

    await db.Application.create({email, name, message});
    await mailer.send(config.mailer.contactEmail, MailTemplates.CONTACT_EMAIL, {email, name, message});

    return res.sendStatus(200);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

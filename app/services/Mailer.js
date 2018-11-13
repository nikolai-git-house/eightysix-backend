const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const nodemailer = require('nodemailer');
const {promisifyAll} = require('bluebird');
const {mjml2html} = require('mjml');
const config = require('../../config');

const TEMPLATES_PATH = path.join(__dirname, '../mail-templates');

function loadTemplate(templateName) {
  let rawTemplate = fs.readFileSync(path.join(TEMPLATES_PATH, templateName), 'utf-8');
  return ejs.compile(mjml2html(rawTemplate).html);
}

const MailTemplates = {
  LOGIN_EMAIL: {
    subject: 'Login to EightySix Analytics',
    compileHtml: loadTemplate('login-email.mjml.ejs'),
    compileText({userName, loginLink}) {
      return `Hello ${userName},\nPlease follow this link to login: ${loginLink}`;
    }
  },
  CONTACT_EMAIL: {
    subject: 'Customer application at EightySix Analytics',
    compileHtml: loadTemplate('contact-email.mjml.ejs'),
    compileText({name, email, message}) {
      return `${name} (${email}), has sent the message:\n${message}`;
    }
  }
};

class Mailer {
  constructor(mailerConfig) {
    this.transporter = promisifyAll(nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.mailer.auth.user,
        pass: config.mailer.auth.pass
      }
    }));
    this.fromAddress = mailerConfig.from;
  }

  send(to, mailTemplate, data) {
    return this.transporter.sendMailAsync({
      from: `<${this.fromAddress}>`,
      to,
      subject: mailTemplate.subject,
      text: mailTemplate.compileText(data),
      html: mailTemplate.compileHtml(data)
    });
  }
}

const mailer = new Mailer(config.mailer);

module.exports = {
  mailer,
  MailTemplates
};

require('dotenv').load();

const ENV = process.env.NODE_ENV === 'production' ? 'production' : 'development';

module.exports = {
  env: ENV,
  isDevMode: ENV === 'development',
  app: {
    url: process.env.APP_URL
  },
  api: {
    port: process.env.API_PORT
  },
  db: {
    host: process.env.RDS_HOSTNAME,
    username: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DB_NAME,
    sslEnabled: process.env.POSTGRES_SSL === 'true'
  },
  mailer: {
    contactEmail: process.env.MAIL_CONTACT,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD
    }
  },
  cognito: {
    identityPoolId: process.env.IDENTITY_POOL_ID,
    region: process.env.REGION,
    userPoolId: process.env.USER_POOL_ID,
    userPoolWebClientId: process.env.USER_POOL_WEB_CLIENT_ID
  },
  aws: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  }
};

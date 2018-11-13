const CognitoExpress = require('cognito-express');
const config = require('../../config');
const db = require('../models');

const cognitoExpress = new CognitoExpress({
  region: config.cognito.region,
  cognitoUserPoolId: config.cognito.userPoolId,
  tokenUse: 'id',
  tokenExpiration: 3600000
});
/*eslint-disable*/
module.exports = () => (req, res, next) => {
  let accessTokenFromClient = req.headers.authorization.replace("Bearer ", "");
  if (!accessTokenFromClient)
    return res.status(401).send("Access Token missing from header");
  cognitoExpress.validate(accessTokenFromClient, async (err, response) => {
    if (err) return res.status(401).send(err);
    let user = await db.User.findOne({ where: { email: response.email } });
    req.user = user.get();
    req.user.role = response["cognito:groups"];
    next();
  });
};

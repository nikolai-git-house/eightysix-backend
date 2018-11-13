const access = require('./access');
const role = require('./role');

module.exports = (action, resource) => {
  let middlewares = [];
  middlewares.push(access());
  middlewares.push(role(action, resource));
  return middlewares;
};

const {ac} = require('../auth/access-control');

module.exports = (action, resource) => (req, res, next) => {
  let permission = ac.can(req.user.role)[action](resource);
  if (permission.granted) {
    return next();
  }
  return next(new Error('You don\'t have permission'));
};

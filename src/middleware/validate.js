const AppError = require('../utils/AppError');

const validate = (validatorFn) => {
  return (req, res, next) => {
    const error = validatorFn(req.body);
    if (error) {
      return next(new AppError(error, 400));
    }
    next();
  };
};

module.exports = validate;

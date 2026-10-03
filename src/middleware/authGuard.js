const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const requireAuth = catchAsync(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Unauthorized: Access token missing. Please log in.', 401));
  }

  try {
    const decoded = verifyAccessToken(token);

    // Verify user still exists in database
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    req.user = currentUser;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('TokenExpired: Access token has expired. Please refresh token.', 401));
    }
    return next(new AppError('Invalid token: Authentication failed.', 401));
  }
});

const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return next(new AppError('Forbidden: SuperAdmin privileges required.', 403));
  }
  next();
};

module.exports = {
  requireAuth,
  requireSuperAdmin,
};

const jwt = require('jsonwebtoken');
const config = require('../config');

const signAccessToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

const signRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn,
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwtRefreshSecret);
};

// Backward compatibility
const signToken = signAccessToken;
const verifyToken = verifyAccessToken;

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  signToken,
  verifyToken,
};

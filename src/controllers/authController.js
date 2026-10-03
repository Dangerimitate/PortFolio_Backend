const AuthService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');

const sendOtp = catchAsync(async (req, res) => {
  const result = await AuthService.sendOtp(req.body);
  res.json({
    status: 'success',
    message: result.message,
    channel: result.channel,
    recipient: result.recipient,
    expiresInSeconds: result.expiresInSeconds,
    otp: result.otp, // Provided for easy dev / demo testing
  });
});

const verifyOtp = catchAsync(async (req, res) => {
  const result = await AuthService.verifyOtp(req.body);
  console.log(`✅ OTP login successful for user: ${result.user.name} (${result.user.email || result.user.number})`);

  res.json({
    status: 'success',
    message: 'OTP verified successfully. Login successful!',
    ...result,
  });
});

const superadminLogin = catchAsync(async (req, res) => {
  const result = await AuthService.superadminLogin(req.body);
  console.log(`👑 SuperAdmin logged in: ${result.user.name} (${result.user.email})`);

  res.json({
    status: 'success',
    message: 'SuperAdmin login successful!',
    ...result,
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const token = req.body.refreshToken || req.headers['x-refresh-token'];
  const result = await AuthService.refreshTokens(token);

  res.json({
    status: 'success',
    message: 'Access token refreshed successfully',
    ...result,
  });
});

const me = catchAsync(async (req, res) => {
  res.json({
    status: 'success',
    user: req.user,
  });
});

const register = catchAsync(async (req, res) => {
  const result = await AuthService.registerUser(req.body);
  console.log(`✅ New user registered: ${result.user.name} (${result.user.number})`);

  res.status(201).json({
    status: 'success',
    message: 'User registered successfully',
    ...result,
  });
});

const login = catchAsync(async (req, res) => {
  const result = await AuthService.loginUser(req.body);
  console.log(`✅ User logged in: ${result.user.name} (${result.user.number})`);

  res.json({
    status: 'success',
    message: 'Login successful',
    ...result,
  });
});

const getUsers = catchAsync(async (req, res) => {
  const users = await AuthService.getAllUsers();
  res.json({
    status: 'success',
    users,
    total: users.length,
  });
});

module.exports = {
  sendOtp,
  verifyOtp,
  superadminLogin,
  refreshToken,
  me,
  register,
  login,
  getUsers,
};

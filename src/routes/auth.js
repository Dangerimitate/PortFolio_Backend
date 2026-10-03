const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { requireAuth, requireSuperAdmin } = require('../middleware/authGuard');
const {
  validateSendOtpPayload,
  validateVerifyOtpPayload,
  validateSuperadminPayload,
  validateRegisterPayload,
  validateLoginPayload,
} = require('../validators/authValidators');

const router = express.Router();

// Public OTP Endpoints
router.post('/send-otp', validate(validateSendOtpPayload), authController.sendOtp);
router.post('/verify-otp', validate(validateVerifyOtpPayload), authController.verifyOtp);

// Public SuperAdmin Endpoints
router.post('/superadmin/login', validate(validateSuperadminPayload), authController.superadminLogin);

// Token Refresh Endpoint
router.post('/refresh', authController.refreshToken);

// Protected Verification Endpoint
router.get('/me', requireAuth, authController.me);

// Legacy/Classic Auth Endpoints
router.post('/register', validate(validateRegisterPayload), authController.register);
router.post('/login', validate(validateLoginPayload), authController.login);
router.get('/users', requireAuth, requireSuperAdmin, authController.getUsers);

module.exports = router;

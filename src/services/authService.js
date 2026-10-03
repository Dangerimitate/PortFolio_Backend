const bcrypt = require('bcryptjs');
const UserModel = require('../models/User');
const OtpService = require('./otpService');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');
const AppError = require('../utils/AppError');

class AuthService {
  /**
   * Request 6-digit OTP to be sent to phone or email
   */
  static async sendOtp({ channel, recipient }) {
    return OtpService.sendOtp({ channel, recipient });
  }

  /**
   * Verify 6-digit OTP and login or create user
   */
  static async verifyOtp({ channel, recipient, otp }) {
    // 1. Validate OTP
    await OtpService.verifyOtp({ channel, recipient, otp });

    // 2. Find or register user for this phone/email
    const user = await UserModel.findOrCreateFromOtp({ channel, recipient });

    // 3. Issue Access Token & Refresh Token
    const payload = {
      id: user.id || user._id,
      name: user.name,
      email: user.email,
      number: user.number,
      role: user.role || 'user',
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ id: payload.id });

    return {
      accessToken,
      refreshToken,
      token: accessToken, // Backward compatibility
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        number: user.number,
        role: user.role || 'user',
      },
    };
  }

  /**
   * SuperAdmin secure login
   */
  static async superadminLogin({ identifier, password }) {
    const user = await UserModel.findByEmailOrUsername(identifier);

    if (!user) {
      throw new AppError('Invalid credentials. SuperAdmin not found.', 401);
    }

    if (user.role !== 'superadmin') {
      throw new AppError('Access denied. This portal is restricted to SuperAdmin accounts.', 403);
    }

    if (!user.password) {
      throw new AppError('Account has no password set.', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials. Wrong password.', 401);
    }

    const payload = {
      id: user.id || user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ id: payload.id });

    return {
      accessToken,
      refreshToken,
      token: accessToken, // Backward compatibility
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
  }

  /**
   * Refresh Access Token using valid Refresh Token
   */
  static async refreshTokens(refreshToken) {
    if (!refreshToken) {
      throw new AppError('Refresh token is required.', 400);
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new AppError('Invalid or expired refresh token. Please sign in again.', 401);
    }

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      throw new AppError('The user associated with this refresh token no longer exists.', 401);
    }

    const payload = {
      id: user.id || user._id,
      name: user.name,
      email: user.email,
      number: user.number,
      role: user.role || 'user',
      username: user.username,
    };

    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken({ id: payload.id });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      token: newAccessToken,
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        number: user.number,
        role: user.role || 'user',
      },
    };
  }

  /**
   * Classic username/number/password registration
   */
  static async registerUser({ name, number, email, password }) {
    const existingUser = await UserModel.findByNumber(number);
    if (existingUser) {
      throw new AppError('User with this phone number already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await UserModel.create({
      name,
      number,
      email,
      password: hashedPassword,
      role: 'user',
    });

    const payload = {
      id: newUser.id || newUser._id,
      name: newUser.name,
      number: newUser.number,
      email: newUser.email,
      role: newUser.role,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ id: payload.id });

    return {
      accessToken,
      refreshToken,
      token: accessToken,
      user: payload,
    };
  }

  /**
   * Classic user login
   */
  static async loginUser({ name, number, password }) {
    const user = await UserModel.findByNumber(number);
    if (!user) {
      throw new AppError('Invalid credentials. User not found.', 401);
    }

    if (user.name && user.name.toLowerCase() !== name.trim().toLowerCase()) {
      throw new AppError('Invalid credentials. Name does not match.', 401);
    }

    if (!user.password) {
      throw new AppError('User has no password set. Please log in with OTP.', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials. Wrong password.', 401);
    }

    const payload = {
      id: user.id || user._id,
      name: user.name,
      number: user.number,
      email: user.email,
      role: user.role || 'user',
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ id: payload.id });

    return {
      accessToken,
      refreshToken,
      token: accessToken,
      user: payload,
    };
  }

  static async getAllUsers() {
    return UserModel.findAll();
  }
}

module.exports = AuthService;

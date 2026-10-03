const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  port: process.env.PORT || 3000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sso',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key_change_in_production',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  corsOrigins: [
    'http://localhost:5001',
    'http://localhost:4200',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5001',
    'http://127.0.0.1:4200',
  ],
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || process.env.EMAIL_USER || '',
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || '"SkarProvince Portal" <noreply@skarprovince.com>',
  },
  sms: {
    twilioSid: process.env.TWILIO_ACCOUNT_SID || '',
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
    twilioPhone: process.env.TWILIO_PHONE_NUMBER || '',
    fast2smsKey: process.env.FAST2SMS_API_KEY || '',
  },
};

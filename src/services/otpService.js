const Otp = require('../models/Otp');
const NotificationService = require('./notificationService');
const AppError = require('../utils/AppError');

// Helper to mask recipient for privacy
const maskRecipient = (channel, recipient) => {
  if (channel === 'email') {
    const [name, domain] = recipient.split('@');
    if (!domain) return recipient;
    const maskedName =
      name.length <= 2
        ? name[0] + '***'
        : name.slice(0, 2) + '***' + name.slice(-1);
    return `${maskedName}@${domain}`;
  } else {
    const cleanNumber = recipient.replace(/\D/g, '');
    if (cleanNumber.length < 4) return recipient;
    return cleanNumber.slice(0, 2) + '******' + cleanNumber.slice(-2);
  }
};

class OtpService {
  /**
   * Generate 6-digit OTP, persist in MongoDB, and trigger real email/SMS dispatch
   */
  static async sendOtp({ channel, recipient }) {
    const normalizedRecipient = recipient.trim().toLowerCase();
    const maskedRecipient = maskRecipient(channel, recipient);

    // 1. Generate 6-digit random code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresInSeconds = 300; // 5 minutes
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    // 2. Persist or update in MongoDB (using upsert so new request refreshes OTP)
    await Otp.findOneAndUpdate(
      { channel, recipient: normalizedRecipient },
      {
        channel,
        recipient: normalizedRecipient,
        otp,
        attempts: 0,
        expiresAt,
        createdAt: new Date(),
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    console.log('\n======================================================');
    console.log(`🔐 [MongoDB OTP Store] Record Saved`);
    console.log(`📡 Channel     : ${channel.toUpperCase()}`);
    console.log(`🎯 Recipient   : ${recipient} (${maskedRecipient})`);
    console.log(`🔑 6-Digit OTP : >>> [ ${otp} ] <<<`);
    console.log(`⏳ Validity    : 5 minutes (${expiresAt.toLocaleTimeString()})`);
    console.log('======================================================\n');

    // 3. Trigger Real Dispatch (Email or Phone)
    let dispatchResult = null;
    if (channel === 'email') {
      dispatchResult = await NotificationService.sendEmailOtp({
        email: normalizedRecipient,
        otp,
        recipientMasked: maskedRecipient,
      });
    } else {
      dispatchResult = await NotificationService.sendSmsOtp({
        phone: recipient,
        otp,
        recipientMasked: maskedRecipient,
      });
    }

    return {
      success: true,
      message: `6-digit OTP successfully sent to ${maskedRecipient}`,
      channel,
      recipient: maskedRecipient,
      rawRecipient: normalizedRecipient,
      otp, // Provided for developer demonstration
      expiresInSeconds,
      deliveryStatus: dispatchResult,
    };
  }

  /**
   * Verify provided 6-digit OTP in MongoDB
   */
  static async verifyOtp({ channel, recipient, otp }) {
    const normalizedRecipient = recipient.trim().toLowerCase();

    // 1. Retrieve OTP document from MongoDB
    const record = await Otp.findOne({ channel, recipient: normalizedRecipient });

    if (!record) {
      throw new AppError(
        'No OTP was requested for this destination or it has already expired.',
        400
      );
    }

    // 2. Check Expiration
    if (new Date() > new Date(record.expiresAt)) {
      await Otp.deleteOne({ _id: record._id });
      throw new AppError('The OTP has expired. Please request a new code.', 400);
    }

    // 3. Check Attempt Limit
    if (record.attempts >= 5) {
      await Otp.deleteOne({ _id: record._id });
      throw new AppError('Too many failed attempts. Please request a new OTP.', 429);
    }

    // 4. Validate Code
    if (record.otp !== String(otp).trim()) {
      record.attempts += 1;
      await record.save();
      const remainingAttempts = 5 - record.attempts;
      throw new AppError(
        `Invalid 6-digit OTP. ${remainingAttempts} attempt(s) remaining.`,
        400
      );
    }

    // 5. Code is valid: delete from MongoDB (single-use token)
    await Otp.deleteOne({ _id: record._id });

    return {
      valid: true,
      channel,
      recipient: normalizedRecipient,
    };
  }
}

module.exports = OtpService;

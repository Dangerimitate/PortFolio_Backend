const nodemailer = require('nodemailer');
const config = require('../config');

class NotificationService {
  /**
   * Cached nodemailer transporter
   */
  static transporter = null;
  static isEthereal = false;

  static async getEmailTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    const { host, port, secure, user, pass } = config.smtp;
    const cleanPass = (pass || '').replace(/['"]/g, '').replace(/\s+/g, '');

    if (user && cleanPass) {
      const isGmail = (host && host.includes('gmail')) || (user && user.endsWith('@gmail.com'));

      if (isGmail) {
        console.log(`📧 [Email Engine] Initializing Gmail Service for: ${user}`);
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user,
            pass: cleanPass,
          },
        });
      } else {
        console.log(`📧 [Email Engine] Initializing custom SMTP (${host}:${port}) for: ${user}`);
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: {
            user,
            pass: cleanPass,
          },
        });
      }

      this.isEthereal = false;
      return this.transporter;
    }

    // Fallback: Automatic Ethereal Test Account
    console.log('📬 [Email Engine] No custom SMTP found in .env. Initializing automatic Ethereal email simulator...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      console.log(`✅ [Email Engine] Ethereal test inbox created: ${testAccount.user}`);

      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.isEthereal = true;
      return this.transporter;
    } catch (err) {
      console.warn(`⚠️ [Email Engine] Failed to initialize Ethereal: ${err.message}`);
      return null;
    }
  }

  /**
   * Send 6-Digit OTP via Email
   */
  static async sendEmailOtp({ email, otp, recipientMasked }) {
    const transporter = await this.getEmailTransporter();

    const { user } = config.smtp;
    const sender =
      user && user.includes('@')
        ? `"SkarProvince Identity" <${user}>`
        : config.smtp.from;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 16px; padding: 32px; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="margin: 0; color: #6366f1; font-size: 20px; letter-spacing: 0.05em;">SKAR PROVINCE IDENTITY</h2>
          <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">One-Time Passcode Verification</p>
        </div>
        <div style="background: #1e293b; border-radius: 12px; padding: 24px; text-align: center; border: 1px dashed #6366f1;">
          <span style="font-size: 12px; color: #a5b4fc; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">Your 6-Digit Verification Code</span>
          <div style="font-size: 30px; font-weight: 800; letter-spacing: 0.25em; color: #38bdf8; margin: 14px 0; font-family: monospace;">
            ${otp}
          </div>
          <span style="font-size: 12px; color: #94a3b8;">Valid for <strong>5 minutes</strong>. Do not share this code with anyone.</span>
        </div>
        <div style="margin-top: 24px; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
          This verification code was requested for <strong>${email}</strong>. If you did not initiate this request, please disregard.
        </div>
      </div>
    `;

    if (!transporter) {
      console.log(`📧 [Email Fallback] Transporter unavailable. OTP for ${email} is ${otp}`);
      return { delivered: false, previewUrl: null };
    }

    try {
      const info = await transporter.sendMail({
        from: sender,
        to: email,
        subject: `Your Verification Code: ${otp} - SkarProvince`,
        text: `Your 6-digit verification code is: ${otp}. It will expire in 5 minutes.`,
        html: htmlContent,
      });

      let previewUrl = null;
      if (this.isEthereal) {
        previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`\n📨 ========================================================`);
        console.log(`🌐 [REAL EMAIL SENT via Ethereal]`);
        console.log(`🔗 VIEW LIVE EMAIL IN BROWSER: ${previewUrl}`);
        console.log(`📨 ========================================================\n`);
      } else {
        console.log(`\n📬 ========================================================`);
        console.log(`✅ [GMAIL SMTP DELIVERED]`);
        console.log(`🎯 Recipient : ${email}`);
        console.log(`🔑 OTP       : ${otp}`);
        console.log(`🆔 MessageId : ${info.messageId}`);
        console.log(`📬 ========================================================\n`);
      }

      return {
        delivered: true,
        previewUrl,
        messageId: info.messageId,
      };
    } catch (err) {
      console.error(`❌ [Email Error] Could not send email: ${err.message}`);
      return { delivered: false, error: err.message };
    }
  }

  /**
   * Send 6-Digit OTP via Phone (SMS)
   */
  static async sendSmsOtp({ phone, otp, recipientMasked }) {
    const { twilioSid, twilioAuthToken, twilioPhone, fast2smsKey } = config.sms;

    // 1. Twilio Integration (if configured in .env)
    if (twilioSid && twilioAuthToken && twilioPhone) {
      try {
        const twilio = require('twilio')(twilioSid, twilioAuthToken);
        const msg = await twilio.messages.create({
          body: `[SkarProvince] Your 6-digit verification code is: ${otp}. Valid for 5 minutes.`,
          from: twilioPhone,
          to: phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`,
        });
        console.log(`✅ [Twilio SMS Sent] SID: ${msg.sid} to ${phone}`);
        return { delivered: true, provider: 'twilio', sid: msg.sid };
      } catch (err) {
        console.error(`❌ [Twilio SMS Error] ${err.message}`);
      }
    }

    // 2. Fast2SMS Integration (if configured in .env)
    if (fast2smsKey) {
      try {
        const cleanNumber = phone.replace(/\D/g, '').slice(-10);
        const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            authorization: fast2smsKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'otp',
            variables_values: otp,
            numbers: cleanNumber,
          }),
        });
        const data = await response.json();
        console.log(`✅ [Fast2SMS Sent] Response:`, data);
        return { delivered: true, provider: 'fast2sms', response: data };
      } catch (err) {
        console.error(`❌ [Fast2SMS Error] ${err.message}`);
      }
    }

    // 3. Fallback: Detailed Carrier Simulation Log
    console.log(`\n📱 ========================================================`);
    console.log(`📡 [SMS GATEWAY DISPATCH]`);
    console.log(`🎯 Recipient Mobile : ${phone} (${recipientMasked})`);
    console.log(`💬 Message Content  : "[SkarProvince] Your verification code is ${otp}. Valid for 5 minutes."`);
    console.log(`💡 NOTE: To deliver real cellular SMS, add TWILIO or FAST2SMS keys to .env`);
    console.log(`📱 ========================================================\n`);

    return {
      delivered: false,
      simulated: true,
      message: 'SMS simulated (Add TWILIO credentials in .env for live carrier delivery)',
    };
  }
}

module.exports = NotificationService;

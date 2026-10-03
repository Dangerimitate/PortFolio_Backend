const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      enum: ['email', 'phone'],
      required: true,
    },
    recipient: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
      trim: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300, // MongoDB TTL index: Document auto-deletes 300s (5m) after createdAt
    },
  },
  {
    timestamps: false,
  }
);

// Compound index on channel and recipient
otpSchema.index({ channel: 1, recipient: 1 });

const Otp = mongoose.model('Otp', otpSchema);

module.exports = Otp;

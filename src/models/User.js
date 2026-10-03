const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      index: true,
    },
    number: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      index: true,
    },
    password: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['user', 'superadmin', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

// Static search methods
userSchema.statics.findByNumber = function (number) {
  const cleanNumber = String(number).trim();
  return this.findOne({ number: cleanNumber });
};

userSchema.statics.findByEmail = function (email) {
  const cleanEmail = String(email).trim().toLowerCase();
  return this.findOne({ email: cleanEmail });
};

userSchema.statics.findByEmailOrUsername = function (identifier) {
  const clean = String(identifier).trim().toLowerCase();
  return this.findOne({
    $or: [
      { email: clean },
      { username: clean },
      { number: clean },
      { name: new RegExp(`^${clean}$`, 'i') },
    ],
  });
};

userSchema.statics.findOrCreateFromOtp = async function ({ channel, recipient }) {
  const cleanRecipient = recipient.trim();
  let existingUser = null;

  if (channel === 'email') {
    existingUser = await this.findByEmail(cleanRecipient);
  } else {
    existingUser = await this.findByNumber(cleanRecipient);
  }

  if (existingUser) {
    return existingUser;
  }

  // Create new user for first-time OTP sign in
  const generatedName =
    channel === 'email'
      ? cleanRecipient.split('@')[0]
      : `User_${cleanRecipient.slice(-4)}`;

  const formattedName =
    generatedName.charAt(0).toUpperCase() + generatedName.slice(1);

  const newUser = await this.create({
    name: formattedName,
    email: channel === 'email' ? cleanRecipient.toLowerCase() : undefined,
    number: channel === 'phone' ? cleanRecipient : undefined,
    role: 'user',
    password: null,
  });

  return newUser;
};

userSchema.statics.findAll = function () {
  return this.find({}, '-password').lean();
};

const User = mongoose.model('User', userSchema);

module.exports = User;

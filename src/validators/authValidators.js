const validateSendOtpPayload = (body) => {
  const { channel, recipient } = body;

  if (!channel || !['email', 'phone'].includes(channel.toLowerCase())) {
    return 'Channel must be either "email" or "phone"';
  }

  if (!recipient || typeof recipient !== 'string' || !recipient.trim()) {
    return 'Recipient (email address or phone number) is required';
  }

  const cleanRecipient = recipient.trim();

  if (channel.toLowerCase() === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanRecipient)) {
      return 'Please enter a valid email address';
    }
  } else {
    const cleanNumber = cleanRecipient.replace(/\D/g, '');
    if (cleanNumber.length < 10 || cleanNumber.length > 15) {
      return 'Phone number must contain between 10 and 15 digits';
    }
  }

  return null;
};

const validateVerifyOtpPayload = (body) => {
  const { channel, recipient, otp } = body;

  if (!channel || !['email', 'phone'].includes(channel.toLowerCase())) {
    return 'Channel must be either "email" or "phone"';
  }

  if (!recipient || typeof recipient !== 'string' || !recipient.trim()) {
    return 'Recipient is required';
  }

  if (!otp || !/^\d{6}$/.test(String(otp).trim())) {
    return 'OTP must be a valid 6-digit number';
  }

  return null;
};

const validateSuperadminPayload = (body) => {
  const { identifier, password } = body;

  if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
    return 'SuperAdmin Email or Username is required';
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    return 'Password is required';
  }

  return null;
};

const validateRegisterPayload = (body) => {
  const { name, number, password } = body;

  if (!name || !number || !password) {
    return 'All fields (name, number, password) are required';
  }

  if (!/^\d{10}$/.test(number)) {
    return 'Phone number must be exactly 10 digits';
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters long';
  }

  return null;
};

const validateLoginPayload = (body) => {
  const { name, number, password } = body;

  if (!name || !number || !password) {
    return 'All fields (name, number, password) are required';
  }

  return null;
};

module.exports = {
  validateSendOtpPayload,
  validateVerifyOtpPayload,
  validateSuperadminPayload,
  validateRegisterPayload,
  validateLoginPayload,
};

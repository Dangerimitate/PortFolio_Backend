# Portfolio Backend - Authentication & Identity Microservice

Enterprise-grade authentication microservice supporting **SuperAdmin authentication**, **6-digit dynamic OTP verification (Email & Phone)**, and **Access Token / Refresh Token rotation** with MongoDB persistence.

---

## 🚀 Key Features

- **6-Digit Dynamic OTP Engine**:
  - Delivers one-time passcodes via **Email (Gmail SMTP/Nodemailer)** or **Phone (SMS Gateway)**.
  - Native MongoDB TTL (Time-To-Live) index for 5-minute auto-expiry.
  - Rate limiting & single-use invalidation.
- **SuperAdmin Role Access**:
  - Secure credential authentication with bcrypt hashing.
  - Role-based authorization middleware (`requireSuperAdmin`).
- **Token Security Architecture**:
  - Short-lived Access Tokens (15 minutes).
  - Long-lived Refresh Tokens (7 days) with token rotation on `/api/auth/refresh`.
  - Protected API routes verified via `requireAuth` middleware.
- **Database (MongoDB & Mongoose)**:
  - Persistent user and OTP collections.
  - Automatic startup seeding for default administrative accounts.

---

## 📦 Tech Stack

- **Runtime**: Node.js & Express.js
- **Database**: MongoDB & Mongoose ODM
- **Security**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, CORS
- **Email Service**: Nodemailer (Gmail / SMTP / Ethereal)

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update your MongoDB URI, JWT secrets, and Gmail App Password.

### 3. Run Server
```bash
# Production mode
npm start

# Development with hot-reload
npm run dev
```

---

## 📡 API Endpoints

| Method | Endpoint | Description | Protection |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/send-otp` | Generate and dispatch 6-digit OTP | Public |
| `POST` | `/api/auth/verify-otp` | Verify OTP & issue access/refresh tokens | Public |
| `POST` | `/api/auth/superadmin/login` | SuperAdmin login | Public |
| `POST` | `/api/auth/refresh` | Refresh access token using refresh token | Public |
| `GET` | `/api/auth/me` | Current authenticated user profile | Bearer Token |
| `GET` | `/api/auth/users` | List all users | SuperAdmin Only |
| `GET` | `/api/health` | Service health status | Public |

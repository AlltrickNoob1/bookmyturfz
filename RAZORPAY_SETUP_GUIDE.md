# Razorpay Payment Integration - Setup Guide

## Overview
This guide will help you set up Razorpay QR payment integration for your Turfz booking application.

## Prerequisites
- Razorpay Account: https://razorpay.com (Sign up for free)
- Node.js 14+ installed
- npm or yarn package manager

---

## Step 1: Get Razorpay Credentials

1. **Create/Login to Razorpay Account**
   - Go to https://dashboard.razorpay.com
   - Sign up or log in with your email

2. **Get API Keys**
   - Navigate to Settings → API Keys
   - You'll see two keys:
     - **Key ID** (public key) - starts with `rzp_live_` or `rzp_test_`
     - **Key Secret** (private key) - keep this SECRET, never commit to repo

3. **Test vs Live Mode**
   - For development, use **Test Keys**
   - For production, use **Live Keys** (requires business verification)

---

## Step 2: Setup Backend Environment

1. **Create `.env` file in backend folder**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit `backend/.env` and add your credentials:**
   ```env
   RAZORPAY_KEY_ID=rzp_test_1234567890abcd
   RAZORPAY_KEY_SECRET=your_secret_key_here
   PORT=5000
   NODE_ENV=development
   FIREBASE_PROJECT_ID=turf-1c32c
   ```

3. **Install Backend Dependencies**
   ```bash
   npm install
   ```

---

## Step 3: Setup Frontend Environment

1. **Create `.env` file in root folder**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and add Razorpay Key ID:**
   ```env
   REACT_APP_RAZORPAY_KEY_ID=rzp_test_1234567890abcd
   REACT_APP_BACKEND_URL=http://localhost:5000
   ```

   > **Note:** Use only the **Key ID** in frontend, NEVER expose the Secret Key

3. **Restart React App**
   ```bash
   npm start
   ```
   (Changes to `.env` require app restart)

---

## Step 4: Run the Backend Server

1. **Open a new terminal and navigate to backend:**
   ```bash
   cd backend
   npm start
   ```

   You should see:
   ```
   🚀 Razorpay Payment Server running on http://localhost:5000
   📍 Payment API: POST http://localhost:5000/api/payment/create-order
   📍 Verify API: POST http://localhost:5000/api/payment/verify-payment
   ```

---

## Step 5: Test the Payment Flow

1. **Login to your app** at `http://localhost:3001`

2. **Book a turf:**
   - Select a sport category
   - Click "Book Now"
   - Select a date and time
   - Click the time slot to create booking

3. **Go to Payment page:**
   - Booking details should display
   - Select "Pay with QR (Razorpay)"
   - Click "Pay Now"

4. **Complete Test Payment:**
   - Razorpay modal will open
   - Use these test cards (Mode: Test):
     - **Success:** 4111111111111111 (Visa)
     - **CVV:** Any 3 digits
     - **Expiry:** Any future date
   - Complete the payment

5. **Verify Payment Success:**
   - You should see "Payment Successful!" toast
   - Payment status should show "Confirmed"
   - Booking data should be updated in Firebase

---

## Project Structure

```
Turfz/
├── frontend (React app)
│   ├── src/
│   │   ├── pages/Payment.jsx       ← Updated with Razorpay integration
│   │   ├── components/TimeSelectModal.jsx  ← Updated with bookingId & amount
│   │   └── firebase-config/config.js
│   ├── .env                        ← Create from .env.example
│   └── .env.example                ← Template with required vars
│
├── backend/                        ← NEW: Payment processing server
│   ├── server.js                   ← Express app entry point
│   ├── controllers/paymentController.js    ← Order creation & verification
│   ├── routes/payment.js           ← API routes
│   ├── config/razorpay.js          ← Razorpay SDK initialization
│   ├── package.json                ← Dependencies
│   ├── .env                        ← Create from .env.example
│   └── .env.example                ← Template with required vars
```

---

## Payment Flow

```
1. User selects time and books turf
   ↓
2. Booking data saved to Firebase with:
   - bookingId, amount, paymentStatus: "Pending"
   
3. User clicks "Pay Now" on Payment page
   ↓
4. Frontend calls: POST /api/payment/create-order
   - Backend creates Razorpay order
   - Returns orderId and amount
   
5. Frontend opens Razorpay modal with QR code
   ↓
6. User scans QR or enters card details
   - Payment processed by Razorpay
   
7. Success callback triggers verification
   ↓
8. Frontend calls: POST /api/payment/verify-payment
   - Backend verifies HMAC signature
   - Confirms payment with Razorpay API
   
9. Payment status updated in Firebase to "Confirmed"
   ↓
10. User sees success message
```

---

## Database Schema (Updated)

**Booking Data in Realtime Database:**
```
users/{uid}/data = {
  booking: { id, name, address, price, image },
  time: "5:00 AM",
  bookingDate: "2024-01-15",
  uid: "user123",
  email: "user@email.com",
  bookingId: "user123_1705275600000",    ← NEW
  amount: 400,                           ← NEW
  paymentStatus: "Confirmed",            ← NEW (Pending/Confirmed)
  paymentId: "pay_1234567890abcd",       ← NEW
  orderId: "order_1234567890abcd"        ← NEW
}
```

---

## Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `RAZORPAY_KEY_ID` | Public key from Razorpay dashboard | `rzp_test_abc123...` |
| `RAZORPAY_KEY_SECRET` | Secret key (NEVER expose) | `secret_xyz789...` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` / `production` |
| `FIREBASE_PROJECT_ID` | Firebase project | `turf-1c32c` |

### Frontend (`.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_RAZORPAY_KEY_ID` | Razorpay Key ID only | `rzp_test_abc123...` |
| `REACT_APP_BACKEND_URL` | Backend API URL | `http://localhost:5000` |

---

## Troubleshooting

### Issue: "RAZORPAY_KEY_ID is required"
- ✅ Check `backend/.env` has `RAZORPAY_KEY_ID` set
- ✅ Restart backend server after updating `.env`

### Issue: "Razorpay is not defined" in frontend
- ✅ Check `REACT_APP_RAZORPAY_KEY_ID` in `.env`
- ✅ Restart React app with `npm start`
- ✅ Clear browser cache

### Issue: Payment fails with "CORS error"
- ✅ Verify backend is running on `http://localhost:5000`
- ✅ Check `REACT_APP_BACKEND_URL` in frontend `.env`
- ✅ Ensure backend `cors` middleware is enabled

### Issue: Payment verification fails
- ✅ Verify signature matching
- ✅ Check `RAZORPAY_KEY_SECRET` is correct in backend
- ✅ Confirm payment status is "captured" in Razorpay dashboard

### Issue: "Cannot read property 'data' of null" in Payment page
- ✅ Make sure to complete booking selection in TimeSelectModal first
- ✅ Check Firebase Realtime DB has booking data saved

---

## Test Card Details (Razorpay Test Mode)

### Successful Payment
- **Card Number:** 4111111111111111
- **CVV:** 123
- **Expiry:** 12/25
- **OTP:** 111111

### Failed Payment
- **Card Number:** 4000000000000002
- **CVV:** 123
- **Expiry:** 12/25

---

## Going to Production

1. **Switch to Live Keys**
   - Get Live Keys from Razorpay dashboard
   - Update `backend/.env` with live credentials
   - Update `frontend/.env` with live Key ID

2. **Deploy Backend**
   - Use Heroku, AWS, Vercel, or your preferred host
   - Update `REACT_APP_BACKEND_URL` to production URL
   - Set `NODE_ENV=production`

3. **Deploy Frontend**
   - Build: `npm run build`
   - Deploy to Netlify, Vercel, or any static host
   - Update environment variables

4. **Enable HTTPS**
   - Razorpay requires HTTPS for production
   - Use SSL certificate from Let's Encrypt or similar

---

## Quick Commands

```bash
# Backend setup and start
cd backend
npm install
npm start

# Frontend setup (in new terminal)
cd ../
npm install
npm start

# Check backend health
curl http://localhost:5000/health
```

---

## Support

- **Razorpay Docs:** https://razorpay.com/docs/
- **Firebase Docs:** https://firebase.google.com/docs
- **React Docs:** https://react.dev

---

Last Updated: 2024

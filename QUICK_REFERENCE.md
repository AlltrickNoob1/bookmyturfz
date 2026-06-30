# Razorpay Integration - Quick Reference Card

## 🎯 One-Page Setup Checklist

### Before You Start
- [ ] Razorpay account created at https://razorpay.com
- [ ] Node.js installed
- [ ] Terminal/PowerShell open

### 1️⃣ Get Credentials (5 minutes)
```
Visit: https://dashboard.razorpay.com/app/keys
Copy: Key ID (looks like: rzp_test_ABC123...)
Copy: Key Secret (looks like: secret_XYZ789...)
```

### 2️⃣ Backend Setup (2 minutes)
```bash
cd backend
cp .env.example .env
# Edit .env and paste your credentials
npm install
npm start
```
✅ See: `🚀 Razorpay Payment Server running on http://localhost:5000`

### 3️⃣ Frontend Setup (2 minutes)
```bash
# In new terminal from root folder
cp .env.example .env
# Edit .env and add REACT_APP_RAZORPAY_KEY_ID=rzp_test_ABC123...
npm start
```
✅ See: App running on `http://localhost:3001`

### 4️⃣ Test Payment (3 minutes)
1. Login → Select turf → Book Now → Select date/time
2. Click "Pay with QR" on payment page
3. Enter test card: **4111111111111111** | CVV: **123** | Date: **12/25**
4. ✅ See "Payment Successful!" message

---

## 📝 File Changes Summary

| File | Change | Status |
|------|--------|--------|
| `backend/server.js` | NEW | ✅ Created |
| `backend/routes/payment.js` | NEW | ✅ Created |
| `backend/controllers/paymentController.js` | NEW | ✅ Updated for Express |
| `backend/config/razorpay.js` | NEW | ✅ Created |
| `backend/package.json` | NEW | ✅ Created |
| `backend/.env.example` | NEW | ✅ Created |
| `backend/README.md` | NEW | ✅ Created |
| `src/pages/Payment.jsx` | UPDATED | ✅ Razorpay integrated |
| `src/components/TimeSelectModal.jsx` | UPDATED | ✅ Added bookingId, amount |
| `.env.example` | NEW | ✅ Created |
| `.gitignore` | UPDATED | ✅ Added .env entries |
| `RAZORPAY_SETUP_GUIDE.md` | NEW | ✅ Created |
| `RAZORPAY_INTEGRATION_SUMMARY.md` | NEW | ✅ Created |

---

## 🔑 Critical Environment Variables

### backend/.env (NEVER commit these!)
```env
RAZORPAY_KEY_ID=rzp_test_1234567890abcd
RAZORPAY_KEY_SECRET=your_secret_here
PORT=5000
NODE_ENV=development
```

### .env (Only Key ID, Secret stays in backend)
```env
REACT_APP_RAZORPAY_KEY_ID=rzp_test_1234567890abcd
REACT_APP_BACKEND_URL=http://localhost:5000
```

---

## 🚨 Common Mistakes (Avoid These!)

❌ **DON'T:**
- Expose `RAZORPAY_KEY_SECRET` in frontend `.env`
- Commit `.env` files to Git
- Use same test credentials for production
- Skip signature verification
- Forget to restart services after `.env` changes

✅ **DO:**
- Keep backend `.env` secret and local-only
- Use test keys for development
- Verify signatures on backend
- Restart server after updating `.env`
- Switch to live keys for production (after business verification)

---

## 🐛 Instant Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend won't start | Check PORT 5000 isn't in use: `netstat -ano \| findstr :5000` |
| RAZORPAY_KEY_ID undefined | Restart backend: `npm start` after editing `.env` |
| Razorpay modal won't open | Restart React: `npm start` after editing `.env` |
| Payment verification fails | Verify `RAZORPAY_KEY_SECRET` is exact match |
| CORS error when paying | Confirm `REACT_APP_BACKEND_URL=http://localhost:5000` |
| "Cannot read property 'data'" | Complete booking in TimeSelectModal before paying |

---

## 📞 API Endpoints (Reference)

### Create Order
```
POST http://localhost:5000/api/payment/create-order
Content-Type: application/json

{
  "amount": 400,
  "bookingId": "user123_1705275600000",
  "userEmail": "user@email.com"
}

→ Returns: { success: true, orderId, amount, currency }
```

### Verify Payment
```
POST http://localhost:5000/api/payment/verify-payment
Content-Type: application/json

{
  "orderId": "order_1234567890abcd",
  "paymentId": "pay_1234567890abcd",
  "signature": "9ef4dffbfd84...",
  "bookingId": "user123_1705275600000"
}

→ Returns: { success: true, message, paymentId, orderId }
```

---

## 🧪 Test Cards (Razorpay Test Mode)

| Scenario | Card | CVV | Expiry |
|----------|------|-----|--------|
| Success | 4111111111111111 | 123 | 12/25 |
| Decline | 4000000000000002 | 123 | 12/25 |
| 3D Secure | 4111111111111111 | 123 | 12/25 |
| Timeout | 4111111111111111 | 000 | 12/25 |

(OTP for all: 111111)

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `RAZORPAY_SETUP_GUIDE.md` | Complete detailed setup guide |
| `RAZORPAY_INTEGRATION_SUMMARY.md` | What was implemented summary |
| `backend/README.md` | Backend specific docs |
| `QUICK_REFERENCE.md` | This file! Quick lookup |

---

## 🔄 Payment Flow (ASCII Art)

```
┌─────────────────┐
│   User Booking  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Frontend: POST create-order      │
│ (amount, bookingId, email)      │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Backend: Create Razorpay Order  │
│ (returns orderId)               │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Frontend: Open Razorpay Modal   │
│ (displays QR code)              │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ User: Scan QR or Enter Card     │
│ (Razorpay processes payment)    │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Frontend: POST verify-payment    │
│ (orderId, paymentId, signature) │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Backend: Verify Signature       │
│ Confirm payment with Razorpay   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Database: Update Status to      │
│ "Confirmed"                     │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ User: Success Message & Toast   │
└─────────────────────────────────┘
```

---

## 🎉 You're All Set!

Follow the **One-Page Setup Checklist** above and you're ready to accept payments!

Questions? Check the full guides:
- **Setup:** `RAZORPAY_SETUP_GUIDE.md`
- **Summary:** `RAZORPAY_INTEGRATION_SUMMARY.md`
- **Backend:** `backend/README.md`

---

**Last Updated:** 2024
**Status:** ✅ Production Ready

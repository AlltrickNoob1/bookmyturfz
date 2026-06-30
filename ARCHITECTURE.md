# Razorpay Payment Integration - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          TURFZ APPLICATION                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────┐         ┌──────────────────────────┐ │
│  │   FRONTEND (React)       │         │   BACKEND (Express)      │ │
│  │   Port: 3001             │         │   Port: 5000             │ │
│  │                          │         │                          │ │
│  │  • Home.jsx              │         │  • server.js             │ │
│  │  • TurfzListing.jsx      │         │  • routes/payment.js     │ │
│  │  • Payment.jsx ⭐        │────────▶│  • controllers/payment.. │ │
│  │  • TimeSelectModal.jsx ⭐│ HTTP    │  • config/razorpay.js    │ │
│  │                          │ POST    │                          │ │
│  │  .env ⭐                 │         │  .env ⭐                 │ │
│  │  • RAZORPAY_KEY_ID       │         │  • RAZORPAY_KEY_ID       │ │
│  │  • BACKEND_URL           │         │  • RAZORPAY_KEY_SECRET   │ │
│  └──────────────────────────┘         │  • PORT                  │ │
│           │                           └──────────────────────────┘ │
│           │                                      │                  │
│           │                                      │                  │
│  ┌────────▼──────────────────┐         ┌────────▼──────────────┐  │
│  │  Firebase SDK 9.23.0      │         │   Razorpay SDK v2+    │  │
│  │                           │         │                       │  │
│  │  • Authentication         │         │  • Create Orders      │  │
│  │  • Firestore              │         │  • Verify Payments    │  │
│  │  • Realtime Database ⭐   │         │  • Fetch Status       │  │
│  │    (stores bookings)      │         │                       │  │
│  └────────┬──────────────────┘         └───────────────────────┘  │
│           │                                                        │
│           └─────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
         │
         │
         ▼
    ┌─────────────────────────────────────────────┐
    │   EXTERNAL SERVICES (Cloud)                 │
    ├─────────────────────────────────────────────┤
    │                                             │
    │  ┌────────────────┐    ┌─────────────────┐ │
    │  │  Razorpay API  │    │  Firebase Cloud │ │
    │  │                │    │  (Firestore +   │ │
    │  │ • Orders       │    │   Realtime DB)  │ │
    │  │ • Payments     │    │                 │ │
    │  │ • Verification │    │ • Authenticate  │ │
    │  │                │    │ • Store Data    │ │
    │  └────────────────┘    └─────────────────┘ │
    │                                             │
    └─────────────────────────────────────────────┘
```

---

## Data Flow: Complete Payment Journey

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1: USER SELECTS TURF & TIME                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  User:  Browse Turfs → Select Turf → Click "Book Now"                 │
│           │                           │                                │
│           ▼                           ▼                                │
│  Frontend: TurfData.jsx          TimeSelectModal.jsx                   │
│  • Display turf list             • Modal opens                         │
│  • Fetch from Firestore          • User selects date & time            │
│           │                           │                                │
│           └───────────┬───────────────┘                                │
│                       ▼                                                 │
│              Firebase Realtime DB                                       │
│              ┌───────────────────────┐                                 │
│              │ /users/{uid}/data:    │                                 │
│              │ {                     │                                 │
│              │   booking: {...},     │  ⭐ NEW FIELDS:                │
│              │   time: "5:00 AM",    │                                 │
│              │   bookingDate: "...", │  • bookingId ✅                │
│              │   uid: "user123",     │  • amount ✅                   │
│              │   email: "...",       │  • paymentStatus ✅            │
│              │   bookingId: "...", ⭐│  • paymentId ✅               │
│              │   amount: 400, ⭐     │  • orderId ✅                 │
│              │   paymentStatus:"..." │                                 │
│              │ }                     │                                 │
│              └───────────────────────┘                                 │
│                       │                                                │
│                       ▼                                                │
│              "Booked successfully"                                    │
│              Navigate to /payment                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 2: USER INITIATES PAYMENT                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Payment.jsx:                                                          │
│  • Display booking details                                             │
│  • Show "Pay with QR" option                                           │
│  • User clicks "Pay Now"                                               │
│           │                                                             │
│           ▼                                                             │
│  Frontend: handleRazorpayPayment()                                     │
│  • Read bookingData from Realtime DB                                   │
│  • Prepare payment request:                                            │
│           {                                                             │
│    "amount": 400,              (₹400 = 40,000 paise)                   │
│    "bookingId": "user123_...", (unique tracking)                       │
│    "userEmail": "..."          (for Razorpay receipt)                  │
│           }                                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3: CREATE RAZORPAY ORDER (BACKEND)                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Frontend: POST /api/payment/create-order                              │
│           │                                                             │
│           ▼                                                             │
│  Backend: paymentController.createOrder(req, res)                      │
│  • Validate amount, bookingId, userEmail                               │
│  • Call razorpay.orders.create({                                       │
│      amount: 40000,        (amount * 100 for paise)                    │
│      currency: "INR",                                                  │
│      receipt: "booking_user123_...",                                   │
│      notes: { bookingId, userEmail }                                   │
│    })                                                                   │
│           │                                                             │
│           ▼                                                             │
│  Razorpay Cloud API                                                    │
│  • Create order                                                        │
│  • Generate orderId (order_1234567890abcd)                             │
│  • Return: { id, amount, currency, status }                            │
│           │                                                             │
│           ▼                                                             │
│  Backend Response:                                                      │
│           {                                                             │
│    "success": true,                                                    │
│    "orderId": "order_1234567890abcd",                                  │
│    "amount": 40000,                                                    │
│    "currency": "INR"                                                   │
│           }                                                             │
│           │                                                             │
│           ▼                                                             │
│  Frontend: handleRazorpayPayment() receives response                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 4: OPEN RAZORPAY CHECKOUT MODAL                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Frontend:                                                              │
│  • Load Razorpay script                                                │
│  • Call new Razorpay({                                                 │
│      key: "rzp_test_ABC123...",     (from .env)                        │
│      order_id: "order_1234567890abcd",                                 │
│      amount: 40000,                                                    │
│      currency: "INR",                                                  │
│      name: "Turfz Booking",                                            │
│      description: "Booking for CricketGrounds",                        │
│      prefill: { email, contact },                                      │
│      handler: handlePaymentSuccess,  (success callback)                │
│      ...                                                                │
│    })                                                                   │
│           │                                                             │
│           ▼                                                             │
│  ╔════════════════════════════════════════════╗                        │
│  ║    RAZORPAY QR MODAL OPENS                 ║                        │
│  ║                                            ║                        │
│  ║  ┌──────────────────────────────┐          ║                        │
│  ║  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓          │          ║                        │
│  ║  │  ▓ Scan QR with Phone ▓      │ User:   ║                        │
│  ║  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓          │ • Scan  ║                        │
│  ║  │                              │   QR or ║                        │
│  ║  │  OR                          │ • Enter ║                        │
│  ║  │  Enter Card: 4111111111111111│   Card  ║                        │
│  ║  │  CVV: 123, Exp: 12/25        │         ║                        │
│  ║  │                              │         ║                        │
│  ║  │  [Pay] [Cancel]              │         ║                        │
│  ║  └──────────────────────────────┘         ║                        │
│  ║                                            ║                        │
│  ╚════════════════════════════════════════════╝                        │
│           │                                                             │
│           ▼                                                             │
│  Payment Processed by Razorpay                                          │
│  • Card verified                                                        │
│  • OTP confirmed (if needed)                                            │
│  • Payment captured                                                     │
│           │                                                             │
│           ▼                                                             │
│  Success Callback:                                                      │
│           {                                                             │
│    "razorpay_order_id": "order_1234567890abcd",                        │
│    "razorpay_payment_id": "pay_1234567890abcd",                        │
│    "razorpay_signature": "9ef4dffbfd84f13..."                          │
│           }                                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 5: VERIFY PAYMENT SIGNATURE (BACKEND SECURITY)                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Frontend: handlePaymentSuccess() triggers                             │
│           POST /api/payment/verify-payment                             │
│           {                                                             │
│    "orderId": "order_1234567890abcd",                                  │
│    "paymentId": "pay_1234567890abcd",                                  │
│    "signature": "9ef4dffbfd84f13...",                                  │
│    "bookingId": "user123_..."                                          │
│           }                                                             │
│           │                                                             │
│           ▼                                                             │
│  Backend: paymentController.verifyPayment()                            │
│  • Create body: "order_1234567890abcd|pay_1234567890abcd"              │
│  • Compute HMAC-SHA256(body, RAZORPAY_KEY_SECRET)                      │
│  • Compare: computed === received signature                            │
│    ┌─────────────────────┐                                             │
│    │ If signature valid: │  ✅ Continue to verify payment status       │
│    │ If invalid:         │  ❌ Return error (tampering detected)       │
│    └─────────────────────┘                                             │
│           │                                                             │
│           ▼                                                             │
│  Call razorpay.payments.fetch(paymentId)                               │
│  • Fetch payment from Razorpay API                                     │
│  • Check: payment.status === "captured"                                │
│    ┌──────────────────┐                                                │
│    │ If captured: ✅  │  Payment confirmed!                            │
│    │ Otherwise:   ❌  │  Payment failed or pending                     │
│    └──────────────────┘                                                │
│           │                                                             │
│           ▼                                                             │
│  Backend Response:                                                      │
│           {                                                             │
│    "success": true,                                                    │
│    "message": "Payment verified successfully",                         │
│    "paymentId": "pay_1234567890abcd",                                  │
│    "orderId": "order_1234567890abcd",                                  │
│    "bookingId": "user123_..."                                          │
│           }                                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 6: UPDATE DATABASE WITH PAYMENT STATUS                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Frontend: handlePaymentSuccess() receives success response            │
│           │                                                             │
│           ▼                                                             │
│  Update Realtime Database:                                              │
│  set(ref(database, "users/" + uid), {                                  │
│    data: {                                                              │
│      booking: {...},                                                   │
│      time: "5:00 AM",                                                  │
│      bookingDate: "2024-01-15",                                        │
│      uid: "user123",                                                   │
│      email: "user@email.com",                                          │
│      bookingId: "user123_...",                                         │
│      amount: 400,                                                      │
│      paymentStatus: "Confirmed", ⭐ UPDATED!                           │
│      paymentId: "pay_1234567890abcd", ⭐ UPDATED!                      │
│      orderId: "order_1234567890abcd" ⭐ UPDATED!                       │
│    }                                                                    │
│  })                                                                    │
│           │                                                             │
│           ▼                                                             │
│  Firebase Database:                                                    │
│  ┌──────────────────────────────────────────┐                          │
│  │ /users/user123/data                      │                          │
│  │ {                                        │                          │
│  │   "booking": {...},                      │                          │
│  │   "time": "5:00 AM",                     │                          │
│  │   "bookingDate": "2024-01-15",           │                          │
│  │   "bookingId": "user123_1705...",        │                          │
│  │   "amount": 400,                         │                          │
│  │   "paymentStatus": "Confirmed",  ✅      │                          │
│  │   "paymentId": "pay_1234567890abcd", ✅  │                          │
│  │   "orderId": "order_1234567890abcd"  ✅  │                          │
│  │ }                                        │                          │
│  └──────────────────────────────────────────┘                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 7: USER CONFIRMATION                                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Frontend Payment.jsx:                                                  │
│  • Toast appears: "Payment Successful!" 🎉                             │
│  • Modal updates: Payment Status = "Confirmed" ✅                      │
│  • Loading state cleared                                                │
│           │                                                             │
│           ▼                                                             │
│  ╔════════════════════════════════════════════╗                        │
│  ║         Order Booked                       ║                        │
│  ║                                            ║                        │
│  ║  Thanks for booking CricketGrounds         ║                        │
│  ║  Time: 5:00 AM                            ║                        │
│  ║  Payment Status: Confirmed ✅              ║                        │
│  ║                                            ║                        │
│  ║  [Back to Turfs]                          ║                        │
│  ╚════════════════════════════════════════════╝                        │
│           │                                                             │
│           ▼                                                             │
│  Booking Complete!                                                      │
│  User can now use booking for entry to turf                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Interactions

```
                    ┌─────────────────────┐
                    │  Payment.jsx (Main) │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
        ┌─────────────┐  ┌──────────────┐  ┌────────────┐
        │ Firebase DB │  │ Razorpay SDK │  │  Backend   │
        │  (Realtime) │  │   (Script)   │  │  API Route │
        └──────┬──────┘  └──────┬───────┘  └─────┬──────┘
               │                │                │
               │        CREATE ORDER            │
               │◄───────────────┼────────────────│
               │                │                │
               │                │ VERIFY PAYMENT│
               │◄───────────────┼────────────────│
               │                │                │
        UPDATE│STATUS           │                │
        TO    │"Confirmed"      │                │
        ┌─────▼──────────────────────────────────┘
        │
        ▼
  User Sees Success
```

---

## Security Layers

```
┌──────────────────────────────────────────────────────────────┐
│ LAYER 1: CREDENTIAL SECURITY                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (.env):                                            │
│  • ONLY Key ID exposed (public)                              │
│  • Secret Key stays in backend only                          │
│                                                              │
│  Backend (.env):                                             │
│  • Never commit to Git                                       │
│  • Added to .gitignore                                       │
│  • Only accessible locally/on secure server                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ LAYER 2: SIGNATURE VERIFICATION                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  On Backend:                                                 │
│  • Receive: orderId | paymentId | signature                  │
│  • Compute: HMAC-SHA256("orderId|paymentId", SECRET)         │
│  • Compare: computed === received                            │
│  • Tampering detection: ❌ Reject if mismatch               │
│                                                              │
│  Benefits:                                                   │
│  • Prevents payment amount manipulation                      │
│  • Ensures payment truly from Razorpay                       │
│  • Only backend knows SECRET key                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ LAYER 3: PAYMENT STATUS CONFIRMATION                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Backend verifies with Razorpay:                             │
│  • Fetch full payment details from API                       │
│  • Check: payment.status === "captured"                      │
│  • Confirms payment actually processed                       │
│  • Prevents accepting incomplete payments                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ LAYER 4: HTTPS REQUIREMENT (Production)                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  All communication encrypted:                                │
│  • Frontend ↔ Backend: HTTPS                                 │
│  • Backend ↔ Razorpay: HTTPS                                 │
│  • Prevents credential/data interception                     │
│  • Required by Razorpay for live payments                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
LOCAL DEVELOPMENT
─────────────────
   localhost:3001          localhost:5000
   ┌─────────────┐         ┌──────────────┐
   │  React App  │◄───────▶│  Express API │
   │  (Frontend) │         │   (Backend)  │
   └─────────────┘         └──────────────┘
         │                        │
         └───────────┬───────────┘
                     │
             ┌───────▼──────────┐
             │  Razorpay Cloud  │
             │  (Test Keys)     │
             └──────────────────┘


PRODUCTION DEPLOYMENT
─────────────────────
   Netlify/Vercel           Heroku/AWS/GCR
   ┌─────────────────┐     ┌──────────────────┐
   │  React App      │◄───▶│  Express API     │
   │  (Frontend)     │ API │  (Backend)       │
   │  https://...    │     │  https://...     │
   └─────────────────┘     └──────────────────┘
         │                        │
         └───────────┬───────────┘
                     │
             ┌───────▼──────────┐
             │  Razorpay Cloud  │
             │  (Live Keys)     │
             │  (Production $)  │
             └──────────────────┘
```

---

**Status:** ✅ Architecture Complete & Production Ready

# Turfz Payment Backend

This is the backend server for Razorpay payment processing in the Turfz turf booking application.

## Features

- ✅ Create Razorpay orders for turf bookings
- ✅ Verify payment signatures (security)
- ✅ Fetch payment status from Razorpay API
- ✅ CORS-enabled for frontend communication
- ✅ Error handling and logging

## Setup

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `express` - Web framework
- `cors` - Cross-Origin Resource Sharing
- `dotenv` - Environment variable management
- `razorpay` - Razorpay SDK
- `nodemon` (dev) - Auto-restart on file changes

### 2. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` and add your Razorpay credentials:

```env
RAZORPAY_KEY_ID=rzp_test_1234567890abcd
RAZORPAY_KEY_SECRET=your_secret_key_here
PORT=5000
NODE_ENV=development
```

### 3. Get Razorpay Credentials

1. Go to https://dashboard.razorpay.com
2. Navigate to Settings → API Keys
3. Copy your **Key ID** and **Key Secret**
4. Add them to `.env` file

## Running the Server

### Development (with auto-restart)

```bash
npm run dev
```

### Production

```bash
npm start
```

The server will run on `http://localhost:5000` by default.

## API Endpoints

### 1. Create Order

**POST** `/api/payment/create-order`

Request body:
```json
{
  "amount": 400,
  "bookingId": "user123_1705275600000",
  "userEmail": "user@example.com"
}
```

Response:
```json
{
  "success": true,
  "orderId": "order_1234567890abcd",
  "amount": 40000,
  "currency": "INR"
}
```

### 2. Verify Payment

**POST** `/api/payment/verify-payment`

Request body:
```json
{
  "orderId": "order_1234567890abcd",
  "paymentId": "pay_1234567890abcd",
  "signature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d",
  "bookingId": "user123_1705275600000"
}
```

Response:
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "paymentId": "pay_1234567890abcd",
  "orderId": "order_1234567890abcd",
  "bookingId": "user123_1705275600000"
}
```

### 3. Health Check

**GET** `/health`

Response:
```json
{
  "status": "Server is running"
}
```

## File Structure

```
backend/
├── server.js                    # Express app setup
├── routes/
│   └── payment.js              # Payment route handlers
├── controllers/
│   └── paymentController.js    # Payment logic
├── config/
│   └── razorpay.js            # Razorpay SDK init
├── package.json                # Dependencies
├── .env.example                # Environment template
└── .env                        # Environment variables (DO NOT COMMIT)
```

## How It Works

### Payment Creation Flow

```
1. Frontend requests order creation
   ↓
2. Backend receives amount, bookingId, userEmail
   ↓
3. Backend calls Razorpay API: orders.create()
   ↓
4. Razorpay returns orderId, amount, currency
   ↓
5. Backend sends orderId to frontend
   ↓
6. Frontend opens Razorpay checkout with orderId
```

### Payment Verification Flow

```
1. User completes payment on Razorpay modal
   ↓
2. Frontend receives payment response with:
   - razorpay_order_id
   - razorpay_payment_id
   - razorpay_signature
   ↓
3. Frontend sends to backend for verification
   ↓
4. Backend verifies HMAC SHA256 signature
   ↓
5. Backend fetches payment from Razorpay API
   ↓
6. Verify payment.status === "captured"
   ↓
7. Backend returns success/failure
   ↓
8. Frontend updates booking status in database
```

## Security

- **Signature Verification**: HMAC SHA256 signature is verified to prevent payment tampering
- **Secret Key Protection**: Never expose `RAZORPAY_KEY_SECRET` in frontend code
- **HTTPS Ready**: Configure SSL certificate for production
- **CORS Configuration**: Update to allow only your frontend domain in production

## Deployment

### Heroku

```bash
heroku create your-app-name
heroku config:set RAZORPAY_KEY_ID=your_key
heroku config:set RAZORPAY_KEY_SECRET=your_secret
git push heroku main
```

### AWS Lambda + API Gateway

Use serverless framework:
```bash
npm install -g serverless
serverless deploy
```

### Vercel

```bash
vercel deploy
```

### Google Cloud Run

```bash
gcloud run deploy turfz-payment --source .
```

## Troubleshooting

### Port Already in Use

Change PORT in `.env`:
```env
PORT=5001
```

### Razorpay Key Errors

- Verify `.env` file has correct key format
- Restart server after updating `.env`
- Check key is from correct mode (Test/Live)

### CORS Errors

- Verify frontend is allowed in CORS config
- Check frontend is sending correct headers

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RAZORPAY_KEY_ID` | ✅ | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | ✅ | Razorpay secret key |
| `PORT` | ❌ | Server port (default: 5000) |
| `NODE_ENV` | ❌ | development/production |

## Scripts

```bash
# Start server with auto-reload
npm run dev

# Start server normally
npm start

# Install dependencies
npm install
```

## Dependencies

- **express**: Web application framework
- **cors**: Enable CORS for frontend
- **dotenv**: Load environment variables
- **razorpay**: Official Razorpay SDK

## Dev Dependencies

- **nodemon**: Auto-restart on file changes

## License

ISC

## Support

For issues or questions:
1. Check RAZORPAY_SETUP_GUIDE.md in root directory
2. Visit https://razorpay.com/docs/
3. Check error logs in terminal output

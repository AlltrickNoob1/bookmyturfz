const Razorpay = require('razorpay');
require('dotenv').config();

let razorpay = null;

try {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

  if (keyId && keySecret && keyId.includes('rzp_')) {
    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    console.log('✅ Razorpay SDK initialized with credentials');
  } else {
    console.log('⚠️  Razorpay credentials not found or incomplete - using mock mode');
    razorpay = null;
  }
} catch (error) {
  console.error('⚠️  Error initializing Razorpay SDK:', error.message);
  razorpay = null;
}

module.exports = razorpay;

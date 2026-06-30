const express = require('express');
const { sendBookingEmail, sendAdminNotification, sendBookingStatusEmail } = require('../controllers/emailController');

const router = express.Router();

router.post('/send-booking-email', sendBookingEmail);
router.post('/send-admin-booking', sendAdminNotification);
router.post('/send-booking-status', sendBookingStatusEmail);

module.exports = router;

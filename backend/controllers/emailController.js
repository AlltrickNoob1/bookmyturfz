let nodemailer;
let transporter = null;
try {
  nodemailer = require('nodemailer');
  transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
} catch (err) {
  console.error('[WARN] Could not initialize nodemailer:', err.message);
  transporter = null;
}

function formatBookingDetails(booking) {
  return `
    Turf: ${booking.turfName || booking.booking?.name || 'N/A'}\n
    Date: ${booking.bookingDate || booking.booking?.bookingDate || 'N/A'}\n
    Slot: ${booking.time || booking.booking?.time || 'N/A'}\n
    Booked At: ${booking.bookingTimestamp || booking.createdAt ? new Date(booking.createdAt).toLocaleString('en-IN') : 'N/A'}\n
    Payment Method: ${booking.paymentMethod || 'N/A'}\n
    Payment Status: ${booking.paymentStatus || 'N/A'}\n
    Email: ${booking.email || booking.userEmail || 'N/A'}\n
    Amount: ₹${booking.amount || 'N/A'}\n
    Booking Id: ${booking.bookingId || 'N/A'}\n
  `;
}

exports.sendBookingEmail = async (req, res) => {
  if (!transporter) {
    return res.status(503).json({ error: 'Email service not configured' });
  }
  try {
    const { booking } = req.body;
    if (!booking) return res.status(400).json({ error: 'Booking data required' });

    const userEmail = booking.email || booking.userEmail;
    if (!userEmail) return res.status(400).json({ error: 'User email required' });

    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: userEmail,
      subject: `Booking confirmation for ${booking.turfName || booking.booking?.name || 'Turf'}`,
      text: `Your booking details:\n${formatBookingDetails(booking)}\n\nThank you for using Turfz.`,
    });

    console.log('[sendBookingEmail] email sent', info.messageId);
    return res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error('[sendBookingEmail] error', err.message);
    res.status(500).json({ error: 'Failed to send booking email', details: err.message });
  }
};

exports.sendAdminNotification = async (req, res) => {
  if (!transporter) {
    return res.status(503).json({ error: 'Email service not configured' });
  }
  try {
    const { booking } = req.body;
    if (!booking) return res.status(400).json({ error: 'Booking data required' });

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return res.status(500).json({ error: 'Admin email not configured' });

    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: adminEmail,
      subject: `New booking to review: ${booking.turfName || booking.booking?.name || 'Turf'}`,
      text: `New booking requires review. Details:\n${formatBookingDetails(booking)}`,
    });

    console.log('[sendAdminNotification] email sent', info.messageId);
    return res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error('[sendAdminNotification] error', err.message);
    res.status(500).json({ error: 'Failed to send admin email', details: err.message });
  }
};

exports.sendBookingStatusEmail = async (req, res) => {
  if (!transporter) {
    return res.status(503).json({ error: 'Email service not configured' });
  }
  try {
    const { booking, action } = req.body;
    if (!booking || !action) return res.status(400).json({ error: 'Booking and action are required' });

    const userEmail = booking.email || booking.userEmail;
    if (!userEmail) return res.status(400).json({ error: 'User email required' });

    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: userEmail,
      subject: `Your booking has been ${action}`,
      text: `Your booking status has changed to ${action}.\n\nDetails:\n${formatBookingDetails(booking)}`,
    });

    console.log('[sendBookingStatusEmail] email sent', info.messageId);
    return res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error('[sendBookingStatusEmail] error', err.message);
    res.status(500).json({ error: 'Failed to send status email', details: err.message });
  }
};

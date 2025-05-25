const nodemailer = require('nodemailer');

const sendEmail = async (req, res) => {
  const { from, to, subject, text } = req.body;

  // Basic validation
  if (!from || !to || !subject || !text) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send the email
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
    });

    // console.log('Email sent:', info.messageId);
    res.status(200).json({ message: 'Email sent successfully', id: info.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
};

module.exports = { sendEmail };
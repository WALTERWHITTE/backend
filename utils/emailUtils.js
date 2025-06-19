const nodemailer = require('nodemailer');
const connection = require('../db');

// Validate env variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  throw new Error('EMAIL_USER or EMAIL_PASS environment variable is missing.');
}

// Create transporter but DO NOT send emails here
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// This function only prepares the final mailOptions (subject, content, recipients etc.)
const prepareEmail = async ({ email, name, products, templateId }) => {
  const monthYear = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const conn = await connection.getConnection();
  const [templateRows] = await conn.query(
    `SELECT subject, content FROM email_templates WHERE templateId = ?`,
    [templateId]
  );
  conn.release();

  if (!templateRows.length) {
    throw new Error(`Template with ID ${templateId} not found.`);
  }

  let { subject, content } = templateRows[0];

  // Replace placeholders
  subject = subject.replace('${name}', name).replace('${monthYear}', monthYear);
  content = content
    .replace('${name}', name)
    .replace('${monthYear}', monthYear)
    .replace('${products}', products || '');

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html: content,
  };

  return mailOptions;
};

// Export both transporter and prepareEmail function
module.exports = { transporter, prepareEmail };

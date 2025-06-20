const connection = require('../db');
const nodemailer = require('nodemailer');

// Transporter config
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Final: Prepare Email with full placeholder support
const prepareEmail = async ({ client, templateId }) => {
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

  // Format DOB to "Mon Jun 2 1980"
  let formattedDob = '';
  if (client.clientDOB) {
    const dob = new Date(client.clientDOB);
    formattedDob = dob.toDateString(); // e.g., "Mon Jun 02 1980"
  }

  const variables = {
    ...client,
    name: client.clientName,
    email: client.clientEmail,
    products: client.clientProducts,
    monthYear,
    profession: client.clientProfession,
    gender: client.clientGender,
    dob: formattedDob,
    familyhead: client.familyHead === 1 ? 'Yes' : 'No',
  };

  const replacePlaceholders = (str) =>
    str.replace(/\$\{(\w+)\}/g, (_, key) =>
      variables[key] !== undefined && variables[key] !== null
        ? variables[key]
        : `[Unknown: ${key}]`
    );

  subject = replacePlaceholders(subject);
  content = replacePlaceholders(content);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: client.clientEmail,
    subject,
    html: content,
  };

  return mailOptions;
};


module.exports = { prepareEmail, transporter };

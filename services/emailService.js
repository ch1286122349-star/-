const nodemailer = require('nodemailer');
const imapSimple = require('imap-simple');
const { simpleParser } = require('mailparser');

// Configuration from environment variables
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true'; // true for 465, false for other ports
const IMAP_HOST = process.env.IMAP_HOST;
const IMAP_PORT = parseInt(process.env.IMAP_PORT || '993', 10);
const IMAP_TLS = process.env.IMAP_TLS === 'true';

/**
 * Send an email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body (optional)
 */
async function sendEmail(to, subject, text, html = null) {
  if (!EMAIL_USER || !EMAIL_PASS || !SMTP_HOST) {
    throw new Error('Email configuration is missing. Please check .env file.');
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: EMAIL_USER,
    to,
    subject,
    text,
    html: html || text,
  });

  console.log('Message sent: %s', info.messageId);
  return info;
}

/**
 * Receive recent emails
 * @param {number} limit - Number of emails to fetch (default 5)
 */
async function getRecentEmails(limit = 5) {
  if (!EMAIL_USER || !EMAIL_PASS || !IMAP_HOST) {
    throw new Error('Email configuration is missing. Please check .env file.');
  }

  const config = {
    imap: {
      user: EMAIL_USER,
      password: EMAIL_PASS,
      host: IMAP_HOST,
      port: IMAP_PORT,
      tls: IMAP_TLS,
      authTimeout: 3000,
    },
  };

  try {
    const connection = await imapSimple.connect(config);
    await connection.openBox('INBOX');

    const searchCriteria = ['ALL'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      markSeen: false,
      struct: true // Ensure struct is fetched to identify parts
    };

    // Get all messages (or search criteria)
    // Note: imap-simple search returns all matching messages. 
    // For efficiency on large mailboxes, you might want to search by date or sequence number.
    // Here we fetch the last 'limit' messages.
    const messages = await connection.search(searchCriteria, fetchOptions);
    
    // Sort by date descending and take the last 'limit'
    // IMAP messages are usually returned in order, but let's be safe.
    // 'messages' array contains message objects with 'attributes' including 'date'.
    const recentMessages = messages
      .slice(-limit) // Get last 'limit' messages (usually most recent)
      .reverse();    // Reverse to show newest first

    const parsedEmails = await Promise.all(recentMessages.map(async (msg) => {
      // Find the body part that contains the full message content
      const all = msg.parts.find(part => part.which === '');
      const id = msg.attributes.uid;
      const idHeader = msg.parts.find(part => part.which === 'HEADER');
      
      // Simple parser needs the raw source or stream
      // We requested body '' which is the full raw message
      if (all) {
          const parsed = await simpleParser(all.body);
          return {
            id,
            subject: parsed.subject,
            from: parsed.from.text,
            to: parsed.to ? parsed.to.text : 'Unknown',
            date: parsed.date,
            text: parsed.text,
            html: parsed.html
          };
      }
      return { id, subject: 'Error parsing', date: msg.attributes.date };
    }));

    connection.end();
    return parsedEmails;

  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
}

module.exports = {
  sendEmail,
  getRecentEmails,
};

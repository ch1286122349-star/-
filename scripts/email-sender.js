const nodemailer = require('nodemailer');
require('dotenv').config();

// 邮件发送器配置
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: parseInt(process.env.EMAIL_SMTP_PORT, 10),
  secure: process.env.SMTP_SECURE === 'true', // true for 465 SSL
  requireTLS: process.env.SMTP_SECURE !== 'true',
  tls: {
    rejectUnauthorized: false
  },
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * 发送邮件
 * @param {Object} options - 邮件选项
 * @param {string} options.to - 收件人邮箱
 * @param {string} options.subject - 邮件主题
 * @param {string} options.text - 纯文本内容
 * @param {string} options.html - HTML 内容（可选）
 * @param {Array} options.attachments - 附件（可选）
 * @returns {Promise} 发送结果
 */
async function sendEmail(options) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || null,
      attachments: options.attachments || null
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('邮件发送成功:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('邮件发送失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 发送测试邮件
 */
async function sendTestEmail() {
  const result = await sendEmail({
    to: process.env.EMAIL_USER, // 发给自己测试
    subject: '测试邮件 - 邮件系统工作正常',
    text: '这是一封测试邮件，证明邮件发送功能正常工作。',
    html: `
      <h2>测试邮件</h2>
      <p>这是一封测试邮件，证明邮件发送功能正常工作。</p>
      <p>发送时间: ${new Date().toLocaleString('zh-CN')}</p>
    `
  });
  
  return result;
}

module.exports = {
  sendEmail,
  sendTestEmail
};

const sgMail = require('@sendgrid/mail');
require('dotenv').config();

// 设置 SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * 使用 SendGrid 发送邮件（可以发送到外部邮箱）
 * @param {Object} options - 邮件选项
 * @param {string} options.to - 收件人邮箱
 * @param {string} options.subject - 邮件主题
 * @param {string} options.text - 纯文本内容
 * @param {string} options.html - HTML 内容（可选）
 * @returns {Promise} 发送结果
 */
async function sendEmailViaSendGrid(options) {
  try {
    const msg = {
      to: options.to,
      from: {
        email: 'sheldon@zyramech.com',
        name: 'Sheldon (ZyraMech)'
      },
      subject: options.subject,
      text: options.text,
      html: options.html || undefined
    };

    const result = await sgMail.send(msg);
    console.log('SendGrid 邮件发送成功:', result[0].headers['x-message-id']);
    return { 
      success: true, 
      messageId: result[0].headers['x-message-id'],
      provider: 'SendGrid'
    };
  } catch (error) {
    console.error('SendGrid 邮件发送失败:', error);
    if (error.response) {
      console.error('错误详情:', error.response.body);
    }
    return { 
      success: false, 
      error: error.message,
      provider: 'SendGrid'
    };
  }
}

/**
 * 发送测试邮件到外部邮箱
 */
async function sendTestEmailToExternal() {
  const result = await sendEmailViaSendGrid({
    to: 'ch1286122349@gmail.com',
    subject: '测试邮件 - SendGrid 外部发送',
    text: '这是一封通过 SendGrid 发送的测试邮件，验证外部邮件发送功能。',
    html: `
      <h2>🎉 外部邮件测试成功！</h2>
      <p>这是一封通过 SendGrid 发送的测试邮件。</p>
      <p><strong>发件人:</strong> sheldon@zyramech.com</p>
      <p><strong>收件人:</strong> ch1286122349@gmail.com</p>
      <p><strong>发送时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
      <p><strong>发送方式:</strong> SendGrid API</p>
      <hr>
      <p><small>此邮件证明你的公司邮箱可以成功发送到外部邮箱！</small></p>
    `
  });
  
  return result;
}

module.exports = {
  sendEmailViaSendGrid,
  sendTestEmailToExternal
};

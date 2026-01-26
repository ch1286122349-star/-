const nodemailer = require('nodemailer');
require('dotenv').config();

async function simpleEmailTest() {
  console.log('📧 简单邮件发送测试');
  
  try {
    // 创建最简单的传输器配置
    const transporter = nodemailer.createTransport({
      host: 'mx1.hostinger.com',
      port: 25,
      secure: false,
      requireTLS: false,
      tls: {
        rejectUnauthorized: false
      },
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    console.log('正在发送测试邮件...');
    
    const result = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: '测试邮件 - ' + new Date().toLocaleString('zh-CN'),
      text: '这是一封测试邮件，验证邮件发送功能是否正常工作。',
      html: `
        <h2>🎉 邮件发送测试</h2>
        <p>这是一封测试邮件，验证邮件发送功能是否正常工作。</p>
        <p><strong>发送时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
        <p><strong>服务器:</strong> mx1.hostinger.com:25</p>
      `
    });
    
    console.log('✅ 邮件发送成功！');
    console.log(`消息ID: ${result.messageId}`);
    console.log(`响应ID: ${result.response}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ 邮件发送失败:', error.message);
    return false;
  }
}

simpleEmailTest();

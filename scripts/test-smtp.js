const nodemailer = require('nodemailer');
require('dotenv').config();

async function testSMTPConnection() {
  console.log('🔍 测试 SMTP 连接...');
  console.log(`SMTP 服务器: ${process.env.EMAIL_SMTP_HOST}`);
  console.log(`SMTP 端口: ${process.env.EMAIL_SMTP_PORT}`);
  console.log(`邮箱: ${process.env.EMAIL_USER}`);
  
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST,
      port: parseInt(process.env.EMAIL_SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // 验证连接
    await transporter.verify();
    console.log('✅ SMTP 连接成功！');
    
    // 尝试发送测试邮件
    const result = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'SMTP 连接测试',
      text: '这是一封 SMTP 连接测试邮件'
    });
    
    console.log('✅ 测试邮件发送成功！');
    console.log(`消息ID: ${result.messageId}`);
    
  } catch (error) {
    console.error('❌ SMTP 连接失败:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 可能的解决方案:');
      console.log('1. 检查 SMTP 服务器地址是否正确');
      console.log('2. 尝试其他常见的邮件服务器地址:');
      console.log('   - mail.zyramech.com');
      console.log('   - email.zyramech.com');
      console.log('   - smtp.zyramech.com');
      console.log('3. 联系 IT 部门确认正确的服务器地址');
    }
  }
}

testSMTPConnection();

const nodemailer = require('nodemailer');
require('dotenv').config();

async function testDifferentSMTPServers() {
  const possibleServers = [
    'smtp.zyramech.com',
    'mail.zyramech.com', 
    'email.zyramech.com',
    'smtp.zyramech.com.mx',
    'mail.zyramech.com.mx',
    'zyramech.com'
  ];
  
  console.log('🔍 测试不同的 SMTP 服务器地址...\n');
  
  for (const server of possibleServers) {
    console.log(`测试服务器: ${server}`);
    
    try {
      const transporter = nodemailer.createTransport({
        host: server,
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        connectionTimeout: 5000, // 5秒超时
        greetingTimeout: 5000
      });
      
      await transporter.verify();
      console.log(`✅ 成功连接到 ${server}！`);
      
      // 如果连接成功，尝试发送测试邮件
      const result = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: '邮件服务器测试成功',
        text: `成功连接到服务器: ${server}`
      });
      
      console.log(`✅ 测试邮件发送成功！消息ID: ${result.messageId}`);
      console.log('\n🎉 找到正确的邮件服务器配置！');
      console.log(`请更新 .env 文件中的 EMAIL_SMTP_HOST 为: ${server}`);
      return;
      
    } catch (error) {
      console.log(`❌ 连接失败: ${error.message}`);
    }
    
    console.log('---');
  }
  
  console.log('\n❌ 所有常见服务器地址都无法连接');
  console.log('\n💡 建议:');
  console.log('1. 检查邮箱是否开启了 SMTP/IMAP 功能');
  console.log('2. 联系 IT 部门获取正确的服务器地址');
  console.log('3. 查看邮箱设置中的服务器配置信息');
}

testDifferentSMTPServers();

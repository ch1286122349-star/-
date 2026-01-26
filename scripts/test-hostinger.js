const nodemailer = require('nodemailer');
require('dotenv').config();

async function testHostingerConfigs() {
  const configs = [
    { host: 'mx1.hostinger.com', port: 465, secure: true },
    { host: 'mx2.hostinger.com', port: 465, secure: true },
    { host: 'mx1.hostinger.com', port: 587, secure: false },
    { host: 'mx2.hostinger.com', port: 587, secure: false },
    { host: 'mx1.hostinger.com', port: 25, secure: false },
    { host: 'mx2.hostinger.com', port: 25, secure: false },
  ];
  
  console.log('🔍 测试 Hostinger 邮件服务器配置...\n');
  
  for (const config of configs) {
    console.log(`测试: ${config.host}:${config.port} (secure: ${config.secure})`);
    
    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000
      });
      
      await transporter.verify();
      console.log(`✅ 连接成功！`);
      
      // 尝试发送测试邮件
      const result = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: '邮件服务器测试',
        text: `成功连接到 ${config.host}:${config.port}`
      });
      
      console.log(`✅ 测试邮件发送成功！消息ID: ${result.messageId}`);
      
      // 更新 .env 文件
      console.log(`\n🎉 找到正确配置！`);
      console.log(`SMTP 服务器: ${config.host}`);
      console.log(`SMTP 端口: ${config.port}`);
      console.log(`SSL/TLS: ${config.secure ? '是' : '否'}`);
      
      return config;
      
    } catch (error) {
      console.log(`❌ 连接失败: ${error.message}`);
    }
    
    console.log('---');
  }
  
  console.log('\n❌ 所有配置都无法连接');
  console.log('\n💡 可能的原因:');
  console.log('1. 邮箱密码不正确');
  console.log('2. 邮箱未开启 SMTP 功能');
  console.log('3. 需要使用应用专用密码而非登录密码');
  console.log('4. 防火墙阻止了连接');
}

testHostingerConfigs();

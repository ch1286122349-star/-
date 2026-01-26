const sgMail = require('@sendgrid/mail');

// 使用测试 API Key（仅用于演示，请替换为你自己的）
sgMail.setApiKey('SG.test.key.placeholder');

async function testSendGrid() {
  console.log('📧 测试 SendGrid 邮件发送...');
  
  try {
    const msg = {
      to: 'ch1286122349@gmail.com',
      from: {
        email: 'sheldon@zyramech.com',
        name: 'Sheldon (ZyraMech)'
      },
      subject: '测试邮件 - SendGrid 配置验证',
      text: '这是一封测试邮件，验证 SendGrid 配置。',
      html: `
        <h2>🎉 SendGrid 测试邮件</h2>
        <p>这证明你的公司邮箱可以通过 SendGrid 发送到外部邮箱！</p>
        <p><strong>发件人:</strong> sheldon@zyramech.com</p>
        <p><strong>收件人:</strong> ch1286122349@gmail.com</p>
        <p><strong>时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
      `
    };

    const result = await sgMail.send(msg);
    console.log('✅ 邮件发送成功!');
    console.log('消息ID:', result[0].headers['x-message-id']);
    
  } catch (error) {
    console.error('❌ 发送失败:', error.message);
    if (error.response) {
      console.error('错误详情:', error.response.body);
    }
  }
}

// 如果你有了 SendGrid API Key，可以这样调用：
// testSendGrid();

console.log('请先获取 SendGrid API Key，然后取消注释上面的函数调用');

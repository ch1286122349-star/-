const { sendTestEmail } = require('./email-sender');
const { testConnection, getInboxEmails, getUnreadEmails } = require('./email-receiver');

async function runEmailTests() {
  console.log('🚀 开始邮件功能测试...\n');
  
  // 测试1: 邮箱连接
  console.log('📧 测试1: 验证邮箱连接');
  try {
    const connectionResult = await testConnection();
    if (connectionResult.success) {
      console.log('✅ 邮箱连接成功');
    } else {
      console.log('❌ 邮箱连接失败:', connectionResult.error);
      return;
    }
  } catch (error) {
    console.log('❌ 邮箱连接测试失败:', error.message);
    return;
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试2: 获取收件箱邮件
  console.log('📥 测试2: 获取收件箱邮件 (前5封)');
  try {
    const emails = await getInboxEmails(5);
    console.log(`✅ 成功获取 ${emails.length} 封邮件`);
    emails.forEach((email, index) => {
      console.log(`\n邮件 ${index + 1}:`);
      console.log(`  主题: ${email.subject}`);
      console.log(`  发件人: ${email.from}`);
      console.log(`  日期: ${email.date.toLocaleString('zh-CN')}`);
      console.log(`  已读: ${email.seen ? '是' : '否'}`);
    });
  } catch (error) {
    console.log('❌ 获取收件箱失败:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试3: 获取未读邮件
  console.log('🔔 测试3: 获取未读邮件');
  try {
    const unreadEmails = await getUnreadEmails();
    console.log(`✅ 成功获取 ${unreadEmails.length} 封未读邮件`);
    if (unreadEmails.length > 0) {
      unreadEmails.forEach((email, index) => {
        console.log(`\n未读邮件 ${index + 1}:`);
        console.log(`  主题: ${email.subject}`);
        console.log(`  发件人: ${email.from}`);
        console.log(`  日期: ${email.date.toLocaleString('zh-CN')}`);
      });
    } else {
      console.log('📭 没有未读邮件');
    }
  } catch (error) {
    console.log('❌ 获取未读邮件失败:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试4: 发送测试邮件
  console.log('📤 测试4: 发送测试邮件');
  try {
    const sendResult = await sendTestEmail();
    if (sendResult.success) {
      console.log('✅ 测试邮件发送成功');
      console.log(`  消息ID: ${sendResult.messageId}`);
    } else {
      console.log('❌ 测试邮件发送失败:', sendResult.error);
    }
  } catch (error) {
    console.log('❌ 发送测试邮件失败:', error.message);
  }
  
  console.log('\n🎉 邮件功能测试完成！');
}

// 运行测试
if (require.main === module) {
  runEmailTests().catch(console.error);
}

module.exports = { runEmailTests };

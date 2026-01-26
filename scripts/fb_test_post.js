require('dotenv').config();

const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

if (!PAGE_ID || !ACCESS_TOKEN) {
  console.error('❌ 错误: 请在 .env 中配置 FACEBOOK_PAGE_ID 和 FACEBOOK_PAGE_ACCESS_TOKEN');
  process.exit(1);
}

const API_VER = 'v22.0';
const BASE_URL = `https://graph.facebook.com/${API_VER}`;

async function testPost() {
  try {
    console.log('🚀 正在发布测试帖子...');
    console.log(`📄 Page ID: ${PAGE_ID}`);
    
    const message = `🧪 这是一条测试帖子 - ${new Date().toLocaleString('zh-CN', { timeZone: 'America/Mexico_City' })}
    
测试 Facebook API 连接是否正常。
#测试 #MXChino`;

    const res = await fetch(`${BASE_URL}/${PAGE_ID}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        access_token: ACCESS_TOKEN
      })
    });

    const data = await res.json();

    if (data.error) {
      console.error('❌ 发帖失败:', JSON.stringify(data.error, null, 2));
      return null;
    }

    console.log('✅ 帖子发布成功!');
    console.log(`📝 帖子 ID: ${data.id}`);
    console.log(`🔗 查看链接: https://www.facebook.com/${data.id.replace('_', '/posts/')}`);
    
    return data.id;

  } catch (error) {
    console.error('❌ 请求错误:', error.message);
    return null;
  }
}

testPost();

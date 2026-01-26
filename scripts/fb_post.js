require('dotenv').config();

const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

if (!PAGE_ID || !ACCESS_TOKEN) {
  console.error('❌ 错误: 请在 .env 文件中配置 FACEBOOK_PAGE_ID 和 FACEBOOK_PAGE_ACCESS_TOKEN');
  process.exit(1);
}

const message = process.argv[2];

if (!message) {
  console.error('❌ 错误: 请提供要发布的帖子内容');
  console.log('用法: node scripts/fb_post.js "你的帖子内容"');
  process.exit(1);
}

async function postToFacebook() {
  const url = `https://graph.facebook.com/v22.0/${PAGE_ID}/feed`;
  
  try {
    console.log(`📤 正在发布到主页 (${PAGE_ID})...`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        access_token: ACCESS_TOKEN
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    console.log('✅ 发布成功!');
    console.log('帖子 ID:', data.id);
    console.log(`查看帖子: https://facebook.com/${data.id}`);

  } catch (error) {
    console.error('❌ 发布失败:', error.message);
  }
}

postToFacebook();

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

if (!PAGE_ID || !ACCESS_TOKEN) {
  console.error('❌ 错误: 请在 .env 文件中配置 FACEBOOK_PAGE_ID 和 FACEBOOK_PAGE_ACCESS_TOKEN');
  process.exit(1);
}

const filePath = process.argv[2];
const message = process.argv[3] || '';

if (!filePath) {
  console.error('❌ 错误: 请提供图片路径');
  console.log('用法: node scripts/fb_post_photo.js <path_to_image> "[caption]"');
  process.exit(1);
}

async function uploadPhoto() {
  const url = `https://graph.facebook.com/v22.0/${PAGE_ID}/photos`;
  
  try {
    console.log(`📤 正在上传图片到主页 (${PAGE_ID})...`);
    
    // 读取文件
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer]);
    
    const formData = new FormData();
    formData.append('access_token', ACCESS_TOKEN);
    formData.append('message', message);
    formData.append('source', blob, path.basename(filePath));

    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    console.log('✅ 图片发布成功!');
    console.log('帖子 ID:', data.post_id || data.id);
    console.log(`查看链接: https://facebook.com/${data.post_id || data.id}`);

  } catch (error) {
    console.error('❌ 发布失败:', error.message);
  }
}

uploadPhoto();

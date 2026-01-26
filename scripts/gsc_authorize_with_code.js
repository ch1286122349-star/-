const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];
const TOKEN_PATH = path.join(__dirname, '../.gsc-token.json');
const CREDENTIALS_PATH = path.join(__dirname, '../gsc-credentials.json');

// 从命令行参数获取授权码
const authCode = process.argv[2];

if (!authCode) {
  console.error('❌ 请提供授权码作为参数');
  console.error('用法: node scripts/gsc_authorize_with_code.js "YOUR_AUTH_CODE"');
  process.exit(1);
}

async function saveToken() {
  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    console.log('🔄 正在使用授权码获取 token...');
    
    const { tokens } = await oAuth2Client.getToken(authCode);
    oAuth2Client.setCredentials(tokens);
    
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log('✅ Token 已保存到', TOKEN_PATH);
    console.log('\n现在可以运行: node scripts/gsc_fetch_data.js');
    
  } catch (error) {
    console.error('❌ 保存 token 失败:', error.message);
    if (error.message.includes('invalid_grant')) {
      console.error('\n授权码可能已过期或无效，请重新获取授权码');
    }
    process.exit(1);
  }
}

saveToken();

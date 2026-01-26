const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '../gsc-credentials.json');
const TOKEN_PATH = path.join(__dirname, '../.gsc-token.json');
const SITE_URL = 'https://mxchino.com/';

/**
 * 测试 Google Search Console API 连接
 */
async function testConnection() {
  console.log('🔍 测试 Google Search Console API 连接...\n');

  // 检查凭据文件
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error('❌ 未找到 gsc-credentials.json 文件');
    console.error('\n请按照 GOOGLE_SEARCH_CONSOLE_SETUP.md 中的步骤：');
    console.error('1. 访问 https://console.cloud.google.com/apis/credentials');
    console.error('2. 创建 OAuth 2.0 客户端 ID（桌面应用）');
    console.error('3. 下载 JSON 文件并保存为 gsc-credentials.json');
    console.error('4. 将文件放到项目根目录\n');
    return false;
  }

  console.log('✅ 找到凭据文件');

  // 检查 token
  if (!fs.existsSync(TOKEN_PATH)) {
    console.log('⚠️  未找到 token 文件（首次运行正常）');
    console.log('请运行: node scripts/gsc_fetch_data.js 进行首次授权\n');
    return false;
  }

  console.log('✅ 找到 token 文件');

  // 测试 API 调用
  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oAuth2Client.setCredentials(token);

    const searchconsole = google.searchconsole({ version: 'v1', auth: oAuth2Client });

    // 测试获取网站列表
    console.log('\n📡 测试 API 调用...');
    const sites = await searchconsole.sites.list();
    
    console.log('✅ API 连接成功！\n');
    console.log('您在 Search Console 中的网站：');
    if (sites.data.siteEntry && sites.data.siteEntry.length > 0) {
      sites.data.siteEntry.forEach((site, index) => {
        console.log(`${index + 1}. ${site.siteUrl} (权限: ${site.permissionLevel})`);
      });
    } else {
      console.log('未找到网站，请确保已在 Search Console 中添加网站');
    }

    // 检查目标网站
    const hasSite = sites.data.siteEntry?.some(s => s.siteUrl === SITE_URL);
    if (hasSite) {
      console.log(`\n✅ 找到目标网站: ${SITE_URL}`);
      console.log('可以开始获取 SEO 数据了！');
      console.log('\n运行: node scripts/gsc_fetch_data.js');
    } else {
      console.log(`\n⚠️  未找到目标网站: ${SITE_URL}`);
      console.log('请检查：');
      console.log('1. 网站 URL 是否正确（包括 https:// 和结尾的 /）');
      console.log('2. 是否已在 Search Console 中验证该网站');
    }

    return true;
  } catch (error) {
    console.error('\n❌ API 调用失败:', error.message);
    if (error.code === 401) {
      console.error('\nToken 可能已过期，请删除 .gsc-token.json 并重新授权');
    }
    return false;
  }
}

// 运行测试
testConnection().then(success => {
  process.exit(success ? 0 : 1);
});

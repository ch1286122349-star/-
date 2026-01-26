const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(__dirname, '../.gsc-token.json');
const CREDENTIALS_PATH = path.join(__dirname, '../gsc-credentials.json');

async function listSites() {
  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oAuth2Client.setCredentials(token);

    const searchconsole = google.searchconsole({ version: 'v1', auth: oAuth2Client });

    console.log('🔍 查询您在 Search Console 中的所有网站...\n');
    const sites = await searchconsole.sites.list();
    
    if (sites.data.siteEntry && sites.data.siteEntry.length > 0) {
      console.log('✅ 找到以下网站：\n');
      sites.data.siteEntry.forEach((site, index) => {
        console.log(`${index + 1}. ${site.siteUrl}`);
        console.log(`   权限级别: ${site.permissionLevel}`);
        console.log('');
      });
      
      const hasMxchino = sites.data.siteEntry.some(s => 
        s.siteUrl.includes('mxchino.com')
      );
      
      if (!hasMxchino) {
        console.log('⚠️  未找到 mxchino.com');
        console.log('\n请按照以下步骤添加网站：');
        console.log('1. 访问 https://search.google.com/search-console');
        console.log('2. 点击左上角"添加资源"');
        console.log('3. 选择"网址前缀"，输入: https://mxchino.com');
        console.log('4. 按照提示验证网站所有权（推荐使用 HTML 文件验证）');
      }
    } else {
      console.log('⚠️  您的账号下没有任何网站');
      console.log('\n请先在 Search Console 中添加网站：');
      console.log('访问: https://search.google.com/search-console');
    }
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  }
}

listSites();

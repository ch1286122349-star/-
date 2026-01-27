const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// 加载凭据
const credentialsPath = path.join(__dirname, '..', 'gsc-credentials.json');
const tokenPath = path.join(__dirname, '..', 'gsc-token.json');

const loadCredentials = () => {
  if (!fs.existsSync(credentialsPath)) {
    console.error('❌ 凭据文件不存在:', credentialsPath);
    console.log('请先运行: node scripts/gsc_authorize_with_code.js');
    process.exit(1);
  }
  
  if (!fs.existsSync(tokenPath)) {
    console.error('❌ Token文件不存在:', tokenPath);
    console.log('请先运行: node scripts/gsc_authorize_with_code.js');
    process.exit(1);
  }
  
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  
  const { client_id, client_secret } = credentials.installed;
  
  const auth = new google.auth.OAuth2(
    client_id,
    client_secret,
    'http://localhost'
  );
  
  auth.setCredentials(token);
  
  return auth;
};

const submitSitemap = async () => {
  try {
    const auth = loadCredentials();
    const searchconsole = google.searchconsole({ version: 'v1', auth });
    
    const siteUrl = 'https://mxchino.com';
    const sitemapUrl = 'https://mxchino.com/sitemap.xml';
    
    console.log(`📤 正在提交sitemap到Google Search Console...`);
    console.log(`网站: ${siteUrl}`);
    console.log(`Sitemap: ${sitemapUrl}`);
    
    const response = await searchconsole.sitemaps.submit({
      siteUrl: siteUrl,
      feedpath: sitemapUrl
    });
    
    console.log('✅ Sitemap提交成功!');
    console.log('响应:', response.data);
    
    // 获取sitemap状态
    console.log('\n📊 获取sitemap状态...');
    const sitemapStatus = await searchconsole.sitemaps.get({
      siteUrl: siteUrl,
      feedpath: sitemapUrl
    });
    
    console.log('Sitemap状态:');
    console.log('- 提交时间:', sitemapStatus.data.lastSubmitted);
    console.log('- 处理状态:', sitemapStatus.data.warnings?.length || 0, '个警告');
    console.log('- 包含URL数量:', sitemapStatus.data.contents?.[0]?.submitted || '未知');
    
  } catch (error) {
    console.error('❌ 提交失败:', error.message);
    if (error.response) {
      console.error('错误详情:', error.response.data);
    }
  }
};

submitSitemap();

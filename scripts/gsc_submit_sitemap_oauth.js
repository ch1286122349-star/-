const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// OAuth2 凭据文件路径
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
  
  // 检查token是否过期
  const now = Date.now();
  if (token.expiry_date && token.expiry_date < now) {
    console.log('⚠️ Token已过期，需要重新授权');
    console.log('请运行: node scripts/gsc_authorize_with_code.js');
    process.exit(1);
  }
  
  return auth;
};

const submitSitemap = async () => {
  try {
    const auth = loadCredentials();
    const searchconsole = google.searchconsole({ version: 'v1', auth });
    
    const siteUrl = 'https://mxchino.com';
    const sitemapUrl = 'https://mxchino.com/sitemap.xml';
    
    console.log('📤 正在提交sitemap到Google Search Console...');
    console.log(`网站: ${siteUrl}`);
    console.log(`Sitemap: ${sitemapUrl}`);
    
    // 提交sitemap
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
    
    const status = sitemapStatus.data;
    console.log('\n📋 Sitemap详细信息:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📅 最后提交时间: ${status.lastSubmitted || '未知'}`);
    console.log(`📊 处理状态: ${status.warnings?.length || 0} 个警告`);
    console.log(`📄 提交的URL数量: ${status.contents?.[0]?.submitted || '未知'}`);
    console.log(`✅ 已索引的URL数量: ${status.contents?.[0]?.indexed || '未知'}`);
    
    if (status.warnings && status.warnings.length > 0) {
      console.log('\n⚠️ 警告信息:');
      status.warnings.forEach(warning => {
        console.log(`  - ${warning}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 提交失败:', error.message);
    
    if (error.code === 401) {
      console.log('\n🔧 认证失败解决方案:');
      console.log('Token可能已过期，请重新授权:');
      console.log('1. 删除 gsc-token.json');
      console.log('2. 运行: node scripts/gsc_authorize_with_code.js');
    } else if (error.code === 403) {
      console.log('\n🔧 权限问题解决方案:');
      console.log('确保Google账号有GSC访问权限');
    }
    
    if (error.response) {
      console.log('\n详细错误信息:', error.response.data);
    }
  }
};

console.log('🚀 Google Search Console Sitemap 提交工具 (OAuth2)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

submitSitemap();

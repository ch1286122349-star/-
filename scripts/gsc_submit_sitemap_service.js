const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// 服务账号密钥文件路径
const keyPath = path.join(__dirname, '..', 'gsc-service-key.json');

const submitSitemap = async () => {
  try {
    // 检查密钥文件
    if (!fs.existsSync(keyPath)) {
      console.error('❌ 服务账号密钥文件不存在:', keyPath);
      console.log('\n📋 创建步骤:');
      console.log('1. 访问 https://console.cloud.google.com/');
      console.log('2. 启用 Search Console API');
      console.log('3. 创建服务账号并下载JSON密钥');
      console.log('4. 将密钥重命名为 gsc-service-key.json');
      console.log('5. 在GSC中添加服务账号权限');
      process.exit(1);
    }

    // 加载服务账号凭据
    const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    const auth = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      ['https://www.googleapis.com/auth/webmasters'],
      null
    );

    // 创建Search Console客户端
    const searchconsole = google.searchconsole({ version: 'v1', auth });

    const siteUrl = 'sc-domain:mxchino.com';
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

    // 获取网站列表验证权限
    console.log('\n🔍 验证网站访问权限...');
    const sites = await searchconsole.sites.list();
    const hasAccess = sites.data.siteEntry?.some(site => 
      site.siteUrl === siteUrl && site.permissionLevel !== 'siteUnverifiedUser'
    );

    if (hasAccess) {
      console.log('✅ 已获得网站访问权限');
    } else {
      console.log('❌ 没有网站访问权限，请在GSC中添加服务账号');
    }

  } catch (error) {
    console.error('❌ 操作失败:', error.message);
    
    if (error.code === 403) {
      console.log('\n🔧 权限问题解决方案:');
      console.log('1. 确保在GSC中添加了服务账号邮箱');
      console.log('2. 确保给予了"完整权限"');
      console.log('3. 确保服务账号密钥文件正确');
    } else if (error.code === 404) {
      console.log('\n🔧 网站不存在解决方案:');
      console.log('1. 确保网站已添加到GSC');
      console.log('2. 确保网站已验证所有权');
    }
    
    if (error.response) {
      console.log('\n详细错误信息:', error.response.data);
    }
  }
};

// 显示使用说明
console.log('🚀 Google Search Console Sitemap 提交工具');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

submitSitemap();

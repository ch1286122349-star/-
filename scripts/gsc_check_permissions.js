const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const keyPath = path.join(__dirname, '..', 'gsc-service-key.json');

const checkPermissions = async () => {
  try {
    if (!fs.existsSync(keyPath)) {
      console.error('❌ 密钥文件不存在:', keyPath);
      process.exit(1);
    }

    const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    console.log('📋 服务账号信息:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('邮箱:', key.client_email);
    console.log('项目ID:', key.project_id);
    console.log('');

    const auth = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      ['https://www.googleapis.com/auth/webmasters'],
      null
    );

    const searchconsole = google.searchconsole({ version: 'v1', auth });

    console.log('🔍 检查可访问的网站...');
    const sites = await searchconsole.sites.list();
    
    if (sites.data.siteEntry && sites.data.siteEntry.length > 0) {
      console.log('✅ 可访问的网站:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      sites.data.siteEntry.forEach(site => {
        const status = site.permissionLevel === 'siteOwner' ? '👑 所有者' : 
                      site.permissionLevel === 'siteFullUser' ? '🔑 完整权限' : 
                      site.permissionLevel === 'siteRestrictedUser' ? '🔒 受限权限' : '❌ 未验证';
        console.log(`${status} ${site.siteUrl}`);
      });
      
      const targetSite = 'https://mxchino.com';
      const hasAccess = sites.data.siteEntry.some(site => 
        site.siteUrl === targetSite && 
        ['siteOwner', 'siteFullUser'].includes(site.permissionLevel)
      );
      
      if (hasAccess) {
        console.log('\n✅ 已获得 mxchino.com 的访问权限');
        
        // 尝试获取网站数据
        console.log('\n📊 测试获取网站数据...');
        try {
          const siteData = await searchconsole.sites.get({ siteUrl: targetSite });
          console.log('✅ 网站数据获取成功');
          console.log('网站URL:', siteData.data.siteUrl);
          console.log('权限级别:', siteData.data.permissionLevel);
        } catch (error) {
          console.log('❌ 获取网站数据失败:', error.message);
        }
        
      } else {
        console.log('\n❌ 没有获得 mxchino.com 的完整权限');
        console.log('\n🔧 解决方案:');
        console.log('1. 确认在GSC中添加了服务账号邮箱');
        console.log('2. 确认权限设置为"完整权限"或"所有者"');
        console.log('3. 等待几分钟让权限生效');
      }
    } else {
      console.log('❌ 没有可访问的网站');
      console.log('\n🔧 解决方案:');
      console.log('1. 确认在GSC中添加了服务账号邮箱');
      console.log('2. 确认网站已在GSC中验证');
      console.log('3. 等待几分钟让权限生效');
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    if (error.code === 403) {
      console.log('\n🔧 可能的原因:');
      console.log('1. 服务账号没有权限');
      console.log('2. Search Console API未启用');
      console.log('3. 网站未在GSC中验证');
    }
  }
};

console.log('🚀 Google Search Console 权限检查工具');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

checkPermissions();

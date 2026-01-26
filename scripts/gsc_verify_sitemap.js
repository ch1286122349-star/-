const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const keyPath = path.join(__dirname, '..', 'gsc-service-key.json');
const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');

const verifySitemap = async () => {
  try {
    console.log('🚀 Google Search Console Sitemap 完整性验证');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. 读取本地sitemap.xml
    console.log('📄 步骤1: 读取本地sitemap.xml...');
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(sitemapContent);
    
    const localUrls = result.urlset.url || [];
    const localUrlCount = localUrls.length;
    
    console.log(`✅ 本地sitemap包含 ${localUrlCount} 个URL\n`);

    // 2. 分类统计
    console.log('📊 步骤2: URL分类统计...');
    const categories = {
      homepage: 0,
      categories: 0,
      restaurants: 0,
      play: 0,
      expo: 0,
      companies: 0
    };

    localUrls.forEach(url => {
      const loc = url.loc[0];
      if (loc === 'https://mxchino.com/') {
        categories.homepage++;
      } else if (loc.match(/\/(companies|directory|enterprises|forum)$/)) {
        categories.categories++;
      } else if (loc.includes('/restaurants')) {
        categories.restaurants++;
      } else if (loc.includes('/play-')) {
        categories.play++;
      } else if (loc.includes('/expo-')) {
        categories.expo++;
      } else if (loc.includes('/company/')) {
        categories.companies++;
      }
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🏠 主页: ${categories.homepage}`);
    console.log(`📋 分类页面: ${categories.categories}`);
    console.log(`🍽️  餐厅相关: ${categories.restaurants}`);
    console.log(`🎢 玩乐地点: ${categories.play}`);
    console.log(`🏢 展会: ${categories.expo}`);
    console.log(`🏪 公司详情: ${categories.companies}`);
    console.log(`📊 总计: ${localUrlCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 3. 连接GSC
    console.log('🔗 步骤3: 连接Google Search Console...');
    const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    const auth = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      ['https://www.googleapis.com/auth/webmasters'],
      null
    );

    const searchconsole = google.searchconsole({ version: 'v1', auth });
    const siteUrl = 'sc-domain:mxchino.com';
    const sitemapUrl = 'https://mxchino.com/sitemap.xml';

    console.log(`✅ 已连接到 ${siteUrl}\n`);

    // 4. 获取sitemap状态
    console.log('📊 步骤4: 获取GSC中的sitemap状态...');
    try {
      const sitemapStatus = await searchconsole.sitemaps.get({
        siteUrl: siteUrl,
        feedpath: sitemapUrl
      });

      const status = sitemapStatus.data;
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📅 最后提交时间: ${status.lastSubmitted || '未提交'}`);
      console.log(`📄 GSC显示的URL数量: ${status.contents?.[0]?.submitted || '未知'}`);
      console.log(`✅ 已索引的URL数量: ${status.contents?.[0]?.indexed || 0}`);
      console.log(`⚠️  警告数量: ${status.warnings || 0}`);
      console.log(`❌ 错误数量: ${status.errors || 0}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // 5. 对比验证
      console.log('🔍 步骤5: 对比验证...');
      const gscUrlCount = status.contents?.[0]?.submitted || 0;
      const difference = localUrlCount - gscUrlCount;

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📄 本地sitemap.xml: ${localUrlCount} 个URL`);
      console.log(`☁️  GSC显示数量: ${gscUrlCount} 个URL`);
      console.log(`📊 差异: ${difference} 个URL`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      if (difference === 0) {
        console.log('✅ 完美！本地sitemap与GSC中的数量完全一致！');
      } else if (Math.abs(difference) <= 5) {
        console.log('⚠️  数量有轻微差异，这可能是正常的：');
        console.log('   - GSC可能还在处理最新的sitemap');
        console.log('   - 某些URL可能被GSC过滤');
        console.log('   - 建议等待24小时后再次检查');
      } else {
        console.log('❌ 数量差异较大，需要检查：');
        console.log('   - sitemap.xml是否正确生成');
        console.log('   - 是否有URL格式错误');
        console.log('   - 是否有重复的URL');
      }

      // 6. 列出所有sitemap
      console.log('\n📋 步骤6: 列出所有已提交的sitemap...');
      const sitemaps = await searchconsole.sitemaps.list({
        siteUrl: siteUrl
      });

      if (sitemaps.data.sitemap && sitemaps.data.sitemap.length > 0) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        sitemaps.data.sitemap.forEach((sm, index) => {
          console.log(`${index + 1}. ${sm.path}`);
          console.log(`   提交时间: ${sm.lastSubmitted || '未知'}`);
          console.log(`   URL数量: ${sm.contents?.[0]?.submitted || 0}`);
          console.log(`   已索引: ${sm.contents?.[0]?.indexed || 0}`);
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }

      // 7. 最终报告
      console.log('📊 最终验证报告');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const checks = [
        { name: 'Sitemap已提交到GSC', status: status.lastSubmitted ? '✅' : '❌' },
        { name: 'URL数量匹配', status: Math.abs(difference) <= 5 ? '✅' : '⚠️' },
        { name: '无错误', status: (status.errors || 0) === 0 ? '✅' : '❌' },
        { name: '服务账号权限正常', status: '✅' }
      ];

      checks.forEach(check => {
        console.log(`${check.status} ${check.name}`);
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      const allPassed = checks.every(c => c.status === '✅');
      if (allPassed) {
        console.log('🎉 所有检查通过！Sitemap功能完整性验证成功！');
      } else {
        console.log('⚠️  部分检查未通过，请查看上述详情。');
      }

    } catch (error) {
      if (error.code === 404) {
        console.log('❌ Sitemap尚未提交到GSC');
        console.log('\n🔧 请运行以下命令提交sitemap:');
        console.log('   node scripts/gsc_submit_sitemap_service.js');
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    if (error.response) {
      console.error('详细错误:', error.response.data);
    }
  }
};

verifySitemap();

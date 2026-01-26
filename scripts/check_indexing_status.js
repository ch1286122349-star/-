#!/usr/bin/env node

/**
 * 检查网站索引状态脚本
 * 使用 Google Search Console API 查看哪些页面被索引，哪些没有
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '../gsc-credentials.json');
const TOKEN_PATH = path.join(__dirname, '../.gsc-token.json');
const SITE_URL = 'sc-domain:mxchino.com';

async function checkIndexingStatus() {
  try {
    // 加载凭据
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));

    const { client_id, client_secret, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    const searchconsole = google.searchconsole({ version: 'v1', auth: oAuth2Client });

    console.log('📊 正在检查网站索引状态...\n');

    // 1. 获取站点地图状态
    console.log('1️⃣ 检查站点地图提交状态...');
    try {
      const sitemapsResponse = await searchconsole.sitemaps.list({
        siteUrl: SITE_URL,
      });

      if (sitemapsResponse.data.sitemap && sitemapsResponse.data.sitemap.length > 0) {
        console.log('✅ 已提交的站点地图：');
        sitemapsResponse.data.sitemap.forEach(sitemap => {
          console.log(`   - ${sitemap.path}`);
          console.log(`     提交时间: ${sitemap.lastSubmitted || '未知'}`);
          console.log(`     最后下载: ${sitemap.lastDownloaded || '未知'}`);
          if (sitemap.contents) {
            sitemap.contents.forEach(content => {
              console.log(`     ${content.type}: ${content.submitted || 0} 已提交, ${content.indexed || 0} 已索引`);
            });
          }
          console.log('');
        });
      } else {
        console.log('❌ 未找到已提交的站点地图！');
        console.log('   请在 Google Search Console 中提交 sitemap.xml\n');
      }
    } catch (error) {
      console.log('⚠️  无法获取站点地图信息:', error.message);
    }

    // 2. 获取索引覆盖率数据（需要 URL Inspection API，但可能需要额外权限）
    console.log('2️⃣ 检查页面索引覆盖率...');
    
    // 使用 Search Analytics API 获取已索引的页面
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 28);

    const analyticsResponse = await searchconsole.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['page'],
        rowLimit: 25000,
      },
    });

    const indexedPages = analyticsResponse.data.rows || [];
    console.log(`✅ 过去 28 天有搜索数据的页面数: ${indexedPages.length}`);
    
    if (indexedPages.length > 0) {
      console.log('\n📄 有搜索数据的页面（前 20 个）：');
      indexedPages.slice(0, 20).forEach((row, index) => {
        const url = row.keys[0];
        const impressions = row.impressions;
        const clicks = row.clicks;
        console.log(`   ${index + 1}. ${url}`);
        console.log(`      展示: ${impressions}, 点击: ${clicks}`);
      });
    }

    // 3. 分析页面类型分布
    console.log('\n3️⃣ 分析页面类型分布...');
    const pageTypes = {
      company: 0,
      play: 0,
      expo: 0,
      other: 0,
    };

    indexedPages.forEach(row => {
      const url = row.keys[0];
      if (url.includes('/company/')) pageTypes.company++;
      else if (url.includes('/play-')) pageTypes.play++;
      else if (url.includes('/expo-')) pageTypes.expo++;
      else pageTypes.other++;
    });

    console.log('   页面类型分布：');
    console.log(`   - 公司详情页: ${pageTypes.company}`);
    console.log(`   - 玩乐地点页: ${pageTypes.play}`);
    console.log(`   - 展会页面: ${pageTypes.expo}`);
    console.log(`   - 其他页面: ${pageTypes.other}`);

    // 4. 保存详细报告
    const report = {
      checkDate: new Date().toISOString(),
      totalIndexedPages: indexedPages.length,
      pageTypes,
      indexedPages: indexedPages.map(row => ({
        url: row.keys[0],
        impressions: row.impressions,
        clicks: row.clicks,
        ctr: row.ctr,
        position: row.position,
      })),
    };

    const reportPath = path.join(__dirname, '../data/indexing-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n✅ 详细报告已保存到: ${reportPath}`);

    // 5. 给出建议
    console.log('\n💡 建议：');
    if (indexedPages.length < 50) {
      console.log('   ⚠️  索引页面数较少（< 50），建议：');
      console.log('   1. 确保已在 Google Search Console 提交 sitemap.xml');
      console.log('   2. 检查 robots.txt 是否正确');
      console.log('   3. 等待 2-4 周让 Google 完全抓取');
    }
    
    if (pageTypes.company === 0) {
      console.log('   ⚠️  没有公司详情页被索引，可能原因：');
      console.log('   1. 页面内容重复度高');
      console.log('   2. 页面质量不够（内容太少）');
      console.log('   3. 缺少内部链接');
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
    if (error.response) {
      console.error('详细信息:', error.response.data);
    }
  }
}

checkIndexingStatus();

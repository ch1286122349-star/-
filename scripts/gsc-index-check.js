// GSC Index Coverage check script
// Usage:
//   GSC_KEY_FILE=/Users/sheldon/Desktop/新项目/gsc-service-key.json \
//   GSC_SITE_URL=sc-domain:mxchino.com \
//   node scripts/gsc-index-check.js

const { google } = require('googleapis');
const path = require('path');

const SITE_URL = process.env.GSC_SITE_URL || 'sc-domain:mxchino.com';
const KEY_FILE = process.env.GSC_KEY_FILE || path.join(__dirname, '../gsc-service-key.json');

async function run() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const searchconsole = google.searchconsole({ version: 'v1', auth });

  // Get index status using URL Inspection API (limited) or sitemaps
  // Note: GSC API v1 doesn't directly expose index coverage report data
  // We'll use sitemaps list to get submitted vs indexed count

  try {
    const sitemaps = await searchconsole.sitemaps.list({
      siteUrl: SITE_URL,
    });

    console.log(`站点: ${SITE_URL}\n`);
    console.log('=== Sitemap 索引状态 ===');
    
    if (sitemaps.data.sitemap && sitemaps.data.sitemap.length > 0) {
      let totalSubmitted = 0;
      let totalIndexed = 0;

      sitemaps.data.sitemap.forEach((sitemap) => {
        const path = sitemap.path;
        const submitted = sitemap.contents?.[0]?.submitted || 0;
        const indexed = sitemap.contents?.[0]?.indexed || 0;
        
        totalSubmitted += Number(submitted);
        totalIndexed += Number(indexed);

        console.log(`\nSitemap: ${path}`);
        console.log(`  已提交: ${submitted}`);
        console.log(`  已编入索引: ${indexed}`);
        console.log(`  索引率: ${submitted > 0 ? ((indexed / submitted) * 100).toFixed(1) : 0}%`);
      });

      console.log(`\n=== 总计 ===`);
      console.log(`已提交总数: ${totalSubmitted}`);
      console.log(`已编入索引总数: ${totalIndexed}`);
      console.log(`总索引率: ${totalSubmitted > 0 ? ((totalIndexed / totalSubmitted) * 100).toFixed(1) : 0}%`);
    } else {
      console.log('未找到 Sitemap 数据');
    }

    // Try to get recent search analytics data to show indexed pages activity
    const today = new Date();
    const get30DaysAgo = () => {
      const d = new Date(today);
      d.setDate(d.getDate() - 30);
      return d.toISOString().split('T')[0];
    };
    const get3DaysAgo = () => {
      const d = new Date(today);
      d.setDate(d.getDate() - 3);
      return d.toISOString().split('T')[0];
    };

    const analytics = await searchconsole.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate: get30DaysAgo(),
        endDate: get3DaysAgo(),
        dimensions: ['page'],
        rowLimit: 1000,
      },
    });

    const uniquePages = new Set();
    if (analytics.data.rows) {
      analytics.data.rows.forEach((row) => {
        uniquePages.add(row.keys[0]);
      });
    }

    console.log(`\n=== 近30天有搜索展示的页面数 ===`);
    console.log(`活跃页面数: ${uniquePages.size}`);
    console.log(`（这些页面在搜索结果中有展示，说明已被 Google 索引）`);

  } catch (error) {
    console.error('查询失败:', error.message);
    process.exitCode = 1;
  }
}

run();

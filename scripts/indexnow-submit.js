// IndexNow batch submission script
// Usage:
//   node scripts/indexnow-submit.js
// This script will:
// 1. Read all URLs from sitemap.xml
// 2. Submit them to IndexNow (Bing/Yandex) for fast indexing

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SITE_URL = 'https://mxchino.com';
const SITEMAP_PATH = path.join(__dirname, '../sitemap.xml');

// Generate a simple API key (you can use any random string, but we'll generate one)
// For production, store this key in a file at your site root: /[key].txt
const API_KEY = crypto.randomBytes(16).toString('hex');

async function submitToIndexNow(urls) {
  const endpoint = 'https://api.indexnow.org/indexnow';
  
  // IndexNow accepts max 10,000 URLs per request, we'll batch in chunks of 100
  const batchSize = 100;
  const batches = [];
  
  for (let i = 0; i < urls.length; i += batchSize) {
    batches.push(urls.slice(i, i + batchSize));
  }

  console.log(`准备提交 ${urls.length} 个 URL，分为 ${batches.length} 批次\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    try {
      const payload = {
        host: 'mxchino.com',
        key: API_KEY,
        urlList: batch,
      };

      const response = await axios.post(endpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });

      if (response.status === 200) {
        successCount += batch.length;
        console.log(`✓ 批次 ${i + 1}/${batches.length} 成功提交 ${batch.length} 个 URL`);
      } else {
        failCount += batch.length;
        console.log(`✗ 批次 ${i + 1}/${batches.length} 失败 (状态码: ${response.status})`);
      }
    } catch (error) {
      failCount += batch.length;
      console.log(`✗ 批次 ${i + 1}/${batches.length} 失败: ${error.message}`);
    }

    // Add small delay between batches to avoid rate limiting
    if (i < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(`\n=== 提交完成 ===`);
  console.log(`成功: ${successCount} 个 URL`);
  console.log(`失败: ${failCount} 个 URL`);
  console.log(`\n重要提示：`);
  console.log(`1. 请在网站根目录创建文件: ${API_KEY}.txt`);
  console.log(`   文件内容为: ${API_KEY}`);
  console.log(`2. 确保该文件可通过 ${SITE_URL}/${API_KEY}.txt 访问`);
  console.log(`3. 这是 IndexNow 验证你拥有该域名的方式`);
}

function extractUrlsFromSitemap() {
  const sitemapContent = fs.readFileSync(SITEMAP_PATH, 'utf-8');
  const urlMatches = sitemapContent.match(/<loc>(.*?)<\/loc>/g);
  
  if (!urlMatches) {
    console.error('未在 sitemap.xml 中找到任何 URL');
    return [];
  }

  const urls = urlMatches.map((match) => {
    return match.replace(/<\/?loc>/g, '');
  });

  return urls;
}

async function run() {
  console.log('IndexNow 批量提交工具\n');
  console.log(`站点: ${SITE_URL}`);
  console.log(`Sitemap: ${SITEMAP_PATH}\n`);

  const urls = extractUrlsFromSitemap();
  
  if (urls.length === 0) {
    console.error('没有找到可提交的 URL');
    process.exit(1);
  }

  console.log(`从 sitemap 中提取到 ${urls.length} 个 URL\n`);

  await submitToIndexNow(urls);
}

run().catch((err) => {
  console.error('执行失败:', err.message);
  process.exitCode = 1;
});

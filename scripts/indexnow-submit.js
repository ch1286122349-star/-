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

// Use the fixed API key that matches the verification file we deployed
const API_KEY = '3fa9ff18f8f0951a811beed43bef1e13';

async function submitToIndexNow(urls) {
  // Try Bing's endpoint directly (more reliable than indexnow.org)
  const endpoint = 'https://www.bing.com/indexnow';
  
  console.log(`准备提交 ${urls.length} 个 URL\n`);
  console.log(`使用 API Key: ${API_KEY}`);
  console.log(`验证文件: https://mxchino.com/${API_KEY}.txt\n`);

  let successCount = 0;
  let failCount = 0;

  // Submit all URLs in a single request (Bing supports up to 10,000 URLs)
  try {
    const payload = {
      host: 'mxchino.com',
      key: API_KEY,
      keyLocation: `https://mxchino.com/${API_KEY}.txt`,
      urlList: urls,
    };

    console.log(`提交中... (${urls.length} 个 URL)`);
    
    const response = await axios.post(endpoint, payload, {
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
      },
      timeout: 30000,
    });

    if (response.status === 200 || response.status === 202) {
      successCount = urls.length;
      console.log(`✓ 成功提交所有 URL (状态码: ${response.status})`);
    } else {
      failCount = urls.length;
      console.log(`✗ 提交失败 (状态码: ${response.status})`);
      console.log(`响应数据:`, response.data);
    }
  } catch (error) {
    failCount = urls.length;
    console.log(`✗ 提交失败: ${error.message}`);
    if (error.response) {
      console.log(`状态码: ${error.response.status}`);
      console.log(`响应数据:`, error.response.data);
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

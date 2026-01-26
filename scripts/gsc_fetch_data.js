const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// OAuth2 配置
const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];
const TOKEN_PATH = path.join(__dirname, '../.gsc-token.json');
const CREDENTIALS_PATH = path.join(__dirname, '../gsc-credentials.json');

// 您的网站 URL（域名资源格式）
const SITE_URL = 'sc-domain:mxchino.com';

/**
 * 创建 OAuth2 客户端
 */
async function authorize() {
  let credentials;
  try {
    credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  } catch (err) {
    console.error('❌ 未找到 gsc-credentials.json 文件');
    console.error('请按照以下步骤操作：');
    console.error('1. 访问 https://console.cloud.google.com/apis/credentials');
    console.error('2. 创建 OAuth 2.0 客户端 ID（桌面应用）');
    console.error('3. 下载 JSON 文件并保存为 gsc-credentials.json');
    process.exit(1);
  }

  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // 检查是否已有 token
  try {
    const token = fs.readFileSync(TOKEN_PATH, 'utf8');
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (err) {
    return getNewToken(oAuth2Client);
  }
}

/**
 * 获取新的访问令牌
 */
function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('\n🔐 请访问以下 URL 进行授权：\n');
  console.log(authUrl);
  console.log('\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('授权后，请输入页面中的授权码：', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return reject(err);
        oAuth2Client.setCredentials(token);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
        console.log('✅ Token 已保存到', TOKEN_PATH);
        resolve(oAuth2Client);
      });
    });
  });
}

/**
 * 获取 Search Console 数据
 */
async function fetchSearchConsoleData(auth, startDate, endDate) {
  const searchconsole = google.searchconsole({ version: 'v1', auth });

  try {
    const response = await searchconsole.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate: startDate,
        endDate: endDate,
        dimensions: ['query', 'page'],
        rowLimit: 100,
        dataState: 'final'
      },
    });

    return response.data;
  } catch (error) {
    console.error('❌ API 调用失败:', error.message);
    if (error.code === 403) {
      console.error('请确保：');
      console.error('1. 已在 Search Console 中验证网站所有权');
      console.error('2. 使用的 Google 账号有权限访问该网站数据');
    }
    throw error;
  }
}

/**
 * 获取网站概览数据
 */
async function fetchOverviewData(auth, startDate, endDate) {
  const searchconsole = google.searchconsole({ version: 'v1', auth });

  try {
    const response = await searchconsole.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate: startDate,
        endDate: endDate,
        dimensions: [],
        dataState: 'final'
      },
    });

    return response.data;
  } catch (error) {
    console.error('❌ 获取概览数据失败:', error.message);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🔍 正在获取 Google Search Console 数据...\n');

  // 设置日期范围（最近 28 天）
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 3); // GSC 数据有 2-3 天延迟
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 28);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  console.log(`📅 数据时间范围: ${startDateStr} 至 ${endDateStr}\n`);

  try {
    const auth = await authorize();

    // 获取概览数据
    console.log('📊 获取网站概览数据...');
    const overview = await fetchOverviewData(auth, startDateStr, endDateStr);
    
    if (overview.rows && overview.rows.length > 0) {
      const stats = overview.rows[0];
      console.log('\n=== 网站整体表现 ===');
      console.log(`总点击量: ${stats.clicks.toLocaleString()}`);
      console.log(`总展示次数: ${stats.impressions.toLocaleString()}`);
      console.log(`平均 CTR: ${(stats.ctr * 100).toFixed(2)}%`);
      console.log(`平均排名: ${stats.position.toFixed(1)}`);
    }

    // 获取详细数据
    console.log('\n📈 获取详细搜索数据...');
    const data = await fetchSearchConsoleData(auth, startDateStr, endDateStr);

    if (data.rows && data.rows.length > 0) {
      console.log(`\n✅ 成功获取 ${data.rows.length} 条数据\n`);
      
      console.log('=== Top 10 搜索查询 ===');
      const topQueries = data.rows
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      topQueries.forEach((row, index) => {
        console.log(`\n${index + 1}. 查询词: ${row.keys[0]}`);
        console.log(`   页面: ${row.keys[1]}`);
        console.log(`   点击: ${row.clicks} | 展示: ${row.impressions} | CTR: ${(row.ctr * 100).toFixed(2)}% | 排名: ${row.position.toFixed(1)}`);
      });

      // 保存完整数据到文件
      const outputPath = path.join(__dirname, '../data/gsc-data.json');
      fs.writeFileSync(outputPath, JSON.stringify({
        dateRange: { start: startDateStr, end: endDateStr },
        overview: overview.rows ? overview.rows[0] : null,
        queries: data.rows
      }, null, 2));
      console.log(`\n💾 完整数据已保存到: ${outputPath}`);
    } else {
      console.log('⚠️  未找到数据，可能原因：');
      console.log('- 网站数据尚未被 Google 收录');
      console.log('- 选择的日期范围内没有数据');
      console.log('- 网站 URL 不正确');
    }

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { authorize, fetchSearchConsoleData, fetchOverviewData };

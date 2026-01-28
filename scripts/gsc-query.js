// GSC Search Analytics API query script
// Usage:
//   GSC_KEY_FILE=/Users/sheldon/Desktop/新项目/gsc-service-key.json \
//   GSC_SITE_URL=https://mxchino.com/ \
//   node scripts/gsc-query.js
// Optional env:
//   GSC_DAYS: lookback days, defaults to 1 (yesterday)

const { google } = require('googleapis');
const path = require('path');

const SITE_URL = process.env.GSC_SITE_URL || 'https://mxchino.com/';
const KEY_FILE = process.env.GSC_KEY_FILE || path.join(__dirname, '../gsc-service-key.json');
const LOOKBACK_DAYS = Number(process.env.GSC_DAYS || 1);

async function run() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const searchconsole = google.searchconsole({ version: 'v1', auth });

  const today = new Date();
  const getDateStr = (daysAgo) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const currentStart = getDateStr(LOOKBACK_DAYS + 1);
  const currentEnd = getDateStr(LOOKBACK_DAYS);
  const previousStart = getDateStr(LOOKBACK_DAYS * 2 + 1);
  const previousEnd = getDateStr(LOOKBACK_DAYS + 2);

  const requestBody = {
    startDate: currentStart,
    endDate: currentEnd,
    dimensions: ['query'],
    rowLimit: 20,
  };

  const [current, previous] = await Promise.all([
    searchconsole.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody,
    }),
    searchconsole.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        ...requestBody,
        startDate: previousStart,
        endDate: previousEnd,
      },
    }),
  ]);

  const currentRows = current.data.rows || [];
  const previousRows = previous.data.rows || [];

  const currentTotal = currentRows.reduce((sum, r) => sum + (r.clicks || 0), 0);
  const currentImpressions = currentRows.reduce((sum, r) => sum + (r.impressions || 0), 0);
  const currentAvgPos = currentRows.length > 0
    ? currentRows.reduce((sum, r) => sum + (r.position || 0), 0) / currentRows.length
    : 0;
  const currentCTR = currentImpressions > 0 ? (currentTotal / currentImpressions) * 100 : 0;

  const previousTotal = previousRows.reduce((sum, r) => sum + (r.clicks || 0), 0);
  const previousImpressions = previousRows.reduce((sum, r) => sum + (r.impressions || 0), 0);
  const previousAvgPos = previousRows.length > 0
    ? previousRows.reduce((sum, r) => sum + (r.position || 0), 0) / previousRows.length
    : 0;
  const previousCTR = previousImpressions > 0 ? (previousTotal / previousImpressions) * 100 : 0;

  console.log(`站点: ${SITE_URL}`);
  console.log(`当前期间: ${currentStart} 到 ${currentEnd}`);
  console.log(`对比期间: ${previousStart} 到 ${previousEnd}\n`);

  console.log('=== 总体指标对比 ===');
  console.log(`点击量: ${currentTotal} (前: ${previousTotal}, Δ: ${currentTotal - previousTotal})`);
  console.log(`展示量: ${currentImpressions} (前: ${previousImpressions}, Δ: ${currentImpressions - previousImpressions})`);
  console.log(`平均排名: ${currentAvgPos.toFixed(2)} (前: ${previousAvgPos.toFixed(2)}, Δ: ${(currentAvgPos - previousAvgPos).toFixed(2)})`);
  console.log(`平均CTR: ${currentCTR.toFixed(2)}% (前: ${previousCTR.toFixed(2)}%, Δ: ${(currentCTR - previousCTR).toFixed(2)}%)\n`);

  console.log('=== Top 20 查询词（当前期间）===');
  console.log('查询词\t点击\t展示\t排名\tCTR%');
  currentRows.slice(0, 20).forEach((row) => {
    const query = row.keys[0];
    const clicks = row.clicks || 0;
    const impressions = row.impressions || 0;
    const position = (row.position || 0).toFixed(1);
    const ctr = ((row.ctr || 0) * 100).toFixed(2);
    console.log(`${query}\t${clicks}\t${impressions}\t${position}\t${ctr}`);
  });
}

run().catch((err) => {
  console.error('GSC query failed:', err.message);
  process.exitCode = 1;
});

// GA4 Data API quick query script
// Usage:
//   GA4_KEY_FILE=/Users/sheldon/Desktop/新项目/scripts/able-inn-419703-ee75981fcea2.json \
//   node scripts/ga4-query.js
// Optional env:
//   GA4_PROPERTY_ID: defaults to 380569192
//   GA4_DAYS: lookback days, defaults to 30

const path = require('path');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

const PROPERTY_ID = process.env.GA4_PROPERTY_ID || '380569192';
const KEY_FILE = process.env.GA4_KEY_FILE || path.join(__dirname, 'able-inn-419703-ee75981fcea2.json');
const LOOKBACK_DAYS = Number(process.env.GA4_DAYS || 30);

const channelMap = {
  'Direct': '直接流量',
  'Organic Search': '自然搜索',
  'Referral': '引荐',
  'Paid Search': '付费搜索',
  'Paid Social': '付费社交',
  'Organic Social': '自然社交',
  'Email': '邮件',
  'Display': '展示广告',
  'Video': '视频',
  'Unassigned': '未分配',
  'Cross-network': '跨网络',
};

async function run() {
  const client = new BetaAnalyticsDataClient({ keyFilename: KEY_FILE });

  const commonRequest = {
    property: `properties/${PROPERTY_ID}`,
    metrics: [
      { name: 'activeUsers' },
      { name: 'sessions' },
      { name: 'eventCount' },
      { name: 'engagedSessions' },
    ],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    limit: 50,
  };

  const [current] = await client.runReport({
    ...commonRequest,
    dateRanges: [{ startDate: `${LOOKBACK_DAYS}daysAgo`, endDate: 'today' }],
  });

  const [previous] = await client.runReport({
    ...commonRequest,
    dateRanges: [{ startDate: `${LOOKBACK_DAYS * 2}daysAgo`, endDate: `${LOOKBACK_DAYS + 1}daysAgo` }],
  });

  // Merge by channel
  const map = new Map();
  const addRows = (rows, key) => {
    rows.forEach((row) => {
      const channel = row.dimensionValues[0].value;
      const metrics = row.metricValues.map((m) => Number(m.value || 0));
      if (!map.has(channel)) map.set(channel, { current: [0, 0, 0, 0], previous: [0, 0, 0, 0] });
      map.get(channel)[key] = metrics;
    });
  };
  addRows(current.rows || [], 'current');
  addRows(previous.rows || [], 'previous');

  const header = ['渠道', 'activeUsers(现)', 'activeUsers(前)', 'Δ', 'sessions(现)', 'sessions(前)', 'Δ', 'eventCount(现)', 'eventCount(前)', 'Δ', 'engagedSessions(现)', 'engagedSessions(前)', 'Δ'];
  console.log(`Property: ${PROPERTY_ID}`);
  console.log(`当前 ${LOOKBACK_DAYS} 天 vs 前一周期 ${LOOKBACK_DAYS} 天`);
  console.log(header.join('\t'));

  map.forEach((val, channel) => {
    const zh = channelMap[channel] || channel;
    const [cuA, cuS, cuE, cuEng] = val.current;
    const [prA, prS, prE, prEng] = val.previous;
    const row = [
      zh,
      cuA, prA, cuA - prA,
      cuS, prS, cuS - prS,
      cuE, prE, cuE - prE,
      cuEng, prEng, cuEng - prEng,
    ];
    console.log(row.join('\t'));
  });
}

run().catch((err) => {
  console.error('GA4 query failed:', err.message);
  process.exitCode = 1;
});

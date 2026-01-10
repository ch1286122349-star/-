require('dotenv').config();
const fs = require('fs');
const path = require('path');

const apiKey = (process.env.GOOGLE_PLACES_API_KEY || '').trim();
if (!apiKey) {
  console.error('Missing GOOGLE_PLACES_API_KEY');
  process.exit(1);
}

const companiesPath = path.join(__dirname, '..', 'data', 'companies.json');
const outputPath = path.resolve(
  process.env.OUTPUT_PATH || path.join(__dirname, '..', 'data', 'discovered-chinese-named-businesses.json')
);

const loadJson = (filePath, fallback) => {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    return fallback;
  }
};

const companies = loadJson(companiesPath, []);
const existingCompanies = new Set(
  companies.map((company) => String(company.placeId || company.place_id || '').trim()).filter(Boolean)
);

const existingDiscoveries = loadJson(outputPath, []);
const discoveryMap = new Map();
if (Array.isArray(existingDiscoveries)) {
  existingDiscoveries.forEach((entry) => {
    if (entry && entry.place_id) {
      discoveryMap.set(entry.place_id, entry);
    }
  });
}

const hasHan = (value) => /\p{Script=Han}/u.test(String(value || ''));
const normalize = (value) => String(value || '')
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .toLowerCase();
const hintTokens = [
  'china',
  'chino',
  'oriental',
  'asia',
  'mandarin',
  'sichuan',
  'szechuan',
  'chongqing',
  'shanghai',
  'beijing',
  'lanzhou',
  'lan zhou',
  'lamian',
  'la mian',
  'biangbiang',
  'biang biang',
  'xiaolong',
  'xiaolongbao',
  'jiaozi',
  'jiao zi',
  'guotie',
  'hotpot',
  'hot pot',
  'huoguo',
  'huo guo',
  'malatang',
  'mala tang',
  'chuanchuan',
  'chuan chuan',
  'dumpling',
  'noodle',
  'ramen',
  'yibin',
  'ranmian',
  'xihu',
];
const matchesHint = (value) => {
  const normalized = normalize(value);
  return hintTokens.some((token) => normalized.includes(token));
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const pinyinKeywordRaw = (process.env.PINYIN_KEYWORDS || '').trim();
const pinyinKeywords = pinyinKeywordRaw
  ? pinyinKeywordRaw.split('|').map((item) => item.trim()).filter(Boolean)
  : [];

const categories = [
  {
    id: 'food',
    label: '餐饮',
    keywords: [
      '中餐',
      '中餐馆',
      '火锅',
      '烧烤',
      '串串',
      '麻辣烫',
      '面馆',
      '拉面',
      '饺子',
      '小吃',
      'hotpot',
      'hot pot',
      'huoguo',
      'huo guo',
      'chuanchuan',
      'chuan chuan',
      'malatang',
      'mala tang',
      'lanzhou',
      'lan zhou',
      'lamian',
      'la mian',
      'biangbiang',
      'biang biang',
      'xiaolongbao',
      'xiaolong',
      'jiaozi',
      'jiao zi',
      'guotie',
      'yibin ranmian',
      'ranmian',
      'xihu hotpot',
      'xihu',
      ...pinyinKeywords,
    ],
  },
  { id: 'dessert', label: '甜品/茶饮', keywords: ['甜品', '奶茶', '茶饮', '烘焙', '蛋糕', '糖水', 'boba', 'bubble tea', 'milk tea'] },
  { id: 'retail', label: '零售/超市', keywords: ['超市', '亚洲超市', '便利店', '百货', '食品店'] },
  { id: 'beauty', label: '美容/美发/美甲', keywords: ['美甲', '美发', '理发', '发廊', '美容'] },
  { id: 'wellness', label: '按摩/养生', keywords: ['按摩', '足疗', '推拿', '养生'] },
  { id: 'health', label: '医疗/中医', keywords: ['中医', '针灸', '诊所', '药房'] },
  { id: 'education', label: '教育/培训', keywords: ['中文学校', '中文课', '培训', '教育'] },
  { id: 'logistics', label: '物流/清关', keywords: ['物流', '快递', '货运', '清关'] },
  { id: 'trade', label: '外贸/进出口', keywords: ['外贸', '进出口', '贸易', '代理'] },
  { id: 'real-estate', label: '地产/中介', keywords: ['地产', '房产', '中介', '租房'] },
  { id: 'auto', label: '汽车/维修', keywords: ['修车', '汽修', '汽车'] },
  { id: 'tech', label: '手机/电子/IT', keywords: ['手机', '电子', '电脑', '维修', 'IT'] },
];

const globalKeywords = ['华人', '中文', '中国', '唐人街'];

const cityQuery = (process.env.CITY_QUERY || '').trim() || '墨西哥城';
const metroQueriesRaw = (process.env.METRO_QUERIES || '').trim();
const metroQueries = metroQueriesRaw
  ? metroQueriesRaw.split('|').map((item) => item.trim()).filter(Boolean)
  : [cityQuery];
const queryMode = (process.env.QUERY_MODE || 'metro').trim().toLowerCase();
const boundsRaw = (process.env.BOUNDING_BOX || '').trim();
const boundsParts = boundsRaw.split(',').map((value) => Number.parseFloat(value));
const bounds = boundsParts.length === 4 && boundsParts.every((value) => Number.isFinite(value))
  ? {
      latMin: Math.min(boundsParts[0], boundsParts[1]),
      latMax: Math.max(boundsParts[0], boundsParts[1]),
      lngMin: Math.min(boundsParts[2], boundsParts[3]),
      lngMax: Math.max(boundsParts[2], boundsParts[3]),
    }
  : null;
const withinBounds = (lat, lng) => {
  if (!bounds) return true;
  if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
  return lat >= bounds.latMin && lat <= bounds.latMax && lng >= bounds.lngMin && lng <= bounds.lngMax;
};
const locationRaw = (process.env.LOCATION || '').trim();
const locationParts = locationRaw.split(',').map((value) => Number.parseFloat(value));
const location = locationParts.length === 2 && locationParts.every((value) => Number.isFinite(value))
  ? { lat: locationParts[0], lng: locationParts[1] }
  : null;
const radius = Number.parseInt(process.env.RADIUS || '', 10);
const hasRadius = Number.isFinite(radius) && radius > 0;

const buildQueries = (keyword, category) => {
  if (queryMode === 'location') {
    return [{ category, keyword, area: cityQuery, baseKeyword: keyword }];
  }
  if (queryMode === 'city') {
    return [{ category, keyword: `${keyword} ${cityQuery}`, area: cityQuery, baseKeyword: keyword }];
  }
  return metroQueries.map((metroQuery) => ({
    category,
    keyword: `${keyword} ${metroQuery}`,
    area: metroQuery,
    baseKeyword: keyword,
  }));
};

const queryQueue = [];
categories.forEach((category) => {
  category.keywords.forEach((keyword) => {
    buildQueries(keyword, category).forEach((task) => queryQueue.push(task));
  });
});
globalKeywords.forEach((keyword) => {
  buildQueries(keyword, { label: '综合' }).forEach((task) => queryQueue.push(task));
});

const fetchTextSearch = async (query, token = '') => {
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.set('query', query);
  if (token) url.searchParams.set('pagetoken', token);
  if (location && hasRadius) {
    url.searchParams.set('location', `${location.lat},${location.lng}`);
    url.searchParams.set('radius', String(radius));
  }
  url.searchParams.set('language', 'zh-CN');
  url.searchParams.set('key', apiKey);
  const res = await fetch(url.toString());
  return res.json();
};

const MAX_PAGES = Number.parseInt(process.env.MAX_PAGES || '2', 10);
const MAX_SECONDS = Number.parseInt(process.env.MAX_SECONDS || '180', 10);
const startedAt = Date.now();

const addDiscovery = (placeId, payload) => {
  const existing = discoveryMap.get(placeId);
  if (existing) {
    existing.tags = Array.from(new Set([...(existing.tags || []), ...payload.tags]));
    existing.sources = Array.from(new Set([...(existing.sources || []), ...payload.sources]));
    existing.last_seen = new Date().toISOString();
    discoveryMap.set(placeId, existing);
    return;
  }
  discoveryMap.set(placeId, payload);
};

(async () => {
  let processed = 0;
  let added = 0;

  try {
    for (const task of queryQueue) {
      if (Date.now() - startedAt > MAX_SECONDS * 1000) {
        throw new Error('TIME_LIMIT');
      }

      let page = 0;
      let token = '';
      while (page < MAX_PAGES) {
        if (Date.now() - startedAt > MAX_SECONDS * 1000) {
          throw new Error('TIME_LIMIT');
        }

        const data = await fetchTextSearch(task.keyword, token);
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
          console.warn('Query failed:', task.keyword, data.status, data.error_message || '');
          break;
        }

        const results = data.results || [];
        results.forEach((item) => {
          if (!item.place_id || !item.name) return;
          const baseKeyword = task.baseKeyword || '';
          const keywordMatches = baseKeyword && (hasHan(baseKeyword) || matchesHint(baseKeyword));
          if (!hasHan(item.name) && !matchesHint(item.name) && !keywordMatches) return;
          if (existingCompanies.has(item.place_id)) return;

          const lat = item.geometry?.location?.lat || null;
          const lng = item.geometry?.location?.lng || null;
          if (!withinBounds(lat, lng)) return;

          const payload = {
            name: item.name,
            place_id: item.place_id,
            address: item.formatted_address || item.vicinity || '',
            rating: item.rating || '',
            user_ratings_total: item.user_ratings_total || '',
            lat,
            lng,
            tags: [task.category.label],
            sources: [task.area ? `${task.keyword}｜${task.area}` : task.keyword],
            first_seen: new Date().toISOString(),
            last_seen: new Date().toISOString(),
          };
          if (!discoveryMap.has(item.place_id)) {
            added += 1;
          }
          addDiscovery(item.place_id, payload);
        });

        processed += results.length;
        if (!data.next_page_token) break;
        token = data.next_page_token;
        page += 1;
        await sleep(2200);
      }
      await sleep(300);
    }
  } catch (err) {
    if (err.message !== 'TIME_LIMIT') {
      console.warn('Discovery stopped:', err.message);
    }
  } finally {
    const grouped = {};
    Array.from(discoveryMap.values()).forEach((entry) => {
      const tag = (entry.tags && entry.tags[0]) || '综合';
      if (!grouped[tag]) grouped[tag] = [];
      grouped[tag].push(entry);
    });

    const output = Object.keys(grouped).sort().map((tag) => ({
      category: tag,
      items: grouped[tag].sort((a, b) => (b.user_ratings_total || 0) - (a.user_ratings_total || 0)),
    }));

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`Processed ${processed} results.`);
    console.log(`Added ${added} new entries.`);
    console.log(`Saved to ${outputPath}`);
  }
})();

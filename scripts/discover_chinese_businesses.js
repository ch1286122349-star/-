require('dotenv').config();
const fs = require('fs');
const path = require('path');

const apiKey = (process.env.GOOGLE_PLACES_API_KEY || '').trim();
if (!apiKey) {
  console.error('Missing GOOGLE_PLACES_API_KEY');
  process.exit(1);
}

const companiesPath = path.join(__dirname, '..', 'data', 'companies.json');
const outputPath = path.join(__dirname, '..', 'data', 'discovered-businesses.json');

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
  'shanghai',
  'beijing',
  'hong',
  'kowloon',
  'dim sum',
  'dumpling',
  'noodle',
  'ramen',
  'hot pot',
  'hotpot',
  'boba',
  'bubble',
  'tea',
  'lan zhou',
  'lanzhou',
  'xian',
  'yunnan',
  'wok',
  'sushi',
];

const matchesHint = (name) => {
  const normalized = normalize(name);
  return hintTokens.some((token) => normalized.includes(token));
};

const shouldInclude = (name) => hasHan(name) || matchesHint(name);

const categories = [
  {
    id: 'chinese-food',
    label: '中餐',
    type: 'restaurant',
    keywords: ['Chinese restaurant', 'comida china', '中餐馆', '中餐'],
  },
  {
    id: 'hotpot-bbq',
    label: '火锅/烧烤/小吃',
    type: 'restaurant',
    keywords: ['hot pot', '火锅', '串串', '烧烤', 'bbq chino'],
  },
  {
    id: 'noodles',
    label: '面馆/拉面',
    type: 'restaurant',
    keywords: ['noodle', 'ramen', '面馆', '拉面', '麻辣烫'],
  },
  {
    id: 'dessert-tea',
    label: '甜品/茶饮/烘焙',
    type: 'cafe',
    keywords: ['bubble tea', '奶茶', 'boba', '甜品', 'dessert', 'bakery', 'pastelería china'],
  },
  {
    id: 'grocery',
    label: '超市/零售',
    type: 'supermarket',
    keywords: ['supermarket', 'asian grocery', '中国超市', '亚洲超市', 'grocery'],
  },
  {
    id: 'massage',
    label: '按摩/养生',
    type: 'spa',
    keywords: ['按摩', 'masaje', 'spa', 'reflexología', '足疗'],
  },
  {
    id: 'beauty',
    label: '美发/美甲/美容',
    type: 'beauty_salon',
    keywords: ['美甲', 'nails', 'beauty salon', 'peluquería', 'barbería', 'estética'],
  },
  {
    id: 'logistics',
    label: '物流/货运/清关',
    keywords: ['物流', '货运', '快递', 'courier', 'aduana', 'freight', 'importación'],
  },
  {
    id: 'trade',
    label: '外贸/进出口',
    keywords: ['importadora', 'exportadora', 'trading', '贸易', '进出口'],
  },
  {
    id: 'real-estate',
    label: '地产/中介',
    type: 'real_estate_agency',
    keywords: ['inmobiliaria', 'real estate', '房产', '中介'],
  },
  {
    id: 'education',
    label: '教育/培训',
    type: 'school',
    keywords: ['中文学校', 'escuela china', 'clases de chino', '中文课', 'academia'],
  },
  {
    id: 'health',
    label: '中医/诊所',
    type: 'doctor',
    keywords: ['中医', 'acupuntura', 'medicina china', 'clinic', 'consultorio'],
  },
  {
    id: 'services',
    label: '法律/财税/咨询',
    keywords: ['律师', 'abogado', '税务', 'contabilidad', 'consultoría', '签证'],
  },
];

const boroughs = [
  { key: 'alvaro-obregon', label: 'Álvaro Obregón', lat: 19.357, lng: -99.200, radius: 6000 },
  { key: 'azcapotzalco', label: 'Azcapotzalco', lat: 19.490, lng: -99.187, radius: 6000 },
  { key: 'benito-juarez', label: 'Benito Juárez', lat: 19.380, lng: -99.160, radius: 6000 },
  { key: 'coyoacan', label: 'Coyoacán', lat: 19.345, lng: -99.162, radius: 6000 },
  { key: 'cuajimalpa', label: 'Cuajimalpa', lat: 19.359, lng: -99.295, radius: 7000 },
  { key: 'cuauhtemoc', label: 'Cuauhtémoc', lat: 19.430, lng: -99.160, radius: 6000 },
  { key: 'gustavo-a-madero', label: 'Gustavo A. Madero', lat: 19.490, lng: -99.110, radius: 7000 },
  { key: 'iztacalco', label: 'Iztacalco', lat: 19.395, lng: -99.095, radius: 6000 },
  { key: 'iztapalapa', label: 'Iztapalapa', lat: 19.357, lng: -99.070, radius: 7000 },
  { key: 'magdalena-contreras', label: 'Magdalena Contreras', lat: 19.300, lng: -99.240, radius: 7000 },
  { key: 'miguel-hidalgo', label: 'Miguel Hidalgo', lat: 19.430, lng: -99.200, radius: 6000 },
  { key: 'milpa-alta', label: 'Milpa Alta', lat: 19.192, lng: -99.022, radius: 8000 },
  { key: 'tlahuac', label: 'Tláhuac', lat: 19.279, lng: -99.003, radius: 7000 },
  { key: 'tlalpan', label: 'Tlalpan', lat: 19.290, lng: -99.170, radius: 8000 },
  { key: 'venustiano-carranza', label: 'Venustiano Carranza', lat: 19.430, lng: -99.110, radius: 6000 },
  { key: 'xochimilco', label: 'Xochimilco', lat: 19.258, lng: -99.105, radius: 8000 },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchNearby = async (params) => {
  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });
  url.searchParams.set('key', apiKey);
  const res = await fetch(url.toString());
  const data = await res.json();
  return data;
};

const MAX_PAGES = 1;
const MAX_SECONDS = Number.parseInt(process.env.MAX_SECONDS || '110', 10);
const startedAt = Date.now();
const TOKEN_DELAY_MS = 2200;
const QUERY_DELAY_MS = 350;

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
    for (const borough of boroughs) {
      for (const category of categories) {
        for (const keyword of category.keywords) {
          let page = 0;
          let token = '';
          while (page < MAX_PAGES) {
            if (Date.now() - startedAt > MAX_SECONDS * 1000) {
              throw new Error('TIME_LIMIT');
            }
          const data = await fetchNearby({
            location: `${borough.lat},${borough.lng}`,
            radius: borough.radius,
            keyword,
            type: category.type || '',
            pagetoken: token || '',
            language: 'zh-CN',
          });

          if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.warn('Query failed:', borough.label, category.label, keyword, data.status, data.error_message || '');
            break;
          }

          const results = data.results || [];
          results.forEach((item) => {
            if (!item.place_id || !item.name) return;
            if (existingCompanies.has(item.place_id)) return;
            const signals = [];
            if (hasHan(item.name)) signals.push('name_has_han');
            if (matchesHint(item.name)) signals.push('name_has_hint');
            if (!signals.length && !hasHan(keyword)) return;
            if (!shouldInclude(item.name) && !hasHan(keyword)) return;

            const payload = {
              name: item.name,
              place_id: item.place_id,
              address: item.vicinity || item.formatted_address || '',
              rating: item.rating || '',
              user_ratings_total: item.user_ratings_total || '',
              lat: item.geometry?.location?.lat || null,
              lng: item.geometry?.location?.lng || null,
              tags: [category.label],
              sources: [`${borough.label}｜${keyword}`],
              signals,
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
          await sleep(TOKEN_DELAY_MS);
        }
          await sleep(QUERY_DELAY_MS);
        }
      }
    }
  } catch (err) {
    if (err.message !== 'TIME_LIMIT') {
      console.warn('Discovery stopped:', err.message);
    }
  } finally {
    const output = Array.from(discoveryMap.values());
    output.sort((a, b) => (b.user_ratings_total || 0) - (a.user_ratings_total || 0));
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`Processed ${processed} results.`);
    console.log(`Added ${added} new entries.`);
    console.log(`Saved ${output.length} entries to ${outputPath}`);
  }
})();

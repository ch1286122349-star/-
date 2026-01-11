require('dotenv').config();
const fs = require('fs');
const path = require('path');

const apiKey = (process.env.GOOGLE_PLACES_API_KEY || '').trim();
if (!apiKey) {
  console.error('Missing GOOGLE_PLACES_API_KEY');
  process.exit(1);
}

const inputPath = path.resolve(
  process.env.INPUT_JSON || path.join(__dirname, '..', 'data', 'chinese-named-businesses-mexico-excluding-cdmx.json')
);
const outputMdPath = path.resolve(
  process.env.OUTPUT_MD || path.join(__dirname, '..', 'data', 'chinese-named-businesses-mexico-excluding-cdmx-3col.md')
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

const entries = loadJson(inputPath, []);
if (!Array.isArray(entries) || entries.length === 0) {
  console.error('Input data is empty.');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalize = (value) => String(value || '')
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .replace(/[^a-z0-9]+/gi, ' ')
  .trim()
  .toLowerCase();

const fetchPlaceDetails = async (placeId) => {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'name,formatted_address,address_component,types');
  url.searchParams.set('region', 'mx');
  url.searchParams.set('language', 'es');
  url.searchParams.set('key', apiKey);
  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.status !== 'OK') {
    console.warn('Places detail failed:', data.status, data.error_message || '');
    return null;
  }
  return data.result || null;
};

const pickComponent = (components, type) => {
  const entry = components.find((component) => Array.isArray(component.types) && component.types.includes(type));
  if (!entry) return '';
  return entry.long_name || entry.short_name || '';
};

const pickFirstComponent = (components, types) => {
  for (const type of types) {
    const value = pickComponent(components, type);
    if (value) return value;
  }
  return '';
};

const hasAnyType = (types, candidates) => candidates.some((type) => types.includes(type));

const classifyByTypes = (types) => {
  if (!Array.isArray(types) || types.length === 0) return '';
  if (hasAnyType(types, ['restaurant', 'meal_takeaway', 'meal_delivery', 'food'])) return '餐饮';
  if (hasAnyType(types, ['cafe', 'bakery'])) return '甜品/茶饮';
  if (hasAnyType(types, ['supermarket', 'grocery_or_supermarket', 'convenience_store', 'store', 'shopping_mall'])) {
    return '零售/超市';
  }
  if (hasAnyType(types, ['spa', 'beauty_salon', 'hair_care', 'nail_salon'])) return '美容/养生';
  if (hasAnyType(types, ['doctor', 'dentist', 'hospital', 'pharmacy', 'health'])) return '医疗/中医';
  if (hasAnyType(types, ['school', 'university'])) return '教育/培训';
  if (hasAnyType(types, ['real_estate_agency'])) return '房产/中介';
  if (hasAnyType(types, ['moving_company', 'storage', 'courier'])) return '物流/货运';
  if (hasAnyType(types, ['accounting', 'lawyer'])) return '专业服务';
  if (hasAnyType(types, ['finance', 'bank'])) return '金融服务';
  if (hasAnyType(types, ['car_repair', 'car_dealer'])) return '汽车/维修';
  if (hasAnyType(types, ['electronics_store'])) return '电子/维修';
  if (hasAnyType(types, ['lodging'])) return '住宿';
  return '';
};

const classifyByName = (name) => {
  const normalized = normalize(name);
  if (!normalized) return '';
  if (/火锅|麻辣烫|面馆|拉面|饺子|烧烤|串串|小吃|餐厅|中餐|饭店|料理|粥/.test(name)) return '餐饮';
  if (/奶茶|茶饮|甜品|蛋糕|烘焙|面包|咖啡/.test(name)) return '甜品/茶饮';
  if (/超市|便利|杂货|市场|食品店/.test(name)) return '零售/超市';
  if (/按摩|足疗|推拿|养生|美容|美发|美甲/.test(name)) return '美容/养生';
  if (/中医|针灸|诊所|药房/.test(name)) return '医疗/中医';
  if (/学校|学院|中文课|培训/.test(name)) return '教育/培训';
  if (/物流|货运|快递/.test(name)) return '物流/货运';
  if (/贸易|进出口/.test(name)) return '外贸/进出口';
  if (/房产|地产|中介/.test(name)) return '房产/中介';
  if (normalized.includes('restaurant') || normalized.includes('restaurante')) return '餐饮';
  if (normalized.includes('supermercado') || normalized.includes('grocery') || normalized.includes('market')) {
    return '零售/超市';
  }
  if (normalized.includes('spa') || normalized.includes('salon') || normalized.includes('beauty') || normalized.includes('nails')) {
    return '美容/养生';
  }
  if (normalized.includes('school') || normalized.includes('academia')) return '教育/培训';
  if (normalized.includes('clinic') || normalized.includes('clinica') || normalized.includes('farmacia')) {
    return '医疗/中医';
  }
  return '';
};

const classifyCategory = (types, name) => {
  const byTypes = classifyByTypes(types);
  if (byTypes) return byTypes;
  const byName = classifyByName(name);
  if (byName) return byName;
  return '其他';
};

const detailsCache = new Map();
const detailDelayMs = Number.parseInt(process.env.DETAIL_DELAY_MS || '200', 10);

(async () => {
  const rows = [];

  for (const entry of entries) {
    const placeId = String(entry.place_id || entry.placeId || '').trim();
    if (!placeId) continue;

    let details = detailsCache.get(placeId);
    if (!details) {
      details = await fetchPlaceDetails(placeId);
      detailsCache.set(placeId, details);
      await sleep(detailDelayMs);
    }

    const name = entry.name || details?.name || '';
    const components = details?.address_components || [];
    const city = entry.city || pickFirstComponent(components, [
      'locality',
      'postal_town',
      'administrative_area_level_2',
      'sublocality_level_1',
      'administrative_area_level_3',
    ]) || '未知';
    const types = details?.types || [];
    const category = classifyCategory(types, name);

    rows.push({ city, name, category });
  }

  rows.sort((a, b) => {
    const cityCompare = (a.city || '').localeCompare(b.city || '');
    if (cityCompare !== 0) return cityCompare;
    return (a.name || '').localeCompare(b.name || '');
  });

  const escapeMd = (value) => String(value || '').replace(/\|/g, '\\|');
  const mdLines = [
    '| 城市 | 店铺 | 类型 |',
    '| --- | --- | --- |',
    ...rows.map((row) => `| ${escapeMd(row.city)} | ${escapeMd(row.name)} | ${escapeMd(row.category)} |`),
  ];
  fs.writeFileSync(outputMdPath, `${mdLines.join('\n')}\n`);

  console.log(`Saved table to ${outputMdPath}`);
})();

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const apiKey = (process.env.GOOGLE_PLACES_API_KEY || '').trim();
if (!apiKey) {
  console.error('Missing GOOGLE_PLACES_API_KEY');
  process.exit(1);
}

const outputJsonPath = path.resolve(
  process.env.OUTPUT_JSON || path.join(__dirname, '..', 'data', 'chinese-named-businesses-mexico-excluding-cdmx.json')
);
const outputCsvPath = path.resolve(
  process.env.OUTPUT_CSV || path.join(__dirname, '..', 'data', 'chinese-named-businesses-mexico-excluding-cdmx.csv')
);
const outputMdPath = path.resolve(
  process.env.OUTPUT_MD || path.join(__dirname, '..', 'data', 'chinese-named-businesses-mexico-excluding-cdmx.md')
);

const parseList = (value) => String(value || '')
  .split('|')
  .map((item) => item.trim())
  .filter(Boolean);

const defaultCityQueries = [
  'Aguascalientes',
  'Acapulco',
  'Campeche',
  'Cancun',
  'Chetumal',
  'Chihuahua',
  'Chilpancingo',
  'Ciudad Juarez',
  'Ciudad Obregon',
  'Ciudad Victoria',
  'Colima',
  'Cuernavaca',
  'Culiacan',
  'Durango',
  'Ensenada',
  'Guanajuato',
  'Guadalajara',
  'Hermosillo',
  'Irapuato',
  'La Paz',
  'Leon',
  'Manzanillo',
  'Matamoros',
  'Mazatlan',
  'Merida',
  'Mexicali',
  'Monterrey',
  'Morelia',
  'Nogales',
  'Oaxaca',
  'Pachuca',
  'Playa del Carmen',
  'Puebla',
  'Puerto Vallarta',
  'Queretaro',
  'Reynosa',
  'Saltillo',
  'San Cristobal de las Casas',
  'San Luis Potosi',
  'Tampico',
  'Tepic',
  'Tijuana',
  'Tlaxcala',
  'Toluca',
  'Torreon',
  'Tuxtla Gutierrez',
  'Veracruz',
  'Villahermosa',
  'Xalapa',
  'Zacatecas',
];

const cityQueries = (() => {
  const explicit = parseList(process.env.CITY_QUERIES);
  if (explicit.length) return explicit;
  const extra = parseList(process.env.EXTRA_CITY_QUERIES);
  return extra.length ? Array.from(new Set([...defaultCityQueries, ...extra])) : defaultCityQueries;
})();

const defaultKeywords = [
  '中餐',
  '中餐馆',
  '火锅',
  '麻辣烫',
  '面馆',
  '拉面',
  '饺子',
  '奶茶',
  '中医',
  '按摩',
  '足疗',
  '中文',
  '华人',
  '中国',
  '唐人街',
  'comida china',
  'restaurante chino',
  'supermercado chino',
  'medicina china',
  'acupuntura',
  'productos chinos',
  'bazar chino',
  'chinatown',
  'chinese restaurant',
  'chinese supermarket',
  'oriental',
];

const defaultPinyinQueries = [
  'sichuan',
  'shanghai',
  'beijing',
  'chengdu',
  'chongqing',
  'xian',
  'lanzhou',
  'guangzhou',
  'shenzhen',
  'xiaolongbao',
  'jiaozi',
  'biangbiang',
  'liangpi',
  'roujiamo',
  'malatang',
  'hong kong',
  'kowloon',
];

const keywordList = (() => {
  const explicit = parseList(process.env.QUERY_KEYWORDS);
  const extra = parseList(process.env.EXTRA_KEYWORDS);
  const base = explicit.length ? explicit : [...defaultKeywords, ...defaultPinyinQueries];
  return Array.from(new Set([...base, ...extra].map((item) => item.trim()).filter(Boolean)));
})();

const normalize = (value) => String(value || '')
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .replace(/[^a-z0-9]+/gi, ' ')
  .trim()
  .toLowerCase();

const romanizedTokens = [
  'beijing',
  'peking',
  'shanghai',
  'sichuan',
  'szechuan',
  'chengdu',
  'chongqing',
  'xian',
  'xiamen',
  'lanzhou',
  'guangzhou',
  'shenzhen',
  'nanjing',
  'tianjin',
  'hangzhou',
  'suzhou',
  'wuhan',
  'kunming',
  'yunnan',
  'guangxi',
  'guizhou',
  'fujian',
  'jiangsu',
  'jiangxi',
  'zhejiang',
  'liaoning',
  'heilongjiang',
  'hunan',
  'hubei',
  'henan',
  'hebei',
  'shanxi',
  'shaanxi',
  'xinjiang',
  'dongbei',
  'hong kong',
  'kowloon',
  'xiaolongbao',
  'jiaozi',
  'baozi',
  'mantou',
  'biangbiang',
  'liangpi',
  'roujiamo',
  'malatang',
  'maocai',
  'huoguo',
  'lamian',
  'zhajiang',
];
const normalizedRomanizedTokens = Array.from(
  new Set(romanizedTokens.map((token) => normalize(token)).filter(Boolean))
);

const hasHan = (value) => /\p{Script=Han}/u.test(String(value || ''));
const matchesRomanized = (name) => {
  const normalized = normalize(name);
  return normalizedRomanizedTokens.some((token) => token && normalized.includes(token));
};

const isChineseNamed = (name) => hasHan(name) || matchesRomanized(name);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchTextSearch = async (query, token = '') => {
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.set('query', query);
  if (token) url.searchParams.set('pagetoken', token);
  url.searchParams.set('region', 'mx');
  url.searchParams.set('language', 'es');
  url.searchParams.set('key', apiKey);
  const res = await fetch(url.toString());
  return res.json();
};

const fetchPlaceDetails = async (placeId) => {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'name,formatted_address,address_component,geometry,rating,user_ratings_total');
  url.searchParams.set('region', 'mx');
  url.searchParams.set('language', 'zh-CN');
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

const isInMexico = (components) => {
  const country = pickComponent(components, 'country');
  if (!country) return false;
  if (String(country).includes('墨西哥')) return true;
  return normalize(country) === 'mexico';
};
const cdmxTokens = new Set(['ciudad de mexico', 'mexico city', 'cdmx', 'distrito federal']);
const cdmxRawTokens = ['墨西哥城', '墨西哥市'];

const isMexicoCity = (city, state, formattedAddress) => {
  const rawValues = [city, state, formattedAddress].map((value) => String(value || ''));
  if (rawValues.some((value) => cdmxRawTokens.some((token) => value.includes(token)))) {
    return true;
  }

  const normalizedCity = normalize(city);
  const normalizedState = normalize(state);
  const normalizedAddress = normalize(formattedAddress);
  return (
    cdmxTokens.has(normalizedCity) ||
    cdmxTokens.has(normalizedState) ||
    Array.from(cdmxTokens).some((token) => token && normalizedAddress.includes(token))
  );
};

const MAX_PAGES = Number.parseInt(process.env.MAX_PAGES || '2', 10);
const MAX_SECONDS = Number.parseInt(process.env.MAX_SECONDS || '900', 10);
const TOKEN_DELAY_MS = Number.parseInt(process.env.TOKEN_DELAY_MS || '2200', 10);
const QUERY_DELAY_MS = Number.parseInt(process.env.QUERY_DELAY_MS || '300', 10);
const DETAIL_DELAY_MS = Number.parseInt(process.env.DETAIL_DELAY_MS || '200', 10);
const startedAt = Date.now();

const loadJson = (filePath, fallback) => {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    return fallback;
  }
};

const discoveries = new Map();
const existing = loadJson(outputJsonPath, []);
if (Array.isArray(existing)) {
  existing.forEach((entry) => {
    if (entry && entry.place_id) {
      discoveries.set(entry.place_id, entry);
    }
  });
}

const addDiscovery = (placeId, payload) => {
  const existing = discoveries.get(placeId);
  if (existing) {
    existing.sources = Array.from(new Set([...(existing.sources || []), ...payload.sources]));
    existing.match_types = Array.from(new Set([...(existing.match_types || []), ...payload.match_types]));
    existing.last_seen = new Date().toISOString();
    discoveries.set(placeId, existing);
    return;
  }
  discoveries.set(placeId, payload);
};

const csvEscape = (value) => {
  const raw = String(value ?? '');
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
};

(async () => {
  let processed = 0;
  let added = 0;

  try {
    for (const city of cityQueries) {
      for (const keyword of keywordList) {
        if (Date.now() - startedAt > MAX_SECONDS * 1000) {
          throw new Error('TIME_LIMIT');
        }

        let page = 0;
        let token = '';
        const query = `${keyword} ${city}`.trim();

        while (page < MAX_PAGES) {
          if (Date.now() - startedAt > MAX_SECONDS * 1000) {
            throw new Error('TIME_LIMIT');
          }

          const data = await fetchTextSearch(query, token);
          if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.warn('Query failed:', query, data.status, data.error_message || '');
            break;
          }

          const results = data.results || [];
          for (const item of results) {
            if (!item.place_id || !item.name) continue;
            if (!isChineseNamed(item.name)) continue;
            if (discoveries.has(item.place_id)) {
              addDiscovery(item.place_id, {
                sources: [query],
                match_types: [hasHan(item.name) ? 'han' : 'pinyin'],
              });
              continue;
            }

            const details = await fetchPlaceDetails(item.place_id);
            await sleep(DETAIL_DELAY_MS);
            if (!details) continue;

            const components = details.address_components || [];
            if (!isInMexico(components)) continue;

            const cityName = pickFirstComponent(components, [
              'locality',
              'postal_town',
              'administrative_area_level_2',
              'sublocality_level_1',
              'administrative_area_level_3',
            ]);
            const stateName = pickComponent(components, 'administrative_area_level_1');
            if (isMexicoCity(cityName, stateName, details.formatted_address || '')) {
              continue;
            }

            const matchTypes = [hasHan(item.name) ? 'han' : 'pinyin'];

            const payload = {
              name: item.name,
              place_id: item.place_id,
              address: details.formatted_address || item.formatted_address || item.vicinity || '',
              city: cityName,
              state: stateName,
              rating: details.rating || item.rating || '',
              user_ratings_total: details.user_ratings_total || item.user_ratings_total || '',
              lat: details.geometry?.location?.lat || item.geometry?.location?.lat || null,
              lng: details.geometry?.location?.lng || item.geometry?.location?.lng || null,
              sources: [query],
              match_types: matchTypes,
              first_seen: new Date().toISOString(),
              last_seen: new Date().toISOString(),
            };

            addDiscovery(item.place_id, payload);
            added += 1;
          }

          processed += results.length;
          if (!data.next_page_token) break;
          token = data.next_page_token;
          page += 1;
          await sleep(TOKEN_DELAY_MS);
        }

        await sleep(QUERY_DELAY_MS);
      }
    }
  } catch (err) {
    if (err.message !== 'TIME_LIMIT') {
      console.warn('Discovery stopped:', err.message);
    }
  } finally {
    const entries = Array.from(discoveries.values()).sort((a, b) => {
      const cityCompare = (a.city || '').localeCompare(b.city || '');
      if (cityCompare !== 0) return cityCompare;
      return (a.name || '').localeCompare(b.name || '');
    });

    fs.writeFileSync(outputJsonPath, JSON.stringify(entries, null, 2));

    const csvLines = [
      ['City', 'State', 'Name', 'Address', 'Place ID', 'Map Link', 'Match Types'].map(csvEscape).join(','),
    ];
    entries.forEach((entry) => {
      const mapLink = entry.place_id ? `https://www.google.com/maps/place/?q=place_id:${entry.place_id}` : '';
      csvLines.push(
        [
          entry.city || '',
          entry.state || '',
          entry.name || '',
          entry.address || '',
          entry.place_id || '',
          mapLink,
          (entry.match_types || []).join('|'),
        ].map(csvEscape).join(',')
      );
    });
    fs.writeFileSync(outputCsvPath, `${csvLines.join('\n')}\n`);

    const mdLines = [
      '| 城市 | 州 | 店铺 | 地址 | Place ID | 地图 | 匹配 |',
      '| --- | --- | --- | --- | --- | --- | --- |',
    ];
    entries.forEach((entry) => {
      const mapLink = entry.place_id ? `https://www.google.com/maps/place/?q=place_id:${entry.place_id}` : '';
      const escapeMd = (value) => String(value || '').replace(/\|/g, '\\|');
      mdLines.push([
        escapeMd(entry.city || ''),
        escapeMd(entry.state || ''),
        escapeMd(entry.name || ''),
        escapeMd(entry.address || ''),
        escapeMd(entry.place_id || ''),
        mapLink,
        escapeMd((entry.match_types || []).join('|')),
      ].join(' | ').replace(/^/, '| ').concat(' |'));
    });
    fs.writeFileSync(outputMdPath, `${mdLines.join('\n')}\n`);

    console.log(`Processed ${processed} results.`);
    console.log(`Added ${added} new entries.`);
    console.log(`Saved JSON to ${outputJsonPath}`);
    console.log(`Saved CSV to ${outputCsvPath}`);
    console.log(`Saved Markdown to ${outputMdPath}`);
  }
})();

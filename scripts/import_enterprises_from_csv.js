#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const SERPAPI_KEY = (process.env.SERPAPI_KEY || '').trim();
if (!SERPAPI_KEY) {
  console.error('缺少 SERPAPI_KEY，终止。');
  process.exit(1);
}

const args = process.argv.slice(2);
const getArg = (name) => {
  const index = args.indexOf(name);
  if (index === -1) return '';
  return args[index + 1] || '';
};
const limit = Number.parseInt(getArg('--limit') || '5', 10);
const onlyName = getArg('--only');
const queryOverride = getArg('--query');
const allowMissingPlace = args.includes('--allow-missing-place');
const defaultCity = getArg('--city') || '蒙特雷';

const csvPath = getArg('--csv') || path.join(__dirname, '..', '蒙特雷中资企业.csv');
const companiesPath = path.join(__dirname, '..', 'data', 'companies.json');
const placeDetailsPath = path.join(__dirname, '..', 'data', 'place-details.json');

const parseCsv = (text) => {
  const rows = [];
  let current = '';
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && (char === ',' || char === '\n' || char === '\r')) {
      if (char === ',') {
        row.push(current);
        current = '';
        continue;
      }
      if (char === '\r' && next === '\n') i += 1;
      row.push(current);
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
      current = '';
      continue;
    }
    current += char;
  }
  if (current.length || row.length) {
    row.push(current);
    rows.push(row);
  }
  return rows;
};

const normalizeName = (value) => String(value || '').trim().replace(/[（(].*$/, '').trim();
const stripCorporateSuffix = (value) => String(value || '')
  .replace(/有限责任公司|有限公司|股份有限公司|股份|集团|公司|厂$/g, '')
  .trim();
const normalizeMatch = (value) => String(value || '')
  .toLowerCase()
  .replace(/[\s\p{P}\p{S}]+/gu, '');

const slugifyAscii = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const citySlugMap = new Map([
  ['蒙特雷', 'monterrey'],
  ['墨西哥城', 'mexico-city'],
  ['瓜达拉哈拉', 'guadalajara'],
]);

const resolveCitySlug = (city) => {
  const normalized = String(city || '').trim();
  if (!normalized) return 'monterrey';
  if (citySlugMap.has(normalized)) return citySlugMap.get(normalized);
  return slugifyAscii(normalized) || 'monterrey';
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${text}`);
  }
  return res.json();
};

const fetchSerpApiJson = async (params) => {
  const url = new URL('https://serpapi.com/search.json');
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  url.searchParams.set('api_key', SERPAPI_KEY);
  return fetchJson(url.toString());
};

const normalizeSerpOpenNow = (value) => {
  if (typeof value === 'boolean') return value;
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return undefined;
  if (['true', 'yes', 'open', 'open now', '营业', '营业中'].includes(raw)) return true;
  if (['false', 'no', 'closed', '休息', '休息中'].includes(raw)) return false;
  return undefined;
};

const normalizeSerpWeekdayText = (hours) => {
  if (Array.isArray(hours?.weekday_text) && hours.weekday_text.length >= 7) {
    return hours.weekday_text;
  }
  if (Array.isArray(hours?.days)) {
    const mapped = hours.days
      .map((entry) => {
        const day = String(entry?.day || '').trim();
        const span = String(entry?.hours || '').trim();
        if (!day || !span) return '';
        return `${day}: ${span}`;
      })
      .filter(Boolean);
    return mapped.length ? mapped : [];
  }
  return [];
};

const normalizeSerpPriceLevel = (value) => {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;
  const raw = String(value || '');
  const match = raw.match(/[$¥€£]+/);
  if (!match) return undefined;
  return match[0].length;
};

const normalizeSerpPhotos = (photos) => {
  if (!Array.isArray(photos)) return [];
  const output = [];
  photos.forEach((item) => {
    if (!item) return;
    if (typeof item === 'string') {
      output.push({ photo_reference: item });
      return;
    }
    const url = item.image || item.photo || item.thumbnail || item.url || '';
    if (url) {
      output.push({ photo_reference: url });
    }
  });
  return output;
};

const buildMapsUrlFromPlaceId = (placeId) => {
  const safeId = String(placeId || '').trim();
  if (!safeId) return '';
  return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(safeId)}`;
};

const mapSerpPlaceResult = (place, fallbackPlaceId = '') => {
  if (!place) return null;
  const placeId = String(place.place_id || fallbackPlaceId || '').trim();
  const rating = Number(place.rating);
  const reviews = Number(place.reviews || place.reviews_count || place.user_ratings_total);
  const priceLevel = normalizeSerpPriceLevel(place.price_level || place.price);
  const gps = place.gps_coordinates || place.gps || null;
  const latitude = Number(gps?.latitude ?? gps?.lat);
  const longitude = Number(gps?.longitude ?? gps?.lng);
  const geometry = (Number.isFinite(latitude) && Number.isFinite(longitude))
    ? { location: { lat: latitude, lng: longitude } }
    : undefined;
  const address = place.address || place.full_address || place.formatted_address || '';
  const phone = place.phone || place.phone_number || '';
  const hours = place.hours || place.opening_hours || {};
  const openingHours = {};
  const openNow = normalizeSerpOpenNow(hours?.open_now ?? place.open_state);
  if (typeof openNow === 'boolean') openingHours.open_now = openNow;
  const weekdayText = normalizeSerpWeekdayText(hours);
  if (weekdayText.length) openingHours.weekday_text = weekdayText;
  const photos = normalizeSerpPhotos(place.photos);
  const mapsUrl = place.links?.google_maps || place.google_maps_url || place.url || buildMapsUrlFromPlaceId(placeId);
  const website = place.website || place.links?.website || '';

  return {
    place_id: placeId || place.place_id,
    name: place.title || place.name || '',
    rating: Number.isFinite(rating) ? rating : undefined,
    user_ratings_total: Number.isFinite(reviews) ? reviews : undefined,
    price_level: Number.isFinite(priceLevel) ? priceLevel : undefined,
    geometry,
    formatted_address: address || undefined,
    formatted_phone_number: phone || undefined,
    opening_hours: Object.keys(openingHours).length ? openingHours : undefined,
    photos: photos.length ? photos : undefined,
    url: mapsUrl || undefined,
    website: website || undefined,
  };
};

const buildDetailText = (name, municipality, park, address, business, note, cityFallback) => {
  const baseName = normalizeName(name);
  const location = [municipality, park].filter(Boolean).join(' 的 ');
  const focus = business ? `，主要业务为${business}` : '';
  const fallbackCity = cityFallback || '蒙特雷';
  const locationText = location ? `在 ${location} ` : `在${fallbackCity}地区 `;
  const addressText = address ? `地址：${address}。` : '';
  const noteText = note ? `备注：${note}。` : '';
  return `${baseName}${locationText}布局相关产线${focus}。${addressText}${noteText}`.trim();
};

const loadJson = (filePath, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return fallback;
  }
};

const pickBestResult = (results, target) => {
  if (!Array.isArray(results) || !results.length) return null;
  const baseCore = stripCorporateSuffix(target.baseName);
  const baseNormalized = normalizeMatch(target.baseName);
  const baseCoreNormalized = normalizeMatch(baseCore);
  const englishNormalized = target.englishName ? normalizeMatch(target.englishName) : '';
  const addressNormalized = normalizeMatch(target.address);
  const parkNormalized = normalizeMatch(target.park);
  const municipalityNormalized = normalizeMatch(target.municipality);

  const matches = results.map((result) => {
    const title = result.title || result.name || '';
    const address = result.address || result.full_address || '';
    const titleNormalized = normalizeMatch(title);
    const addressText = normalizeMatch(address);
    const titleCoreNormalized = normalizeMatch(stripCorporateSuffix(title));
    const hasBase = baseNormalized && titleNormalized.includes(baseNormalized);
    const hasBaseCore = baseCoreNormalized && (titleNormalized.includes(baseCoreNormalized) || titleCoreNormalized.includes(baseCoreNormalized));
    const hasEnglish = englishNormalized && titleNormalized.includes(englishNormalized);
    if (!hasBase && !hasBaseCore && !hasEnglish) return null;
    let score = 0;
    if (hasBase) score += 6;
    if (hasBaseCore) score += 4;
    if (hasEnglish) score += 4;
    if (municipalityNormalized && addressText.includes(municipalityNormalized)) score += 2;
    if (parkNormalized && addressText.includes(parkNormalized)) score += 2;
    if (addressNormalized && addressText.includes(addressNormalized)) score += 2;
    return { result, score };
  }).filter(Boolean);

  if (!matches.length) return null;
  matches.sort((a, b) => b.score - a.score);
  return matches[0].result;
};

const fetchPlaceDetails = async (placeId) => {
  const placeData = await fetchSerpApiJson({
    engine: 'google_maps',
    type: 'place',
    place_id: placeId,
    hl: 'zh-CN',
    gl: 'mx',
  });
  const place = placeData.place_results
    || placeData.place_result
    || (Array.isArray(placeData.local_results) ? placeData.local_results[0] : null);
  return mapSerpPlaceResult(place, placeId);
};

const findCompanyByBase = (companies, baseName, city) => companies.find(
  (company) => String(company?.industry || '').trim() === '中资企业'
    && normalizeName(company.name) === baseName
    && (!city || String(company.city || '').trim() === city)
);

const extractPlaceReference = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return { placeId: '', query: '' };
  const placeIdMatch = raw.match(/place_id[:=]([A-Za-z0-9_-]+)/i)
    || raw.match(/(ChIJ[0-9A-Za-z_-]{10,})/);
  const searchMatch = raw.match(/Search:\s*([^)]+)\)?/i);
  const query = searchMatch ? searchMatch[1].trim() : '';
  return {
    placeId: placeIdMatch ? placeIdMatch[1] : '',
    query,
  };
};

const main = async () => {
  const csv = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(csv.trim());
  const headers = rows.shift();
  const nameIndex = headers.findIndex((h) => h.includes('企业名称'));
  const businessIndex = headers.findIndex((h) => h.includes('核心业务') || h.includes('行业板块'));
  const cityIndex = headers.findIndex((h) => h.includes('所在城市') || h.includes('所在区域'));
  const parkIndex = headers.findIndex((h) => h.includes('工业园区'));
  const addressIndex = headers.findIndex((h) => h.includes('详细地址') || h.includes('具体地址'));
  const noteIndex = headers.findIndex((h) => h.includes('备注'));
  const mapRefIndex = headers.findIndex((h) => h.includes('地图定位') || h.includes('Place ID') || h.includes('Keyword'));

  const companies = loadJson(companiesPath, []);
  const placeCache = loadJson(placeDetailsPath, {});

  const candidates = rows.map((cols) => ({
    name: (cols[nameIndex] || '').trim(),
    business: (cols[businessIndex] || '').trim(),
    municipality: (cols[cityIndex] || '').trim(),
    park: (cols[parkIndex] || '').trim(),
    address: (cols[addressIndex] || '').trim(),
    note: (cols[noteIndex] || '').trim(),
    mapRef: (cols[mapRefIndex] || '').trim(),
  })).filter((item) => item.name);

  const selected = onlyName
    ? candidates.filter((item) => normalizeName(item.name) === normalizeName(onlyName))
    : candidates;

  if (!selected.length) {
    console.error('未找到匹配的企业名称。');
    process.exit(1);
  }

  const added = [];
  let processed = 0;
  const existingSlugs = new Set(companies.map((company) => company.slug));

  for (const item of selected) {
    if (!onlyName && processed >= limit) break;
    processed += 1;

    const englishMatch = item.name.match(/[（(]([^）)]+)[）)]/);
    const englishName = englishMatch ? englishMatch[1] : '';
    const baseName = normalizeName(item.name);
    const baseQuery = [item.name, item.municipality, item.park, item.address, defaultCity].filter(Boolean).join(' ');
    const mapRef = extractPlaceReference(item.mapRef);
    const mapQuery = mapRef.query
      ? [mapRef.query, item.address, item.municipality, defaultCity].filter(Boolean).join(' ')
      : '';
    const query = queryOverride || mapQuery || baseQuery;

    let placeId = mapRef.placeId || '';
    let details = null;
    try {
      if (!placeId) {
        const searchData = await fetchSerpApiJson({
          engine: 'google_maps',
          type: 'search',
          q: query,
          hl: 'zh-CN',
          gl: 'mx',
        });
        const localResults = Array.isArray(searchData.local_results) ? [...searchData.local_results] : [];
        if (Array.isArray(searchData.place_results)) {
          localResults.push(...searchData.place_results);
        } else if (searchData.place_results) {
          localResults.push(searchData.place_results);
        }
        const picked = pickBestResult(localResults, {
          baseName,
          englishName,
          municipality: item.municipality,
          park: item.park,
          address: item.address,
        });
        if (!picked?.place_id) {
          if (!allowMissingPlace) {
            console.warn(`${item.name} 未找到匹配结果，跳过。`);
            continue;
          }
          console.warn(`${item.name} 未找到匹配结果，使用占位条目。`);
        } else {
          placeId = String(picked.place_id || '').trim();
        }
      }
      if (placeId) {
        details = placeCache[placeId] || await fetchPlaceDetails(placeId);
        if (!details) {
          console.warn(`${item.name} 详情获取失败，使用占位条目。`);
        } else {
          placeCache[placeId] = details;
        }
      }
    } catch (err) {
      if (!allowMissingPlace) {
        console.warn(`${item.name} 获取失败：${err.message}`);
        continue;
      }
      console.warn(`${item.name} 获取失败：${err.message}，使用占位条目。`);
    }

    const lat = details?.geometry?.location?.lat;
    const lng = details?.geometry?.location?.lng;
    const detailText = buildDetailText(
      item.name,
      item.municipality,
      item.park,
      item.address,
      item.business,
      item.note,
      defaultCity
    );
    const existing = findCompanyByBase(companies, baseName, defaultCity);

    if (existing) {
      existing.placeId = placeId;
      existing.mapQuery = query;
      existing.mapLink = details?.url || '';
      existing.phone = details?.formatted_phone_number || '';
      existing.website = details?.website || '';
      existing.lat = Number.isFinite(lat) ? lat : existing.lat;
      existing.lng = Number.isFinite(lng) ? lng : existing.lng;
      existing.summary = item.business || existing.summary;
      existing.detail = detailText;
      existing.detailPaid = true;
      console.log(`已更新 ${item.name}`);
    } else {
      const slugBase = slugifyAscii(englishName || item.name);
      const slugCity = resolveCitySlug(defaultCity || item.municipality || 'monterrey');
      let slug = [slugBase || 'company', slugCity].filter(Boolean).join('-');
      if (existingSlugs.has(slug)) {
        let counter = 2;
        while (existingSlugs.has(`${slug}-${counter}`)) counter += 1;
        slug = `${slug}-${counter}`;
      }
      existingSlugs.add(slug);
      added.push({
        slug,
        name: item.name,
        industry: '中资企业',
        city: defaultCity,
        summary: item.business || '主营业务未提供',
        contact: '暂未提供',
        phone: details?.formatted_phone_number || '',
        website: details?.website || '',
        cover: '',
        placeId,
        mapQuery: query,
        mapLink: details?.url || '',
        lat: Number.isFinite(lat) ? lat : undefined,
        lng: Number.isFinite(lng) ? lng : undefined,
        detail: detailText,
        detailPaid: true,
      });
      console.log(`已新增 ${item.name}`);
    }
    await sleep(250);
  }

  if (added.length) {
    const lastEnterpriseIndex = (() => {
      let idx = -1;
      companies.forEach((company, i) => {
        if (String(company.industry || '').trim() === '中资企业') idx = i;
      });
      return idx;
    })();

    if (lastEnterpriseIndex >= 0) {
      companies.splice(lastEnterpriseIndex + 1, 0, ...added);
    } else {
      companies.push(...added);
    }
  }

  fs.writeFileSync(companiesPath, JSON.stringify(companies, null, 2), 'utf8');
  fs.writeFileSync(placeDetailsPath, JSON.stringify(placeCache, null, 2), 'utf8');
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

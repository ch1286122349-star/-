#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const readEnvFile = (filePath) => {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const content = fs.readFileSync(filePath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    env[key] = value;
  });
  return env;
};

const repoRoot = path.join(__dirname, '..');
const env = readEnvFile(path.join(repoRoot, '.env'));
const SERPAPI_KEY = (process.env.SERPAPI_KEY || env.SERPAPI_KEY || '').trim();

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
const csvPath = getArg('--csv') || path.join(repoRoot, '墨西哥城中资企业新.csv');
const companiesPath = path.join(repoRoot, 'data', 'companies.json');
const placeDetailsPath = path.join(repoRoot, 'data', 'place-details.json');

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
const normalizeMatch = (value) => String(value || '')
  .toLowerCase()
  .replace(/[\s\p{P}\p{S}]+/gu, '');

const loadJson = (filePath, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return fallback;
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchSerpApiJson = async (params) => {
  const url = new URL('https://serpapi.com/search.json');
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  url.searchParams.set('api_key', SERPAPI_KEY);
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
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
    if (url) output.push({ photo_reference: url });
  });
  return output;
};

const extractPhotoCount = (place) => {
  const photos = normalizeSerpPhotos(place?.photos);
  return photos.length;
};

const fetchPlaceDetails = async (placeId) => {
  if (!placeId) return null;
  const data = await fetchSerpApiJson({
    engine: 'google_maps',
    type: 'place',
    place_id: placeId,
    hl: 'zh-CN',
    gl: 'mx',
  });
  return data.place_results || data.place_result || (Array.isArray(data.local_results) ? data.local_results[0] : null);
};

const hasCityHint = (value) => /Mexico City|Ciudad de M[eé]xico|CDMX|Mexico\s*D\.F\./i.test(value || '');

const cleanAddress = (address) => String(address || '')
  .replace(/\([^)]*\)/g, '')
  .replace(/\b(Piso|Of\.?|Oficina|Suite|Interior|Int\.?|Local)\b\s*[^,]*/gi, '')
  .replace(/\s+/g, ' ')
  .replace(/\s+,/g, ',')
  .trim();

const buildBuildingQueries = (address) => {
  const cleaned = cleanAddress(address);
  if (!cleaned) return [];
  const city = 'Ciudad de México';
  const queries = [];

  const withCity = hasCityHint(cleaned) ? cleaned : `${cleaned} ${city}`;
  queries.push(withCity);

  const segments = cleaned.split(',').map((part) => part.trim()).filter(Boolean);
  const streetSegment = segments.find((part) => /\d/.test(part)) || segments[0];
  const buildingSegments = segments.filter((part) => /(Torre|Edificio|Plaza|Corporativo|Centro|Tower|Business|Carso|Antara)/i.test(part));

  buildingSegments.forEach((segment) => {
    const base = hasCityHint(segment) ? segment : `${segment} ${city}`;
    queries.push(base);
    if (streetSegment && streetSegment !== segment) {
      const combo = `${segment} ${streetSegment} ${city}`;
      queries.push(combo);
    }
  });

  if (streetSegment && !queries.some((q) => q.includes(streetSegment))) {
    const streetQuery = hasCityHint(streetSegment) ? streetSegment : `${streetSegment} ${city}`;
    queries.push(streetQuery);
  }

  const seen = new Set();
  return queries.filter((q) => {
    const key = q.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const loadAddressMap = (csvRows) => {
  const header = csvRows.shift();
  const nameIndex = header.findIndex((h) => h.includes('企业名称'));
  const addressIndex = header.findIndex((h) => h.includes('详细办公地址'));
  const map = new Map();
  csvRows.forEach((row) => {
    const name = normalizeName(row[nameIndex] || '');
    const address = String(row[addressIndex] || '').trim();
    if (name && address && !map.has(name)) {
      map.set(name, address);
    }
  });
  return map;
};

const pickBuildingPlaceId = async (query, companyName, placeDetailsCache) => {
  const data = await fetchSerpApiJson({
    engine: 'google_maps',
    type: 'search',
    q: query,
    hl: 'es',
    gl: 'mx',
  });
  const results = Array.isArray(data.local_results) ? [...data.local_results] : [];
  if (data.place_results) results.push(data.place_results);
  if (data.place_result) results.push(data.place_result);
  if (!results.length) return '';

  const baseNormalized = normalizeMatch(companyName);
  const candidates = results.slice(0, 6).map((item) => ({
    placeId: String(item.place_id || '').trim(),
    title: String(item.title || item.name || '').trim(),
  })).filter((item) => item.placeId);

  const ordered = candidates.sort((a, b) => {
    const aMatch = baseNormalized && normalizeMatch(a.title).includes(baseNormalized) ? 1 : 0;
    const bMatch = baseNormalized && normalizeMatch(b.title).includes(baseNormalized) ? 1 : 0;
    return aMatch - bMatch;
  });

  let fallback = '';
  for (const item of ordered) {
    if (!fallback) fallback = item.placeId;
    const cached = placeDetailsCache[item.placeId];
    if (cached && extractPhotoCount(cached) > 0) return item.placeId;
    let details = null;
    try {
      details = await fetchPlaceDetails(item.placeId);
    } catch (err) {
      continue;
    }
    if (details) {
      placeDetailsCache[item.placeId] = details;
      if (extractPhotoCount(details) > 0) return item.placeId;
    }
    await sleep(200);
  }

  return fallback;
};

const companies = loadJson(companiesPath, []);
const placeDetailsCache = loadJson(placeDetailsPath, {});
const csvText = fs.readFileSync(csvPath, 'utf8');
const csvRows = parseCsv(csvText.trim());
const addressMap = loadAddressMap(csvRows);

let updated = 0;
let skipped = 0;
let searched = 0;

const run = async () => {
  for (const company of companies) {
    const industry = String(company?.industry || '').trim();
    const city = String(company?.city || '').trim();
    if (industry !== '中资企业' || city !== '墨西哥城') continue;

    const cover = String(company.cover || '').trim();
    const placeId = String(company.placeId || company.place_id || '').trim();
    const details = placeId ? placeDetailsCache[placeId] : null;
    const photoCount = extractPhotoCount(details);

    if (cover) {
      skipped += 1;
      continue;
    }

    if (placeId && photoCount > 0) {
      skipped += 1;
      continue;
    }

    const baseName = normalizeName(company.name);
    const address = addressMap.get(baseName) || '';
    const queries = buildBuildingQueries(address);

    if (!queries.length) {
      skipped += 1;
      continue;
    }

    let buildingPlaceId = '';
    for (const query of queries) {
      searched += 1;
      try {
        buildingPlaceId = await pickBuildingPlaceId(query, company.name, placeDetailsCache);
      } catch (err) {
        console.warn(`${company.name} 查找写字楼失败：${err.message}`);
      }
      if (buildingPlaceId) break;
      await sleep(200);
    }

    if (buildingPlaceId) {
      company.cover = `/api/place-photo/${buildingPlaceId}`;
      company.buildingPlaceId = buildingPlaceId;
      updated += 1;
    } else {
      skipped += 1;
    }

    await sleep(250);
  }

  fs.writeFileSync(companiesPath, JSON.stringify(companies, null, 2), 'utf8');
  fs.writeFileSync(placeDetailsPath, JSON.stringify(placeDetailsCache, null, 2), 'utf8');

  console.log(`Processed ${searched} queries.`);
  console.log(`Updated ${updated} companies. Skipped ${skipped}.`);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

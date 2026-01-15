#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const SERPAPI_KEY = (process.env.SERPAPI_KEY || '').trim();
if (!SERPAPI_KEY) {
  console.error('缺少 SERPAPI_KEY，终止。');
  process.exit(1);
}

const repoRoot = path.join(__dirname, '..');
const COMPANIES_PATH = path.join(repoRoot, 'data', 'companies.json');
const PLACE_DETAILS_PATH = path.join(repoRoot, 'data', 'place-details.json');
const CSV_PATH = path.join(repoRoot, '墨西哥城中资企业新.csv');
const PHOTO_DIR = path.join(repoRoot, 'image', 'place-photos');
const MIN_FILE_SIZE_BYTES = Number.parseInt(process.env.PLACE_PHOTO_MIN_BYTES || `${120 * 1024}`, 10);

fs.mkdirSync(PHOTO_DIR, { recursive: true });

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

const loadAddressMap = (csvPath) => {
  const csvText = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(csvText.trim());
  const header = rows.shift();
  const nameIndex = header.findIndex((h) => h.includes('企业名称'));
  const addressIndex = header.findIndex((h) => h.includes('详细办公地址'));
  const map = new Map();
  rows.forEach((row) => {
    const name = normalizeName(row[nameIndex] || '');
    const address = String(row[addressIndex] || '').trim();
    if (name && address && !map.has(name)) map.set(name, address);
  });
  return map;
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
  const buildingSegments = segments.filter((part) => /(Torre|Edificio|Plaza|Corporativo|Centro|Tower|Business|Carso|Antara|Reforma)/i.test(part));

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

const parseSizeFromUrl = (url) => {
  const match = String(url || '').match(/=w(\d+)-h(\d+)/);
  if (match) return { width: Number(match[1]), height: Number(match[2]) };
  const sMatch = String(url || '').match(/=s(\d+)/);
  if (sMatch) return { width: Number(sMatch[1]), height: Number(sMatch[1]) };
  return { width: 0, height: 0 };
};

const upgradeGoogleusercontentUrl = (url, width = 1600, height = 1200) => {
  const raw = String(url || '');
  if (!/googleusercontent\.com/.test(raw)) return raw;
  if (raw.includes('=s')) {
    return raw.replace(/=s\d+(-k-no)?/, `=s${width}-k-no`);
  }
  if (raw.includes('=w') && raw.includes('-h')) {
    return raw.replace(/=w\d+-h\d+(-k-no)?/, `=w${width}-h${height}-k-no`);
  }
  return raw;
};

const normalizePhotoItem = (item) => {
  if (!item) return null;
  if (typeof item === 'string') {
    return { url: item, width: 0, height: 0 };
  }
  const url = item.image || item.photo || item.thumbnail || item.url || '';
  if (!url) return null;
  const width = Number(item.width || 0);
  const height = Number(item.height || 0);
  return { url, width, height };
};

const extractCandidatesFromResult = (place) => {
  const candidates = [];
  const push = (item) => {
    const normalized = normalizePhotoItem(item);
    if (normalized?.url) candidates.push(normalized);
  };

  if (place?.thumbnail) push(place.thumbnail);
  if (Array.isArray(place?.images)) place.images.forEach(push);
  if (Array.isArray(place?.photos)) place.photos.forEach(push);

  return candidates
    .map((item) => {
      const parsed = parseSizeFromUrl(item.url);
      return { ...item, width: item.width || parsed.width, height: item.height || parsed.height };
    })
    .filter((item) => /^https?:\/\//i.test(item.url));
};

const fetchPhoto = async (photoUrl) => {
  const res = await fetch(photoUrl);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Photo HTTP ${res.status} ${text}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  return { buffer, contentType };
};

const loadJson = (filePath, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return fallback;
  }
};

const companies = loadJson(COMPANIES_PATH, []);
const placeCache = loadJson(PLACE_DETAILS_PATH, {});
const addressMap = loadAddressMap(CSV_PATH);

const isCdmxEnterprise = (company) => String(company?.industry || '').trim() === '中资企业'
  && String(company?.city || '').trim() === '墨西哥城';

const coverPlaceId = (company) => {
  const cover = String(company.cover || '').trim();
  const match = cover.match(/\/api\/place-photo\/(.+)$/);
  if (match) return match[1].split('/')[0];
  return String(company.buildingPlaceId || company.placeId || company.place_id || '').trim();
};

const needsPhoto = (company, placeId) => {
  if (!placeId) return false;
  const filePath = path.join(PHOTO_DIR, `${placeId}.jpg`);
  if (fs.existsSync(filePath)) {
    const size = fs.statSync(filePath).size;
    return size < MIN_FILE_SIZE_BYTES;
  }
  return true;
};

const main = async () => {
  let updated = 0;
  let skipped = 0;
  let searched = 0;

  for (const company of companies) {
    if (!isCdmxEnterprise(company)) continue;

    const placeId = coverPlaceId(company);
    if (!placeId || !needsPhoto(company, placeId)) {
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

    let saved = false;
    for (const query of queries) {
      searched += 1;
      let data;
      try {
        data = await fetchSerpApiJson({
          engine: 'google_maps',
          type: 'search',
          q: query,
          hl: 'es',
          gl: 'mx',
        });
      } catch (err) {
        console.warn(`${company.name} 查询失败：${err.message}`);
        continue;
      }

      const results = [];
      if (Array.isArray(data.local_results)) results.push(...data.local_results);
      if (data.place_results) results.push(data.place_results);
      if (data.place_result) results.push(data.place_result);
      if (!results.length) {
        await sleep(200);
        continue;
      }

      const matched = results.find((item) => String(item.place_id || '').trim() === placeId) || results[0];
      const candidates = extractCandidatesFromResult(matched);
      if (!candidates.length) {
        await sleep(200);
        continue;
      }

      candidates.sort((a, b) => (b.width * b.height) - (a.width * a.height));
      const best = candidates[0];
      const photoUrl = upgradeGoogleusercontentUrl(best.url);
      if (!photoUrl) {
        await sleep(200);
        continue;
      }

      try {
        const photo = await fetchPhoto(photoUrl);
        const fileName = `${placeId}.jpg`;
        const filePath = path.join(PHOTO_DIR, fileName);
        fs.writeFileSync(filePath, photo.buffer);
        company.cover = `/image/place-photos/${fileName}`;
        company.buildingPlaceId = company.buildingPlaceId || placeId;
        const cacheEntry = placeCache[placeId] || { place_id: placeId };
        if (!Array.isArray(cacheEntry.photos) || cacheEntry.photos.length === 0) {
          cacheEntry.photos = candidates.map((item) => ({ photo_reference: item.url }));
        }
        placeCache[placeId] = cacheEntry;
        updated += 1;
        saved = true;
      } catch (err) {
        console.warn(`${company.name} 下载失败：${err.message}`);
      }

      await sleep(250);
      if (saved) break;
    }

    if (!saved) skipped += 1;
  }

  fs.writeFileSync(COMPANIES_PATH, JSON.stringify(companies, null, 2), 'utf8');
  fs.writeFileSync(PLACE_DETAILS_PATH, JSON.stringify(placeCache, null, 2), 'utf8');

  console.log(`Processed ${searched} queries.`);
  console.log(`Updated ${updated} covers. Skipped ${skipped}.`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

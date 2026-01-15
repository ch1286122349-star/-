#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const SERPAPI_KEY = (process.env.SERPAPI_KEY || '').trim();
if (!SERPAPI_KEY) {
  console.error('缺少 SERPAPI_KEY，终止。');
  process.exit(1);
}

const photoDir = path.join(__dirname, '..', 'image', 'place-photos');
fs.mkdirSync(photoDir, { recursive: true });

const COMPANIES_PATH = path.join(__dirname, '..', 'data', 'companies.json');
const PLACE_DETAILS_PATH = path.join(__dirname, '..', 'data', 'place-details.json');
const FORCE_REDOWNLOAD = process.argv.includes('--force');
const MIN_FILE_SIZE_BYTES = Number.parseInt(process.env.PLACE_PHOTO_MIN_BYTES || `${120 * 1024}`, 10);

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
  const original = item.original || item.original_image || {};
  const url = original.image
    || original.url
    || item.image
    || item.photo
    || item.thumbnail
    || item.url
    || '';
  if (!url) return null;
  const width = Number(original.width || item.width || 0);
  const height = Number(original.height || item.height || 0);
  return { url, width, height };
};

const extractPhotoCandidates = (place, photosData) => {
  const candidates = [];
  const collectFromList = (list) => {
    if (!Array.isArray(list)) return;
    list.forEach((item) => {
      const normalized = normalizePhotoItem(item);
      if (normalized?.url) candidates.push(normalized);
    });
  };
  collectFromList(place?.photos);
  collectFromList(place?.images);
  collectFromList(photosData?.photos || photosData?.photos_results || photosData?.images);

  return candidates
    .map((item) => {
      if (!item.url || !/^https?:\/\//i.test(item.url)) return null;
      if (item.width && item.height) return item;
      const parsed = parseSizeFromUrl(item.url);
      return { ...item, width: parsed.width || item.width, height: parsed.height || item.height };
    })
    .filter(Boolean);
};

const fetchPlacePhotos = async (placeId) => {
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
  let photosData = null;
  if (place?.photos_link) {
    const photosUrl = new URL(place.photos_link);
    if (!photosUrl.searchParams.get('api_key')) {
      photosUrl.searchParams.set('api_key', SERPAPI_KEY);
    }
    photosData = await fetchJson(photosUrl.toString());
  }
  return { place, photosData, candidates: extractPhotoCandidates(place, photosData) };
};

const fetchPhoto = async (photoUrl) => {
  const res = await fetch(photoUrl);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Photo HTTP ${res.status} ${body}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  return { buffer, contentType };
};

const main = async () => {
  let companies = [];
  try {
    companies = JSON.parse(fs.readFileSync(COMPANIES_PATH, 'utf8'));
  } catch (err) {
    console.error('读取 companies.json 失败');
    process.exit(1);
  }
  let placeCache = {};
  try {
    placeCache = JSON.parse(fs.readFileSync(PLACE_DETAILS_PATH, 'utf8'));
  } catch (err) {
    placeCache = {};
  }
  const placeIds = [...new Set(companies
    .filter((company) => String(company?.industry || '').trim() === '中资企业')
    .map((company) => String(company.placeId || company.place_id || '').trim())
    .filter(Boolean))];

  for (const placeId of placeIds) {
    const fileName = `${placeId}.jpg`;
    const filePath = path.join(photoDir, fileName);
    if (fs.existsSync(filePath) && !FORCE_REDOWNLOAD) {
      const stats = fs.statSync(filePath);
      if (stats.size >= MIN_FILE_SIZE_BYTES) {
        console.log(`跳过已有照片 ${fileName}`);
        continue;
      }
      console.log(`重新下载小图 ${fileName} (${stats.size} bytes)`);
    }
    try {
      const { place, photosData, candidates } = await fetchPlacePhotos(placeId);
      if (!Array.isArray(candidates) || candidates.length === 0) {
        throw new Error('无可用图片');
      }
      candidates.sort((a, b) => (b.width * b.height) - (a.width * a.height));
      const best = candidates[0];
      const photoUrl = upgradeGoogleusercontentUrl(best.url);
      if (!photoUrl) {
        throw new Error('无可用图片');
      }
      const photo = await fetchPhoto(photoUrl);
      fs.writeFileSync(filePath, photo.buffer);
      const cacheEntry = placeCache[placeId] || { place_id: placeId };
      if (!Array.isArray(cacheEntry.photos) || cacheEntry.photos.length === 0) {
        cacheEntry.photos = candidates.map((item) => ({ photo_reference: item.url }));
      }
      if (!cacheEntry.url && place?.links?.google_maps) {
        cacheEntry.url = place.links.google_maps;
      }
      placeCache[placeId] = cacheEntry;
      console.log(`保存封面 ${fileName} (${photo.buffer.length} bytes)`);
    } catch (err) {
      console.warn(`${placeId} 下载失败：${err.message}`);
    }
    await sleep(250);
  }
  fs.writeFileSync(PLACE_DETAILS_PATH, JSON.stringify(placeCache, null, 2), 'utf8');
};

main().catch((err) => {
  console.error('运行出错：', err);
  process.exit(1);
});

const fs = require('fs');
const path = require('path');

require('dotenv').config();

const args = process.argv.slice(2);
const placeId = args[0];
const outputPath = args[1];
const apiKey = (process.env.GOOGLE_PLACES_API_KEY || '').trim();

if (!placeId || !outputPath) {
  console.error('Usage: node scripts/fetch-place-photo.js <placeId> <outputPath>');
  process.exit(1);
}

if (!apiKey) {
  console.error('Missing GOOGLE_PLACES_API_KEY in environment.');
  process.exit(1);
}

const fetchJson = async (url) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return data;
};

const fetchPhotoReference = async () => {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'photos');
  url.searchParams.set('key', apiKey);
  const data = await fetchJson(url.toString());
  if (data.status !== 'OK' || !data.result?.photos?.length) {
    throw new Error(`Places detail error: ${data.status || 'UNKNOWN'}`);
  }
  return data.result.photos[0].photo_reference;
};

const fetchPhotoBuffer = async (photoRef) => {
  const photoUrl = new URL('https://maps.googleapis.com/maps/api/place/photo');
  photoUrl.searchParams.set('maxwidth', '1600');
  photoUrl.searchParams.set('photo_reference', photoRef);
  photoUrl.searchParams.set('key', apiKey);
  const res = await fetch(photoUrl.toString());
  if (!res.ok) {
    throw new Error(`Photo HTTP ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

const ensureDir = (filePath) => {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
};

(async () => {
  try {
    const photoRef = await fetchPhotoReference();
    const buffer = await fetchPhotoBuffer(photoRef);
    const resolvedPath = path.resolve(outputPath);
    ensureDir(resolvedPath);
    fs.writeFileSync(resolvedPath, buffer);
    console.log(`Saved photo to ${resolvedPath}`);
  } catch (err) {
    console.error('Failed to fetch place photo:', err.message);
    process.exit(1);
  }
})();

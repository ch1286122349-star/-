const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  console.error('Missing GOOGLE_PLACES_API_KEY in env.');
  process.exit(1);
}

const companiesPath = path.join(__dirname, '..', 'data', 'companies.json');
const raw = fs.readFileSync(companiesPath, 'utf8');
const companies = JSON.parse(raw);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchPhotoCount = async (placeId) => {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'photos');
  url.searchParams.set('key', API_KEY);
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== 'OK') {
    return { status: data.status, count: 0 };
  }
  const photos = Array.isArray(data.result?.photos) ? data.result.photos : [];
  return { status: data.status, count: photos.length };
};

const kept = [];
const removed = [];
let warned = false;

(async () => {
  for (const company of companies) {
    const placeId = String(company.placeId || company.place_id || '').trim();
    if (!placeId) {
      removed.push({ name: company.name, reason: 'missing placeId' });
      continue;
    }
    try {
      const { status, count } = await fetchPhotoCount(placeId);
      if (status === 'OK' && count > 0) {
        kept.push(company);
      } else if (status === 'ZERO_RESULTS' || status === 'NOT_FOUND' || (status === 'OK' && count === 0)) {
        removed.push({ name: company.name, reason: 'no photos' });
      } else {
        kept.push(company);
        if (!warned) {
          console.warn('Non-OK status received, keep entries for safety:', status);
          warned = true;
        }
      }
    } catch (err) {
      kept.push(company);
      if (!warned) {
        console.warn('Photo check failed; keeping entries for safety.');
        warned = true;
      }
    }
    await sleep(180);
  }

  fs.writeFileSync(companiesPath, JSON.stringify(kept, null, 2), 'utf8');
  console.log(`Removed ${removed.length} entries without photos. Remaining ${kept.length}.`);
})();

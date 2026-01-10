require('dotenv').config();
const fs = require('fs');
const path = require('path');

const apiKey = (process.env.GOOGLE_PLACES_API_KEY || '').trim();
if (!apiKey) {
  console.error('Missing GOOGLE_PLACES_API_KEY');
  process.exit(1);
}

const dataPath = path.join(__dirname, '..', 'data', 'companies.json');
let companies = [];
try {
  companies = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  if (!Array.isArray(companies)) throw new Error('Invalid companies data');
} catch (err) {
  console.error('Failed to read companies.json:', err.message);
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchPlaceGeometry = async (placeId) => {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'geometry');
  url.searchParams.set('key', apiKey);
  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.status !== 'OK' || !data.result?.geometry?.location) {
    throw new Error(data.error_message || data.status || 'Places details failed');
  }
  return data.result.geometry.location;
};

const hasCoords = (entry) => Number.isFinite(entry.lat) && Number.isFinite(entry.lng);

(async () => {
  let updated = 0;
  for (const company of companies) {
    const placeId = String(company.placeId || company.place_id || '').trim();
    if (!placeId || hasCoords(company)) continue;
    try {
      const location = await fetchPlaceGeometry(placeId);
      company.lat = location.lat;
      company.lng = location.lng;
      updated += 1;
      await sleep(200);
    } catch (err) {
      console.warn(`Skip ${company.name || placeId}: ${err.message}`);
      await sleep(200);
    }
  }

  if (updated > 0) {
    fs.writeFileSync(dataPath, JSON.stringify(companies, null, 2));
  }
  console.log(`Updated ${updated} entries with coordinates.`);
})();

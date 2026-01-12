const fs = require('fs');
const path = require('path');

const baseUrl = (process.env.SITE_ORIGIN || 'https://mxchino.com').replace(/\/$/, '');
const companiesPath = path.join(__dirname, '..', 'data', 'companies.json');
const outputPath = path.join(__dirname, '..', 'sitemap.xml');

const loadCompanies = () => {
  try {
    const raw = fs.readFileSync(companiesPath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read companies.json:', err.message);
    return [];
  }
};

const escapeXml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/\"/g, '&quot;')
  .replace(/'/g, '&apos;');

const buildUrl = (slug) => `${baseUrl}/company/${encodeURIComponent(slug)}`;

const companies = loadCompanies()
  .filter((company) => company && company.slug)
  .map((company) => String(company.slug).trim())
  .filter(Boolean)
  .sort((a, b) => a.localeCompare(b));

const today = new Date().toISOString().split('T')[0];
const urls = [
  { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'weekly' },
  { loc: `${baseUrl}/companies`, priority: '0.8', changefreq: 'weekly' },
  ...companies.map((slug) => ({
    loc: buildUrl(slug),
    priority: '0.6',
    changefreq: 'monthly',
  })),
];

const urlset = urls.map((entry) => (
  `  <url>\n` +
  `    <loc>${escapeXml(entry.loc)}</loc>\n` +
  `    <lastmod>${today}</lastmod>\n` +
  `    <changefreq>${entry.changefreq}</changefreq>\n` +
  `    <priority>${entry.priority}</priority>\n` +
  `  </url>`
)).join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  `${urlset}\n` +
  `</urlset>\n`;

fs.writeFileSync(outputPath, sitemap);
console.log(`Sitemap generated at ${outputPath} with ${urls.length} URLs.`);

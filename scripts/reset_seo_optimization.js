#!/usr/bin/env node

/**
 * 重置 SEO 优化，只保留手工优化的餐厅
 */

const fs = require('fs');
const path = require('path');

const COMPANIES_PATH = path.join(__dirname, '../data/companies.json');

// 手工优化的餐厅 slug 列表（保留这些）
const manualOptimized = [
  'julongxuan-gourmet-cdmx',
  'kowloon-delight-tacubaya',
  'canton-mexicali',
  'kjbc', // 温州小吃
  'longmenzhen',
  'dumpling-e',
  'kupq', // 嘉城
  'du-te-chinese-breakfast',
  'royal-stew',
  'restaurante-arcoiris-la-verdadera-esencia-de-la-comida-china',
  'jinxi-sabor-oriental'
];

const companies = JSON.parse(fs.readFileSync(COMPANIES_PATH, 'utf8'));

let resetCount = 0;

companies.forEach((company, index) => {
  // 如果有 seoTitle 但不在手工优化列表中，则删除 SEO 字段
  if (company.seoTitle && !manualOptimized.includes(company.slug)) {
    delete companies[index].seoTitle;
    delete companies[index].seoDescription;
    delete companies[index].description;
    delete companies[index].features;
    delete companies[index].specialties;
    delete companies[index].priceRange;
    delete companies[index].cuisine;
    delete companies[index].relatedCompanies;
    
    console.log(`🔄 已重置: ${company.name}`);
    resetCount++;
  }
});

fs.writeFileSync(COMPANIES_PATH, JSON.stringify(companies, null, 2), 'utf8');

console.log(`\n✅ 重置完成！`);
console.log(`   重置: ${resetCount} 个餐厅`);
console.log(`   保留: ${manualOptimized.length} 个手工优化的餐厅`);

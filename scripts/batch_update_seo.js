#!/usr/bin/env node

/**
 * 批量更新公司 SEO 数据脚本
 */

const fs = require('fs');
const path = require('path');

const COMPANIES_PATH = path.join(__dirname, '../data/companies.json');
const BATCH_DATA_PATH = path.join(__dirname, '../DETAILED_BATCH_1.json');

// 读取数据
const companies = JSON.parse(fs.readFileSync(COMPANIES_PATH, 'utf8'));
const batchData = JSON.parse(fs.readFileSync(BATCH_DATA_PATH, 'utf8'));

console.log(`📊 准备更新 ${batchData.length} 个公司的 SEO 数据...\n`);

let updatedCount = 0;

// 更新每个公司
batchData.forEach(data => {
  const index = companies.findIndex(c => c.slug === data.slug);
  
  if (index !== -1) {
    // 合并数据（保留原有字段，添加新字段）
    companies[index] = {
      ...companies[index],
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      description: data.description,
      features: data.features,
      specialties: data.specialties,
      priceRange: data.priceRange,
      cuisine: data.cuisine,
      relatedCompanies: data.relatedCompanies
    };
    
    console.log(`✅ 已更新: ${companies[index].name}`);
    updatedCount++;
  } else {
    console.log(`⚠️  未找到: ${data.slug}`);
  }
});

// 保存更新后的数据
fs.writeFileSync(COMPANIES_PATH, JSON.stringify(companies, null, 2), 'utf8');

console.log(`\n🎉 批量更新完成！`);
console.log(`   成功更新: ${updatedCount} 个公司`);
console.log(`   总公司数: ${companies.length}`);

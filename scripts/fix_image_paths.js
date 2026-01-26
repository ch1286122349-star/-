#!/usr/bin/env node

/**
 * 将 companies.json 中的 /api/place-photo/ 路径替换为 /image/place-photos/ 静态路径
 */

const fs = require('fs');
const path = require('path');

const COMPANIES_PATH = path.join(__dirname, '../data/companies.json');
const PLACE_PHOTO_DIR = path.join(__dirname, '../image/place-photos');

const companies = JSON.parse(fs.readFileSync(COMPANIES_PATH, 'utf8'));

let fixedCount = 0;

companies.forEach((company, index) => {
  if (company.cover && company.cover.startsWith('/api/place-photo/')) {
    // 提取 placeId
    const placeId = company.cover.replace('/api/place-photo/', '');
    
    // 检查本地是否存在对应的图片文件
    const fileName = `${placeId}.jpg`;
    const filePath = path.join(PLACE_PHOTO_DIR, fileName);
    
    if (fs.existsSync(filePath)) {
      // 替换为静态路径
      companies[index].cover = `/image/place-photos/${fileName}`;
      console.log(`✅ 修复: ${company.name} -> ${fileName}`);
      fixedCount++;
    } else {
      console.log(`⚠️  图片不存在: ${company.name} -> ${fileName}`);
    }
  }
});

// 保存更新后的数据
fs.writeFileSync(COMPANIES_PATH, JSON.stringify(companies, null, 2), 'utf8');

console.log(`\n🎉 修复完成！`);
console.log(`   成功修复: ${fixedCount} 个公司的图片路径`);
console.log(`   总公司数: ${companies.length}`);

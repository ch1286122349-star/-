#!/usr/bin/env node

/**
 * 批量优化所有餐厅的 SEO 数据
 */

const fs = require('fs');
const path = require('path');

const COMPANIES_PATH = path.join(__dirname, '../data/companies.json');

// 读取公司数据
const companies = JSON.parse(fs.readFileSync(COMPANIES_PATH, 'utf8'));

// 筛选出所有餐饮类公司
const restaurants = companies.filter(c => c.industry === '餐饮与服务');

console.log(`📊 找到 ${restaurants.length} 个餐饮类公司\n`);

// 已经优化过的餐厅（有 seoTitle 的）
const optimized = restaurants.filter(r => r.seoTitle);
const needOptimization = restaurants.filter(r => !r.seoTitle);

console.log(`✅ 已优化: ${optimized.length} 个`);
console.log(`⏳ 待优化: ${needOptimization.length} 个\n`);

// 为每个餐厅生成 SEO 数据
function generateSEO(restaurant) {
  const name = restaurant.name;
  const city = restaurant.city || '墨西哥';
  const summary = restaurant.summary || '';
  const category = restaurant.category || '中餐';
  
  // 提取评分信息
  const ratingMatch = summary.match(/评分\s*([\d.]+).*?(\d+)/);
  const rating = ratingMatch ? ratingMatch[1] : '';
  const reviewCount = ratingMatch ? ratingMatch[2] : '';
  
  // 根据类别生成菜系
  let cuisine = '中餐';
  let features = '正宗中餐、环境舒适、服务周到';
  let specialties = '经典中餐、家常菜、特色小炒';
  let priceRange = '$150-300 MXN';
  
  // 根据名称和类别推断菜系
  if (name.includes('粤') || name.includes('Canton') || name.includes('广东') || name.includes('Kowloon') || category.includes('粤')) {
    cuisine = '粤菜';
    features = '正宗粤菜、港式点心、烧腊、环境舒适';
    specialties = '烧鹅、叉烧、虾饺、烧卖、肠粉、煲仔饭';
    priceRange = '$200-400 MXN';
  } else if (name.includes('川') || name.includes('Sichuan') || name.includes('麻辣') || name.includes('火锅')) {
    cuisine = '川菜';
    features = '正宗川菜、麻辣鲜香、辣度可调';
    specialties = '麻婆豆腐、水煮鱼、宫保鸡丁、回锅肉、麻辣火锅';
    priceRange = '$200-400 MXN';
  } else if (name.includes('东北') || name.includes('锅包肉')) {
    cuisine = '东北菜';
    features = '东北菜、分量足、价格实惠';
    specialties = '锅包肉、地三鲜、酸菜白肉、东北乱炖';
    priceRange = '$200-400 MXN';
  } else if (name.includes('饺') || name.includes('Dumpling')) {
    cuisine = '北方菜';
    features = '手工水饺、面食、现场制作';
    specialties = '水饺、锅贴、牛肉面、炸酱面';
    priceRange = '$120-250 MXN';
  } else if (name.includes('早餐') || name.includes('Breakfast') || name.includes('豆浆')) {
    cuisine = '小吃';
    features = '中式早餐、小吃、价格实惠';
    specialties = '豆浆、油条、包子、粥、煎饼';
    priceRange = '$80-150 MXN';
  } else if (name.includes('温州') || name.includes('江浙')) {
    cuisine = '温州菜';
    features = '温州菜、江浙小吃、家常菜';
    specialties = '温州鱼丸、炒年糕、馄饨、小笼包';
    priceRange = '$120-250 MXN';
  } else if (name.includes('陕西') || name.includes('Shaanxi') || name.includes('羊')) {
    cuisine = '陕西菜';
    features = '陕西菜、羊肉、面食';
    specialties = '羊肉泡馍、肉夹馍、油泼面、羊肉汤';
    priceRange = '$150-300 MXN';
  } else if (name.includes('湖南') || name.includes('Hunan')) {
    cuisine = '湘菜';
    features = '湘菜、辣而不燥、香辣可口';
    specialties = '剁椒鱼头、毛氏红烧肉、小炒肉';
    priceRange = '$200-400 MXN';
  }
  
  // 生成标题
  const seoTitle = `${name} - ${city}${cuisine}餐厅 | 墨西哥中文网`;
  
  // 生成描述
  let seoDescription = `${name}是${city}${cuisine}餐厅`;
  if (rating && reviewCount) {
    seoDescription += `，评分${rating}★（${reviewCount}条评价）`;
  }
  seoDescription += `。提供${specialties.split('、').slice(0, 3).join('、')}等美食。${features.split('、')[0]}，深受食客喜爱。人均消费 ${priceRange}。`;
  
  // 生成详细描述
  let description = `${name}位于${city}，是一家${cuisine}餐厅`;
  if (rating && reviewCount) {
    description += `，拥有${reviewCount}条顾客评价，评分${rating}`;
  }
  description += `。餐厅提供${specialties}等经典菜品，食材新鲜，烹饪地道。`;
  description += `环境舒适整洁，服务热情周到，价格合理。`;
  description += `无论是想念家乡味道的华人，还是喜欢中餐的墨西哥食客，都能在这里找到满意的选择。`;
  
  return {
    seoTitle: seoTitle.length > 60 ? seoTitle.substring(0, 57) + '...' : seoTitle,
    seoDescription: seoDescription.length > 160 ? seoDescription.substring(0, 157) + '...' : seoDescription,
    description,
    features,
    specialties,
    priceRange,
    cuisine
  };
}

// 批量更新
let updatedCount = 0;

companies.forEach((company, index) => {
  if (company.industry === '餐饮与服务' && !company.seoTitle) {
    const seoData = generateSEO(company);
    companies[index] = {
      ...company,
      ...seoData
    };
    console.log(`✅ 已优化: ${company.name}`);
    updatedCount++;
  }
});

// 保存更新后的数据
fs.writeFileSync(COMPANIES_PATH, JSON.stringify(companies, null, 2), 'utf8');

console.log(`\n🎉 批量优化完成！`);
console.log(`   新优化: ${updatedCount} 个餐厅`);
console.log(`   总优化: ${updatedCount + optimized.length} 个餐厅`);
console.log(`   餐厅总数: ${restaurants.length}`);

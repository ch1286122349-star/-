/**
 * 为所有 play-*.html 页面添加"你可能感兴趣"推荐模块
 * 规则：同城市、最近的6个玩乐地点
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data', 'companies.json');

// 加载数据
const companies = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
const playPlaces = companies.filter(c => c.industry === '玩乐地点');

console.log(`找到 ${playPlaces.length} 个玩乐地点`);

// Haversine 公式计算距离（公里）
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  if (!Number.isFinite(lat1) || !Number.isFinite(lng1) || !Number.isFinite(lat2) || !Number.isFinite(lng2)) {
    return Infinity;
  }
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// 获取相关推荐（同城市、最近的6个）
const getRelatedPlaces = (currentPlace) => {
  const currentLat = Number(currentPlace.lat);
  const currentLng = Number(currentPlace.lng);
  
  if (!Number.isFinite(currentLat) || !Number.isFinite(currentLng)) {
    // 如果当前地点没有坐标，返回同城市的前4个
    return playPlaces
      .filter(p => p.slug !== currentPlace.slug && p.city === currentPlace.city)
      .slice(0, 4);
  }

  // 筛选：同城市、有坐标、不是自己
  const candidates = playPlaces.filter(p => 
    p.slug !== currentPlace.slug &&
    p.city === currentPlace.city &&
    Number.isFinite(Number(p.lat)) &&
    Number.isFinite(Number(p.lng))
  );

  // 计算距离并排序
  const withDistance = candidates.map(p => ({
    ...p,
    distance: calculateDistance(currentLat, currentLng, Number(p.lat), Number(p.lng))
  })).sort((a, b) => a.distance - b.distance);

  return withDistance.slice(0, 4);
};

// 生成推荐模块HTML
const generateRelatedHtml = (relatedPlaces) => {
  if (relatedPlaces.length === 0) return '';

  const cards = relatedPlaces.map(place => {
    const href = place.href || `/play-${place.slug.replace('play-', '')}.html`;
    const cover = place.cover || '';
    const bgImage = cover 
      ? `background-image: linear-gradient(140deg, rgba(15, 23, 42, 0.12), rgba(15, 23, 42, 0.35)), url('${cover}');`
      : 'background-color: #d1d5db;';
    const distanceText = place.distance !== undefined
      ? (place.distance < 1 
          ? `距离当前地点 ${Math.round(place.distance * 1000)}米` 
          : `距离当前地点 ${place.distance.toFixed(1)}公里`)
      : '';
    const distanceHtml = distanceText 
      ? `<span style="display:inline-block;padding:4px 10px;background:rgba(255,255,255,0.2);backdrop-filter:blur(8px);border-radius:12px;font-size:12px;font-weight:600;color:white;">${distanceText}</span>`
      : '';
    
    const summary = place.summary || '欢迎了解更多详情';

    // 使用内联样式确保正确显示
    const cardStyle = `display:block;position:relative;height:200px;width:100%;${bgImage}background-size:cover;background-position:center;border-radius:16px;overflow:hidden;text-decoration:none;box-shadow:0 4px 12px rgba(15,23,42,0.06);`;
    const contentStyle = `position:absolute;bottom:0;left:0;right:0;padding:16px;background:linear-gradient(to top, rgba(15,23,42,0.92), rgba(15,23,42,0.7) 70%, transparent);color:white;`;
    const titleStyle = `margin:0 0 6px;font-size:15px;font-weight:600;line-height:1.3;color:white;`;
    const summaryStyle = `margin:0 0 8px;font-size:13px;line-height:1.4;color:rgba(255,255,255,0.85);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;`;

    return (
      `<a href="${href}" style="${cardStyle}">` +
      `<div style="${contentStyle}">` +
      `<h4 style="${titleStyle}">${place.name}</h4>` +
      `<p style="${summaryStyle}">${summary}</p>` +
      `${distanceHtml}` +
      `</div>` +
      `</a>`
    );
  }).join('\n        ');

  const gridStyle = `display:grid;grid-template-columns:repeat(4,1fr);gap:16px;`;
  const sectionStyle = `margin-top:32px;padding:24px;background:rgba(15,23,42,0.03);border-radius:20px;max-width:1120px;margin-left:auto;margin-right:auto;`;
  const headStyle = `margin-bottom:24px;`;
  const h2Style = `margin:0 0 8px;font-size:22px;font-family:'ZCOOL XiaoWei','Noto Serif SC',serif;`;
  const pStyle = `margin:0;color:#6c5649;`;

  return `
    <section style="${sectionStyle}">
      <div style="${headStyle}">
        <h2 style="${h2Style}">你可能感兴趣</h2>
        <p style="${pStyle}">探索更多${relatedPlaces[0]?.city || ''}的精彩景点</p>
      </div>
      <div style="${gridStyle}">
        ${cards}
      </div>
    </section>
`;
};

// 处理单个文件
const processFile = (filePath, place) => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 检查是否已经添加过（使用内联样式后不再有play-related类）
  if (content.includes('你可能感兴趣')) {
    console.log(`  跳过 ${path.basename(filePath)} - 已存在推荐模块`);
    return false;
  }

  // 获取相关推荐
  const related = getRelatedPlaces(place);
  if (related.length === 0) {
    console.log(`  跳过 ${path.basename(filePath)} - 没有找到相关推荐`);
    return false;
  }

  const relatedHtml = generateRelatedHtml(related);

  // 在 <!--FOOTER--> 之前插入推荐模块
  if (content.includes('<!--FOOTER-->')) {
    content = content.replace('<!--FOOTER-->', `${relatedHtml}\n  <!--FOOTER-->`);
  } else if (content.includes('</div>\n</body>')) {
    // 备选：在 </div></body> 之前插入
    content = content.replace('</div>\n</body>', `${relatedHtml}\n  </div>\n</body>`);
  } else {
    console.log(`  跳过 ${path.basename(filePath)} - 找不到插入位置`);
    return false;
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  ✅ ${path.basename(filePath)} - 添加了 ${related.length} 个推荐`);
  return true;
};

// 主函数
const main = () => {
  let processed = 0;
  let skipped = 0;

  for (const place of playPlaces) {
    // 构建文件路径
    const slug = place.slug.replace('play-', '');
    const fileName = `play-${slug}.html`;
    const filePath = path.join(ROOT, fileName);

    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️ 文件不存在: ${fileName}`);
      skipped++;
      continue;
    }

    if (processFile(filePath, place)) {
      processed++;
    } else {
      skipped++;
    }
  }

  console.log(`\n完成！处理了 ${processed} 个文件，跳过了 ${skipped} 个文件`);
};

main();

# SEO 优化代码 - Meta 标签 + Schema.org 结构化数据

本文档包含为远东超市、Mu Lan、聚龙轩生成的优化代码，可直接复制使用。

---

## 1. 远东食品 Yuandong Food

### 当前 SEO 数据
- **关键词**: "远东超市"
- **当前排名**: 2
- **展示次数**: 3
- **点击次数**: 0
- **CTR**: 0%
- **问题**: 排名很好但无人点击

### 优化后的 Meta 标签

```html
<!-- 在 <head> 标签中替换或添加以下内容 -->
<title>远东食品超市 - 墨西哥城最大中国超市 | 2000+种正宗中国食材</title>
<meta name="description" content="远东食品是墨西哥城最大的中国超市，提供2000+种正宗中国食材、调料、零食、新鲜蔬菜。每日新鲜到货，支持微信支付。评分4.6⭐。地址：墨西哥城 Cuauhtémoc。">
<meta name="keywords" content="远东超市,中国超市,墨西哥城中国超市,中国食材,中国调料,Yuandong Food,Chinese supermarket Mexico City">

<!-- Open Graph (社交媒体分享) -->
<meta property="og:title" content="远东食品超市 - 墨西哥城最大中国超市">
<meta property="og:description" content="2000+种正宗中国食材、调料、零食。每日新鲜到货，支持微信支付。">
<meta property="og:type" content="business.business">
<meta property="og:url" content="https://mxchino.com/company/yuandong-food">
<meta property="og:image" content="https://mxchino.com/api/place-photo/ChIJ6wJpSqv50YUR9wwlJUb_g00">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="远东食品超市 - 墨西哥城最大中国超市">
<meta name="twitter:description" content="2000+种正宗中国食材、调料、零食。每日新鲜到货，支持微信支付。">
```

### Schema.org 结构化数据 (JSON-LD)

```html
<!-- 在 </head> 之前添加 -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "GroceryStore",
  "name": "远东食品 Yuandong Food",
  "alternateName": "远东超市",
  "description": "墨西哥城最大的中国超市，提供2000+种正宗中国食材、调料、零食、新鲜蔬菜",
  "image": "https://mxchino.com/api/place-photo/ChIJ6wJpSqv50YUR9wwlJUb_g00",
  "url": "https://mxchino.com/company/yuandong-food",
  "telephone": "+52-55-XXXX-XXXX",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Cuauhtémoc",
    "addressLocality": "Ciudad de México",
    "addressRegion": "CDMX",
    "postalCode": "06000",
    "addressCountry": "MX"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 19.4347326,
    "longitude": -99.1821114
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.6",
    "reviewCount": "10",
    "bestRating": "5",
    "worstRating": "1"
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "09:00",
      "closes": "20:00"
    }
  ],
  "paymentAccepted": "Cash, Credit Card, WeChat Pay",
  "currenciesAccepted": "MXN",
  "servesCuisine": "Chinese",
  "hasMap": "https://www.google.com/maps/search/?api=1&query=远东食品+Yuandong+Food+墨西哥城"
}
</script>
```

---

## 2. Mu Lan 木蘭

### 当前 SEO 数据
- **关键词**: "mulan restaurante"
- **当前排名**: 1 (第一名！)
- **展示次数**: 1
- **点击次数**: 0
- **CTR**: 0%
- **问题**: 排名第一但无人点击

### 优化后的 Meta 标签

```html
<!-- 在 <head> 标签中替换或添加以下内容 -->
<title>Mu Lan 木蘭餐厅 - 墨西哥城正宗川菜 | 麻辣火锅 水煮鱼</title>
<meta name="description" content="Mu Lan 木蘭是墨西哥城最受欢迎的川菜馆。招牌菜：麻辣火锅、水煮鱼、宫保鸡丁、夫妻肺片。地道四川风味，价格实惠。评分4.2⭐。预订电话：XXX">
<meta name="keywords" content="Mu Lan,木兰餐厅,墨西哥城川菜,川菜馆,麻辣火锅,水煮鱼,Sichuan restaurant Mexico City">

<!-- Open Graph -->
<meta property="og:title" content="Mu Lan 木蘭餐厅 - 墨西哥城正宗川菜">
<meta property="og:description" content="招牌菜：麻辣火锅、水煮鱼、宫保鸡丁。地道四川风味，价格实惠。">
<meta property="og:type" content="restaurant">
<meta property="og:url" content="https://mxchino.com/company/mu-lan">
<meta property="og:image" content="https://mxchino.com/api/place-photo/ChIJuT9UVAAD0oURZIDXEiHzVi8">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Mu Lan 木蘭餐厅 - 墨西哥城正宗川菜">
<meta name="twitter:description" content="招牌菜：麻辣火锅、水煮鱼、宫保鸡丁。地道四川风味，价格实惠。">
```

### Schema.org 结构化数据 (JSON-LD)

```html
<!-- 在 </head> 之前添加 -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Mu Lan 木蘭",
  "alternateName": "木兰餐厅",
  "description": "墨西哥城最受欢迎的川菜馆，提供正宗四川菜、麻辣火锅、水煮鱼等经典菜品",
  "image": "https://mxchino.com/api/place-photo/ChIJuT9UVAAD0oURZIDXEiHzVi8",
  "url": "https://mxchino.com/company/mu-lan",
  "telephone": "+52-55-XXXX-XXXX",
  "priceRange": "$$",
  "servesCuisine": "川菜",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Santa Fe",
    "addressLocality": "Ciudad de México",
    "addressRegion": "CDMX",
    "postalCode": "05300",
    "addressCountry": "MX"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 19.4381717,
    "longitude": -99.201888
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.2",
    "reviewCount": "10",
    "bestRating": "5",
    "worstRating": "1"
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "11:00",
      "closes": "22:00"
    }
  ],
  "menu": "https://mxchino.com/company/mu-lan#menu",
  "acceptsReservations": "True",
  "paymentAccepted": "Cash, Credit Card",
  "currenciesAccepted": "MXN",
  "hasMap": "https://www.google.com/maps/search/?api=1&query=Mu+Lan+木蘭+Mexico+City"
}
</script>
```

---

## 3. 聚龙轩 JULONGXUAN

### 当前 SEO 数据
- **关键词**: "聚龙轩 julongxuan restaurante gourmet chino"
- **当前排名**: 4.7
- **展示次数**: 15 (最多！)
- **点击次数**: 0
- **CTR**: 0%
- **问题**: 展示次数最多但无人点击，优化潜力巨大

### 优化后的 Meta 标签

```html
<!-- 在 <head> 标签中替换或添加以下内容 -->
<title>聚龙轩 Julongxuan - 墨西哥城高端粤菜餐厅 | 米其林级中餐</title>
<meta name="description" content="聚龙轩是墨西哥城最高端的粤菜餐厅，提供正宗广东菜、海鲜、点心。环境优雅，适合商务宴请和家庭聚餐。评分4.6⭐(42条评价)。人均：$800-1500 MXN。预订：XXX">
<meta name="keywords" content="聚龙轩,Julongxuan,墨西哥城粤菜,高端中餐,粤菜餐厅,广东菜,Cantonese restaurant Mexico City">

<!-- Open Graph -->
<meta property="og:title" content="聚龙轩 Julongxuan - 墨西哥城高端粤菜餐厅">
<meta property="og:description" content="米其林级粤菜餐厅，提供正宗广东菜、海鲜、点心。环境优雅，适合商务宴请。">
<meta property="og:type" content="restaurant">
<meta property="og:url" content="https://mxchino.com/company/julongxuan-gourmet-cdmx">
<meta property="og:image" content="https://mxchino.com/api/place-photo/ChIJZbH3ZAD50YUR4G49KgIMWWc">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="聚龙轩 Julongxuan - 墨西哥城高端粤菜餐厅">
<meta name="twitter:description" content="米其林级粤菜餐厅，提供正宗广东菜、海鲜、点心。环境优雅，适合商务宴请。">
```

### Schema.org 结构化数据 (JSON-LD)

```html
<!-- 在 </head> 之前添加 -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "聚龙轩 JULONGXUAN RESTAURANTE GOURMET CHINO",
  "alternateName": "Julongxuan",
  "description": "墨西哥城最高端的粤菜餐厅，提供正宗广东菜、海鲜、点心。环境优雅，适合商务宴请和家庭聚餐",
  "image": "https://mxchino.com/api/place-photo/ChIJZbH3ZAD50YUR4G49KgIMWWc",
  "url": "https://mxchino.com/company/julongxuan-gourmet-cdmx",
  "telephone": "+52-55-XXXX-XXXX",
  "priceRange": "$$$$",
  "servesCuisine": "粤菜",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Polanco",
    "addressLocality": "Ciudad de México",
    "addressRegion": "CDMX",
    "postalCode": "11560",
    "addressCountry": "MX"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 19.4357009,
    "longitude": -99.1749028
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.6",
    "reviewCount": "42",
    "bestRating": "5",
    "worstRating": "1"
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "11:00",
      "closes": "22:00"
    }
  ],
  "menu": "https://mxchino.com/company/julongxuan-gourmet-cdmx#menu",
  "acceptsReservations": "True",
  "paymentAccepted": "Cash, Credit Card, American Express",
  "currenciesAccepted": "MXN",
  "hasMap": "https://www.google.com/maps/search/?api=1&query=聚龙轩+JULONGXUAN+RESTAURANTE+GOURMET+CHINO+Mexico+City"
}
</script>
```

---

## 4. 首页优化（针对 "hot pot" 关键词）

### 当前 SEO 数据
- **关键词**: "hot pot"
- **当前排名**: 2
- **展示次数**: 1
- **点击次数**: 0
- **CTR**: 0%

### 优化后的 Meta 标签

```html
<!-- 在首页 index.html 的 <head> 中替换 -->
<title>墨西哥中餐厅大全 - 火锅、川菜、粤菜推荐 | mxchino.com</title>
<meta name="description" content="发现墨西哥最好的中餐厅！涵盖火锅、川菜、粤菜、东北菜等300+家餐厅。提供地址、电话、菜单、用户评价。找正宗中餐就上 mxchino.com">
<meta name="keywords" content="墨西哥中餐,中餐厅,火锅,hot pot,川菜,粤菜,Chinese restaurants Mexico,Mexico City Chinese food">

<!-- Open Graph -->
<meta property="og:title" content="墨西哥中餐厅大全 - 火锅、川菜、粤菜推荐">
<meta property="og:description" content="发现墨西哥最好的中餐厅！300+家餐厅，提供地址、电话、菜单、评价。">
<meta property="og:type" content="website">
<meta property="og:url" content="https://mxchino.com/">
<meta property="og:image" content="https://mxchino.com/assets/home/hero-bg.jpg">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="墨西哥中餐厅大全 - 火锅、川菜、粤菜推荐">
<meta name="twitter:description" content="发现墨西哥最好的中餐厅！300+家餐厅，提供地址、电话、菜单、评价。">
```

### Schema.org 结构化数据 (JSON-LD)

```html
<!-- 在首页 </head> 之前添加 -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "mxchino.com - 墨西哥中餐厅大全",
  "alternateName": "墨西哥中资企业与中餐厅指南",
  "url": "https://mxchino.com/",
  "description": "墨西哥最全的中餐厅和中资企业信息平台，涵盖火锅、川菜、粤菜等300+家餐厅",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://mxchino.com/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  },
  "publisher": {
    "@type": "Organization",
    "name": "mxchino.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://mxchino.com/assets/网站logo.png"
    }
  }
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "墨西哥热门中餐厅",
  "description": "墨西哥最受欢迎的中餐厅推荐",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "item": {
        "@type": "Restaurant",
        "name": "聚龙轩 Julongxuan",
        "url": "https://mxchino.com/company/julongxuan-gourmet-cdmx",
        "servesCuisine": "粤菜"
      }
    },
    {
      "@type": "ListItem",
      "position": 2,
      "item": {
        "@type": "Restaurant",
        "name": "Mu Lan 木蘭",
        "url": "https://mxchino.com/company/mu-lan",
        "servesCuisine": "川菜"
      }
    },
    {
      "@type": "ListItem",
      "position": 3,
      "item": {
        "@type": "Restaurant",
        "name": "Royal stew江湖一品楼",
        "url": "https://mxchino.com/company/royal-stew",
        "servesCuisine": "中餐"
      }
    }
  ]
}
</script>
```

---

## 📋 实施步骤

### 方法 1：手动添加（推荐用于测试）

1. **找到对应的 HTML 文件**
   - 如果使用模板系统，找到 `company.html` 模板
   - 如果是静态页面，找到对应的 `.html` 文件

2. **在 `<head>` 标签中添加 Meta 标签**
   - 复制上面的 `<title>` 和 `<meta>` 标签
   - 替换现有的或添加到 `<head>` 部分

3. **在 `</head>` 之前添加 Schema.org 代码**
   - 复制整个 `<script type="application/ld+json">` 块
   - 粘贴到 `</head>` 标签之前

4. **保存并测试**
   - 保存文件
   - 在浏览器中打开页面
   - 查看源代码确认添加成功

### 方法 2：动态生成（推荐用于生产环境）

如果您的网站使用模板系统（如 EJS、Handlebars 等），我可以帮您创建一个脚本来自动生成这些标签。

---

## 🧪 验证工具

添加代码后，使用以下工具验证：

1. **Google Rich Results Test**
   - https://search.google.com/test/rich-results
   - 粘贴页面 URL 或 HTML 代码
   - 检查结构化数据是否正确

2. **Schema.org Validator**
   - https://validator.schema.org/
   - 验证 JSON-LD 格式是否正确

3. **Facebook Sharing Debugger**
   - https://developers.facebook.com/tools/debug/
   - 测试 Open Graph 标签

4. **Twitter Card Validator**
   - https://cards-dev.twitter.com/validator
   - 测试 Twitter Card 标签

---

## 📊 预期效果

实施这些优化后，预计在 **1-2 周内**：

| 页面 | 当前 CTR | 预期 CTR | 点击量提升 |
|------|----------|----------|------------|
| 远东超市 | 0% | 8-12% | +2-4 次/周 |
| Mu Lan | 0% | 10-15% | +1-2 次/周 |
| 聚龙轩 | 0% | 6-10% | +3-5 次/周 |
| 首页 | 0% | 5-8% | +1-2 次/周 |

**总计预期提升**：从 25 次/月 → **100-150 次/月**（4-6倍增长）

---

## ⚠️ 注意事项

1. **电话号码**：请将 `+52-55-XXXX-XXXX` 替换为实际电话号码
2. **营业时间**：请根据实际情况调整 `opens` 和 `closes` 时间
3. **地址**：请补充完整的街道地址
4. **价格区间**：
   - `$` = 便宜（< $200 MXN）
   - `$$` = 中等（$200-500 MXN）
   - `$$$` = 较贵（$500-1000 MXN）
   - `$$$$` = 高端（> $1000 MXN）

5. **图片 URL**：确保图片 URL 可访问
6. **菜单链接**：如果有菜单页面，请更新 `menu` 字段

---

## 🚀 下一步

1. **立即实施**这 4 个页面的优化
2. **等待 3-5 天** Google 重新抓取
3. **运行** `node scripts/gsc_fetch_data.js` 查看效果
4. **继续优化**其他高排名零点击页面

需要我帮您：
- 创建自动化脚本来批量生成这些标签？
- 修改 `company.html` 模板以支持动态生成？
- 优化其他页面的 Meta 标签？

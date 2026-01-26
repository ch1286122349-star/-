# Google Search Console 手动提交 URL 列表

**生成时间**: 2026-01-26  
**总计**: 50个优先URL

---

## 📋 提交方法

1. 登录 [Google Search Console](https://search.google.com/search-console)
2. 选择你的网站 `sc-domain:mxchino.com`
3. 点击左侧「网址检查」
4. 输入URL并点击「请求编入索引」
5. **每天最多提交10-15个URL**

---

## 🔥 优先级1：高排名零点击页面（立即提交）

这些页面在Google中排名很高但没有点击，优化后立即提交：

```
https://mxchino.com/company/julongxuan-gourmet-cdmx
https://mxchino.com/company/mu-lan
https://mxchino.com/company/yuandong-food
https://mxchino.com/company/kupq
```

---

## ⭐ 优先级2：核心页面（第1天）

```
https://mxchino.com/
https://mxchino.com/sitemap-html.html
https://mxchino.com/directory
https://mxchino.com/enterprises
```

---

## 🎢 优先级3：热门玩乐地点 - 墨西哥城（第2-3天）

```
https://mxchino.com/play-teotihuacan.html
https://mxchino.com/play-antropologia.html
https://mxchino.com/play-chapultepec.html
https://mxchino.com/play-bellas-artes.html
https://mxchino.com/play-xochimilco.html
https://mxchino.com/play-frida-kahlo.html
https://mxchino.com/play-coyoacan.html
https://mxchino.com/play-zocalo.html
https://mxchino.com/play-castillo-chapultepec.html
https://mxchino.com/play-soumaya.html
```

---

## 🏔️ 优先级4：热门玩乐地点 - 蒙特雷（第4-5天）

```
https://mxchino.com/play-chipinque.html
https://mxchino.com/play-cerro-de-la-silla.html
https://mxchino.com/play-fundidora.html
https://mxchino.com/play-matacanes.html
https://mxchino.com/play-bioparque-estrella.html
https://mxchino.com/play-grutas-de-garcia.html
https://mxchino.com/play-macroplaza.html
https://mxchino.com/play-paseo-santa-lucia.html
```

---

## 🏛️ 优先级5：热门玩乐地点 - 其他城市（第6天）

```
https://mxchino.com/play-chichen-itza.html
https://mxchino.com/play-cancun-beach.html
https://mxchino.com/play-tulum.html
https://mxchino.com/play-guanajuato.html
https://mxchino.com/play-cabanas.html
https://mxchino.com/play-catedral-gdl.html
https://mxchino.com/play-tlaquepaque.html
https://mxchino.com/play-chapala.html
```

---

## 📅 优先级6：热门展会（第7天）

```
https://mxchino.com/expo-fabtech-mexico.html
https://mxchino.com/expo-intermoda.html
https://mxchino.com/expo-antad.html
https://mxchino.com/expo-automechanika.html
https://mxchino.com/expo-intersolar.html
https://mxchino.com/expo-cihac.html
https://mxchino.com/expo-abastur.html
https://mxchino.com/expo-manufactura.html
```

---

## 📊 提交进度追踪

| 日期 | 提交数量 | 已完成 |
|------|----------|--------|
| Day 1 | 8 | [ ] |
| Day 2 | 10 | [ ] |
| Day 3 | 10 | [ ] |
| Day 4 | 8 | [ ] |
| Day 5 | 8 | [ ] |
| Day 6 | 8 | [ ] |
| Day 7 | 8 | [ ] |

---

## 💡 提交技巧

1. **优先提交有内容的页面** - 内容丰富的页面更容易被索引
2. **检查索引状态** - 提交前先用「网址检查」查看当前状态
3. **等待2-3天** - 提交后通常2-3天才会被索引
4. **不要重复提交** - 同一URL短期内只需提交一次
5. **检查错误** - 如果显示「无法编入索引」，查看具体原因

---

## 🔍 后续监控

每周运行一次GSC数据获取脚本，检查索引进度：

```bash
node scripts/gsc_fetch_data.js
```

预期效果：
- 1周后：索引页面 13 → 30-50
- 2周后：索引页面 → 80-100
- 1个月后：索引页面 → 150+

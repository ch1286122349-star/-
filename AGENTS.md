# 项目助手规则

- 对于较复杂的请求，在执行前先揣摩用户的真实意图并复述确认。
- 经过用户明确确认后再执行；极其简单的请求可直接执行无需确认。
- 只能用中文回答用户的问题。

---

## 添加玩乐地点完整流程

### 第一步：收集信息

1. **基本信息**
   - 景点中文名 + 西班牙语/英文名
   - 所在城市（蒙特雷、墨西哥城、瓜达拉哈拉等）
   - 景点类型（生态公园、博物馆、峡谷探险、野生动物园等）
   - 建议游玩时长

2. **详细信息**（可通过 WebSearch 获取）
   - 门票价格
   - 开放时间
   - 地理位置描述
   - 主要特色和亮点
   - 注意事项

3. **Google 地图链接**
   - **推荐格式**：`https://www.google.com/maps/search/?api=1&query=景点名称+城市名`
   - **示例**：`https://www.google.com/maps/search/?api=1&query=Chipinque+Monterrey`
   - 或使用用户提供的 `maps.app.goo.gl` 短链接

### 第二步：创建图片目录和下载图片

1. **创建目录**
   ```bash
   mkdir -p assets/play/景点slug/
   ```
   - slug 命名规则：小写英文，用连字符分隔
   - 示例：`chipinque`、`museo-historia-mexicana`、`cerro-de-la-silla`

2. **图片命名规则**
   | 文件名 | 用途 | 说明 |
   |--------|------|------|
   | `hero-01.jpg` | 首屏主图 | 高优先级加载 |
   | `hero-02.jpg` | 首屏副图 | 懒加载 |
   | `geo-01.jpg` | 地理/环境图 | 展示位置或环境 |
   | `tour-01.jpg` | 游览图1 | 展示活动或路线 |
   | `tour-02.jpg` | 游览图2 | 展示活动或路线 |
   | `gallery-01~04.jpg` | 画册图片 | 页面底部展示 |
   | `wild-01.jpg` | 生态图片 | 可选，展示动植物 |

3. **图片来源**（推荐稳定渠道）

   **⚠️ 重要提示**：由于防爬机制，自动下载经常失败。推荐手动下载！

   | 来源 | 特点 | 获取方式 |
   |------|------|----------|
   | **Wikimedia Commons** | 真实景点照片、CC许可 | 手动下载最可靠 |
   | **Unsplash** | 高质量、免费 | 需登录后下载 |
   | **Pexels** | 免费商用 | 直接下载 |
   | **Pixabay** | 免费、多语言 | 需注册 |
   | **小红书/抖音截图** | 真实用户拍摄 | 需注明来源 |

4. **手动下载图片流程（推荐）**

   **方法 A：Wikimedia Commons（最稳定）**
   1. 访问 `commons.wikimedia.org`
   2. 搜索景点英文/西班牙文名称
   3. 点击图片 → 点击「原始文件」→ 右键「另存为」
   4. 保存到 `assets/play/景点slug/` 并按规则命名

   **方法 B：Unsplash/Pexels**
   1. 访问 `unsplash.com` 或 `pexels.com`
   2. 搜索景点名称（英文效果更好）
   3. 点击图片 → 点击「Free Download」或「下载」
   4. 选择「Medium」或「Large」尺寸（1600px 左右最佳）

   **方法 C：使用 Pexels API（自动化，推荐开发者使用）**
   ```bash
   # 1. 注册 Pexels 获取免费 API Key: https://www.pexels.com/api/
   # 2. 使用 API 下载
   curl -H "Authorization: YOUR_API_KEY" \
     "https://api.pexels.com/v1/search?query=teotihuacan&per_page=5" \
     | jq '.photos[].src.large' 
   ```

5. **自动下载命令（成功率约 30%）**
   ```bash
   cd assets/play/景点slug/
   curl -L -A "Mozilla/5.0" -o hero-01.jpg "图片直接链接"
   ```
   
   **如果返回 HTML 文本而非图片**：说明链接被重定向，需手动下载

5. **图片压缩**（必须执行，否则页面会卡顿）
   ```bash
   cd assets/play/景点slug/
   for img in *.jpg; do
     sips -Z 1600 "$img" --setProperty formatOptions 70 >/dev/null 2>&1
   done
   ```
   - 最大宽度：1600px
   - JPEG 质量：70%
   - 目标单张大小：< 500KB

### 第三步：创建 HTML 页面

1. **文件命名**：`play-景点slug.html`
   - 示例：`play-chipinque.html`

2. **页面结构模板**
   ```html
   <!DOCTYPE html>
   <html lang="zh-Hans">
   <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>玩乐地点｜景点名称</title>
     <meta name="description" content="简短描述">
     <link rel="canonical" href="https://mxchino.com/play-slug.html">
     <meta property="og:title" content="玩乐地点｜景点名称">
     <meta property="og:image" content="https://mxchino.com/assets/play/slug/hero-01.jpg">
     <link href="https://fonts.googleapis.com/css2?family=ZCOOL+XiaoWei&display=swap" rel="stylesheet">
     <!--HEAD-->
   </head>
   <body class="play-page">
     <!--HEADER-->
     <div class="page play-shell">
       <!-- 页面内容 -->
     </div>
     <!--FOOTER-->
   </body>
   </html>
   ```

3. **图片标签规则**
   - 首屏图片：`fetchpriority="high"`
   - 其他图片：`loading="lazy" decoding="async"`
   ```html
   <!-- 首屏图片 -->
   <img src="/assets/play/slug/hero-01.jpg" alt="描述" fetchpriority="high">
   
   <!-- 其他图片 -->
   <img src="/assets/play/slug/geo-01.jpg" alt="描述" loading="lazy" decoding="async">
   ```

4. **参考现有页面**：复制 `play-chipinque.html` 或其他页面作为模板

### 第四步：更新 companies.json

在 `data/companies.json` 中添加新条目：

```json
{
  "slug": "play-景点slug",
  "name": "景点名称 中英文",
  "industry": "玩乐地点",
  "city": "蒙特雷",
  "summary": "简短描述，50字以内",
  "cover": "/assets/play/景点slug/hero-01.jpg",
  "href": "/play-景点slug.html",
  "lat": 25.6167,
  "lng": -100.3667
}
```

**注意**：
- `industry` 必须是 `"玩乐地点"`
- `href` 必须指向 HTML 文件路径
- `cover` 是首页卡片显示的封面图
- **`lat` 和 `lng` 必须填写**（用于首页显示距离用户的距离）

### 获取经纬度坐标

1. **Google Maps 获取**：
   - 在 Google Maps 搜索景点
   - 右键点击地图上的位置
   - 第一行显示的就是经纬度（如 `25.6167, -100.3667`）
   - `lat` = 第一个数字（纬度）
   - `lng` = 第二个数字（经度）

2. **常用城市参考坐标**：
   | 城市 | 纬度 (lat) | 经度 (lng) |
   |------|-----------|-----------|
   | 蒙特雷 | 25.67 | -100.31 |
   | 墨西哥城 | 19.43 | -99.13 |
   | 瓜达拉哈拉 | 20.67 | -103.35 |
   | 坎昆 | 21.16 | -86.85 |
   | 瓜纳华托 | 21.02 | -101.26 |

### 第五步：验证和发布

1. **本地预览**
   ```bash
   npm start
   # 访问 http://localhost:3000/play-景点slug.html
   ```

2. **检查清单**
   - [ ] 页面能正常打开，样式正确
   - [ ] 所有图片都能加载
   - [ ] Google 地图链接可以点击打开
   - [ ] 首页"玩乐地点"区域显示新景点
   - [ ] 图片已压缩（单张 < 500KB）

3. **提交到 GitHub**
   ```bash
   git add play-景点slug.html assets/play/景点slug/ data/companies.json
   git commit -m "feat: 添加玩乐地点 - 景点名称"
   git push origin 分支名
   ```

---

## 快速命令参考

### 批量压缩某目录图片
```bash
cd assets/play/目录名/
for img in *.jpg; do
  sips -Z 1600 "$img" --setProperty formatOptions 70 >/dev/null 2>&1
done
```

### 检查图片大小
```bash
ls -lh assets/play/目录名/*.jpg
```

### 检查所有 play 目录大小
```bash
du -sh assets/play/*/
```

### 重启本地服务器
```bash
lsof -ti:3000 | xargs kill -9; npm start
```

---

## 常见问题

### Q: 页面滑动卡顿
**原因**：图片太大
**解决**：运行图片压缩命令

### Q: Google 地图链接打不开
**原因**：短链接过期或格式错误
**解决**：使用标准格式 `https://www.google.com/maps/search/?api=1&query=景点名+城市`

### Q: 首页不显示新景点
**原因**：`companies.json` 配置错误
**检查**：
1. `industry` 是否为 `"玩乐地点"`
2. `href` 路径是否正确
3. JSON 格式是否有语法错误

### Q: 图片下载失败（返回 ASCII 文本）
**原因**：URL 不是直接图片链接
**解决**：
1. 在浏览器中打开图片页面
2. 找到"原始文件"或"下载"链接
3. 复制真正的 `.jpg` 直接链接
4. **最可靠方法**：直接在浏览器中右键另存为

### Q: 图片重复/与文案不符
**检查重复**：
```bash
# 检查某目录图片是否重复
cd assets/play/目录名/
md5 -q *.jpg | sort | uniq -d
```
**解决**：
1. 删除重复图片
2. 从上述推荐来源手动下载不同角度的照片
3. 确保每张图片内容与其用途对应：
   - `hero` = 标志性全景
   - `geo` = 地理环境
   - `tour` = 活动/体验
   - `gallery` = 多角度展示
   - `wild` = 生态/动植物

---

## 文件结构参考

```
新项目/
├── play-chipinque.html          # 景点页面
├── play-museo-historia-mexicana.html
├── ...
├── assets/
│   └── play/
│       ├── chipinque/           # 景点图片目录
│       │   ├── hero-01.jpg
│       │   ├── hero-02.jpg
│       │   ├── geo-01.jpg
│       │   ├── tour-01.jpg
│       │   ├── tour-02.jpg
│       │   └── gallery-01~04.jpg
│       └── museo-historia-mexicana/
│           └── ...
├── data/
│   └── companies.json           # 包含所有景点数据
└── server.js                    # 包含路由处理
```

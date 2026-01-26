# Google Search Console API 设置指南

本指南将帮助您设置 Google Search Console API，以便获取网站的 SEO 数据。

## 📋 前置要求

- Google 账号（已在 Search Console 中验证网站所有权）
- Node.js 环境（已安装）
- googleapis npm 包（已安装）

## 🚀 设置步骤

### 第一步：创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 点击顶部的项目选择器
3. 点击 "新建项目"
4. 输入项目名称（如 `mxchino-seo`）
5. 点击 "创建"

### 第二步：启用 Search Console API

1. 在项目中，访问 [API 库](https://console.cloud.google.com/apis/library)
2. 搜索 "Google Search Console API"
3. 点击进入，然后点击 "启用"

### 第三步：创建 OAuth 2.0 凭据

1. 访问 [凭据页面](https://console.cloud.google.com/apis/credentials)
2. 点击 "创建凭据" → "OAuth 客户端 ID"
3. 如果提示配置同意屏幕：
   - 点击 "配置同意屏幕"
   - 用户类型选择 "外部"
   - 填写应用名称（如 `mxchino SEO Tool`）
   - 用户支持电子邮件：选择您的邮箱
   - 开发者联系信息：填写您的邮箱
   - 点击 "保存并继续"
   - 作用域：跳过，点击 "保存并继续"
   - 测试用户：添加您的 Google 账号邮箱
   - 点击 "保存并继续"
4. 返回凭据页面，再次点击 "创建凭据" → "OAuth 客户端 ID"
5. 应用类型选择 "**桌面应用**"
6. 名称输入 `mxchino-seo-client`
7. 点击 "创建"
8. 下载 JSON 文件
9. 将下载的文件重命名为 `gsc-credentials.json`
10. 将文件放到项目根目录：`/Users/sheldon/Desktop/新项目/gsc-credentials.json`

### 第四步：运行脚本获取数据

```bash
cd /Users/sheldon/Desktop/新项目
node scripts/gsc_fetch_data.js
```

**首次运行流程**：
1. 脚本会显示一个授权 URL
2. 复制 URL 并在浏览器中打开
3. 选择您的 Google 账号
4. 点击 "继续"（可能会显示"Google 尚未验证此应用"的警告，点击"继续"）
5. 授权访问 Search Console 数据
6. 复制页面显示的授权码
7. 粘贴到终端并按回车
8. 脚本会自动保存 token，下次运行无需重新授权

## 📊 获取的数据

脚本会获取以下 SEO 数据（最近 28 天）：

### 网站整体表现
- 总点击量
- 总展示次数
- 平均点击率 (CTR)
- 平均排名

### 详细搜索数据
- Top 100 搜索查询
- 每个查询的：
  - 关键词
  - 对应页面
  - 点击量
  - 展示次数
  - CTR
  - 平均排名

### 数据保存位置
- 完整数据保存在：`data/gsc-data.json`
- Token 保存在：`.gsc-token.json`（已加入 .gitignore）

## 🔒 安全注意事项

1. **不要提交凭据文件到 Git**
   - `gsc-credentials.json` 包含敏感信息
   - `.gsc-token.json` 包含访问令牌
   - 已在 `.gitignore` 中排除这些文件

2. **定期更新 Token**
   - Token 会自动刷新
   - 如果遇到认证问题，删除 `.gsc-token.json` 重新授权

## 📈 后续可以做的事情

1. **创建定期报告**
   - 使用 cron job 定期运行脚本
   - 将数据保存到数据库
   - 生成趋势图表

2. **分析特定页面**
   - 修改脚本筛选特定 URL
   - 对比不同时间段的数据

3. **优化 SEO 策略**
   - 找出高展示低点击的关键词（优化 CTR）
   - 找出排名在 11-20 的关键词（提升排名）
   - 分析哪些页面需要改进

## ❓ 常见问题

### Q: 提示 "403 Forbidden" 错误
**A**: 确保：
- 您的 Google 账号在 Search Console 中有该网站的权限
- 网站 URL 完全匹配（包括 https:// 和结尾的 /）
- API 已启用

### Q: 没有数据返回
**A**: 可能原因：
- 网站刚添加到 Search Console，数据还未生成
- 选择的日期范围内确实没有流量
- 网站 URL 不正确

### Q: Token 过期
**A**: 删除 `.gsc-token.json` 文件，重新运行脚本进行授权

## 📞 需要帮助？

如果遇到问题，请检查：
1. Google Cloud Console 中 API 是否已启用
2. OAuth 同意屏幕是否配置完成
3. 凭据文件是否在正确位置
4. 您的 Google 账号是否有 Search Console 权限

# Facebook 自动化广告发布流程 (海关问题专用)

本文档指导如何使用 `scripts/publish_customs_ad.js` 脚本，将一张图片快速发布为 Facebook 帖子，并自动将其转化为“海关问题”广告组下的广告。

## ✅ 前提条件

确保 `.env` 文件中已配置以下关键变量：

- `FACEBOOK_AD_ACCOUNT_ID` (广告账户 ID, 如 `act_1020659192329769`)
- `FACEBOOK_USER_ACCESS_TOKEN` (用户访问令牌，需包含 `ads_management` 权限)
- `FACEBOOK_PAGE_ACCESS_TOKEN` (主页访问令牌，用于发帖)
- `FACEBOOK_PAGE_ID` (主页 ID)

> **注意**: 该脚本专门针对广告组 ID `120238030169510396` ("海关问题") 进行了硬编码优化。

## 🚀 使用方法

### 1. 准备图片
将你制作好的图片放在项目目录中，例如 `assets/customs_ad_01.jpg`。

### 2. 运行脚本
在终端中执行以下命令：

```bash
node scripts/publish_customs_ad.js "广告文案" <图片路径1> [图片路径2] ...
```

**示例（单图模式）：**
```bash
node scripts/publish_customs_ad.js "需要海关清关服务..." assets/ad_cover.jpg
```

**示例（多图轮播模式 - Carousel）：**
如果你提供了多张图片，脚本会自动创建一个 **轮播广告 (Carousel Ad)**。
```bash
node scripts/publish_customs_ad.js "寻找焊接供应商..." assets/cover.jpg assets/drawing.png
```

### 3. 脚本执行流程 (自动完成)
脚本会自动执行以下步骤：
1.  **发布帖子**：将所有图片发布为一条 Facebook 多图帖子。
2.  **上传素材**：将图片上传到广告库获取 Hash。
3.  **创建创意**：
    *   **单图**：创建带有 WhatsApp 按钮的标准图片广告。
    *   **多图**：创建 **轮播广告 (Carousel)**，每张卡片都带有 WhatsApp 按钮。
4.  **创建广告**：在“海关问题”广告组下创建新广告 (PAUSED)。

## 📢 后续操作

脚本运行成功后，你会看到类似以下的输出：
```
🎉 SUCCESS! Ad created successfully.
🆔 Ad ID: 120240245519580396
🔗 Link: https://adsmanager.facebook.com/...
```

1.  **点击链接**进入 Facebook 广告管理工具。
2.  检查广告预览是否符合预期。
3.  **手动开启广告** (将开关从 Off 拨到 On)。

---

## 🛠️ 故障排查

**Q: 报错 `Error validating access token: Session has expired`**
A: Token 过期了。请去 Graph API Explorer 重新生成 Token 并更新到 `.env` 文件。

**Q: 报错 `Creative creation failed: Invalid parameter`**
A: 检查 `.env` 中的 Token 是否拥有 `ads_management` 权限，或者广告账户状态是否正常。

**Q: 广告创建了但没有 WhatsApp 按钮？**
A: 脚本会自动检测广告组绑定的号码。如果广告组未绑定号码，按钮将回退链接到 Facebook 主页。请确保广告组本身已正确配置为“消息互动”目标。

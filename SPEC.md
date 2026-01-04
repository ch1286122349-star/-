# 项目工作规范（SPEC）

## 目标
- 提供「墨西哥中文网」联系/订阅表单的单页静态站点，简洁、清晰、易填写。
- 首屏主行动：填写并提交表单（暂无后端提交逻辑，可扩展）。

## 技术栈
- 纯静态：HTML + 原生 CSS，内联样式（当前在 `index.html`）。
- 字体：Google Fonts `Noto Sans SC` + `Space Grotesk`。
- 不依赖 JS 框架；后续若要加交互，优先原生或最小依赖。

## 设计与视觉
- 主题：暖色基调（橙 #ff6a3d、琥珀 #ffb400、薄荷 #2bbfa8），背景奶油/暖橙渐变（非蓝色）。
- 文字：主色 `--ink: #24140f`，次色 `--muted: #5f4b45`。
- 边角与阴影：圆角 18px，阴影 `0 22px 64px rgba(36, 20, 15, 0.22)`。
- 按钮与 Logo：使用暖色梯度，悬浮微提升；输入聚焦态用橙色描边/阴影。
- 布局：居中窄版（约 820px），卡片包裹表单，留充足内边距；小屏单列。

## 可访问性与文案
- 表单字段包含 `label for` + `id`，必填项标 `*`。
- 占位符给示例，便于理解。
- 语言 `lang="zh-Hans"`，viewport 已设置。
- 交互无 JS 时，按钮保留 `type="submit"`，后端接入时补 `action`。

## 文件结构
- `index.html`：主页面与样式。保持内联 CSS 简洁；新样式优先复用 CSS 变量。
- 其他：暂无构建脚本/依赖；如需拆分样式，可新增 `styles.css` 并在此更新规范。

## 预览与开发
- 内嵌预览：在 Cursor/VS Code 用 Live Server 启动后，命令面板执行 `Simple Browser: Show`，粘贴本地地址（默认 `http://127.0.0.1:5500/index.html`）嵌入预览。
- 终端预览（无需插件）：`python3 -m http.server 8000` 后访问 `http://localhost:8000/index.html`。

## 变更原则
- 保持暖色主题，不再回退到冷色/蓝色基底。
- 新增交互时，尽量无框架；必要时写清依赖与用途。
- 对样式/布局/文案的重大改动，请在 PR/提交说明里简述目的与影响。

## 待办/扩展
- 若需要收集表单：接入后端或邮件服务（如 Formspree），并补充成功/错误提示。
- 可添加基础校验与加载/禁用态，仍保持最小依赖。*** End Patch" might grammar? need newline end. ensure no Chinese punctuation issues? include ascii simple. Check ends. Ensure apply patch grammar correct. Let's run. */

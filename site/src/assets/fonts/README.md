# 品牌字体

- 字体：Noto Serif SC（思源宋体同源的简体中文宋体），Google Fonts 提供。
- 文件：`noto-serif-sc-brand.woff2`，可变字重 500–700，6,084 字节。
- 仅包含「老旧默片普通人的生活档案」的 12 个去重汉字，用于品牌名称和首页副标题；不替换档案正文的系统字体。
- 品牌名称使用 700 字重，首页副标题使用 500 字重。字体随网站本地构建打包，不在访客浏览时调用 Google 服务。
- 使用 SIL Open Font License 1.1。完整授权文件随网站分发于 `site/public/fonts/OFL.txt`，公开路径 `/fonts/OFL.txt`。
- 字体原项目：https://github.com/google/fonts/tree/main/ofl/notoserifsc
- 获取日期：2026-09-14。Google Fonts 样式接口参数：`family=Noto+Serif+SC:wght@500..700&text=老旧默片普通人的生活档案`，接口返回版本 v35 的 WOFF2 字体。

如需扩展品牌固定文案，应更新字体字符子集与 `BaseLayout.astro` 中的 `unicode-range`。普通藏品资料和动态文案不应使用此字体子集。

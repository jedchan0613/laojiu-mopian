# 品牌字体

- 字体：Noto Serif SC（思源宋体同源的简体中文宋体），Google Fonts 提供。
- 主文件：`noto-serif-sc-brand.woff2`，可变字重 200–900，约 672 KB。
- 补充文件：`noto-serif-sc-brand-supplement.woff`，可变字重 200–900，约 7 KB；只补充后来公开文案新增、主文件尚未包含的“困、室、搞、暗、玩”。它与主文件同源，浏览器只在页面出现这些字时按需加载。
- 子集覆盖界面常用汉字、标点，以及当前已公开档案题名与说明中的汉字；用于品牌名称、标题和公开页正文。元数据、表单和按钮改用系统无衬线字体。
- 未收入子集的生僻字会回退到系统宋体，不在访客浏览时调用 Google 服务。
- 品牌名称使用 700 字重，首页副标题使用 500 字重。字体随网站本地构建打包。
- 使用 SIL Open Font License 1.1。完整授权文件随网站分发于 `site/public/fonts/OFL.txt`，公开路径 `/fonts/OFL.txt`。
- 字体原项目：https://github.com/google/fonts/tree/main/ofl/notoserifsc
- 获取日期：2026-09-20。源文件为 Noto Serif SC 可变字体，经 `pyftsubset` 按当前公开文案裁切后本地打包。

公开构建会读取主文件和补充文件的真实字形范围，并检查所有已生成公开页面。以后新增公开文案如有缺字，构建会直接报出具体字符；补充字库后，还要同步更新 `BaseLayout.astro` 中对应的 `unicode-range`。动态访客输入不必强行纳入此子集。

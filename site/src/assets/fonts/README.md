# 品牌字体

- 字体：Noto Serif SC（思源宋体同源的简体中文宋体），Google Fonts 提供。
- 常用文件：`noto-serif-sc-base.woff2`，可变字重 200–900，约 133 KB，覆盖首页和常用字符；首页只需下载这一份。
- 扩展文件：`noto-serif-sc-extended.woff2`，同源同字重，约 119 KB，覆盖其他公开页新增字符。通过不重叠的 `unicode-range` 按需加载。
- 原字库：`noto-serif-sc-brand.woff2`，约 687 KB，仅作为本地重新裁切的来源保留，不再被公开页面引用或打包。
- 补充文件：`noto-serif-sc-brand-supplement.woff`，可变字重 200–900，约 7 KB；只补充后来公开文案新增、主文件尚未包含的“困、室、搞、暗、玩”。它与主文件同源，浏览器只在页面出现这些字时按需加载。
- 子集覆盖界面常用汉字、标点，以及当前已公开档案题名与说明中的汉字；用于品牌名称、标题和公开页正文。元数据、表单和按钮改用系统无衬线字体。
- 未收入子集的生僻字会回退到系统宋体，不在访客浏览时调用 Google 服务。
- 品牌名称使用 700 字重，首页副标题使用 500 字重。字体随网站本地构建打包。
- 使用 SIL Open Font License 1.1。完整授权文件随网站分发于 `site/public/fonts/OFL.txt`，公开路径 `/fonts/OFL.txt`。
- 字体原项目：https://github.com/google/fonts/tree/main/ofl/notoserifsc
- 获取日期：2026-09-20。源文件为 Noto Serif SC 可变字体，经 `pyftsubset` 按当前公开文案裁切后本地打包。

公开构建会读取常用、扩展和补充文件的真实字形范围，并检查所有已生成公开页面。以后新增公开文案如有缺字，构建会直接报出具体字符。动态访客输入不必强行纳入此子集。

## 后续维护

通常直接在 `site/` 执行 `npm run build`。只有公开文案新增了缺失字符，才需要重新裁切：

1. 在 `site/` 执行 `npm run astro -- build`，先生成最新页面文字。
2. 在项目根目录运行 `python -X utf8 site/scripts/subset-public-fonts.py`。该工具使用本机现有 FontTools 和 Node 内置压缩能力，不安装新的依赖；自动更新两份字库与 `brand-subsets.css` 的字符范围。
3. 再在 `site/` 执行正式 `npm run build`，确认字形覆盖和公开内容检查全部通过。

原字库和五字补充文件保持不变，授权文件继续随公开网站分发。字库均本地提供，不增加外部字体请求。

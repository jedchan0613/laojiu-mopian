"""按首页拆分同源字体，同时保留原字库完整覆盖；不新增网站运行依赖。

先生成 site/dist，再用已有的 FontTools 和 Node.js 执行本工具。
原字体保留不改；生成首页常用字、原字库剩余字两个 WOFF2 子集及 CSS。
"""

import argparse
import html
import re
import shutil
import subprocess
import sys
import types
from pathlib import Path


parser = argparse.ArgumentParser()
parser.add_argument("--node", default=shutil.which("node"))
args = parser.parse_args()
if not args.node:
    raise SystemExit("需要已有的 Node.js 才能处理 Brotli 压缩。")

# FontTools 已在本机使用过；用 Node 内置编解码器补足本机缺少的 Python Brotli。
# 数据通过管道传递，不写临时字体、不安装软件，也不请求外部字体服务。
def codec(data, compress=False):
    operation = "brotliCompressSync" if compress else "brotliDecompressSync"
    options = ",{params:{[z.constants.BROTLI_PARAM_MODE]:z.constants.BROTLI_MODE_FONT}}" if compress else ""
    program = (
        "const z=require('node:zlib');const chunks=[];"
        "process.stdin.on('data',c=>chunks.push(c));"
        "process.stdin.on('end',()=>process.stdout.write(z."
        + operation + "(Buffer.concat(chunks)" + options + ")));"
    )
    return subprocess.run([args.node, "-e", program], input=data, capture_output=True, check=True).stdout


bridge = types.ModuleType("brotli")
bridge.decompress = lambda data: codec(data)
bridge.compress = lambda data, **options: codec(data, compress=True)
bridge.MODE_FONT = 2
sys.modules["brotli"] = bridge

from fontTools import subset
from fontTools.ttLib import TTFont

site_root = Path(__file__).resolve().parent.parent
font_root = site_root / "src" / "assets" / "fonts"
source = font_root / "noto-serif-sc-brand.woff2"
homepage_path = site_root / "dist" / "index.html"
if not homepage_path.is_file():
    raise SystemExit("请先生成公开页面，再裁切字体。")

# 保留脚本中动态出现的中文文案，避免轮播、搜索、读图操作后缺字。
def characters(markup):
    return {ord(char) for char in html.unescape(markup)}


available = set(TTFont(source).getBestCmap())
homepage = homepage_path.read_text(encoding="utf-8")
base = (characters(homepage) | set(range(32, 127))) & available
# 程序部署接入服务器正式档案；它们不一定与本地样例相同。
# 扩展字库不能只取本地页面文字，否则会删掉服务器仍在使用的字形。
# 按需加载仍然保留，同时两份字体的并集完整继承原字库覆盖。
extended = available - base
if not base or base & extended or base | extended != available:
    raise SystemExit("字体拆分必须完整保留原字库，且两份字符范围不得重叠。")


def unicode_range(points):
    ranges = []
    for point in sorted(points):
        if ranges and point == ranges[-1][1] + 1:
            ranges[-1][1] = point
        else:
            ranges.append([point, point])
    return ", ".join(f"U+{start:X}" if start == end else f"U+{start:X}-{end:X}" for start, end in ranges)


styles = ["/* 由 scripts/subset-public-fonts.py 生成，原字体保持不变。 */"]
for name, points in [("base", base), ("extended", extended)]:
    font = TTFont(source)
    options = subset.Options()
    options.name_IDs = ["*"]
    options.layout_features = ["*"]
    cutter = subset.Subsetter(options=options)
    cutter.populate(unicodes=points)
    cutter.subset(font)
    font.flavor = "woff2"
    filename = f"noto-serif-sc-{name}.woff2"
    font.save(font_root / filename)
    styles.append(
        "@font-face {\n"
        "  font-family: 'LJM Brand Serif';\n"
        f"  src: url('./{filename}') format('woff2');\n"
        "  font-style: normal;\n  font-weight: 200 900;\n  font-display: swap;\n"
        f"  unicode-range: {unicode_range(set(font.getBestCmap()))};\n"
        "}\n"
    )
    print(f"{name}: {len(points)} 字形，{(font_root / filename).stat().st_size} 字节")
# 服务器新增公开原文需要的同源补充字库也随项目维护；重新拆分不能丢掉接入。
public_supplement = font_root / "noto-serif-sc-public-supplement.woff2"
supplement_points = set(TTFont(public_supplement).getBestCmap()) - available
styles.append(
    "@font-face {\n"
    "  font-family: 'LJM Brand Serif';\n"
    "  src: url('./noto-serif-sc-public-supplement.woff2') format('woff2');\n"
    "  font-style: normal;\n  font-weight: 200 900;\n  font-display: swap;\n"
    f"  unicode-range: {unicode_range(supplement_points)};\n"
    "}\n"
)
print(f"public supplement: {len(supplement_points)} 字形，{public_supplement.stat().st_size} 字节")
(font_root / "brand-subsets.css").write_text("\n\n".join(styles) + "\n", encoding="utf-8")

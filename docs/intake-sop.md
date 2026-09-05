# 真实藏品入站流程

本流程用于把一件真实藏品整理成“老旧默片”网站可使用的发布层资料。网站项目不是档案主库，原始档案、高清主档和完整敏感资料始终保存在项目之外的独立本地档案系统中。

## 一、固定 11 步流程

以后每件真实藏品依次执行：

1. **确定永久编号**：按照 `LJM-YYYYMMDD-TYP-NNN` 分配 `item_id`。
2. **制作发布副本**：在项目之外从主档另行制作压缩、必要脱敏的 JPEG 副本，不修改唯一主档。
3. **创建 inbox 目录**：创建 `public-assets/inbox/永久编号/`。
4. **放入规范图片**：使用 `front-public.jpg`、`back-public.jpg` 和必要的 `detail-01-public.jpg`。
5. **创建 metadata JSON**：复制 `archive-data/metadata-template.json` 为 `archive-data/永久编号.json`。
6. **填写元数据**：填写 `core`，并按 `object_type` 选择正确的对象专属 `metadata.schema`。
7. **Codex 隐私检查**：检查字段、图片、目录、命名、敏感风险和 schema 对应关系，不猜测身份或模糊文字。
8. **用户人工确认**：用户明确决定是否允许正式入站；没有明确确认时必须停止。
9. **Codex 正式入站**：只把审核通过的发布副本复制到 `site/public/archive/永久编号/`，把确认后的数据加入网站，并设置 `use_status = U3`。
10. **build 检查**：在 `site/` 执行项目现有的正式 `build` 命令，失败时安全修复后重试。
11. **浏览器人工验收**：用户检查列表、详情页、图片、公开文字、搜索和筛选结果。

任一步出现敏感内容、字段冲突、图片疑似主档、资料不完整或无法确定的情况，都必须暂停，不得自动发布。

## 二、永久编号

正式格式：

```text
LJM-YYYYMMDD-TYP-NNN
```

- `LJM`：老旧默片项目永久前缀。
- `YYYYMMDD`：材料的接收或获得日期，不是照片拍摄、书写、发行、签发或邮寄日期。
- `TYP`：Excel `04_代码字典` 中的对象类型代码。
- `NNN`：同一接收日期、同一对象类型下从 `001` 开始的三位顺序号。

例如 `LJM-20260808-PST-001` 表示 2026 年 8 月 8 日接收的明信片类第 001 件对象。

正式对象类型：

| 代码 | 类型 | 专属 schema |
| --- | --- | --- |
| `PHO` | 照片正片 | photo |
| `NEG` | 底片 | photo |
| `SLD` | 反转片 | photo |
| `ALB` | 相册 | photo |
| `PCD` | 照片明信片 | postcard |
| `PST` | 明信片 | postcard |
| `DIA` | 日记 | diary_notebook |
| `NTB` | 笔记本 | diary_notebook |
| `IDC` | 证件 | credential |
| `CRD` | 商业与服务卡片 | card |
| `LET` | 信件 | common |
| `RPR` | 复制件 | common |
| `OTH` | 其他 | common |

永久编号一旦正式建立，原则上不得修改、不得复用，也不因日后分类或研究结论改变而重新编号。网站 URL、图片目录、JSON 和网站数据使用同一个 `item_id`。编号只使用英文字母、数字和短横线，不写人物姓名。

旧 `FSA` 规则已停用；历史说明见 `docs/coding-standard.md`。

## 三、待入站区与图片

`public-assets/inbox/` 只接收已经筛选、压缩并在需要时完成脱敏的“网站发布副本”。它不是主档存储位置。

目录示例：

```text
public-assets/inbox/LJM-20260808-PST-001/
├── front-public.jpg
├── back-public.jpg
├── detail-01-public.jpg
└── detail-02-public.jpg
```

- `front`：正面。
- `back`：背面。
- `detail`：局部细节，多张时用两位顺序号。
- `public`：网站发布副本标记，但不能代替隐私检查。

规则：

1. 发布图片优先使用 JPEG 和 `.jpg`。
2. 不得放入 TIFF、RAW、DNG、PSD、原始扫描件、唯一主档或名称含 `master` 的文件。
3. 图片进入 inbox 前必须完成必要遮盖。
4. 不修改、覆盖或替换唯一主档。
5. 发布副本不能依靠文件名保存重要元数据。
6. 永久编号写入数据并作为目录名，不把人物、地点、年代等说明塞进文件名。

## 四、发布层 metadata JSON

`archive-data/metadata-template.json` 只用于网站发布层。模板分成：

```text
core         通用管理元数据
metadata     对象专属描述元数据
public_view  访客可见文字投影
```

### `core` 模板字段

| 字段 | 用途 |
| --- | --- |
| `record_status` | 档案记录状态。模板默认 `SUS`（暂停），正式有效记录为 `ACT`。 |
| `item_id` | 永久编号，使用 `LJM-YYYYMMDD-TYP-NNN`。 |
| `batch_id` | 同一批材料的批次编号。规则未确认时不得猜填。 |
| `accession_date` | 实物接收或获得日期，格式 `YYYY-MM-DD`。 |
| `object_type` | 对象类型正式代码。 |
| `title` | 适合公开的题名。 |
| `date_display` | 必填。访客看到的材料年代原始表达，例如“约1985年”；同时作为收藏品编码第二段。无法判断时填写“年代未知”。 |
| `privacy_level` | 隐私等级 `G`、`Y`、`R`；模板默认 `Y`，必须人工复核。 |
| `rights_status` | 权利状态；模板默认 `UNK`（权利不明）。 |
| `research_status` | 研究状态；模板默认 `R0`（未开始）。 |
| `evidence_level` | 证据等级 `A/B/C/D`；模板默认 `D`（未知）。 |
| `evidence_basis` | 证据依据，事实、推测与未知必须区分。 |
| `digitization_status` | 数字化状态；模板默认 `DG0`。 |
| `transcription_status` | 转录状态；模板默认 `TX0`（不适用），有文字时按实际状态调整。 |
| `use_status` | 使用状态；模板默认 `U0`，候选可用 `U1`，用户批准发布后才用 `U3`。 |
| `publication_file_path` | 通过检查的网站发布图片路径数组，不得指向主档。 |

### `metadata` 模板字段

| 字段 | 用途 |
| --- | --- |
| `schema` | 根据 `object_type` 选择 `photo`、`postcard`、`diary_notebook`、`credential`、`card` 或 `common`。 |
| `dimensions` | 对应 schema 的专属维度对象。没有资料时不编造；未知和不适用按附件规则区分。 |

### `public_view` 模板字段

| 字段 | 用途 |
| --- | --- |
| `description` | 适合公开的客观简介。 |
| `transcription` | 已检查和必要脱敏的访客版转录。 |
| `tags` | 搜索和筛选用的公开标签数组。 |

作品内容地点不再单独维护展示字段：只填写 `core` 的国家、省级、市级、区县、街道/乡镇、具体地点（必要时加地点说明），公开页的地点文字、地点筛选和“按地点浏览”全部由这组字段自动推导。结构化地点字段同样不得包含精确私人住址。

模板不包含身份证号码、银行卡号、电话、精确私人住址、完整签名或医疗信息，因为这些内容不应进入网站发布数据。

## 五、对象专属维度选择

- `PHO/NEG/SLD/ALB` 使用 D01-D21。
- `PST/PCD` 使用 PC01-PC21。
- `DIA/NTB` 使用 DN01-DN21。
- `IDC` 使用 ID01-ID21。
- `CRD` 使用 CD01-CD21。
- `LET/RPR/OTH` 使用 `common`，不得伪造专属维度。

完整维度定义见 `docs/metadata-dimensions.md` 和 `site/src/data/standards/*-dimensions.json`。

## 六、发布门槛

待入站资料默认保持 `record_status = SUS`、`privacy_level = Y`、`evidence_level = D`、`use_status = U0`。

进入人工批准环节前，至少必须：

- 字段和目录相互一致。
- 图片确认为发布副本。
- 完成 `docs/privacy-checklist.md`。
- `privacy_level = G`。
- `record_status = ACT`。
- 候选状态使用 `use_status = U1`，不能提前写 `U3`。
- `CRD` 还必须填写 `CD21.redaction_status`；只有 `RD-CLEAR`、`RD-MASK` 或 `RD-PART` 可以进入发布流程。

只有用户明确批准后，Codex 才能复制文件到网站公开目录，并把 `use_status` 改为 `U3`。`Y`、`R` 或任何无法确认的情况都必须暂停。

## 七、发布后的检查

正式入站后必须检查：

- 永久编号、URL、JSON、图片目录完全一致。
- 列表页只统计满足公开条件的记录。
- 详情页图片和公开文字正常。
- 搜索至少覆盖标题、`item_id`、对象类型、年代显示、地点、描述、转录和标签。
- 类型、年代、地点和标签筛选正常。
- 在 `site/` 执行正式 `npm run build` 成功。

不得修改项目之外的档案主库。

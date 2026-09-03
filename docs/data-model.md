# 老旧默片数据模型

## 1. 规范来源与适用范围

当前正式数据规范来源为 `docs/reference/archive-metadata-standard-v1.xlsx`。网站不使用数据库，档案发布层继续由 TypeScript 和 JSON 文件管理。

本项目不是档案主库。数据文件只能保存适合网站使用的发布层资料，不能保存原始 TIFF、RAW、主档路径、完整证件号码、完整私人地址、签名、指纹或医疗信息。

## 2. 双层数据结构

每件档案使用两层档案元数据：

```text
ArchiveItem
├── core                 通用管理元数据
└── metadata             按对象类型选择的专属描述元数据
    ├── photo
    ├── postcard
    ├── diary_notebook
    ├── credential
    └── common           暂无专属 schema 的类型
```

网站另有 `public_view`，只负责保存适合访客阅读的简介、标签、地点显示、公开转录和按图片顺序对应的 `image_descriptions`。图片说明是发布层的可访问性文字，不改变图片文件或档案主数据。`public_view` 是档案数据的显示投影，不是第三套档案元数据，也不能代替 `core` 或对象专属维度。

## 3. 通用管理元数据 `ArchiveItemCore`

`ArchiveItemCore` 对应 Excel 的 `02_档案台账`、`03_字段说明` 和 `04_代码字典`，项目共读取到 86 个通用字段定义。主要分区如下：

| 分区 | 主要内容 |
| --- | --- |
| 身份与管理 | `record_status`、`item_id`、`collection_code`、`batch_id`、`accession_date`、`object_type`、`item_seq`、`title` |
| 时间 | 必填显示年代、起止日期、判断说明 |
| 地点 | 地点代码、国家、省、市、区县、街道、具体地点和说明 |
| 人物与机构 | 人物、关系、身份、机构及权威编号 |
| 内容分类 | 事件/场景、主题、照片功能、拍摄形式、摄影来源 |
| 载体与工艺 | 载体、色彩、工艺、尺寸 |
| 背面与标记 | 背面信息、印章、标记及逐字转录 |
| 来源与关系 | 获得方式、来源、组合、相册、系列和关联单件 |
| 保存状态 | 保存等级、问题和处理说明 |
| 权限与研究 | 隐私、权利、研究状态、证据等级和依据 |
| 数字文件 | 数字化、转录、备份、发布副本和校验和 |
| 利用与保管 | 使用状态、项目、出处、物理保管和维护日期 |

TypeScript 定义位于 `site/src/data/archive-schema.ts`，Excel 原始字段定义位于 `site/src/data/standards/common-fields.json`。

Excel 标记为必填但旧记录暂缺的字段，不得为了通过检查而编造。迁移时可暂缺，并在下一次人工整理中补齐。

`collection_code` 是只读派生字段：第一段是 `04_代码字典` 中的正式 `object_type` 对象类型代码，第二段是基本信息中必填的 `date_display` 显示年代，随后按 Excel 打勾维度顺序组合能够匹配正式代码字典的必填属性代码。显示年代会去除空格，并把斜线、下划线等分隔符规范为短横线；正式字典代码去掉第一个短横线及其前缀后进入收藏品编码。各段之间用 `_` 连接，同一维度多个代码用 `+` 连接。编码不包含永久编号和维度编号，会随对象类型、显示年代及确定属性更新，不能代替永久编号，也不允许手工维护。

## 4. 对象类型与专属 schema

| `object_type` | 对象 | 使用的专属 schema |
| --- | --- | --- |
| `PHO`、`NEG`、`SLD`、`ALB` | 照片正片、底片、反转片、相册 | `PhotoMetadata`，D01-D21 |
| `PST`、`PCD` | 明信片、照片明信片 | `PostcardMetadata`，PC01-PC21 |
| `DIA`、`NTB` | 日记、笔记本 | `DiaryNotebookMetadata`，DN01-DN21 |
| `IDC` | 证件 | `CredentialMetadata`，ID01-ID21 |
| `LET` | 信件 | 仅通用管理元数据；待定义专属 schema |
| `RPR` | 复制件 | 仅通用管理元数据；待定义专属 schema |
| `OTH` | 其他 | 仅通用管理元数据；待定义专属 schema |
| `card` | 旧卡片 / 信用卡 | 旧有待扩展类型，仅通用管理元数据；正式对象代码和专属 schema 待定义 |

不能把四套共 84 个专属维度全部平铺到所有对象。`ArchiveItem` 通过 `core.object_type` 和 `metadata.schema` 建立对应关系。

### 4.1 公开网站访客分类

公开网站首页和档案筛选使用 `site/src/data/archive-categories.ts` 中的七个访客分类。访客分类由 `core.object_type` 自动推导，例如 `PST` 和 `PCD` 都归入“明信片”，`PHO`、`NEG`、`SLD`、`ALB` 都归入“老照片”。

访客分类不是新的档案字段，也不保存到 `core`、`metadata` 或 `public_view`。本地管理入口继续维护正式精确类型和对应 schema；档案详情页继续显示精确类型。这样可以让公开导航保持简单，同时避免建立一套与 Excel 规范冲突的数据分类。

## 5. 代码值与原始文字分开

代码用于一致录入和检索，原始文字用于保存材料实际表达。两者不得互相覆盖。

```ts
{
  place_code: 'PL-CN-GD-FS-CC',
  city: '佛山',
  district: '禅城',
  date_display: '约1985年',
  event_scene: ['EV-WRK']
}
```

网站向访客显示时优先读取正式代码字典的中文标签，例如把 `EV-WRK` 显示为“劳动/工作”，数据内部仍保留 `EV-WRK`。

## 6. 多值、未知与不适用

- Excel 中允许多值的字段，在 TypeScript 和 JSON 中使用数组，例如 `event_scene: ['EV-WRK', 'EV-POR']`。
- 只有导出 CSV/Excel 时，才按来源规范转换为英文分号分隔。
- 附件已提供未知代码时，使用正式未知代码，例如 `EV-UNK`、`FN-UNK`、`PS-UNK`、`PC-UNK`、`MK-UNK` 和证据等级 `D`。年代无法判断时，在必填的显示年代中填写“年代未知”。
- 不适用的字段可以省略。不得用“未知”代替“不适用”，也不得用空字符串代替附件已经定义的未知值。
- 没有资料时不得编造日期、地点、人物、邮路、来源或历史结论。

## 7. 发布判断

网站当前只公开同时满足以下条件的记录：

- `record_status = ACT`：记录有效。
- `privacy_level = G`：隐私检查通过。
- `use_status = U3`：用户已批准并正式发布。

`Y` 和 `R` 不得默认公开。`U1` 只表示候选，不等于已经发布。

## 8. 证件敏感字段

`CredentialMetadata` 支持 ID01-ID21，但网站发布层必须遵守：

- 证件号码只能使用 `document_number_masked`。
- 地址只能使用 `address_masked`。
- 完整号码、完整私人地址、完整签名和指纹不得进入网站数据。
- `signatures` 和 `fingerprints` 在网站 TypeScript schema 中被明确禁止赋值。
- 证件默认按高隐私风险处理，完成逐项遮盖和人工确认前不得公开。

## 9. 文件关系

- `site/src/data/archive-schema.ts`：TypeScript 数据类型和对象类型路由。
- `site/src/data/archive.ts`：当前正式发布记录。
- `site/src/data/standards/common-fields.json`：86 个通用字段定义。
- `site/src/data/standards/*-dimensions.json`：四套 21 维定义。
- `site/src/data/standards/code-dictionary.json`：正式代码字典。
- `site/src/data/standards/collection-code-rules.json`：Excel 打勾必填维度、可编码字段和收藏品编码顺序。
- `archive-data/metadata-template.json`：单件档案发布层入站模板。
- `samples/archive-test-data.ts`：迁移后的虚构测试资料，不参与正式网站统计。

永久编号规则见 `docs/coding-standard.md`，84 个维度见 `docs/metadata-dimensions.md`，代码字典见 `docs/code-dictionary.md`。

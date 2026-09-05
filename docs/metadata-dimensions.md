# 老旧默片对象专属维度

## 1. 来源与保存方式

五套对象专属维度来自 `docs/reference/archive-metadata-standard-v1.xlsx`：

- `01_21照片维度`：照片 D01-D21。
- `05_明信片维度`：明信片 PC01-PC21。
- `06_日记笔记维度`：日记/笔记 DN01-DN21。
- `07_证件维度`：证件 ID01-ID21。
- `08_旧卡片维度`：旧卡片 CD01-CD21。

本次共读取 5 套、105 个维度。每个维度在 `site/src/data/standards/` 对应 JSON 中完整保存：

- `dimension_code`
- `name`
- `fields`
- `code_structure`
- `rule`
- `example`
- `multi_value_rule`
- `uncertainty_rule`
- `register_mapping`
- `notes`

以下表格用于快速查阅名称。具体字段、规则、多值、不确定性、台账映射和备注以对应 JSON 及 Excel 原文为准。

## 2. 必填维度与收藏品编码

基本信息中的 `date_display` 显示年代对所有类型必填，并固定作为 `collection_code` 第二段。Excel 新增的 `是否确认唯一属性编码（必填）` 列是对象专属必填依据；打勾维度中能匹配 `04_代码字典` 的字段会集中放在管理页最前面，逐个设为必填，并进入后续编码段。打勾但没有正式字典值的维度随后排在普通可选维度前面，要求至少填写一项，但不自行创造代码。照片 D01 和证件 ID05 的年代要求由基本信息中的显示年代统一满足。

| 对象 | 打勾的必填维度 | 进入收藏品编码的正式代码字段 |
| --- | --- | --- |
| 照片 | D01、D02、D06、D07、D12、D15、D16、D17 | D06 `themes`；D07 `photo_function`；D12 `verso_types`；D16 `condition_grade`、`condition_details`；D17 `privacy_level` |
| 明信片 | PC01、PC02、PC04、PC07、PC12、PC19、PC21 | PC01 `postcard_type`；PC02 `postcard_function`；PC12 `themes`、`event_scene`；PC19 `postal_mark_types`；PC21 `postcard_use` |
| 日记/笔记 | DN01、DN08、DN10、DN11、DN14、DN19 | DN01 `notebook_type`；DN11 `themes`；DN19 `notebook_completeness` |
| 证件 | ID01、ID02、ID05、ID09、ID10、ID16、ID20 | ID01 `credential_type`；ID09 `portrait_status`；ID16 `carrier`、`color`、`process`；ID20 `credential_status` |
| 旧卡片 | CD01、CD02、CD12、CD16、CD17、CD20 | CD01 `card_type`；CD02 `card_functions`；CD12 `card_status`；CD16 `carrier`、`color`；CD17 `card_technologies`；CD20 `card_completeness`、`condition_grade`、`condition_details` |

完整的机器可读规则保存在 `site/src/data/standards/collection-code-rules.json`。

现有代码字典已补齐旧卡片参与编码的正式代码。根据 2026-08-29 的录入规则调整，明信片 PC11 和 PC18 改为非必填；其他类型仍无正式字典值表的必填维度及待定义内容见 `docs/missing-required-code-definitions.md`。

## 3. 照片 D01-D21

适用于 `PHO`、`NEG`、`SLD`、`ALB`，TypeScript 类型为 `PhotoMetadata`。

| 代码 | 名称 | 代码 | 名称 |
| --- | --- | --- | --- |
| D01 | 年代/时间 | D12 | 背面信息 |
| D02 | 地域/地点 | D13 | 印章/标记 |
| D03 | 人物 | D14 | 来源/流传经历 |
| D04 | 机构/单位 | D15 | 原始组合关系 |
| D05 | 事件/场景 | D16 | 保存状态 |
| D06 | 主题 | D17 | 隐私等级 |
| D07 | 照片功能 | D18 | 研究状态 |
| D08 | 拍摄形式 | D19 | 证据等级 |
| D09 | 摄影来源 | D20 | 数字化状态 |
| D10 | 载体/工艺 | D21 | 作品使用状态 |
| D11 | 尺寸/规格 |  |  |

## 4. 明信片 PC01-PC21

适用于 `PST`、`PCD`，TypeScript 类型为 `PostcardMetadata`。

| 代码 | 名称 | 代码 | 名称 |
| --- | --- | --- | --- |
| PC01 | 明信片类别 | PC12 | 图像主题/画面内容 |
| PC02 | 原始功能/场合 | PC13 | 出版/发行机构 |
| PC03 | 制作/发行时间 | PC14 | 印刷/制造机构 |
| PC04 | 书写时间 | PC15 | 摄影者/画家/设计者 |
| PC05 | 寄递时间序列 | PC16 | 印刷工艺/色彩 |
| PC06 | 图像地点 | PC17 | 版式/尺寸 |
| PC07 | 寄出地 | PC18 | 邮票 |
| PC08 | 收件地/收件地址 | PC19 | 邮戳/邮政标记 |
| PC09 | 寄件人 | PC20 | 语言/文字与正文转录 |
| PC10 | 收件人 | PC21 | 邮寄/使用状态与邮路 |
| PC11 | 通信关系/关联机构 |  |  |

制作/发行、书写、寄发、经转和到达时间必须分开。图像地点、寄出地点和收件地点也必须分开，不能用一个通用地点覆盖。

## 5. 日记/笔记 DN01-DN21

适用于 `DIA`、`NTB`，TypeScript 类型为 `DiaryNotebookMetadata`。

| 代码 | 名称 | 代码 | 名称 |
| --- | --- | --- | --- |
| DN01 | 册簿类别 | DN12 | 事件/生活阶段 |
| DN02 | 内容时间范围 | DN13 | 条目组织结构 |
| DN03 | 日期连续性/记录频率 | DN14 | 装帧/物理结构 |
| DN04 | 作者/记录者 | DN15 | 页码/页数/使用范围 |
| DN05 | 所有者/使用流转 | DN16 | 书写媒介/颜色 |
| DN06 | 涉及人物与关系 | DN17 | 插页/附件/夹藏物 |
| DN07 | 涉及机构/单位 | DN18 | 批注/修改/书写层 |
| DN08 | 书写/事件地点 | DN19 | 完整性/缺失情况 |
| DN09 | 语言/文字/书写方向 | DN20 | 可读性/转录状态 |
| DN10 | 内容体裁 | DN21 | 敏感内容/访问分区 |
| DN11 | 主题 |  |  |

册簿必须保留原始页序、条目结构、不同书写层、附件关系和敏感页码范围，不能退化为一段普通 `transcription`。

## 6. 证件 ID01-ID21

适用于 `IDC`，TypeScript 类型为 `CredentialMetadata`。

| 代码 | 名称 | 代码 | 名称 |
| --- | --- | --- | --- |
| ID01 | 证件类别 | ID12 | 地址/户籍/单位 |
| ID02 | 证件功能/使用场景 | ID13 | 隶属/级别/类别 |
| ID03 | 签发机构 | ID14 | 语言/文字 |
| ID04 | 签发辖区/地点 | ID15 | 版式/尺寸/页数 |
| ID05 | 签发/登记日期 | ID16 | 载体/材料/色彩 |
| ID06 | 有效期 | ID17 | 印刷/安全特征 |
| ID07 | 持证人 | ID18 | 印章/签名/指纹 |
| ID08 | 证件号码 | ID19 | 签注/变更/注销痕迹 |
| ID09 | 证件照片/肖像状态 | ID20 | 证件状态/完整性 |
| ID10 | 个人属性 | ID21 | 敏感等级/公开副本处理 |
| ID11 | 职业/资格/身份 |  |  |

网站发布层只能保存遮盖后的 `document_number_masked`、`address_masked` 等字段。完整证件号码、完整私人地址、签名和指纹不得进入网站数据。

## 7. 旧卡片 CD01-CD21

适用于 `CRD`，TypeScript 类型为 `CardMetadata`。

| 代码 | 名称 | 代码 | 名称 |
| --- | --- | --- | --- |
| CD01 | 卡片类别 | CD12 | 卡片状态 |
| CD02 | 原始功能/使用场景 | CD13 | 卡面图像/主题 |
| CD03 | 发行/制作时间 | CD14 | 语言/文字与转录 |
| CD04 | 有效期 | CD15 | 版式/尺寸 |
| CD05 | 发行机构 | CD16 | 载体/材料/色彩 |
| CD06 | 品牌/商户/服务网络 | CD17 | 机读/储存技术 |
| CD07 | 发行地/适用地区 | CD18 | 防伪/签名/肖像状态 |
| CD08 | 持卡人/使用人 | CD19 | 卡套/附件/原始组合 |
| CD09 | 卡号/账号 | CD20 | 完整性/保存状态 |
| CD10 | 面值/余额/权益 | CD21 | 敏感内容/公开处理 |
| CD11 | 使用痕迹 |  |  |

网站发布层只能保存遮盖后的 `holder_name_masked`、`card_number_masked`；卡号最多保留末四位。完整姓名、卡号、账户、安全码、密码、磁条/芯片数据和签名内容不得进入项目。`CD21.redaction_status` 未确认时不得发布。

## 8. 未提供专属 21 维的类型

`LET`、`RPR`、`OTH` 当前只使用通用管理元数据。项目不会为这些类型伪造不存在的专属维度。

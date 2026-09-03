# 老旧默片代码字典

## 1. 正式来源

代码字典唯一正式来源为 `docs/reference/archive-metadata-standard-v1.xlsx` 的 `04_代码字典` 工作表。网站可读取的数据文件为：

`site/src/data/standards/code-dictionary.json`

本次读取结果：36 个字典键、255 条代码、255 条均为启用状态。

每条数据完整保存：`dictionary_key`、`dimension_category`、`code`、`label`、`definition`、`field`、`input_mode`、`enabled`、`sort`。

## 2. 字典项目统计

| 字典键 | 维度/类别 | 条数 |
| --- | --- | ---: |
| `record_status` | 档案状态 | 3 |
| `object_type` | 资料类型 | 12 |
| `event_scene` | 事件/场景 | 15 |
| `theme` | 主题 | 15 |
| `photo_function` | 照片功能 | 9 |
| `shot_form` | 拍摄形式 | 8 |
| `photography_source` | 摄影来源 | 5 |
| `carrier` | 载体 | 8 |
| `color` | 色彩 | 4 |
| `process` | 工艺 | 8 |
| `verso` | 背面信息 | 8 |
| `mark` | 印章/标记 | 8 |
| `acquisition` | 来源/获得方式 | 8 |
| `condition` | 保存等级 | 5 |
| `damage` | 保存问题 | 12 |
| `privacy` | 隐私等级 | 3 |
| `rights` | 权利状态 | 5 |
| `research_status` | 研究状态 | 5 |
| `evidence` | 证据等级 | 4 |
| `digitization` | 数字化状态 | 5 |
| `transcription` | 转录状态 | 4 |
| `backup` | 备份状态 | 4 |
| `use_status` | 作品使用状态 | 5 |
| `postcard_type` | 明信片类别 | 9 |
| `postcard_function` | 明信片功能 | 8 |
| `postcard_use` | 明信片使用状态 | 5 |
| `postal_mark` | 邮政标记 | 8 |
| `notebook_type` | 日记/笔记类别 | 10 |
| `entry_structure` | 条目结构 | 6 |
| `writing_medium` | 书写媒介 | 7 |
| `notebook_completeness` | 册簿完整性 | 5 |
| `credential_type` | 证件类别 | 11 |
| `portrait_status` | 证件照片状态 | 5 |
| `security_feature` | 安全/认证特征 | 8 |
| `credential_status` | 证件状态 | 6 |
| `redaction_status` | 公开副本处理 | 4 |

合计 255 条。

## 3. 使用规则

- 页面、搜索、筛选、详情展示和以后录入校验应复用同一份代码字典，不能在组件内另外维护冲突的中文名称。
- 网站向普通访客优先显示 `label`，必要时同时显示 `code`。
- 数据内部必须保存 `code`，不能只保存中文标签。
- 代码一旦进入正式档案，不修改旧代码或旧含义；需要扩展时新增代码。
- 多值代码在 TypeScript/JSON 中使用数组；导出表格时再转换为英文分号分隔。
- 没有出现在 Excel 中的代码不能根据前缀猜测补齐。

## 4. 当前未覆盖的前缀

部分维度表提到的结构，例如 `EF-*`、`JG-*`、`BD-*`、`LG-*`、`CF-*` 以及书写层 `L1/L2`，在当前 `04_代码字典` 中没有对应完整值表。项目只保留维度定义和原始文字字段，不自行发明这些代码；等来源 Excel 增补后再加入字典。

`card` 同样没有正式 `object_type` 代码，暂列待扩展类型。

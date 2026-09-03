# 必填维度缺少代码字典定义清单

## 一、核对结论

依据 `docs/reference/archive-metadata-standard-v1.xlsx` 的四个对象维度页和 `04_代码字典` 重新核对：

- 基本信息中的 `date_display` 已作为所有类型共用的必填编码字段，不使用代码字典；此外已有 21 个参与收藏品编码的专属字段能可靠匹配现有代码字典：照片 6 个、明信片 6 个、日记/笔记 3 个、证件 6 个。
- 这些字段在维护页中使用明确的字典键：单值字段显示下拉，多值字段显示代码选项列表。照片 D17 `privacy_level` 由草稿和正式发布流程自动维护，显示字典参照但不允许在属性页手工绕过隐私状态。
- 根据 2026-08-29 的录入规则调整，明信片 PC11 和 PC18 已改为非必填；当前仍有 9 个必填维度没有可直接使用的正式字典值表。项目不能根据示例前缀自行创造代码，因此暂时保留日期、文本或编号输入。

| 对象 | 已匹配的参与编码字段 |
| --- | --- |
| 照片 | D06 `themes`；D07 `photo_function`；D12 `verso_types`；D16 `condition_grade`、`condition_details`；D17 `privacy_level` |
| 明信片 | PC01 `postcard_type`；PC02 `postcard_function`；PC12 `themes`、`event_scene`；PC19 `postal_mark_types`；PC21 `postcard_use` |
| 日记/笔记 | DN01 `notebook_type`；DN11 `themes`；DN19 `notebook_completeness` |
| 证件 | ID01 `credential_type`；ID09 `portrait_status`；ID16 `carrier`、`color`、`process`；ID20 `credential_status` |

## 二、照片：2 类待定义

| 维度 | 当前字段 | Excel 结构 | 当前缺少的定义 |
| --- | --- | --- | --- |
| D02 地域/地点 | `country`、`province`、`city`、`district`、`street_town`、`specific_place` | 地点原文 | 当前只提供省、市、区名称参照，不生成地点代码；历史地名和具体地点继续保留原文。 |
| D15 原始组合关系 | `batch_id`、`collection_id`、`album_id`、`series_id`、`original_position`、`related_item_ids` | `B/C/A/S/Item` | 这些是每批、每组或每件产生的编号，不是有限枚举。需要确定编号生成规则、必填层级，以及是否需要“关系类型”字典。 |

补充缺口：D16 的 `condition_details` 已匹配 `damage` 字典，但现有值只有各种损坏类型，没有“无明显问题/不适用”代码。由于该字段现在参与编码且为必填，需要你决定新增一个正式代码，或明确规定在保存等级为 `C0` 时允许该字段为空。

## 三、明信片：2 类待定义

| 维度 | 当前字段 | Excel 结构 | 当前缺少的定义 |
| --- | --- | --- | --- |
| PC04 书写时间 | `writing_date`、`writing_date_text` | `YYYY-MM-DD / 原文` | 这是日期值和原文，不是现有代码字典枚举。收藏品编码已经统一包含基本信息中的显示年代，因此书写日期不再另作代码段；如以后需要更细日期编码，应在 Excel 中单独定义。 |
| PC07 寄出地 | `dispatch_place` | 地点原文 | 当前保留寄出地点原文，不生成地点代码。 |

## 四、日记/笔记：3 类待定义

| 维度 | 当前字段 | Excel 结构 | 当前缺少的定义 |
| --- | --- | --- | --- |
| DN08 书写/事件地点 | `writing_place`、`mentioned_places` | 地点原文 | 当前保留书写地点和涉及地点原文，不生成地点代码。 |
| DN10 内容体裁 | `content_genres` | `JG-*` | Excel 给出了 `JG-*` 前缀和示例，但 `04_代码字典` 没有任何 `JG-*` 值。需要补齐体裁代码、中文名称和使用边界。 |
| DN14 装帧/物理结构 | `binding_type`、`cover_material`、`leaf_structure` | `BD-* + 描述` | Excel 给出了 `BD-*` 前缀，但没有装帧值表；封面材料和页叶结构也没有对应字典。需要分别确认哪些字段采用代码、哪些保留描述。 |

## 五、证件：2 类待定义

| 维度 | 当前字段 | Excel 结构 | 当前缺少的定义 |
| --- | --- | --- | --- |
| ID02 证件功能/使用场景 | `credential_function` | `CF-*` | Excel 给出了 `CF-*` 前缀，但 `04_代码字典` 没有任何 `CF-*` 值。需要补齐身份识别、通行、配给、就业、学习、执业、会员等功能代码及边界。 |
| ID10 个人属性 | `birth_date`、`sex_text`、`nationality`、`other_attributes` | 原文 + 规范值 | 现有字典没有性别、国籍或其他属性值表；出生日期本身不适合固定下拉。需要决定允许公开和参与编码的具体字段，并分别定义规范值，避免把不必要的敏感信息写入公开层。 |

## 六、你补充定义时需要提供的列

如果决定在 Excel 的 `04_代码字典` 中补充值，请按现有表头提供：

1. `字典键`
2. `维度/类别`
3. `值代码`
4. `中文名称`
5. `定义与使用边界`
6. `适用字段`
7. `录入形式`：`单值下拉` 或 `可多值;`
8. `启用`
9. `排序`

补充后，维护页可以继续按正式字典自动生成下拉或多选代码列表；在 Excel 正式定义前，项目不会自行补造代码。

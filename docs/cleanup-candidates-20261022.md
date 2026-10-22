# 2026-10-22 生成产物清理清单与执行结果

用户已明确批准按本清单直接删除。2026-10-22 19:21执行完成：19个目录均已删除，逻辑文件大小合计2,654,508,142B（约2.65GB）；C盘采样空闲字节从171,261,337,600变为173,958,717,440，增加2,697,379,840B（约2.70GB，包含其他进程影响，不全归因于本次）。不经过回收站，可按下述保留输入重建。

删除前后20,612份保留文件（逻辑共6,289,783,040B）的SHA256清单一致，0新增/丢失/变化；9条链接不跟随。校验覆盖旧主工作区的项目内档案/源发布图/响应图输入/草稿/历史等，以及outputs中未删除的恢复、输入与记录。只保存校验值，没有新增业务备份；项目外原始主库未访问。实际记录在`outputs/optimization-20261022/cleanup-result.json`及`protected-after.json`。

范围仅限旧代码工作区 `C:\Users\35171\Documents\BaiduSyncdisk\laojiu-mopian` 内的以下19个生成目录；当前GitHub工作区不在删除范围。估计文件逻辑大小合计约2.65GB，实际释放空间执行后测量，不把它当精确NTFS占用。

| 旧工作区内的相对路径 | 拟删除目录 | 原因/保留内容 |
| --- | --- | --- |
| `site` | `dist`、`node_modules`、`.astro` | 旧入口已停止使用；保留源码、锁文件、档案、发布源图及响应图 |
| `outputs/thai-20261015/stage-current/site` | `dist`、`.astro` | 保留源码、词典、图片输入、before、其他stage和恢复材料 |
| `outputs/album-release-20261015-v2/site` | `dist`、`.astro` | 保留发布输入、源码、审核与恢复材料 |
| `outputs/album-review-20261014/fixture/site` | `dist`、`.astro` | 保留fixture源码、数据、图片输入及before |
| `outputs/security-phase1-20261018-synthetic/workspace/site` | `dist`、`.astro` | 保留合成输入和验收证据 |
| `outputs/mobile-maintenance-stage1/workspace/site` | `dist`、`.astro` | 保留合成输入和验收证据 |
| `outputs/mobile-maintenance-stage2/workspace/site` | `dist`、`.astro` | 保留合成输入和验收证据 |
| `outputs/mobile-maintenance-stage3/workspace/site` | `dist`、`.astro` | 保留合成输入和验收证据 |
| `outputs/mobile-maintenance-stage4/workspace/site` | `dist`、`.astro` | 保留合成输入和验收证据 |

核对情况：19个目录本身及内部没有链接；9个dist的相邻site均有package、锁文件、源码和archive数据，所含网页发布图片在相邻public输入中均存在（没有缺失源图）。4173未发现监听，本轮代码测试使用新GitHub工作区，不依赖旧目录。执行前还会重查目录边界、链接和占用。

不删除：任何`archive-data`、`public-assets/inbox`、发布源图、响应图输入、私密账号/投稿、草稿、历史、回收区、脱敏前后材料、译文审核决定、恢复包、before和`local-preview-backups`。不把整个outputs或整个作业目录当缓存，不触碰项目外主库。

影响与恢复：上述生成目录拟直接删除（不经过回收站），源码和输入仍保留；需要旧构建时可按原锁文件重装依赖、重新运行build。不能保证重新生成的时间戳或依赖下载可用性与旧文件完全相同。百度同步可能将此次生成目录删除传播到其他设备，应确认其他设备不再依赖这些旧产物。

执行前后只保存校验清单和结果，不为本轮新增业务资料备份；先核对受保护文件摘要，再记录文件删除和实际空间变化。详细逐目录字节清单位于新工作区`outputs/optimization-20261022/local-cleanup-inventory.json`，源图输入核验在`candidate-inputs.json`。

服务器不在此删除清单内：目前仅约108MiB npm缓存可重建且后续部署仍会用，暂不为小收益清空；现行三版本保留、私密业务目录与恢复证据全部保留。新产生的隔离构建在验收结束后，沿明确边界单独收尾。

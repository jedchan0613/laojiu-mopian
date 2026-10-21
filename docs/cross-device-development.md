# Windows 与 Mac 的安全协作方式

## 从现在起使用哪个目录

Windows 新代码目录：`C:\Users\35171\Documents\GitHub\laojiu-mopian`。它不在百度云同步盘中，Git对象是独立副本，不使用旧目录的硬链接或依赖目录。

旧目录 `C:\Users\35171\Documents\BaiduSyncdisk\laojiu-mopian` 完整保留，包含原有本地档案、发布图片、草稿及历史。本次不移动、删除或覆盖其中的真实资料。不要继续在旧目录提交代码，也不要将两份代码目录重新放回同步盘。Git忽略规则不能控制百度云是否同步文件。

新目录是**代码工作区，不是已迁移的本地档案库**。本次没有复制账号数据库、草稿、待入站区或正式发布图片；不要直接在这里启动真实档案管理/发布。隔离测试使用合成资料，线上部署使用服务器自身179件公开资料。本地真实资料若以后需要迁移，应另做一致性备份与核对，不能用源码中的142件本地快照覆盖服务器。

在GitHub Desktop中使用“添加本地仓库”选择新目录；在Codex中也应打开新目录。当前聊天的目录不会因此自动改变。本次未操作你的应用设置或替你切换已有聊天。

本机Git直连GitHub被重置，但Windows原有本机代理`localhost:15236`仍在监听并可访问GitHub。新仓库仅配置自己使用该现有代理，不修改系统/全局代理、不关闭TLS校验。以后代理程序未运行时应先检查连接，不强制推送或把Mac套用成Windows端口。

## Mac 的处理

当前没有连接到Mac，因此不能宣称Mac对象库或依赖已经修好。不要在旧百度云仓库中反复还原、清缓存或强制推送。先保留Mac未提交修改，再到同步盘之外新建独立仓库，例如“个人文件夹/Developer/laojiu-mopian”。

GitHub可访问时：

```bash
mkdir -p "$HOME/Developer"
git clone https://github.com/jedchan0613/laojiu-mopian.git "$HOME/Developer/laojiu-mopian"
cd "$HOME/Developer/laojiu-mopian"
git fsck --full --no-reflogs --no-dangling
npm ci --prefix site
node site/scripts/check-source-integrity.mjs
node --test local-admin/tests/*.test.mjs
```

目标目录已存在时先停止并核对，不删除或覆盖。`npm ci`只安装现有锁文件中的依赖，让Mac取得自己的二进制；不要复制Windows的`node_modules`。Mac缺少Caddy时相关测试会明确跳过，真实缓存验收由现有Linux服务器隔离环境执行，不为消除跳过而安装新服务。

如果Mac仍无法访问GitHub，可用本次准备的单文件Git恢复包离线克隆。恢复包是固定版本的传输文件，不是让百度云实时同步`.git`目录。验证文件摘要后，在不存在的新目录执行 `git clone /实际位置/laojiu-mopian-main.bundle "$HOME/Developer/laojiu-mopian"`，再将origin设为上述GitHub地址，按同样方法安装现有依赖和检查。恢复包不包含账号、草稿或原始主库。

## 日常规则

1. 开始修改前先检查工作区和同步Git；有未提交修改先保留，不使用强制覆盖或硬重置。
2. 每次只在一台电脑上修改同一阶段，完成测试、提交并推送后，再换另一台电脑拉取。
3. `.git`、`node_modules`、构建缓存、运行数据库和草稿不在两台电脑间实时同步。档案主库仍独立保存，真实资料保持原有隐私与入站规则。
4. 新增源码检查在正式build开始前拒绝百度云冲突副本、上传中标记及未完成的Git合并；管理全量测试也执行同一检查。
5. 服务器发布必须继承服务器当前资料，并通过全量测试、正式build和公开隔离检查。待审译文不随程序提交自动批准。

# 架构说明

## 整体形状

整个应用是「一个 IIFE + 一份全局状态 + 一组渲染函数」。没有模块系统、没有路由、没有虚拟 DOM，所有代码在 `app.js` 里按「基础状态 → 存储 → 权限 → 工具 → 各功能模块 → 视图事件 → 启动」的顺序线性排列，行号即章节号。

```
index.html            静态骨架：登录门、五个 view、若干 dialog、两个隐藏 file input
styles.css            屏幕样式 + 打印样式（@page 由 JS 在运行时注入 #printStyle）
vendor/qrcode.js      QR 码生成（同步、无依赖）
vendor/jsQR.js        二维码解码（无 BarcodeDetector 时的回退）
app.js                全部业务逻辑
build-standalone.mjs  把上述文件内联成单个 HTML
```

数据流是单向的：

```
localStorage ──readStore()/normalize()──> 全局变量（assets / counts / users / …）
                                              │
                        ┌─────────────────────┴─────────────────────┐
                        │                                           │
                  用户操作（bind 里的事件）                    渲染函数读变量生成 HTML
                        │                                           │
                  修改全局变量 ──persist()──> localStorage      innerHTML 写回 DOM
```

没有双向绑定，也没有 diff：任何变更都改内存变量，然后调 `persist()` 落盘、调 `renderAll()` 或某个局部 `render*()` 整体重绘。

## 模块划分

| 模块 | 位置 | 关键函数 | 职责 |
| --- | --- | --- | --- |
| 基础状态 | `app.js:4` | 常量区 | 6 个 `localStorage` 键名、角色与状态枚举、字段中文名、18 套内置模板、全局可变状态（当前用户、勾选集合、预览页码与缩放、扫码状态等） |
| 存储 | `app.js:68` | `readStore`、`persist`、`saveUsers`、`saveTemplates`、`normalize` | 读写 JSON、容错降级；`normalize()` 在启动与恢复备份后重建对象并修补旧数据 |
| 登录与权限 | `app.js:118` | `findUser`、`isAdmin`、`isStaff`、`visibleAssets`、`visibleCounts`、`ensureAdminAccount`、`doLogin`、`doLogout`、`showGate`、`afterLogin`、`nextAssetId` | 校验账号、写会话、按角色过滤数据与显隐按钮、首次运行时创建默认管理员 |
| 通用工具 | `app.js:188` | `esc`、`toast`、`fmtTime`、`dayStamp`、`safeFileName`、`findAsset`、`tryFixUtf8` | HTML 转义、提示条、时间格式化、文件名清洗、按编号查资产、修复乱码编码 |
| CSV | `app.js:224` | `toCsv`、`parseCsv`、`exportAssetsCsv`、`importCsv` | 带 BOM 的 CSV 导出（Excel 友好）、手写解析器（支持引号与转义）、表头别名映射 |
| 二维码与模板 | `app.js:269` | `qrSvg`、`allTemplates`、`findTemplate`、`readFormTemplate`、`applyTemplateToForm`、`selectTemplate`、`saveAsTemplate`、`deleteTemplate` | 生成 SVG 二维码；模板读表单、选中、另存、删除；内置与自定义模板合并查找 |
| 标签渲染与打印 | `app.js:396` | `getLabelAssets`、`buildLabelHtml`、`renderLabelPreview`、`stdPrint` | 按模板与范围取资产，生成六种版式的标签 HTML，计算分页并注入 `@page`，走浏览器标准打印 |
| 直连打印机 | `app.js:601` | `printerGeometry`、`buildPrinterCommand`、`serialConnect`、`serialPrint` | Web Serial 打开端口，按 DPI 换算坐标，拼 TSPL / ZPL 指令逐张发送 |
| 资产台账 | `app.js:680` | `filteredAssets`、`renderOptions`、`renderAssets`、`openAssetDialog`、`saveAsset`、`deleteAsset`、`openQr` | 搜索与筛选、表格渲染、表单增改、删除时同步清理盘点记录 |
| 照片压缩与上传 | `app.js:828` | `compressImage`、`uploadPhoto`、`handlePhotoFile`、`renderPhoto`、`openPhoto` | 文件 → 等比缩放 → 逐级降质量到目标体积 → `PUT uploads/`，失败则保留 dataURL |
| 备份与恢复 | `app.js:947` | `backup`、`restore`、`loadDemo` | 导出整库 JSON、整体替换式恢复、载入示例数据 |
| 盘点 | `app.js:1031` | `scopeAssets`、`startCount`、`renderCountRun`、`renderChecklist`、`handleCode`、`finishCount`、`renderHistory`、`showResult`、`exportResult` | 范围快照、实时进度、扫码去重与越界判断、结束生成记录、导出盘亏 CSV |
| 摄像头 | `app.js:1188` | `initCameraEls`、`startCamera`、`stopCamera`、`scanLoop` | 优先用 `BarcodeDetector`，缺失时用 jsQR 逐帧解码，1.5 秒内重复码忽略 |
| 人员管理 | `app.js:1346` | `renderUsers`、`openUserDialog`、`saveUser`、`deleteUser` | 账号增删改、防止删除当前账号、保证至少一个管理员 |
| 视图与事件 | `app.js:1413` | `renderAll`、`switchView`、`bind` | 标签页切换、集中绑定全部 DOM 事件、关闭 dialog 的通用处理 |
| 启动 | `app.js:1601` | 顶层执行 | 初始化摄像头元素、创建默认管理员、绑定事件、按会话决定进入入口还是登录门 |

几个值得注意的实现点：

- **所有插入 HTML 的变量都过 `esc()`**，包括属性值（如 `data-id="…"`）。这是纯 `innerHTML` 拼接方案的安全底线。
- **渲染是整体重绘**。`renderAssets()` 会重建整张表格，勾选状态存在 `selected` 这个 `Set` 里，重绘后按集合回填，因此不需要保留 DOM 引用。
- **打印不是截图**。`buildLabelHtml()` 生成真实 DOM，打印时给 `body` 加 `.printing`，CSS 只显示 `#labelSheet`，`@page` 尺寸与边距来自当前模板，因此输出是矢量文字和 SVG 二维码。
- **照片压缩是自适应的**。`compressImage()` 先按长边 640px 等比缩放，再以 0.62 起步逐轮降质量，质量到底后按 0.8 缩尺寸，最多 10 轮，直到小于 40KB；每次重绘前铺白底，避免 JPEG 无透明通道导致发黑。
- **上传失败不影响保存**。`handlePhotoFile()` 在上传失败时把 dataURL 留在 `pendingPhoto` 里，页面提示「暂存本机」，台账照常保存，只是照片不再跨设备可见。

## 为什么不用框架

- **零构建是核心卖点**。目标用户是「把文件夹丢到服务器就能用」的人。引入 React/Vue 就必然带来 `node_modules`、打包步骤和版本升级压力，而单文件版本还要把整个运行时内联进去，体积从 444KB 涨到 1MB 以上。
- **功能边界清晰**。五个视图、一张主表、若干弹窗，状态总量小，整体重绘的代价可以接受（几百行表格在毫秒级）。虚拟 DOM 的优势在这里体现不出来。
- **寿命优先**。原生 API 十年不变，框架的 breaking change 三年一轮。这类内部小工具往往几年才有人维护一次，减少依赖就是减少腐化速度。
- **离线分发**。单文件版本要能在没有网络、没有 Node 的机器上双击运行，任何运行时依赖都必须内联，这在工程上是不划算的。

代价也要说清楚：整体重绘会丢失输入框焦点（因此表单放在 `dialog` 里，只在打开时初始化）、没有组件复用（相同的表格渲染代码在台账与盘点清单里各写一遍）、事件全部集中绑定（`bind()` 有 170 多行）。

## 为什么用 localStorage

**收益**：

- 没有任何服务端依赖，部署就是传文件，不需要数据库、迁移脚本、备份任务。
- 数据留在用户自己的设备上，不经过网络，隐私边界清晰。
- 同步 API，读写不需要 `async`，代码路径简单，出错可以直接 `try/catch` 降级。

**代价**：

- 容量约 5MB，dataURL 照片几张就能占满，所以才有「压缩到 40KB + 上传服务器」这套组合拳。
- 按源隔离：换浏览器、换设备、清理缓存都会丢数据，只能靠备份 JSON 迁移。
- 没有并发控制：两个标签页同时编辑会互相覆盖，后写入的赢。
- 没有事务：`persist()` 分别写两个键，极端情况下（配额写满）可能出现资产写成功、盘点记录写失败。
- 无法做真正的权限控制：登录门是前端逻辑，`staff` 的可见范围只是渲染层过滤。

如果未来要多端同步或多用户协作，正确的做法是保留现有数据结构不变，把 `readStore` / `persist` 换成网络后端（接口契约就是 `docs/DATA-MODEL.md` 里的对象），而不是在前面加一层「同步服务」硬凑。是否值得这么做，取决于是否真的需要多人共享同一份台账——目前的设计假设是「一份台账、一台设备、一个人维护」。

## 扩展点

- **新增标签模板**：往 `PRESET_TEMPLATES` 加一项，见 `CONTRIBUTING.md` 的示例。
- **新增标签版式**：在 `buildLabelHtml()` 里加一个 `style` 分支，并在 `styles.css` 中补对应的 `.label.style-xxx`。
- **新增字段**：需要同时改 `FIELD_LABELS`、`FIELD_SHORT`、表单、`CSV_HEADERS` / `CSV_MAP`、`normalize()`、备份格式与 `docs/DATA-MODEL.md`。
- **替换存储层**：`readStore`、`persist`、`saveUsers`、`saveTemplates` 是唯一直接触碰 `localStorage` 的地方（另有 `KEY_ACTIVE_TPL` 与 `KEY_SESSION` 的零散读写），改这四个函数即可换成 IndexedDB 或远程 API。

# 资产管理（Asset Manager）

A single-page asset ledger and stocktaking app written in plain JavaScript. No framework, no build step, no npm dependencies — open `index.html` and it runs. Assets, stocktakes, label templates and accounts live in `localStorage`; photos are compressed in the browser and uploaded with a plain HTTP `PUT`. Includes QR label printing with 18 built-in templates and camera / serial-barcode stocktaking.

**仓库**：[github.com/yongsjp41-crypto/asset-manager](https://github.com/yongsjp41-crypto/asset-manager) · **在线演示**：[yongsjp41-crypto.github.io/asset-manager](https://yongsjp41-crypto.github.io/asset-manager/) · **许可证**：[MIT](LICENSE) · **当前版本**：1.0.0

## 项目简介

面向小型团队和行政、IT 资产管理的轻量工具。目标是「拷过去就能用」：把目录放到任意静态站点，或用 `node build-standalone.mjs` 打成单个 HTML 文件，双击打开即可建档、打印二维码标签、用手机或扫码枪盘点。没有服务端、没有数据库、没有账号体系依赖，代价是所有数据都绑在当前浏览器上，靠备份文件迁移。

适合的场景：几十到几百件固定资产的日常登记与年度盘点、需要贴标签但没有资产系统的团队、内网离线环境。

## 功能特性

| 模块 | 能力 |
| --- | --- |
| 资产台账 | 编号、名称、分类、位置、保管人、状态（在用 / 闲置 / 维修 / 报废）、备注、照片；增删改查、关键词搜索、按状态与位置筛选、批量勾选 |
| 资产照片 | 前端 Canvas 压缩，长边上限 640px、目标约 40KB（JPEG 质量 0.62 逐级降到 0.32，仍超标再缩尺寸）；上传服务器或离线存为 dataURL；支持大图查看 |
| 标签打印 | QR 码生成；18 套内置模板（A4 不干胶 2/3/4/5 列、热敏 30×20 / 40×60 / 50×30 / 60×40 多版式、90×55 资产卡片）；自定义尺寸、列数、边距、二维码大小、字号、字段、边框、版式；打印预览分页与缩放 |
| 直连打印机 | Web Serial 直发 TSPL / ZPL 指令，可设波特率与 DPI |
| 扫码盘点 | 摄像头扫码（原生 `BarcodeDetector`，回退 jsQR）+ 手动输入；USB 扫码枪可用键盘模拟模式在输入框直接录入；重复与越界提示、声音与震动反馈 |
| 盘点清单 | 实时进度、已盘 / 未盘 / 全部筛选、盘亏清单 |
| 盘点记录 | 历史批次留存，差异明细，导出 CSV |
| 人员管理 | `admin` / `staff` 两种角色；`staff` 仅能看到保管人为本人的资产 |
| 数据迁移 | 整库 JSON 备份与恢复；CSV 导入导出 |

## 界面与技术栈

界面是单页五标签结构：顶部为品牌区与「备份数据 / 恢复数据 / 使用说明」，下方为「资产台账 / 扫码盘点 / 盘点记录 / 标签打印 / 人员管理」，台账用表格承载，其余为卡片式面板；标签打印页左侧是模板选择与参数表单，右侧是等比例的纸张预览。整体是浅色卡片风格，主色由 `:root` 里的 CSS 变量统一定义，改几个变量就能换配色；暂未适配系统深色模式。

技术栈刻意保持最小：

- 原生 ES5 风格 JavaScript，IIFE 包裹，无模块打包，无 polyfill 依赖。
- 原生 DOM 操作与 `innerHTML` 模板拼接，统一经 `esc()` 转义。
- CSS 变量主题 + 打印专用 `@page` 规则（运行时按模板注入）。
- `localStorage` 持久化，`dialog` 元素承载弹窗，`FileReader` + Canvas 处理照片。
- 唯一的运行时依赖是两个本地第三方库，已随仓库分发。

## 快速开始

先拿到代码：

```bash
git clone https://github.com/yongsjp41-crypto/asset-manager.git
cd asset-manager
```

也可以直接在仓库页面点 **Code → Download ZIP** 下载。

### 方式一：直接打开

下载仓库后双击 `index.html`。台账、标签打印、备份恢复均可使用；摄像头扫码与照片上传受 `file://` 限制，通常不可用。

### 方式二：打成单文件

```bash
node build-standalone.mjs
```

生成 `资产管理.html`（当前约 444KB），样式、脚本、二维码库全部内联，可直接发给别人或拷到离线机器，双击使用。该产物已被 `.gitignore` 忽略，不入库。

### 方式三：本地静态服务

```bash
python3 -m http.server 8000
# 或：npx serve .
```

访问 `http://localhost:8000`。`localhost` 属于安全上下文，摄像头与串口可用。

首次打开会自动创建管理员账号 `admin` / `admin123`，登录后请立刻在「人员管理」中修改密码。想先看效果可以在台账页点「载入示例数据」，或导入 `examples/sample-backup.json` 体验完整数据。

## 部署

作为纯静态站点，任意 Web 服务器都能托管。Nginx 的完整示例（HTTPS、`/uploads/` 的 WebDAV `PUT`、体积与后缀限制、HSTS、缓存策略）见 [docs/DEPLOY.md](docs/DEPLOY.md)，文末附 Apache 与 Caddy 的最小等价配置。

部署时注意两点：站点必须能通过 HTTPS 访问，否则摄像头与串口不可用；资产照片上传依赖对 `/uploads/` 的 `PUT` 支持，未配置时页面会提示「上传失败，暂存本机」，功能降级但不影响台账。

### GitHub Pages 在线演示

在线演示：**<https://yongsjp41-crypto.github.io/asset-manager/>**

仓库已启用 GitHub Pages，构建来源为 GitHub Actions（`.github/workflows/pages.yml`）。向 `main` 推送或手动触发 `workflow_dispatch` 会自动更新演示站。如果 fork 到自己的账号，在 **Settings → Pages → Source** 选择 **GitHub Actions** 即可启用。

需要说明的是：Pages 是纯静态托管，不支持 `PUT` 上传，因此演示站上的照片只会存进访问者自己浏览器的 localStorage；每个访问者的数据也各自独立、互不可见，适合演示而不适合当作共享台账使用。

## 数据存储与迁移

所有业务数据保存在当前浏览器的 `localStorage`，共 6 个键：

| 键 | 内容 |
| --- | --- |
| `am.assets.v1` | 资产数组 |
| `am.stocktakes.v1` | 盘点记录数组 |
| `am.templates.v1` | 自定义标签模板数组 |
| `am.template.active` | 当前模板 ID（纯字符串，非 JSON） |
| `am.users.v1` | 账号数组（含明文密码） |
| `am.session.v1` | 登录会话对象 |

字段级说明见 [docs/DATA-MODEL.md](docs/DATA-MODEL.md)。

迁移与保命建议：换电脑、换浏览器、清理缓存之前，用顶部「备份数据」导出 JSON；到新环境后用「恢复数据」导入。备份文件是明文，包含账号密码，请按敏感文件保管。恢复会覆盖当前全部资产与盘点记录，操作前有二次确认。

## 浏览器兼容性

| 能力 | 要求 |
| --- | --- |
| 基础功能（台账、标签、备份） | 支持 `dialog`、`XMLHttpRequest`、Canvas 的现代浏览器；Chrome / Edge 90+、Safari 15.4+、Firefox 98+ |
| 摄像头扫码 | 需 HTTPS 或 `localhost`；`BarcodeDetector` 缺失时回退 jsQR（仅识别二维码） |
| 一维条码识别 | 依赖浏览器原生 `BarcodeDetector`，目前 Chrome / Edge 支持较好 |
| Web Serial（标签打印机直连） | 仅 Chromium 内核（Chrome / Edge），且需 HTTPS 或 `localhost` |
| 照片上传 | 不能是 `file://` 协议 |

## 目录结构

```
asset-manager/
├── index.html                 页面结构（五个视图 + 若干 dialog）
├── app.js                     全部业务逻辑，IIFE 包裹，约 1620 行
├── styles.css                 界面与打印样式，CSS 变量主题
├── build-standalone.mjs       单文件构建脚本（零依赖）
├── vendor/
│   ├── qrcode.js              QRCode Generator for JavaScript（MIT）
│   └── jsQR.js                jsQR（Apache-2.0）
├── examples/
│   └── sample-backup.json     可直接导入的示例备份
├── docs/
│   ├── DEPLOY.md              部署与安全加固
│   ├── DATA-MODEL.md          localStorage 数据结构
│   ├── ARCHITECTURE.md        模块划分与设计取舍
│   └── screenshots/           截图说明
├── .github/
│   ├── workflows/             CI 与 GitHub Pages 部署
│   ├── ISSUE_TEMPLATE/        Issue 表单
│   └── PULL_REQUEST_TEMPLATE.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── LICENSE
└── package.json               仅用于 scripts 与元信息，无运行时依赖
```

注意：`资产管理.html` 是构建产物，被 `.gitignore` 忽略，不要提交；`vendor/` 下的两个库必须保留原始版权头。

## 已知限制与安全提示

这是给可信环境用的单机工具，不是多租户系统。以下都是设计取舍，不是待修复的缺陷：

- 账号密码以明文存放在 `am.users.v1`，浏览器开发者工具可直接读取；会话也存在 `localStorage`。
- 没有后端鉴权。页面部署到公网后，任何人打开都能看到登录门，而登录门只是前端逻辑，数据本身仍在访问者自己的浏览器里。
- 数据不跨设备同步。同一台机器的不同浏览器、不同用户配置之间互不可见。
- 多标签页同时编辑会互相覆盖，没有并发控制与冲突合并。
- 刷新页面需要重新登录：会话对象会写入 `am.session.v1`，但启动时的读取函数只接受数组，因此登录态不会自动恢复。
- 照片上传接口没有内置鉴权与限速，必须由部署方在 Web 服务器或反向代理层补齐，且应限制为图片后缀与合理体积。
- 打印排版依赖浏览器打印引擎，不同浏览器的默认边距可能造成轻微偏移，正式打印前先用「打印测试页」校准。

安全策略与漏洞报告流程见 [SECURITY.md](SECURITY.md)。

## 贡献

欢迎提 Issue 与 PR。开发前请读 [CONTRIBUTING.md](CONTRIBUTING.md)：不需要安装依赖，改完 `index.html` / `app.js` / `styles.css` 刷新即可；提交前跑 `npm run check` 与 `npm run build` 自测。参与即表示同意遵守 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。

## 许可证

[MIT](LICENSE)，Copyright (c) 2026 yongsjp41-crypto。

## 第三方致谢

- [QRCode Generator for JavaScript](https://github.com/kazuhikoarase/qrcode-generator) — Copyright (c) 2009 Kazuhiko Arase，MIT 许可，见 `vendor/qrcode.js` 文件头。
- [jsQR](https://github.com/cozmo/jsQR) — Apache-2.0 许可，见 `vendor/jsQR.js`。按 Apache-2.0 要求，再分发时需保留版权与许可声明，修改过的文件需注明。
- 「QR Code」是 DENSO WAVE INCORPORATED 的注册商标。

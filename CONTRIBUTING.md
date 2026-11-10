# 贡献指南

感谢你愿意改进这个项目。这是一个刻意保持简单的纯前端应用，贡献的价值更多在于「把某件事做对」，而不是「引入更多技术」。

## 开发环境

不需要安装任何依赖，不需要打包器，不需要 `npm install`。

```bash
git clone <your-fork-url>
cd asset-manager
python3 -m http.server 8000   # 或 npx serve .
```

打开 `http://localhost:8000`，修改 `index.html`、`app.js`、`styles.css` 后刷新浏览器即可看到效果。

建议用 `localhost` 而不是双击文件：`file://` 下摄像头、串口、照片上传都会被浏览器限制，部分问题无法复现。

自测命令：

```bash
npm run check    # node --check app.js && node --check build-standalone.mjs
npm run build    # 生成 资产管理.html，确认单文件版仍可用
```

`资产管理.html` 是构建产物，已被 `.gitignore` 忽略，不要提交。

## 代码风格

- **保持 ES5 风格**：用 `var`、`function`、字符串拼接，避免箭头函数与可选链，避免为了新语法引入编译步骤。现有代码统一用 `function () {}`，请跟随。
- **不引入框架、不引入运行时依赖**。需要新库时先开 Issue 讨论，说明体积与许可证影响。
- **原生 DOM**：用 `$` / `$$` 选择器与 `innerHTML` 拼接，所有插入模板的变量必须经 `esc()` 转义，属性值也不例外。
- **状态集中在顶部变量**：新增持久化字段要同步改 `normalize()`、`persist()` 与备份/恢复逻辑，并更新 `docs/DATA-MODEL.md`。
- 缩进 2 空格，LF 换行，文件末尾留空行，UTF-8；`.editorconfig` 已配置。
- 中文与英文、数字之间加空格；注释写「为什么」，不写「是什么」。
- 不写没必要的防御性代码：内部函数之间的调用可以信任，只在用户输入、`localStorage`、网络响应这些边界做校验。
- 一个 PR 只做一件事。格式化、重命名、重构请与功能改动分开提交。

## 提交信息

采用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)，中文或英文均可，主题行不超过 72 字符：

```
feat: 标签模板支持自定义标题字体
fix: 盘点清单在筛选为空时仍显示表头
docs: 补充 Nginx WebDAV 部署示例
refactor: 抽出照片压缩的轮次上限常量
```

常用类型：`feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`chore`。破坏性变更在类型后加 `!` 并在正文说明影响。

## PR 流程

1. 先开 Issue 说明要解决的问题，避免大改动方向不一致。
2. 从 `main` 拉分支，命名如 `feat/custom-label-title`、`fix/checklist-empty`。
3. 提交前在本地跑通 `npm run check` 与 `npm run build`，并手工过一遍受影响的页面。
4. 提 PR 时填写模板：说明改了什么、为什么改、如何验证；涉及界面改动的请附截图（放 PR 描述里，不要提交图片文件到仓库）。
5. CI 会跑语法检查与构建校验，失败请先修复。
6. 合并由维护者执行，通常使用 squash merge。

## 如何新增一个标签模板

内置模板都在 `app.js` 顶部的 `PRESET_TEMPLATES` 数组里（约第 19 行）。加一项即可出现在「标签打印」的模板选择器里，无需改 HTML 或 CSS。

示例：新增一套 50×40mm 横版热敏标签，二维码在左、字段在右。

```js
{ id: 'p-50x40', name: '热敏标签 50×40mm', labelW: 50, labelH: 40, pageW: 50, pageH: 40,
  cols: 1, gap: 0, margin: 0, qr: 22, font: 8, layout: 'row', showQr: true, border: true,
  fields: ['id', 'name', 'location', 'keeper'] },
```

字段含义：

| 字段 | 说明 |
| --- | --- |
| `id` | 唯一标识，一经发布不要修改（`am.template.active` 会存它） |
| `name` | 显示名称，建议带上尺寸，便于区分 |
| `labelW` / `labelH` | 单张标签宽高，单位 mm |
| `pageW` / `pageH` | 纸张宽高，mm。等于标签尺寸且 `cols: 1`、`margin: 0` 时走单张连续纸模式 |
| `cols` | 每行标签数，1-10 |
| `gap` | 标签间距，mm |
| `margin` | 页边距，mm |
| `qr` | 二维码边长，mm |
| `font` | 正文字号，pt |
| `layout` | `'row'` 二维码在左、文字在右；`'column'` 二维码在上、文字在下 |
| `showQr` | 是否打印二维码 |
| `border` | 旧版边框开关；新模板建议改用 `frame` |
| `fields` | 要打印的字段，取值见 `FIELD_LABELS`：`id`、`name`、`category`、`location`、`keeper`、`status`、`note`，`id` 始终打印 |
| `style` | 可选，版式：`classic`（默认）、`center`、`hero`、`table`、`card`、`grid` |
| `frame` | 可选，边框：`none`、`dashed`、`solid`、`double` |
| `title` | 可选，标签顶部的标题文字 |

注意事项：

- `id` 不要与现有模板重复，也不要使用 `TPL` 前缀（自定义模板用 `TPL` + 时间戳）。
- 标签总宽 `cols * labelW + (cols - 1) * gap` 应不超过 `pageW - 2 * margin`，否则预览会给出超宽提示。
- 若新增 `style` 或 `frame` 取值，需同步修改 `buildLabelHtml()` 与 `styles.css` 中对应的 `.label` 类，并为 `tplThumb()` 的缩略图补上判断。
- 修改后请用 A4 与热敏两种纸张各打一次测试标签，并在 PR 里说明实测设备与打印结果。

## 文档与数据格式改动

改 `localStorage` 结构时，务必保持向后兼容：`normalize()` 里要为新增字段提供默认值，旧备份仍能导入。若确实需要破坏性变更，请同步更新 `docs/DATA-MODEL.md`、`examples/sample-backup.json` 与 `CHANGELOG.md`。

## 许可证

提交贡献即表示同意以 [MIT](LICENSE) 许可发布你的改动。

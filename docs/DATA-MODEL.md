# 数据结构

本文档描述应用在浏览器 `localStorage` 中的 6 个键，以及「备份数据」导出的 JSON 结构。所有字段均取自 `app.js` 的实际实现（`normalize()`、`persist()`、`backup()`、`restore()` 等函数），不是推测。

## 总览

| 键 | 形态 | 写入时机 | 读取方式 |
| --- | --- | --- | --- |
| `am.assets.v1` | JSON 数组 | 资产增删改后 `persist()` | `readStore()`，非数组则回退 `[]` |
| `am.stocktakes.v1` | JSON 数组 | 盘点开始 / 扫码 / 结束 / 删除后 `persist()` | 同上，回退 `[]` |
| `am.templates.v1` | JSON 数组 | 保存或删除自定义模板后 `saveTemplates()` | 同上，回退 `[]` |
| `am.template.active` | 纯字符串（非 JSON） | 切换模板时 `selectTemplate()` | `localStorage.getItem()` |
| `am.users.v1` | JSON 数组 | 账号增删改、首次创建管理员后 `saveUsers()` | `readStore()`，回退 `[]` |
| `am.session.v1` | JSON 对象 | 登录时写入，退出时删除 | `readStore()`（见下方已知问题） |

启动时 `normalize()` 会遍历资产、盘点记录与账号，逐条重建对象：**未列在下面的字段会被丢弃**，缺失字段用默认值补齐。这也是旧版本数据能继续使用的原因。

## am.assets.v1

资产数组。每条记录：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 资产编号，全局唯一，新增时预填 `ZC-<YYYYMMDD>-<三位流水号>`，可手动修改 |
| `name` | string | 资产名称，必填 |
| `category` | string | 分类 |
| `location` | string | 存放位置 |
| `keeper` | string | 保管人**姓名**，与 `am.users.v1` 里的 `name` 对应（不是 `username`） |
| `status` | string | 状态，取值 `在用` / `闲置` / `维修` / `报废`；缺失时补 `在用` |
| `note` | string | 备注 |
| `photo` | string | 空串、服务器相对路径 `uploads/<文件名>.jpg`、或离线兜底的 `data:image/jpeg;base64,...` |
| `createdAt` | number | 创建时间，毫秒时间戳 |

示例：

```json
{
  "id": "ZC-20261110-003",
  "name": "激光打印机",
  "category": "电子设备",
  "location": "2 楼文印室",
  "keeper": "王强",
  "status": "维修",
  "note": "卡纸，待厂家上门",
  "photo": "uploads/ZC-20261110-003-1762749600000.jpg",
  "createdAt": 1762749600000
}
```

注意：

- `id` 的比较区分大小写，扫码时会先精确匹配，再尝试忽略大小写匹配；照片文件名经过 `safeFileName()` 处理，会把 `\ / : * ? " < > |` 和空白替换为 `_`。
- 删除资产时，相关盘点记录里的 `expected` 与 `found` 会同步移除该编号，但服务器上的照片文件不会被删除。
- `dataURL` 形式的照片会占用 `localStorage` 配额（通常 5MB），几张就可能写满，生产环境请配置上传接口。

## am.stocktakes.v1

盘点记录数组，新的记录用 `unshift` 插到最前面。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 记录 ID，`CT` + 创建时间戳 |
| `name` | string | 盘点名称，默认「日期 + 盘点」 |
| `scope` | object | 盘点范围：`{ "field": "all" \| "location" \| "category" \| "status", "value": string }`，`all` 时 `value` 为空串 |
| `createdAt` | number | 开始时间，毫秒时间戳 |
| `finishedAt` | number \| null | 结束时间；`null` 表示进行中 |
| `expected` | string[] | 应盘资产编号列表，开始时按范围快照 |
| `found` | object[] | 已盘记录，每项 `{ "id": string, "at": number }` |
| `by` | string | 发起人的 `username`，可能为空串 |

示例：

```json
{
  "id": "CT1762753200000",
  "name": "2026-11 办公区盘点",
  "scope": { "field": "location", "value": "3 楼办公区" },
  "createdAt": 1762753200000,
  "finishedAt": 1762756800000,
  "expected": ["ZC-20261110-001", "ZC-20261110-002", "ZC-20261110-003"],
  "found": [
    { "id": "ZC-20261110-001", "at": 1762753260000 },
    { "id": "ZC-20261110-003", "at": 1762753320000 }
  ],
  "by": "admin"
}
```

约定与行为：

- 同一时刻只允许一条进行中的盘点。`normalize()` 发现多条 `finishedAt` 为 `null` 的记录时，会把除第一条之外的其余记录直接结束（`finishedAt` 置为各自的 `createdAt`）。
- 盘亏 = `expected` 中不在 `found` 里的编号。`found` 里的条目一定同时存在于 `expected`（扫码时越界资产会被拒绝）。
- 「放弃盘点」会直接删除该记录，不保留痕迹。

## am.templates.v1

用户自定义的标签模板数组。内置的 18 套模板写死在 `app.js` 的 `PRESET_TEMPLATES` 里，不存 `localStorage`；这个键只放用户另存的模板。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | `TPL` + 时间戳 |
| `name` | string | 模板名称 |
| `custom` | boolean | 固定为 `true`，用于区分内置模板并启用「删除模板」 |
| `labelW` / `labelH` | number | 单张标签宽高（mm） |
| `pageW` / `pageH` | number | 纸张宽高（mm） |
| `cols` | number | 每行标签数，1-10 |
| `gap` | number | 标签间距（mm） |
| `margin` | number | 页边距（mm） |
| `qr` | number | 二维码边长（mm） |
| `font` | number | 正文字号（pt） |
| `layout` | string | `row`（二维码在左）或 `column`（二维码在上） |
| `style` | string | 版式：`classic` / `center` / `hero` / `table` / `card` / `grid` |
| `title` | string | 标签顶部标题，可为空串 |
| `showQr` | boolean | 是否打印二维码 |
| `frame` | string | 边框：`none` / `dashed` / `solid` / `double` |
| `border` | boolean | 旧版边框开关，等于 `frame !== 'none'`，仅为兼容保留 |
| `fields` | string[] | 打印字段，首位固定 `id`，其余取自 `name`、`category`、`location`、`keeper`、`status`、`note` |

示例：

```json
{
  "id": "TPL1762756800000",
  "name": "热敏 50×30 · 自定义",
  "custom": true,
  "labelW": 50,
  "labelH": 30,
  "pageW": 50,
  "pageH": 30,
  "cols": 1,
  "gap": 0,
  "margin": 0,
  "qr": 18,
  "font": 8,
  "layout": "row",
  "style": "classic",
  "title": "资产管理",
  "showQr": true,
  "frame": "solid",
  "border": true,
  "fields": ["id", "name", "location"]
}
```

单张连续纸的判定条件是 `cols === 1 && pageW === labelW && pageH === labelH && margin === 0`，满足时每张标签独占一页。

## am.template.active

当前选中模板的 ID，**纯字符串**，不是 JSON：

```
p-a4-3
```

缺失或指向不存在的模板时回退到 `PRESET_TEMPLATES[0].id`（`p-a4-3`）。恢复备份时若 `activeTemplate` 找不到对应模板，同样回退。

## am.users.v1

账号数组。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `username` | string | 登录名，唯一 |
| `password` | string | 明文密码 |
| `name` | string | 显示姓名，同时用于和资产的 `keeper` 匹配 |
| `role` | string | `admin` 或 `staff`，其他值一律按 `staff` 处理 |
| `createdAt` | number | 创建时间，毫秒时间戳 |

示例：

```json
[
  {
    "username": "admin",
    "password": "admin123",
    "name": "管理员",
    "role": "admin",
    "createdAt": 1762749600000
  },
  {
    "username": "wangqiang",
    "password": "change-me",
    "name": "王强",
    "role": "staff",
    "createdAt": 1762753200000
  }
]
```

首次运行且数组中没有任何 `admin` 时，`ensureAdminAccount()` 会自动插入 `admin` / `admin123`。密码明文存储是已知设计限制，详见 `SECURITY.md`。

## am.session.v1

登录会话对象，写入后用于「记住当前登录人」。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `username` | string | 登录名 |
| `name` | string | 姓名快照 |
| `role` | string | 角色快照 |
| `loginAt` | number | 登录时间，毫秒时间戳 |

示例：

```json
{ "username": "admin", "name": "管理员", "role": "admin", "loginAt": 1762753200000 }
```

**已知问题**：启动时用 `readStore(KEY_SESSION, null)` 读取，而 `readStore()` 只接受数组（非数组一律返回 fallback），因此这个对象永远不会被读回，刷新页面后必定回到登录门。会话数据仍会写入并占用存储，退出登录时会被删除。改这一处需要同时调整 `readStore()` 的调用方式，属于行为变更，请按 Issue 流程讨论。

## 备份文件结构

「备份数据」导出的 JSON 是单个对象，`version` 当前为 `3`：

```json
{
  "app": "asset-manager",
  "version": 3,
  "exportedAt": "2026-11-10T08:00:00.000Z",
  "assets": [],
  "stocktakes": [],
  "labelTemplates": [],
  "activeTemplate": "p-a4-3",
  "users": []
}
```

| 字段 | 说明 | 恢复时是否必需 |
| --- | --- | --- |
| `app` | 固定 `asset-manager`，仅作标识 | 否 |
| `version` | 导出格式版本，当前 `3` | 否 |
| `exportedAt` | ISO 8601 时间字符串 | 否 |
| `assets` | 资产数组，结构同 `am.assets.v1` | **是**，缺失或非数组则拒绝导入 |
| `stocktakes` | 盘点记录数组 | 否，缺失则清空 |
| `labelTemplates` | 自定义模板数组 | 否，缺失则清空 |
| `activeTemplate` | 当前模板 ID | 否，无效则回退 `p-a4-3` |
| `users` | 账号数组 | 否；**是数组时才会覆盖**账号，并触发 `ensureAdminAccount()` |

恢复的行为细节：

1. 只校验 `Array.isArray(data.assets)`，随后有二次确认弹窗。
2. `assets`、`stocktakes`、`labelTemplates` 是整体替换，不是合并；恢复前请先导出当前数据。
3. 若备份里带了 `users` 且当前登录账号在新账号表中不存在，会立即退出登录。
4. 恢复后统一走 `normalize()`，因此备份中多余的字段会被丢弃，缺失字段用默认值补齐。

`examples/sample-backup.json` 是一份可直接导入的示例，**刻意省略了 `users` 字段**，这样导入时不会覆盖你现有的账号。

## 存储容量与清理

`localStorage` 的配额通常为 5MB（按源计算，字符数计），台账与盘点记录本身很小，真正的消耗者是 dataURL 形式的照片。判断方式：浏览器开发者工具 → Application → Local Storage 查看各键的体积。

清理建议：不要在开发者工具里手工改一半，容易造成引用不一致（例如盘点记录指向已删除的资产编号）。正确做法是导出 JSON、在本地编辑、再整体恢复，或直接用页面上的删除功能。

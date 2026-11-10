(function () {
  'use strict';

  /* ================= 基础状态 ================= */
  var KEY_ASSETS = 'am.assets.v1';
  var KEY_COUNTS = 'am.stocktakes.v1';
  var KEY_TEMPLATES = 'am.templates.v1';
  var KEY_ACTIVE_TPL = 'am.template.active';
  var KEY_USERS = 'am.users.v1';
  var KEY_SESSION = 'am.session.v1';
  var ROLES = { admin: '管理员', staff: '人员' };
  var STATUSES = ['在用', '闲置', '维修', '报废'];
  var FIELD_LABELS = { id: '资产编号', name: '资产名称', category: '分类', location: '位置', keeper: '保管人', status: '状态', note: '备注' };
  var FIELD_SHORT = { id: '编码', name: '名称', category: '分类', location: '位置', keeper: '保管人', status: '状态', note: '备注' };
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  // 内置标签模板：A4 不干胶排版 + 单张连续标签纸
  var PRESET_TEMPLATES = [
    { id: 'p-a4-3', name: 'A4 不干胶 · 3 列', labelW: 63, labelH: 32, pageW: 210, pageH: 297, cols: 3, gap: 2, margin: 8, qr: 20, font: 8, layout: 'row', showQr: true, border: true, fields: ['id', 'name', 'location'] },
    { id: 'p-a4-4', name: 'A4 不干胶 · 4 列', labelW: 46, labelH: 25, pageW: 210, pageH: 297, cols: 4, gap: 2, margin: 8, qr: 15, font: 7, layout: 'row', showQr: true, border: true, fields: ['id', 'name'] },
    { id: 'p-a4-2', name: 'A4 大标签 · 2 列', labelW: 95, labelH: 55, pageW: 210, pageH: 297, cols: 2, gap: 3, margin: 8, qr: 32, font: 10, layout: 'row', showQr: true, border: true, fields: ['id', 'name', 'location', 'keeper'] },
    { id: 'p-a4-5', name: 'A4 迷你 · 5 列', labelW: 37, labelH: 18, pageW: 210, pageH: 297, cols: 5, gap: 2, margin: 7, qr: 11, font: 6, layout: 'row', showQr: true, border: true, fields: ['id', 'name'] },
    { id: 'p-30x20', name: '热敏标签 30×20mm', labelW: 30, labelH: 20, pageW: 30, pageH: 20, cols: 1, gap: 0, margin: 0, qr: 13, font: 6, layout: 'row', showQr: true, border: false, fields: ['id'] },
    { id: 'p-50x30', name: '热敏标签 50×30mm', labelW: 50, labelH: 30, pageW: 50, pageH: 30, cols: 1, gap: 0, margin: 0, qr: 18, font: 8, layout: 'row', showQr: true, border: false, fields: ['id', 'name', 'location'] },
    { id: 'p-60x40', name: '热敏标签 60×40mm', labelW: 60, labelH: 40, pageW: 60, pageH: 40, cols: 1, gap: 0, margin: 0, qr: 24, font: 9, layout: 'row', showQr: true, border: false, fields: ['id', 'name', 'location'] },
    { id: 'p-40x60', name: '热敏 40×60 · 经典', labelW: 40, labelH: 60, pageW: 40, pageH: 60, cols: 1, gap: 0, margin: 0, qr: 28, font: 9, layout: 'column', showQr: true, border: true, fields: ['id', 'name', 'location', 'keeper'], style: 'classic', title: '资产管理' },
    { id: 'p-40x60-c', name: '热敏 40×60 · 居中大码', labelW: 40, labelH: 60, pageW: 40, pageH: 60, cols: 1, gap: 0, margin: 0, qr: 24, font: 8, layout: 'column', showQr: true, border: true, fields: ['id', 'name', 'location', 'keeper'], style: 'center', title: '资产管理' },
    { id: 'p-40x60-h', name: '热敏 40×60 · 头部色块', labelW: 40, labelH: 60, pageW: 40, pageH: 60, cols: 1, gap: 0, margin: 0, qr: 17, font: 6.5, layout: 'row', showQr: true, border: false, fields: ['id', 'name', 'location', 'keeper'], style: 'hero', title: '资产管理' },
    { id: 'p-40x60-t', name: '热敏 40×60 · 表格明细', labelW: 40, labelH: 60, pageW: 40, pageH: 60, cols: 1, gap: 0, margin: 0, qr: 20, font: 7, layout: 'column', showQr: true, border: true, fields: ['id', 'name', 'location', 'keeper', 'status'], style: 'table', title: '' },
    { id: 'p-40x60-fc', name: '热敏 40×60 · 双线框大码', labelW: 40, labelH: 60, pageW: 40, pageH: 60, cols: 1, gap: 0, margin: 0, qr: 21, font: 7.5, layout: 'column', showQr: true, border: true, fields: ['id', 'name', 'location', 'keeper'], style: 'center', frame: 'double', title: '资产管理' },
    { id: 'p-40x60-g', name: '热敏 40×60 · 网格表单框', labelW: 40, labelH: 60, pageW: 40, pageH: 60, cols: 1, gap: 0, margin: 0, qr: 18, font: 7, layout: 'column', showQr: true, border: true, fields: ['id', 'name', 'location', 'keeper'], style: 'grid', frame: 'solid', title: '资产管理' },
    { id: 'p-40x60-fs', name: '热敏 40×60 · 实线框经典', labelW: 40, labelH: 60, pageW: 40, pageH: 60, cols: 1, gap: 0, margin: 0, qr: 24, font: 8, layout: 'column', showQr: true, border: true, fields: ['id', 'name', 'location', 'keeper'], style: 'classic', frame: 'solid', title: '' },
    { id: 'p-40x60-ft', name: '热敏 40×60 · 明细框线', labelW: 40, labelH: 60, pageW: 40, pageH: 60, cols: 1, gap: 0, margin: 0, qr: 18, font: 7, layout: 'column', showQr: true, border: true, fields: ['id', 'name', 'location', 'keeper', 'status'], style: 'table', frame: 'solid', title: '' },
    { id: 'p-40x60-card', name: '热敏 40×60 · 条码卡', labelW: 40, labelH: 60, pageW: 40, pageH: 60, cols: 1, gap: 0, margin: 0, qr: 12, font: 6, layout: 'row', showQr: true, border: false, fields: ['id', 'name', 'location', 'keeper'], style: 'card', frame: 'none', title: '固定资产条码卡' },
    { id: 'p-60x40-card', name: '热敏 60×40 · 条码卡（横版）', labelW: 60, labelH: 40, pageW: 60, pageH: 40, cols: 1, gap: 0, margin: 0, qr: 21, font: 7, layout: 'row', showQr: true, border: false, fields: ['id', 'name', 'location', 'keeper'], style: 'card', frame: 'none', title: '固定资产条码卡' },
    { id: 'p-90x55', name: '资产卡片 90×55mm', labelW: 90, labelH: 55, pageW: 90, pageH: 55, cols: 1, gap: 0, margin: 0, qr: 30, font: 10, layout: 'row', showQr: true, border: true, fields: ['id', 'name', 'category', 'location', 'keeper', 'status'] }
  ];

  var assets = readStore(KEY_ASSETS, []);
  var counts = readStore(KEY_COUNTS, []);
  var customTemplates = readStore(KEY_TEMPLATES, []);
  var activeTemplateId = '';
  var users = readStore(KEY_USERS, []);
  var me = readStore(KEY_SESSION, null);
  try { activeTemplateId = localStorage.getItem(KEY_ACTIVE_TPL) || PRESET_TEMPLATES[0].id; } catch (e) { activeTemplateId = PRESET_TEMPLATES[0].id; }
  var currentTemplate = null;
  var labelScope = 'all';
  var labelOneId = '';
  var previewPage = 1;      // 当前预览页码
  var zoomFit = true;       // 预览缩放：true=适应宽度
  var zoomLevel = 1;        // 手动缩放倍数
  var serialPort = null, serialWriter = null;
  var selected = new Set();
  var editingId = null;
  var pendingPhoto = '';      // 表单里当前照片：服务器相对路径 或 dataURL（离线兜底）
  var photoBusy = false;
  var qrAssetId = null;
  var resultId = null;
  var ckFilter = 'all';   // 盘点清单筛选：all / pending / done
  var toastTimer = null;

  // 摄像头 / 识别
  var stream = null, detector = null, scanning = false, scanTimer = null;
  var lastCode = '', lastCodeAt = 0;
  var video, canvas, ctx;

  function readStore(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      var val = raw ? JSON.parse(raw) : fallback;
      return Array.isArray(val) ? val : fallback;
    } catch (e) { return fallback; }
  }
  function persist() {
    try {
      localStorage.setItem(KEY_ASSETS, JSON.stringify(assets));
      localStorage.setItem(KEY_COUNTS, JSON.stringify(counts));
    } catch (e) {
      toast('保存失败：浏览器本地存储不可用或已满');
    }
  }
  function saveUsers() {
    try { localStorage.setItem(KEY_USERS, JSON.stringify(users)); } catch (e) { /* 忽略 */ }
  }
  function normalize() {
    assets = assets.filter(function (a) { return a && a.id; }).map(function (a) {
      return {
        id: String(a.id), name: a.name || '', category: a.category || '',
        location: a.location || '', keeper: a.keeper || '',
        status: a.status || '在用', note: a.note || '',
        photo: a.photo || '',
        createdAt: a.createdAt || Date.now()
      };
    });
    counts = counts.filter(function (c) { return c && c.id && Array.isArray(c.expected); }).map(function (c) {
      return {
        id: c.id, name: c.name || '盘点', scope: c.scope || { field: 'all', value: '' },
        createdAt: c.createdAt || Date.now(), finishedAt: c.finishedAt || null,
        expected: c.expected.map(String),
        found: Array.isArray(c.found) ? c.found : [],
        by: c.by || ''
      };
    });
    // 只保留一条进行中的盘点，避免恢复旧备份后状态混乱
    var running = counts.filter(function (c) { return !c.finishedAt; });
    running.slice(1).forEach(function (c) { c.finishedAt = c.createdAt; });
    users = users.filter(function (u) { return u && u.username && u.role; }).map(function (u) {
      return {
        username: String(u.username), password: String(u.password || ''),
        name: u.name || u.username, role: u.role === 'admin' ? 'admin' : 'staff',
        createdAt: u.createdAt || Date.now()
      };
    });
  }
  normalize();

  /* ================= 权限与登录 ================= */
  function findUser(username) { return users.find(function (u) { return u.username === username; }); }
  function isAdmin() { return !!(me && me.role === 'admin'); }
  function isStaff() { return !!(me && me.role === 'staff'); }
  // 人员权限：只能看到保管人是自己的资产
  function visibleAssets() {
    if (!isStaff()) return assets;
    return assets.filter(function (a) { return (a.keeper || '') === me.name; });
  }
  function visibleCounts() {
    if (!isStaff()) return counts;
    return counts.filter(function (c) { return !c.by || c.by === me.username; });
  }
  function ensureAdminAccount() {
    if (users.some(function (u) { return u.role === 'admin'; })) return;
    users.push({ username: 'admin', password: 'admin123', name: '管理员', role: 'admin', createdAt: Date.now() });
    saveUsers();
  }
  function doLogin(username, password) {
    var u = findUser(username);
    if (!u || u.password !== password) return false;
    me = { username: u.username, name: u.name, role: u.role, loginAt: Date.now() };
    try { localStorage.setItem(KEY_SESSION, JSON.stringify(me)); } catch (e) { /* 忽略 */ }
    return true;
  }
  function doLogout() {
    me = null;
    try { localStorage.removeItem(KEY_SESSION); } catch (e) { /* 忽略 */ }
    stopCamera(); selected.clear();
    showGate();
  }
  function showGate() {
    $('#appBody').hidden = true;
    $('#loginGate').hidden = false;
    $('#loginName').value = ''; $('#loginPass').value = '';
    $('#loginError').hidden = true;
    setTimeout(function () { $('#loginName').focus(); }, 50);
  }
  function afterLogin() {
    $('#loginGate').hidden = true;
    $('#appBody').hidden = false;
    $('#userChip').textContent = me.name + '（' + (ROLES[me.role] || me.role) + '）';
    $('#userChip').className = 'user-chip' + (isAdmin() ? ' chip-admin' : '');
    $('#btnLogout').hidden = false;
    // 按角色显隐
    $('#btnBackup').hidden = !isAdmin();
    $('#btnRestore').hidden = !isAdmin();
    $('#btnImport').hidden = !isAdmin();
    $('#btnDemo').hidden = !isAdmin();
    $('#tabUsers').hidden = !isAdmin();
    selected.clear(); resultId = null; labelScope = 'all'; previewPage = 1; zoomFit = true;
    renderAll();
    selectTemplate(activeTemplateId);
  }
  // 资产编码自动生成：ZC-日期-3位流水号（按当日已有最大号 +1）
  function nextAssetId() {
    var day = dayStamp(Date.now());
    var max = 0;
    assets.forEach(function (a) {
      var m = /^ZC-(\d{8})-(\d{1,4})$/.exec(a.id);
      if (m && m[1] === day) max = Math.max(max, parseInt(m[2], 10));
    });
    var seq = String(max + 1);
    while (seq.length < 3) seq = '0' + seq;
    return 'ZC-' + day + '-' + seq;
  }
  if (typeof qrcode !== 'undefined' && qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs['UTF-8']) {
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function fmtTime(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function dayStamp(ts) {
    var d = new Date(ts);
    return '' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
  }
  function safeFileName(s) { return String(s).replace(/[\\/:*?"<>|\s]+/g, '_'); }
  function findAsset(id) {
    var exact = assets.find(function (a) { return a.id === id; });
    if (exact) return exact;
    var lower = String(id).toLowerCase();
    return assets.find(function (a) { return a.id.toLowerCase() === lower; });
  }
  // 兼容部分解码器把 UTF-8 字节按 Latin-1 读成乱码的情况
  function tryFixUtf8(s) {
    try { return decodeURIComponent(escape(s)); } catch (e) { return s; }
  }
  function currentCount() { return counts.find(function (c) { return !c.finishedAt; }) || null; }
  function getCount(id) { return counts.find(function (c) { return c.id === id; }); }

  /* ================= CSV / 文件 ================= */
  function csvCell(v) {
    var s = String(v == null ? '' : v);
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function toCsv(rows) {
    return '\uFEFF' + rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n');
  }
  function parseCsv(text) {
    text = String(text).replace(/^\uFEFF/, '');
    var rows = [], row = [], cell = '', quoted = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (quoted) {
        if (ch === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; }
        } else { cell += ch; }
      } else if (ch === '"') { quoted = true; }
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else if (ch !== '\r') { cell += ch; }
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return String(c).trim() !== ''; }); });
  }
  function download(filename, content, mime) {
    var blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  var CSV_HEADERS = ['资产编号', '资产名称', '分类', '存放位置', '保管人', '状态', '备注'];
  var CSV_MAP = {
    '资产编号': 'id', '编号': 'id', '资产编码': 'id', 'id': 'id', 'ID': 'id',
    '资产名称': 'name', '名称': 'name', 'name': 'name',
    '分类': 'category', '类别': 'category', 'category': 'category',
    '存放位置': 'location', '位置': 'location', '使用地点': 'location', 'location': 'location',
    '保管人': 'keeper', '使用人': 'keeper', '责任人': 'keeper', 'keeper': 'keeper',
    '状态': 'status', 'status': 'status',
    '备注': 'note', '说明': 'note', 'note': 'note'
  };
  function assetRow(a) { return [a.id, a.name, a.category, a.location, a.keeper, a.status, a.note]; }

  /* ================= 二维码 ================= */
  function qrSvg(text) {
    try {
      var qr = qrcode(0, 'M');
      qr.addData(String(text));
      qr.make();
      return qr.createSvgTag(4, 2);
    } catch (e) { return '<p>二维码生成失败</p>'; }
  }
  /* ================= 标签模板 ================= */
  function allTemplates() { return PRESET_TEMPLATES.concat(customTemplates); }
  function cloneTemplate(t) { return JSON.parse(JSON.stringify(t)); }
  function findTemplate(id) { return allTemplates().find(function (t) { return t.id === id; }); }
  function saveTemplates() {
    try { localStorage.setItem(KEY_TEMPLATES, JSON.stringify(customTemplates)); } catch (e) { /* 忽略 */ }
  }
  function isSingleMode(t) {
    return t.cols === 1 && t.pageW === t.labelW && t.pageH === t.labelH && t.margin === 0;
  }
  function num(id, def, min, max) {
    var v = parseFloat($(id).value);
    return isFinite(v) ? Math.min(max, Math.max(min, v)) : def;
  }
  function readFormTemplate() {
    var t = cloneTemplate(currentTemplate || PRESET_TEMPLATES[0]);
    t.labelW = num('#tplLabelW', t.labelW, 10, 300);
    t.labelH = num('#tplLabelH', t.labelH, 10, 300);
    t.pageW = num('#tplPageW', t.pageW, 10, 500);
    t.pageH = num('#tplPageH', t.pageH, 10, 500);
    t.cols = Math.round(num('#tplCols', t.cols, 1, 10));
    t.gap = num('#tplGap', t.gap, 0, 20);
    t.margin = num('#tplMargin', t.margin, 0, 40);
    t.qr = num('#tplQr', t.qr, 5, 100);
    t.font = num('#tplFont', t.font, 5, 24);
    t.layout = $('#tplLayout').value;
    t.style = $('#tplStyle').value || 'classic';
    t.title = $('#tplTitle').value.trim();
    t.showQr = $('#tplShowQr').checked;
    t.frame = $('#tplFrame').value || 'none';
    t.border = t.frame !== 'none';
    t.fields = ['id'].concat($$('#tplFields input[type="checkbox"]')
      .filter(function (c) { return c.checked && c.value !== 'id'; })
      .map(function (c) { return c.value; }));
    return t;
  }
  function applyTemplateToForm(t) {
    $('#tplLabelW').value = t.labelW; $('#tplLabelH').value = t.labelH;
    $('#tplPageW').value = t.pageW; $('#tplPageH').value = t.pageH;
    $('#tplCols').value = t.cols; $('#tplGap').value = t.gap;
    $('#tplMargin').value = t.margin; $('#tplQr').value = t.qr;
    $('#tplFont').value = t.font; $('#tplLayout').value = t.layout;
    $('#tplStyle').value = t.style || 'classic';
    $('#tplTitle').value = t.title || '';
    $('#tplShowQr').checked = !!t.showQr;
    $('#tplFrame').value = t.frame || (t.border ? 'dashed' : 'none');
    $$('#tplFields input[type="checkbox"]').forEach(function (c) {
      c.checked = c.value === 'id' || (t.fields || []).indexOf(c.value) >= 0;
    });
  }
  function tplThumb(t) {
    var single = isSingleMode(t);
    var ratio = Math.max(0.4, Math.min(5, t.labelW / t.labelH));
    var cell = '<span class="th-cell" style="aspect-ratio:' + ratio + '"><span class="th-qr"></span><span class="th-txt"><i></i><i></i></span></span>';
    var n = single ? 1 : Math.min(t.cols, 5);
    var cells = '';
    for (var i = 0; i < n; i++) cells += cell;
    return '<span class="tpl-thumb' + ((t.layout === 'column' || (t.style && t.style !== 'classic')) ? ' thumb-col' : '') +
      (t.showQr ? '' : ' thumb-noqr') +
      ((t.frame === 'solid' || t.frame === 'double') ? ' thumb-fr' : '') + '">' + cells + '</span>';
  }
  function tplCard(t) {
    var single = isSingleMode(t);
    var size = single ? '单张 ' + t.labelW + '×' + t.labelH + 'mm'
      : t.labelW + '×' + t.labelH + 'mm · ' + t.cols + ' 列/页';
    return '<button type="button" class="tpl-card' + (t.id === activeTemplateId ? ' active' : '') +
      '" data-id="' + esc(t.id) + '" title="' + esc(t.name) + '">' +
      tplThumb(t) +
      '<span class="tpl-name">' + esc(t.name) + '</span>' +
      '<span class="tpl-size">' + esc(size) + '</span></button>';
  }
  function renderTemplateSelect() {
    var html = '<span class="tpl-group">内置模板</span>' + PRESET_TEMPLATES.map(tplCard).join('');
    if (customTemplates.length) {
      html += '<span class="tpl-group">我的模板</span>' + customTemplates.map(tplCard).join('');
    }
    $('#tplPicker').innerHTML = html;
    var t = findTemplate(activeTemplateId) || PRESET_TEMPLATES[0];
    $('#tplBadge').textContent = t.custom ? '我的模板' : '预设';
    $('#btnTplDelete').disabled = !t.custom;
  }
  function selectTemplate(id) {
    var t = findTemplate(id) || PRESET_TEMPLATES[0];
    activeTemplateId = t.id;
    try { localStorage.setItem(KEY_ACTIVE_TPL, activeTemplateId); } catch (e) { /* 忽略 */ }
    currentTemplate = cloneTemplate(t);
    previewPage = 1;
    renderTemplateSelect();
    applyTemplateToForm(currentTemplate);
    renderLabelPreview();
  }
  function applyTemplatePreview() {
    currentTemplate = readFormTemplate();
    renderLabelPreview();
    $('#tplHint').textContent = '预览已更新（可另存为新模板）';
  }
  function saveAsTemplate() {
    var name = prompt('新模板名称', (currentTemplate.name || '标签模板') + ' 副本');
    if (!name || !name.trim()) return;
    var t = readFormTemplate();
    t.id = 'TPL' + Date.now();
    t.name = name.trim();
    t.custom = true;
    customTemplates.push(t);
    saveTemplates();
    selectTemplate(t.id);
    toast('模板「' + t.name + '」已保存');
  }
  function deleteTemplate() {
    var t = findTemplate(activeTemplateId);
    if (!t || !t.custom) return;
    if (!confirm('删除模板「' + t.name + '」？')) return;
    customTemplates = customTemplates.filter(function (x) { return x.id !== t.id; });
    saveTemplates();
    selectTemplate(PRESET_TEMPLATES[0].id);
    toast('模板已删除');
  }

  /* ================= 标签预览与打印 ================= */
  function sampleAsset() {
    return { id: 'SAMPLE-001', name: '测试标签', category: '示例分类', location: '示例位置', keeper: '张三', status: '在用', note: '' };
  }
  function getLabelAssets() {
    var list;
    if (labelScope === 'selected') list = Array.from(selected).map(findAsset);
    else if (labelScope === 'filtered') list = filteredAssets();
    else if (labelScope === 'one') list = [findAsset(labelOneId)];
    else list = visibleAssets().slice();
    return list.filter(Boolean).sort(function (a, b) {
      return a.id.localeCompare(b.id, 'zh-CN', { numeric: true });
    });
  }
  function renderLabelScope() {
    $('#scopeSelectedCount').textContent = selected.size;
    $('#scopeFilteredCount').textContent = filteredAssets().length;
    $('#scopeAllCount').textContent = visibleAssets().length;
    $$('input[name="labelScope"]').forEach(function (r) { r.checked = r.value === labelScope; });
    var single = $('#labelOneAsset');
    single.hidden = labelScope !== 'one';
    single.innerHTML = visibleAssets().slice().sort(function (a, b) {
      return a.id.localeCompare(b.id, 'zh-CN', { numeric: true });
    }).map(function (a) {
      return '<option value="' + esc(a.id) + '">' + esc(a.id) + ' · ' + esc(a.name) + '</option>';
    }).join('');
    if (labelOneId && visibleAssets().some(function (a) { return a.id === labelOneId; })) single.value = labelOneId;
    else labelOneId = single.value || '';
  }
  function labelFieldRows(a, t, exclude) {
    var rows = [];
    (t.fields || []).forEach(function (f) {
      if (f === 'id' || f === exclude || !a[f]) return;
      rows.push({ k: FIELD_LABELS[f] || f, v: a[f] });
    });
    return rows;
  }
  // 边框样式：兼容旧数据的 border 布尔值
  function frameClass(t, force) {
    var f = t.frame || (t.border ? 'dashed' : 'none');
    if (force) f = force;
    return f === 'none' ? '' : ' fr-' + f;
  }
  function buildLabelHtml(a, t) {
    var style = t.style || 'classic';
    var title = t.title || '';
    if (style === 'card') {
      // 条码卡：标题在上，左侧字段表格 + 右侧二维码格，粗黑框线（参考传统固定资产条码卡）
      // 窄标签（<50mm）自动用短字段名，避免值列被挤窄
      var fk = function (f) { return (t.labelW < 50 ? FIELD_SHORT[f] : FIELD_LABELS[f]) || f; };
      var rows = labelFieldRows(a, t);
      var cardRows = ['<div class="sc-row"><span class="sc-k">' + esc(fk('id')) + '</span><span class="sc-v">' + esc(a.id) + '</span></div>'];
      if (a.name) cardRows.push('<div class="sc-row"><span class="sc-k">' + esc(fk('name')) + '</span><span class="sc-v">' + esc(a.name) + '</span></div>');
      rows.forEach(function (r) {
        if (r.k === FIELD_LABELS.name) return;
        cardRows.push('<div class="sc-row"><span class="sc-k">' + esc(fk(r.k === FIELD_LABELS.name ? 'name' : Object.keys(FIELD_LABELS).find(function (k) { return FIELD_LABELS[k] === r.k; }) || r.k)) + '</span><span class="sc-v">' + esc(r.v) + '</span></div>');
      });
      return '<div class="label style-card' + frameClass(t) + '">' +
        (title ? '<div class="sc-title">' + esc(title) + '</div>' : '') +
        '<div class="sc-body">' +
        '<div class="sc-table">' + cardRows.join('') + '</div>' +
        (t.showQr ? '<div class="sc-qr"><div class="label-qr">' + qrSvg(a.id) + '</div></div>' : '') +
        '</div></div>';
    }
    if (style === 'grid') {
      // 网格表单：外框 + 行分隔线，标题条 + 二维码 + 编号/名称/字段行
      var rows = labelFieldRows(a, t);
      var name = rows.length && rows[0].k === FIELD_LABELS.name ? rows.shift() : null;
      var gridRows = ['<div class="sg-row sg-code-row"><span class="sg-k">编号</span><span class="sg-v">' + esc(a.id) + '</span></div>'];
      if (name) gridRows.push('<div class="sg-row"><span class="sg-k">名称</span><span class="sg-v">' + esc(name.v) + '</span></div>');
      rows.forEach(function (r) {
        gridRows.push('<div class="sg-row"><span class="sg-k">' + esc(r.k) + '</span><span class="sg-v">' + esc(r.v) + '</span></div>');
      });
      return '<div class="label style-grid' + frameClass(t, t.frame && t.frame !== 'none' ? t.frame : 'solid') + '">' +
        (title ? '<div class="sg-title">' + esc(title) + '</div>' : '') +
        (t.showQr ? '<div class="sg-qr-row"><div class="label-qr">' + qrSvg(a.id) + '</div></div>' : '') +
        '<div class="sg-rows">' + gridRows.join('') + '</div></div>';
    }
    if (style === 'center') {
      var sub = labelFieldRows(a, t, 'name').map(function (r) { return r.v; }).join(' · ');
      return '<div class="label style-center' + frameClass(t) + '">' +
        (title ? '<div class="st-title">' + esc(title) + '</div>' : '') +
        (t.showQr ? '<div class="label-qr">' + qrSvg(a.id) + '</div>' : '') +
        '<div class="st-code">' + esc(a.id) + '</div>' +
        '<div class="st-name">' + esc(a.name || '') + '</div>' +
        (sub ? '<div class="st-sub">' + esc(sub) + '</div>' : '') +
        '</div>';
    }
    if (style === 'hero') {
      var rows = labelFieldRows(a, t);
      var name = rows.length && rows[0].k === FIELD_LABELS.name ? rows.shift() : null;
      return '<div class="label style-hero' + frameClass(t) + '">' +
        '<div class="sh-head"><span class="sh-code">' + esc(a.id) + '</span>' +
        (title ? '<span class="sh-tag">' + esc(title) + '</span>' : '') + '</div>' +
        '<div class="sh-body">' +
        (t.showQr ? '<div class="label-qr">' + qrSvg(a.id) + '</div>' : '') +
        '<div class="sh-info">' +
        (name ? '<div class="sh-name">' + esc(name.v) + '</div>' : '') +
        rows.map(function (r) {
          return '<div class="sh-row"><span class="sh-k">' + esc(r.k) + '</span><b>' + esc(r.v) + '</b></div>';
        }).join('') +
        '</div></div></div>';
    }
    if (style === 'table') {
      return '<div class="label style-table' + frameClass(t) + '">' +
        '<div class="stb-head"><span class="stb-code">' + esc(a.id) + '</span>' +
        '<span class="stb-name">' + esc(a.name || '') + '</span></div>' +
        (t.showQr ? '<div class="stb-mid"><div class="label-qr">' + qrSvg(a.id) + '</div></div>' : '') +
        '<div class="stb-rows">' +
        labelFieldRows(a, t, 'name').map(function (r) {
          return '<div class="stb-row"><span>' + esc(r.k) + '</span><b>' + esc(r.v) + '</b></div>';
        }).join('') +
        '</div></div>';
    }
    // 经典：二维码在侧 + 文本行
    var lines = ['<div class="l-line l-code">' + esc(a.id) + '</div>'];
    (t.fields || ['id']).forEach(function (f) {
      if (f === 'id' || !a[f]) return;
      var cls = f === 'name' ? 'l-line l-name' : 'l-line l-extra';
      lines.push('<div class="' + cls + '">' + esc(a[f]) + '</div>');
    });
    return '<div class="label' + (t.layout === 'column' ? ' layout-column' : '') + frameClass(t) + '">' +
      (t.showQr ? '<div class="label-qr">' + qrSvg(a.id) + '</div>' : '') +
      '<div class="label-text">' + lines.join('') + '</div></div>';
  }
  function renderLabelPreview(overrideList) {
    var t = currentTemplate;
    if (!t) return;
    var list = overrideList || getLabelAssets();
    var root = document.documentElement.style;
    root.setProperty('--label-w', t.labelW + 'mm');
    root.setProperty('--label-h', t.labelH + 'mm');
    root.setProperty('--label-qr', t.qr + 'mm');
    root.setProperty('--label-fs', t.font + 'pt');
    root.setProperty('--label-cols', t.cols);
    root.setProperty('--label-gap', t.gap + 'mm');
    root.setProperty('--label-pad', '1.5mm');
    $('#printStyle').textContent = '@page { size: ' + t.pageW + 'mm ' + t.pageH + 'mm; margin: ' + t.margin + 'mm; }';

    $('#labelSheet').innerHTML = list.map(function (a) { return buildLabelHtml(a, t); }).join('');
    var single = isSingleMode(t);
    var rows = Math.max(1, Math.floor((t.pageH - 2 * t.margin + t.gap) / (t.labelH + t.gap)));
    var perPage = single ? 1 : t.cols * rows;
    var totalPages = Math.max(1, Math.ceil(list.length / perPage));
    if (previewPage < 1 || previewPage > totalPages) previewPage = 1;
    $('#labelPreview').innerHTML = list.slice((previewPage - 1) * perPage, previewPage * perPage)
      .map(function (a) { return buildLabelHtml(a, t); }).join('');

    var preview = $('#labelPreview');
    preview.style.width = t.pageW + 'mm';
    preview.style.minHeight = t.pageH + 'mm';
    preview.style.padding = t.margin + 'mm';
    var wrapWidth = $('#previewWrap').clientWidth;
    var rawScale = wrapWidth > 0 ? (wrapWidth - 8) / (t.pageW * 3.7795) : 1;
    var scale;
    if (zoomFit) {
      // 小尺寸标签纸放大便于查看，A4 等大纸张保持原比例避免预览过高
      scale = t.pageW >= 150 ? Math.min(1, rawScale) : Math.min(2.5, Math.max(0.25, rawScale));
    } else {
      scale = zoomLevel;
    }
    preview.style.setProperty('--preview-zoom', scale);

    $('#previewMeta').textContent = list.length + ' 张';
    $('#labelScopeBadge').textContent = list.length + ' 张';
    $('#pageInfo').textContent = previewPage + '/' + totalPages + ' 页';
    $('#btnPrevPage').disabled = previewPage <= 1;
    $('#btnNextPage').disabled = previewPage >= totalPages;
    $('#zoomInfo').textContent = zoomFit ? '适应' : Math.round(zoomLevel * 100) + '%';
    var fitW = t.cols * t.labelW + (t.cols - 1) * t.gap;
    var availW = t.pageW - 2 * t.margin;
    var note = t.name + ' · 标签 ' + t.labelW + '×' + t.labelH + 'mm · 纸张 ' + t.pageW + '×' + t.pageH + 'mm · ' +
      (single ? '每张标签占一页，共 ' + totalPages + ' 页'
              : '每页 ' + perPage + ' 张 · 共 ' + list.length + ' 张 / ' + totalPages + ' 页');
    if (fitW > availW + 0.5) {
      note += ' · ⚠ 标签总宽 ' + fitW + 'mm 超过可用纸宽 ' + availW.toFixed(1) + 'mm，请调小标签宽、列数或页边距';
    }
    if (!list.length) note += ' · 当前范围没有资产';
    $('#previewNote').textContent = note;
  }
  function renderLabelView() { renderLabelScope(); renderLabelPreview(); }
  function stdPrint(testOnly) {
    var list = testOnly ? [sampleAsset()] : getLabelAssets();
    if (!list.length) { toast('当前范围没有可打印的资产'); return; }
    renderLabelPreview(list);
    document.body.classList.add('printing');
    document.body.classList.toggle('single-mode', isSingleMode(currentTemplate));
    var done = function () {
      document.body.classList.remove('printing');
      document.body.classList.remove('single-mode');
      window.removeEventListener('afterprint', done);
      clearTimeout(fallback);
      renderLabelPreview();
    };
    window.addEventListener('afterprint', done);
    var fallback = setTimeout(done, 15000);
    setTimeout(function () { window.print(); }, 80);
    toast(testOnly ? '已调起测试标签打印' : '已调起打印：' + list.length + ' 张标签');
  }
  function openLabelView(scope, oneId) {
    labelScope = scope || 'all';
    if (oneId) labelOneId = oneId;
    switchView('labels');
  }

  /* ================= 直连标签打印机（Web Serial） ================= */
  function cmdSafe(s) { return String(s == null ? '' : s).replace(/["\r\n\\]/g, ' ').slice(0, 80); }
  function printerGeometry(t) {
    var d = Number($('#serialDpi').value) / 25.4;
    return {
      d: d,
      w: Math.round(t.labelW * d), h: Math.round(t.labelH * d),
      qx: Math.round(2 * d), qy: Math.max(0, Math.round((t.labelH - t.qr) / 2 * d)),
      tx: t.layout === 'column' ? Math.round(2 * d) : Math.round((2 + t.qr + 1) * d),
      ty: t.layout === 'column' ? Math.round((2 + t.qr + 1) * d) : Math.round(t.labelH / 2 * d),
      cell: Math.max(2, Math.min(10, Math.round(t.qr * d / 33))),
      font: Math.max(15, Math.round(t.font * 2))
    };
  }
  function buildPrinterCommand(a, t) {
    var g = printerGeometry(t);
    var code = cmdSafe(a.id);
    if ($('#serialProto').value === 'zpl') {
      return '^XA\r\n^PW' + g.w + '\r\n^LL' + g.h + '\r\n' +
        '^FO' + g.qx + ',' + g.qy + '^BQN,2,' + g.cell + '^FDQA,' + code + '^FS\r\n' +
        '^FO' + g.tx + ',' + g.ty + '^A0N,' + g.font + ',' + g.font + '^FD' + code + '^FS\r\n^XZ\r\n';
    }
    return 'SIZE ' + t.labelW + ' mm,' + t.labelH + ' mm\r\n' +
      'GAP ' + t.gap + ' mm,0 mm\r\nDIRECTION 1\r\nCLS\r\n' +
      'QRCODE ' + g.qx + ',' + g.qy + ',H,' + g.cell + ',A,0,"' + code + '"\r\n' +
      'TEXT ' + g.tx + ',' + g.ty + ',"3",0,1,1,"' + code + '"\r\nPRINT 1\r\n';
  }
  function updateSerialUI(connected) {
    $('#serialBadge').textContent = connected ? '已连接' : '未连接';
    $('#serialBadge').className = 'badge' + (connected ? ' badge-blue' : '');
    $('#btnSerialConnect').disabled = connected || !('serial' in navigator);
    ['#btnSerialPrint', '#btnSerialTest', '#btnSerialClose'].forEach(function (s) { $(s).disabled = !connected; });
  }
  async function serialConnect() {
    if (!('serial' in navigator)) { toast('当前浏览器不支持串口直连，请用 Chrome / Edge'); return; }
    try {
      var port = await navigator.serial.requestPort();
      await port.open({ baudRate: Number($('#serialBaud').value) });
      serialPort = port;
      serialWriter = port.writable.getWriter();
      updateSerialUI(true);
      toast('标签打印机已连接');
    } catch (e) {
      toast('连接失败：' + (e.name || e.message));
    }
  }
  async function serialDisconnect() {
    try { if (serialWriter) await serialWriter.close(); } catch (e) { /* 忽略 */ }
    try { if (serialPort) await serialPort.close(); } catch (e) { /* 忽略 */ }
    serialWriter = null; serialPort = null;
    updateSerialUI(false);
    toast('已断开');
  }
  function serialSleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  async function serialPrint(testOnly) {
    if (!serialWriter) { toast('请先连接标签打印机'); return; }
    var list = testOnly ? [sampleAsset()] : getLabelAssets();
    if (!list.length) { toast('当前范围没有可打印的资产'); return; }
    if (!testOnly && !confirm('将直接向打印机发送 ' + list.length + ' 张标签，确定继续？')) return;
    var sent = 0;
    for (var i = 0; i < list.length; i++) {
      try {
        await serialWriter.write(new TextEncoder().encode(buildPrinterCommand(list[i], currentTemplate)));
        sent++;
        await serialSleep(280);
      } catch (e) {
        toast('第 ' + (i + 1) + ' 张发送失败：' + (e.message || e.name));
        break;
      }
    }
    toast('已发送 ' + sent + ' 张标签');
  }
  function initSerialUI() {
    if (!('serial' in navigator)) {
      $('#serialHint').textContent = '当前浏览器不支持串口直连（需 Chrome / Edge 且在 localhost 或 HTTPS 下），请改用标准打印。';
    }
    updateSerialUI(false);
  }

  /* ================= 台账渲染 ================= */
  function filteredAssets() {
    var q = $('#assetSearch').value.trim().toLowerCase();
    var st = $('#filterStatus').value, loc = $('#filterLocation').value;
    return visibleAssets().filter(function (a) {
      if (st && a.status !== st) return false;
      if (loc && a.location !== loc) return false;
      if (q) {
        var hay = [a.id, a.name, a.category, a.location, a.keeper, a.status, a.note].join(' ').toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    }).sort(function (a, b) { return a.id.localeCompare(b.id, 'zh-CN', { numeric: true }); });
  }
  function statusClass(s) { return STATUSES.indexOf(s) >= 0 ? s : '其他'; }
  function renderOptions() {
    var values = function (field) {
      return Array.from(new Set(visibleAssets().map(function (a) { return a[field] || ''; }).filter(Boolean)))
        .sort(function (a, b) { return a.localeCompare(b, 'zh-CN'); });
    };
    var keep = { status: $('#filterStatus').value, location: $('#filterLocation').value };
    $('#filterStatus').innerHTML = '<option value="">全部状态</option>' +
      STATUSES.map(function (s) { return '<option value="' + esc(s) + '">' + esc(s) + '</option>'; }).join('');
    $('#filterLocation').innerHTML = '<option value="">全部位置</option>' +
      values('location').map(function (v) { return '<option value="' + esc(v) + '">' + esc(v) + '</option>'; }).join('');
    $('#filterStatus').value = keep.status;
    $('#filterLocation').value = keep.location;
    $('#assetStatus').innerHTML = STATUSES.map(function (s) {
      return '<option value="' + esc(s) + '">' + esc(s) + '</option>';
    }).join('');
    $('#categoryOptions').innerHTML = values('category').map(function (v) { return '<option value="' + esc(v) + '"></option>'; }).join('');
    $('#locationOptions').innerHTML = values('location').map(function (v) { return '<option value="' + esc(v) + '"></option>'; }).join('');
  }
  function renderAssets() {
    renderOptions();
    var list = filteredAssets();
    var visible = visibleAssets();
    var ids = new Set(visible.map(function (a) { return a.id; }));
    Array.from(selected).forEach(function (id) { if (!ids.has(id)) selected.delete(id); });

    $('#assetBody').innerHTML = list.map(function (a) {
      return '<tr>' +
        '<td><input type="checkbox" class="row-check" data-id="' + esc(a.id) + '"' + (selected.has(a.id) ? ' checked' : '') + ' aria-label="选择 ' + esc(a.id) + '"></td>' +
        '<td class="cell-code">' + esc(a.id) + '</td>' +
        '<td class="cell-name">' + (a.photo ? '<button type="button" class="photo-flag" data-act="photo" data-id="' + esc(a.id) + '" title="查看照片" aria-label="查看照片">' + PHOTO_ICON + '</button>' : '') + esc(a.name) + '</td>' +
        '<td>' + esc(a.category) + '</td>' +
        '<td>' + esc(a.location) + '</td>' +
        '<td>' + esc(a.keeper) + '</td>' +
        '<td><span class="status status-' + statusClass(a.status) + '">' + esc(a.status) + '</span></td>' +
        '<td class="cell-note" title="' + esc(a.note) + '">' + esc(a.note) + '</td>' +
        '<td><div class="row-ops">' +
          '<button type="button" class="btn btn-sm" data-act="qr" data-id="' + esc(a.id) + '">二维码</button>' +
          '<button type="button" class="btn btn-sm" data-act="edit" data-id="' + esc(a.id) + '">编辑</button>' +
          '<button type="button" class="btn btn-sm btn-danger" data-act="del" data-id="' + esc(a.id) + '">删除</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');

    var isEmpty = visible.length === 0;
    $('#emptyAssets').hidden = !isEmpty;
    $('#assetTable').hidden = isEmpty;
    $('#emptyText').textContent = isStaff()
      ? '暂时没有保管人是「' + esc(me.name) + '」的资产，请联系管理员分配。'
      : '台账还是空的，先添加资产或导入 CSV。';
    $('#assetMeta').textContent = '共 ' + visible.length + ' 项资产' +
      (list.length !== visible.length ? '（当前筛选 ' + list.length + ' 项）' : '');
    $('#selectedMeta').textContent = selected.size ? '已选 ' + selected.size + ' 项' : '';
    $('#btnPrintLabels').textContent = selected.size ? '打印标签（' + selected.size + '）' : '打印标签';
    var visibleChecks = $$('.row-check');
    $('#checkAll').checked = visibleChecks.length > 0 && visibleChecks.every(function (c) { return c.checked; });
    $('#checkAll').disabled = list.length === 0;
  }

  /* ================= 台账操作 ================= */
  function formField(form, name) { return form.querySelector('[name="' + name + '"]'); }
  function openAssetDialog(id) {
    var form = $('#assetForm');
    form.reset();
    editingId = id || null;
    var a = id ? findAsset(id) : null;
    $('#assetDialogTitle').textContent = a ? '编辑资产' : '新增资产';
    var fields = {};
    ['id', 'name', 'category', 'location', 'keeper', 'status', 'note'].forEach(function (n) { fields[n] = formField(form, n); });
    fields.id.readOnly = !!a;
    // 资产编码自动生成（新增时预填 ZC-日期-流水号，仍可手动改）
    fields.id.value = a ? a.id : nextAssetId();
    fields.name.value = a ? a.name : '';
    fields.category.value = a ? a.category : '';
    fields.location.value = a ? a.location : '';
    fields.keeper.value = a ? a.keeper : '';
    // 人员权限：保管人锁定为本人
    if (isStaff()) { fields.keeper.value = me.name; fields.keeper.readOnly = true; }
    else { fields.keeper.readOnly = false; }
    fields.status.value = a && STATUSES.indexOf(a.status) >= 0 ? a.status : '在用';
    fields.note.value = a ? a.note : '';
    pendingPhoto = a ? (a.photo || '') : '';
    photoBusy = false;
    $('#assetPhotoInput').value = '';
    renderPhoto('');
    $('#assetIdHint').textContent = a ? '编号不可修改' : '已自动生成，可修改';
    $('#assetDialog').showModal();
    setTimeout(function () { (a ? fields.name : fields.name).focus(); }, 30);
  }
  function saveAsset(e) {
    e.preventDefault();
    if (photoBusy) { toast('照片还在压缩上传中，请稍候再保存'); return; }
    var form = $('#assetForm');
    var f = {};
    ['id', 'name', 'category', 'location', 'keeper', 'status', 'note'].forEach(function (n) { f[n] = formField(form, n).value; });
    var obj = {
      id: f.id.trim(), name: f.name.trim(), category: f.category.trim(),
      location: f.location.trim(), keeper: isStaff() ? me.name : f.keeper.trim(),
      status: f.status, note: f.note.trim(), photo: pendingPhoto || ''
    };
    if (!obj.id || !obj.name) { toast('资产编号和名称不能为空'); return; }
    if (editingId) {
      var a = findAsset(editingId);
      if (isStaff() && a && a.keeper !== me.name) { toast('只能编辑保管人是自己的资产'); return; }
      if (a) Object.assign(a, obj);
    } else {
      if (assets.some(function (x) { return x.id === obj.id; })) { toast('资产编号「' + obj.id + '」已存在'); return; }
      assets.push(Object.assign({ createdAt: Date.now() }, obj));
    }
    persist(); $('#assetDialog').close(); renderAll();
    toast(editingId ? '资产已更新' : '资产已添加');
  }
  function deleteAsset(id) {
    var a = findAsset(id);
    if (!a) return;
    if (isStaff() && a.keeper !== me.name) { toast('只能删除保管人是自己的资产'); return; }
    if (!confirm('确定删除资产「' + a.name + '（' + a.id + '）」？\n相关盘点记录中也会移除该资产。')) return;
    assets = assets.filter(function (x) { return x.id !== id; });
    counts.forEach(function (c) {
      c.expected = c.expected.filter(function (x) { return x !== id; });
      c.found = c.found.filter(function (x) { return x.id !== id; });
    });
    selected.delete(id);
    persist(); renderAll(); toast('已删除');
  }
  function openQr(id) {
    var a = findAsset(id);
    if (!a) return;
    qrAssetId = id;
    $('#qrImage').innerHTML = qrSvg(a.id);
    $('#qrCode').textContent = a.id + ' · ' + a.name;
    $('#qrDialog').showModal();
  }

  /* ================= 资产照片：极限压缩 + 上传 ================= */
  var PHOTO_MAX_EDGE = 640;        // 长边像素上限，资产照片看清外观足够
  var PHOTO_TARGET = 40 * 1024;    // 目标体积 40KB，优先压质量再压尺寸
  var PHOTO_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 4L7.5 6H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-3.5L15 4H9zm3 4.6a4.4 4.4 0 110 8.8 4.4 4.4 0 010-8.8z"/></svg>';

  function dataUrlToBlob(dataUrl) {
    var parts = String(dataUrl).split(',');
    var mime = (/:(.*?);/.exec(parts[0]) || [])[1] || 'image/jpeg';
    var bin = atob(parts[1]);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }
  function kbOf(url) { return Math.round((url.length - url.indexOf(',') - 1) * 3 / 4 / 1024); }

  // 自适应压缩：先降 JPEG 质量，质量到底再缩边长，直到 <= 目标体积
  function compressImage(file, cb) {
    var reader = new FileReader();
    reader.onerror = function () { cb('读取文件失败'); };
    reader.onload = function () {
      var img = new Image();
      img.onerror = function () { cb('无法解析这张图片（可能是 HEIC 等格式）'); };
      img.onload = function () {
        var scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(img.width, img.height));
        var quality = 0.62;
        var rounds = 0;
        (function render() {
          var w = Math.max(1, Math.round(img.width * scale));
          var h = Math.max(1, Math.round(img.height * scale));
          var cv = document.createElement('canvas');
          cv.width = w; cv.height = h;
          var g = cv.getContext('2d');
          g.fillStyle = '#ffffff';           // JPEG 无透明通道，垫白底避免发黑
          g.fillRect(0, 0, w, h);
          g.drawImage(img, 0, 0, w, h);
          var url;
          try { url = cv.toDataURL('image/jpeg', quality); } catch (e) { cb('图片处理失败'); return; }
          var bytes = (url.length - url.indexOf(',') - 1) * 3 / 4;
          rounds++;
          if (bytes > PHOTO_TARGET && rounds < 10) {
            if (quality > 0.32) quality = Math.max(0.32, quality - 0.1);
            else scale *= 0.8;
            return render();
          }
          cb(null, url, kbOf(url), w + '×' + h);
        })();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  // 上传到服务器：Nginx WebDAV 接收 PUT，浏览器相对路径 /uploads/xxx.jpg
  function uploadPhoto(dataUrl, assetId, cb) {
    if (location.protocol === 'file:') { cb('本地打开无法上传'); return; }
    var name = safeFileName(assetId || 'photo') + '-' + Date.now() + '.jpg';
    var xhr = new XMLHttpRequest();
    xhr.open('PUT', 'uploads/' + name);
    xhr.setRequestHeader('Content-Type', 'image/jpeg');
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) cb(null, 'uploads/' + name);
      else cb('HTTP ' + xhr.status);
    };
    xhr.onerror = function () { cb('网络不可用'); };
    xhr.ontimeout = function () { cb('上传超时'); };
    xhr.timeout = 20000;
    try { xhr.send(dataUrlToBlob(dataUrl)); } catch (e) { cb('上传失败'); }
  }

  function renderPhoto(msg) {
    var has = !!pendingPhoto;
    $('#photoEmpty').hidden = has;
    $('#photoPreview').hidden = !has;
    if (has) {
      $('#photoThumb').src = pendingPhoto;
      $('#photoInfo').textContent = msg || '';
    } else {
      $('#photoThumb').removeAttribute('src');
      $('#photoInfo').textContent = '';
    }
  }

  function handlePhotoFile(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) { toast('请选择图片文件'); return; }
    photoBusy = true;
    $('#photoEmpty').hidden = true;
    $('#photoPreview').hidden = false;
    $('#photoInfo').textContent = '正在压缩…';
    var assetId = formField($('#assetForm'), 'id').value || 'photo';
    compressImage(file, function (err, dataUrl, kb, size) {
      if (err) {
        photoBusy = false;
        toast('照片处理失败：' + err);
        renderPhoto('');
        return;
      }
      pendingPhoto = dataUrl;
      renderPhoto('已压缩 ' + kb + 'KB（' + size + '），正在上传…');
      uploadPhoto(dataUrl, assetId, function (uerr, url) {
        photoBusy = false;
        if (uerr) {
          renderPhoto('已压缩 ' + kb + 'KB（' + size + '）· 上传失败，暂存本机');
          toast('上传失败（' + uerr + '），照片暂存在本机');
        } else {
          pendingPhoto = url;
          renderPhoto('已压缩 ' + kb + 'KB（' + size + '）· 已上传服务器');
          toast('照片已上传（' + kb + 'KB）');
        }
      });
    });
  }

  function openPhoto(src, title) {
    if (!src) return;
    $('#photoDialogTitle').textContent = title || '资产照片';
    $('#photoBig').src = src;
    $('#photoDialog').showModal();
  }
  function exportAssetsCsv() {
    if (!assets.length) { toast('台账为空，没有可导出的内容'); return; }
    download('资产台账_' + dayStamp(Date.now()) + '.csv',
      toCsv([CSV_HEADERS].concat(assets.slice().sort(function (a, b) {
        return a.id.localeCompare(b.id, 'zh-CN', { numeric: true });
      }).map(assetRow))), 'text/csv;charset=utf-8');
  }
  function importCsv(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var rows = parseCsv(reader.result);
      if (rows.length < 2) { toast('CSV 内容为空或缺少数据行'); return; }
      var keys = rows[0].map(function (h) { return CSV_MAP[String(h).trim()] || null; });
      if (keys.indexOf('id') === -1 || keys.indexOf('name') === -1) {
        toast('CSV 表头需包含「资产编号」和「资产名称」两列'); return;
      }
      var added = 0, skipped = 0, invalid = 0;
      rows.slice(1).forEach(function (row) {
        var obj = { category: '', location: '', keeper: '', status: '在用', note: '' };
        keys.forEach(function (k, i) { if (k) obj[k] = String(row[i] == null ? '' : row[i]).trim(); });
        if (!obj.id || !obj.name) { invalid++; return; }
        if (assets.some(function (a) { return a.id === obj.id; })) { skipped++; return; }
        if (STATUSES.indexOf(obj.status) === -1) obj.status = '在用';
        assets.push(Object.assign({ createdAt: Date.now() }, obj));
        added++;
      });
      persist(); renderAll();
      toast('导入完成：新增 ' + added + ' 项，跳过重复 ' + skipped + ' 项，无效 ' + invalid + ' 行');
    };
    reader.readAsText(file, 'UTF-8');
  }
  function backup() {
    var data = {
      app: 'asset-manager', version: 3, exportedAt: new Date().toISOString(),
      assets: assets, stocktakes: counts,
      labelTemplates: customTemplates, activeTemplate: activeTemplateId,
      users: users
    };
    download('资产数据备份_' + dayStamp(Date.now()) + '.json', JSON.stringify(data, null, 2), 'application/json;charset=utf-8');
    toast('备份文件已下载，请妥善保存');
  }
  function restore(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var data;
      try { data = JSON.parse(reader.result); } catch (e) { toast('文件不是有效的 JSON'); return; }
      if (!data || !Array.isArray(data.assets)) { toast('备份文件格式不正确'); return; }
      if (!confirm('恢复备份会覆盖当前全部资产与盘点记录，确定继续？')) return;
      assets = data.assets;
      counts = Array.isArray(data.stocktakes) ? data.stocktakes : [];
      customTemplates = Array.isArray(data.labelTemplates) ? data.labelTemplates : [];
      if (Array.isArray(data.users)) {
        users = data.users;
        normalize(); saveUsers(); ensureAdminAccount();
        if (me && !findUser(me.username)) { doLogout(); return; }
      }
      saveTemplates();
      activeTemplateId = findTemplate(data.activeTemplate) ? data.activeTemplate : PRESET_TEMPLATES[0].id;
      normalize(); persist(); stopCamera(); selected.clear();
      selectTemplate(activeTemplateId);
      renderAll(); switchView('assets');
      toast('已恢复：' + assets.length + ' 项资产、' + counts.length + ' 条盘点记录');
    };
    reader.readAsText(file, 'UTF-8');
  }
  function loadDemo() {
    if (!isAdmin()) { toast('只有管理员可以载入示例数据'); return; }
    var demo = [
      ['ZC-001', '笔记本电脑', '电子设备', '3 楼办公区', '张伟', '在用', ''],
      ['ZC-002', '投影仪', '电子设备', '3 楼会议室', '李娜', '在用', '含遥控器'],
      ['ZC-003', '办公桌', '家具', '3 楼办公区', '张伟', '在用', ''],
      ['ZC-004', '打印机', '电子设备', '2 楼文印室', '王强', '维修', '卡纸待修'],
      ['ZC-005', '空调', '设备', '2 楼会议室', '李娜', '在用', ''],
      ['ZC-006', '文件柜', '家具', '档案室', '赵敏', '在用', ''],
      ['ZC-007', '显示器', '电子设备', '3 楼办公区', '陈晨', '闲置', ''],
      ['ZC-008', '碎纸机', '电子设备', '2 楼文印室', '王强', '报废', '待处置']
    ];
    demo.forEach(function (r) {
      if (assets.some(function (a) { return a.id === r[0]; })) return;
      assets.push({ id: r[0], name: r[1], category: r[2], location: r[3], keeper: r[4], status: r[5], note: r[6], createdAt: Date.now() });
    });
    persist(); renderAll(); toast('已载入示例数据');
  }

  /* ================= 盘点：新建 ================= */
  function scopeLabel(c) {
    if (!c || !c.scope || c.scope.field === 'all') return '全部资产';
    var names = { location: '位置', category: '分类', status: '状态' };
    return '按' + (names[c.scope.field] || c.scope.field) + '：' + (c.scope.value || '（空）');
  }
  function scopeAssets() {
    var field = $('#scopeField').value, value = $('#scopeValue').value;
    return visibleAssets().filter(function (a) { return field === 'all' || (a[field] || '') === value; });
  }
  function renderCountSetup() {
    var field = $('#scopeField').value;
    var box = $('#scopeValueField');
    box.hidden = field === 'all';
    if (field !== 'all') {
      var vals = field === 'status' ? STATUSES.slice() :
        Array.from(new Set(visibleAssets().map(function (a) { return a[field] || ''; }).filter(Boolean)))
          .sort(function (a, b) { return a.localeCompare(b, 'zh-CN'); });
      var old = $('#scopeValue').value;
      $('#scopeValue').innerHTML = vals.map(function (v) {
        return '<option value="' + esc(v) + '">' + esc(v) + '</option>';
      }).join('');
      if (vals.indexOf(old) >= 0) $('#scopeValue').value = old;
      $('#scopeValueField').querySelector('span').textContent =
        ({ location: '选择位置', category: '选择分类', status: '选择状态' })[field] || '范围取值';
    }
    var n = scopeAssets().length;
    $('#scopeHint').textContent = '本次应盘 ' + n + ' 项资产';
    var notice = $('#setupNotice');
    notice.hidden = n > 0;
    if (n === 0) notice.textContent = assets.length ? '当前范围内没有资产，请更换范围。' : '台账为空，请先在「资产台账」建档后再开始盘点。';
    $('#btnStartCount').disabled = n === 0;
  }
  function startCount() {
    if (currentCount()) { toast('已有进行中的盘点'); renderCount(); return; }
    var list = scopeAssets();
    if (!list.length) { renderCountSetup(); return; }
    var field = $('#scopeField').value;
    var c = {
      id: 'CT' + Date.now(),
      name: $('#countName').value.trim() || (fmtTime(Date.now()).slice(0, 10) + ' 盘点'),
      scope: { field: field, value: field === 'all' ? '' : $('#scopeValue').value },
      createdAt: Date.now(), finishedAt: null,
      expected: list.map(function (a) { return a.id; }), found: [],
      by: me ? me.username : ''
    };
    counts.unshift(c); persist();
    $('#feedback').innerHTML = '';
    renderCount(); toast('盘点已开始，共 ' + list.length + ' 项');
  }

  /* ================= 盘点：进行中 ================= */
  function renderCount() {
    var c = currentCount();
    $('#countSetup').hidden = !!c;
    $('#countRun').hidden = !c;
    if (c) renderCountRun(c); else { stopCamera(); renderCountSetup(); }
  }
  function renderCountRun(c) {
    $('#runName').textContent = c.name;
    $('#runScope').textContent = '范围：' + scopeLabel(c) + ' · 开始于 ' + fmtTime(c.createdAt);
    var total = c.expected.length, done = c.found.length;
    var pct = total ? Math.round(done / total * 100) : 0;
    $('#progressText').textContent = done + ' / ' + total + ' 已盘';
    $('#progressPct').textContent = pct + '%';
    $('#progressFill').style.width = pct + '%';
    $('#foundBadge').textContent = done;
    $('#foundList').innerHTML = c.found.length ? c.found.slice().reverse().map(function (f) {
      var a = findAsset(f.id);
      return '<li><div><div class="f-name">' + esc(a ? a.name : f.id) + '</div>' +
        '<div class="f-meta">' + esc(f.id) + '</div></div>' +
        '<div class="f-meta">' + fmtTime(f.at).slice(11) + '</div></li>';
    }).join('') : '<div class="found-empty">还没有扫到资产</div>';

    var missing = c.expected.filter(function (id) { return !c.found.some(function (f) { return f.id === id; }); });
    $('#missingBadge').textContent = missing.length;
    $('#missingList').innerHTML = missing.length ? missing.map(function (id) {
      var a = findAsset(id);
      return '<div class="missing-item"><strong>' + esc(id) + '</strong><span>' +
        esc(a ? a.name + ' · ' + (a.location || '—') : '资产已删除') + '</span></div>';
    }).join('') : '<span class="missing-none">全部盘完，没有未盘资产。</span>';
    renderChecklist(c);
  }
  /* 盘点清单：逐行实时显示已盘/未盘，可筛选 */
  function renderChecklist(c) {
    var foundMap = {};
    c.found.forEach(function (f) { foundMap[f.id] = f.at; });
    var rows = c.expected.map(function (id) {
      var a = findAsset(id);
      var done = !!foundMap[id];
      return { id: id, a: a, done: done, at: foundMap[id] };
    }).filter(function (r) {
      if (ckFilter === 'pending') return !r.done;
      if (ckFilter === 'done') return r.done;
      return true;
    });
    var doneCount = c.expected.filter(function (id) { return !!foundMap[id]; }).length;
    $('#ckBadge').textContent = doneCount + ' / ' + c.expected.length + ' 已盘';
    $$('#ckFilters .btn').forEach(function (b) { b.classList.toggle('active', b.dataset.ck === ckFilter); });
    $('#ckBody').innerHTML = rows.length ? rows.map(function (r) {
      var a = r.a;
      return '<tr class="' + (r.done ? 'ck-done' : 'ck-pending') + '">' +
        '<td class="cell-code">' + esc(r.id) + '</td>' +
        '<td class="cell-name">' + esc(a ? a.name : '资产已删除') + '</td>' +
        '<td>' + esc(a ? a.location : '') + '</td>' +
        '<td>' + esc(a ? a.keeper : '') + '</td>' +
        '<td>' + (r.done
          ? '<span class="ck-state ok">✓ 已盘</span><span class="ck-time">' + fmtTime(r.at).slice(11) + '</span>'
          : '<span class="ck-state pending">○ 未盘</span>') + '</td>' +
      '</tr>';
    }).join('') : '<tr><td colspan="5" class="ck-empty">' +
      (ckFilter === 'done' ? '还没有盘到的资产' : ckFilter === 'pending' ? '全部盘完，没有未盘资产 🎉' : '本次盘点范围为空') + '</td></tr>';
    $('#ckMeta').textContent = '共 ' + c.expected.length + ' 项 · 已盘 ' + doneCount + ' · 未盘 ' + (c.expected.length - doneCount);
  }
  function feedback(kind, msg) {
    $('#feedback').innerHTML = '<div class="feedback-msg ' + kind + '">' + esc(msg) + '</div>';
  }
  function beep(ok) {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      var ac = new AC(), o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = ok ? 880 : 300;
      g.gain.value = 0.05; o.connect(g); g.connect(ac.destination);
      o.start(); o.stop(ac.currentTime + 0.09);
      setTimeout(function () { ac.close(); }, 250);
    } catch (e) { /* 忽略音频失败 */ }
  }
  function handleCode(raw) {
    var code = String(raw || '').trim();
    if (!code) return;
    var now = Date.now();
    if (code === lastCode && now - lastCodeAt < 1500) return;
    lastCode = code; lastCodeAt = now;

    var c = currentCount();
    if (!c) return;
    var a = findAsset(code);
    if (!a) {
      var fixed = tryFixUtf8(code);
      if (fixed && fixed !== code) a = findAsset(fixed);
    }
    if (!a) { feedback('err', '「' + code + '」不在资产台账中，请先建档'); beep(false); return; }
    if (c.found.some(function (f) { return f.id === a.id; })) {
      feedback('warn', a.name + '（' + a.id + '）已经盘过了'); return;
    }
    if (c.expected.indexOf(a.id) === -1) {
      feedback('warn', a.name + '（' + a.id + '）不在本次盘点范围，未计入'); return;
    }
    c.found.push({ id: a.id, at: Date.now() });
    persist(); renderCountRun(c);
    feedback('ok', '已盘：' + a.name + ' · ' + a.id);
    $('#manualCode').value = '';
    beep(true);
    if (navigator.vibrate) navigator.vibrate(40);
  }

  /* ================= 摄像头 ================= */
  function initCameraEls() {
    video = $('#video');
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d', { willReadFrequently: true });
  }
  async function startCamera() {
    if (scanning) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      $('#cameraHint').textContent = '当前环境不支持摄像头（需 HTTPS 或 localhost），请使用下方手动输入。';
      toast('摄像头不可用，请用手动输入');
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false
      });
      video.srcObject = stream;
      await video.play();
      detector = null;
      if (window.BarcodeDetector) {
        try {
          detector = new window.BarcodeDetector({
            formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'codabar', 'itf']
          });
        } catch (e) { detector = null; }
      }
      $('#scanEngine').textContent = detector
        ? '识别方式：浏览器原生（二维码 / 一维条码）'
        : (typeof jsQR === 'function' ? '识别方式：内置二维码识别（仅二维码）' : '识别组件未加载，请用手动输入');
      $('#scanStage').classList.add('camera-on');
      $('#scanFrame').hidden = false;
      $('#btnStopCamera').hidden = false;
      scanning = true;
      scanLoop();
    } catch (e) {
      $('#cameraHint').textContent = '摄像头开启失败：' + (e.name || e.message) + '。请使用下方手动输入。';
      toast('无法开启摄像头，可改用手动输入');
      stopCamera();
    }
  }
  function stopCamera() {
    scanning = false;
    clearTimeout(scanTimer);
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    if (video) { video.srcObject = null; }
    detector = null;
    var stage = $('#scanStage');
    if (stage) stage.classList.remove('camera-on');
    $('#scanFrame').hidden = true;
    $('#btnStopCamera').hidden = true;
    $('#scanEngine').textContent = '';
  }
  async function scanLoop() {
    if (!scanning) return;
    try {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        var code = null;
        if (detector) {
          var res = await detector.detect(video);
          if (res && res.length) code = res[0].rawValue;
        } else if (typeof jsQR === 'function') {
          var scale = Math.min(1, 720 / video.videoWidth);
          var w = Math.round(video.videoWidth * scale), h = Math.round(video.videoHeight * scale);
          if (w > 0 && h > 0) {
            canvas.width = w; canvas.height = h;
            ctx.drawImage(video, 0, 0, w, h);
            var img = ctx.getImageData(0, 0, w, h);
            var r = jsQR(img.data, w, h, { inversionAttempts: 'attemptBoth' });
            if (r) code = r.data;
          }
        }
        if (code) handleCode(code);
      }
    } catch (e) { /* 单帧失败，继续下一帧 */ }
    if (scanning) scanTimer = setTimeout(scanLoop, detector ? 120 : 240);
  }

  /* ================= 盘点：结束 / 记录 ================= */
  function finishCount() {
    var c = currentCount();
    if (!c) return;
    var missing = c.expected.length - c.found.length;
    if (!confirm('结束本次盘点？\n已盘 ' + c.found.length + ' 项，未盘 ' + missing + ' 项，结束后将生成盘点记录。')) return;
    c.finishedAt = Date.now();
    persist(); stopCamera();
    renderCount(); renderHistory();
    showResult(c.id);
  }
  function cancelCount() {
    var c = currentCount();
    if (!c) return;
    if (!confirm('放弃本次盘点？已扫的 ' + c.found.length + ' 条记录不会保存。')) return;
    counts = counts.filter(function (x) { return x.id !== c.id; });
    persist(); stopCamera(); renderCount(); renderHistory(); toast('已放弃本次盘点');
  }
  function missingIds(c) {
    return c.expected.filter(function (id) { return !c.found.some(function (f) { return f.id === id; }); });
  }
  function renderHistory() {
    var list = visibleCounts().filter(function (c) { return c.finishedAt; })
      .sort(function (a, b) { return b.finishedAt - a.finishedAt; });
    $('#historyMeta').textContent = '共 ' + list.length + ' 条盘点记录';
    $('#emptyHistory').hidden = list.length > 0;
    $('#historyList').innerHTML = list.map(function (c) {
      var miss = missingIds(c).length;
      return '<div class="card history-item">' +
        '<div class="history-main"><h3>' + esc(c.name) + '</h3>' +
          '<div class="muted tiny">' + esc(scopeLabel(c)) + ' · 结束于 ' + fmtTime(c.finishedAt) + '</div>' +
          '<div class="history-stats"><span>应盘 <b>' + c.expected.length + '</b></span>' +
            '<span>已盘 <b>' + c.found.length + '</b></span>' +
            '<span>未盘 <b class="' + (miss ? 'bad' : '') + '">' + miss + '</b></span></div>' +
        '</div><div class="history-actions">' +
          '<button type="button" class="btn btn-sm" data-act="view" data-id="' + esc(c.id) + '">查看结果</button>' +
          '<button type="button" class="btn btn-sm" data-act="export" data-id="' + esc(c.id) + '">导出 CSV</button>' +
          '<button type="button" class="btn btn-sm btn-danger" data-act="del" data-id="' + esc(c.id) + '">删除</button>' +
        '</div></div>';
    }).join('');
  }
  function showResult(id) {
    var c = getCount(id);
    if (!c) return;
    resultId = id;
    var miss = missingIds(c);
    var rows = miss.length ? miss.map(function (assetId) {
      var a = findAsset(assetId);
      return '<tr><td class="cell-code">' + esc(assetId) + '</td><td>' + esc(a ? a.name : '资产已删除') +
        '</td><td>' + esc(a ? a.location : '—') + '</td><td>' + esc(a ? a.keeper : '—') + '</td></tr>';
    }).join('') : '';
    $('#resultTitle').textContent = c.name + ' · 盘点结果';
    $('#resultBody').innerHTML =
      '<div class="result-summary">' +
        '<div class="result-box"><b>' + c.expected.length + '</b><span>应盘</span></div>' +
        '<div class="result-box"><b>' + c.found.length + '</b><span>已盘</span></div>' +
        '<div class="result-box"><b>' + miss.length + '</b><span>未盘</span></div>' +
      '</div>' +
      '<h3 style="margin-bottom:8px">未盘清单（' + miss.length + '）</h3>' +
      (miss.length
        ? '<div class="result-list"><table><thead><tr><th>资产编号</th><th>名称</th><th>位置</th><th>保管人</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
        : '<p class="muted">全部盘完，没有未盘资产。</p>');
    $('#resultDialog').showModal();
  }
  function exportResult(id) {
    var c = getCount(id);
    if (!c) return;
    var foundMap = {};
    c.found.forEach(function (f) { foundMap[f.id] = f.at; });
    var rows = [['资产编号', '资产名称', '分类', '存放位置', '保管人', '盘点结果', '盘点时间']];
    c.expected.forEach(function (assetId) {
      var a = findAsset(assetId) || { id: assetId, name: '', category: '', location: '', keeper: '' };
      rows.push([a.id, a.name, a.category, a.location, a.keeper,
        foundMap[assetId] ? '已盘' : '未盘', foundMap[assetId] ? fmtTime(foundMap[assetId]) : '']);
    });
    download('盘点结果_' + safeFileName(c.name) + '_' + dayStamp(c.finishedAt || Date.now()) + '.csv',
      toCsv(rows), 'text/csv;charset=utf-8');
  }

  /* ================= 视图 / 事件 ================= */
  /* ================= 人员管理（仅管理员） ================= */
  var editingUser = null;
  function renderUsers() {
    if (!isAdmin()) return;
    $('#usersBody').innerHTML = users.map(function (u) {
      return '<tr>' +
        '<td class="cell-name">' + esc(u.name) + '</td>' +
        '<td class="cell-code">' + esc(u.username) + '</td>' +
        '<td><span class="status ' + (u.role === 'admin' ? 'status-在用' : 'status-闲置') + '">' + esc(ROLES[u.role] || u.role) + '</span></td>' +
        '<td>' + esc(u.password ? '已设置' : '未设置') + '</td>' +
        '<td>' + fmtTime(u.createdAt).slice(0, 10) + '</td>' +
        '<td><div class="row-ops">' +
          '<button type="button" class="btn btn-sm" data-uact="edit" data-id="' + esc(u.username) + '">编辑</button>' +
          (u.username !== me.username ? '<button type="button" class="btn btn-sm btn-danger" data-uact="del" data-id="' + esc(u.username) + '">删除</button>' : '<span class="tiny muted">当前登录</span>') +
        '</div></td>' +
      '</tr>';
    }).join('');
    $('#usersMeta').textContent = '共 ' + users.length + ' 个账号';
  }
  function openUserDialog(username) {
    var form = $('#userForm');
    form.reset();
    editingUser = username || null;
    var u = username ? findUser(username) : null;
    $('#userDialogTitle').textContent = u ? '编辑账号' : '新增账号';
    var f = form.elements;
    f.username.value = u ? u.username : '';
    f.username.readOnly = !!u;
    f.name.value = u ? u.name : '';
    f.password.value = '';
    f.password.placeholder = u ? '留空则不修改密码' : '设置登录密码';
    f.role.value = u ? u.role : 'staff';
    $('#userDialog').showModal();
    setTimeout(function () { (u ? f.name : f.username).focus(); }, 30);
  }
  function saveUser(e) {
    e.preventDefault();
    var f = $('#userForm').elements;
    var username = f.username.value.trim(), name = f.name.value.trim(), password = f.password.value, role = f.role.value;
    if (!username || !name) { toast('登录名和姓名不能为空'); return; }
    if (editingUser) {
      var u = findUser(editingUser);
      if (!u) return;
      u.name = name;
      if (password) u.password = password;
      if (u.username === me.username && role !== 'admin') { toast('不能降级当前登录的管理员'); return; }
      u.role = role;
    } else {
      if (findUser(username)) { toast('登录名「' + username + '」已存在'); return; }
      if (!password) { toast('新账号必须设置密码'); return; }
      users.push({ username: username, password: password, name: name, role: role, createdAt: Date.now() });
    }
    saveUsers(); $('#userDialog').close(); renderUsers();
    toast(editingUser ? '账号已更新' : '账号已创建');
  }
  function deleteUser(username) {
    var u = findUser(username);
    if (!u) return;
    if (username === me.username) { toast('不能删除当前登录的账号'); return; }
    if (u.role === 'admin' && users.filter(function (x) { return x.role === 'admin'; }).length <= 1) {
      toast('系统至少要保留一个管理员'); return;
    }
    if (!confirm('删除账号「' + u.name + '（' + username + '）」？\n其保管的资产不会被删除，只是取消与账号的关联。')) return;
    users = users.filter(function (x) { return x.username !== username; });
    saveUsers(); renderUsers(); toast('账号已删除');
  }

  function renderAll() { renderAssets(); renderCount(); renderHistory(); renderUsers(); }
  function switchView(name) {
    if (!me) return;
    if (name !== 'count') stopCamera();
    $$('.tab').forEach(function (t) { t.classList.toggle('active', t.dataset.view === name); });
    $$('.view').forEach(function (v) { v.classList.toggle('hidden', v.id !== 'view-' + name); });
    if (name === 'count') renderCount();
    if (name === 'history') renderHistory();
    if (name === 'labels') renderLabelView();
    if (name === 'users') renderUsers();
  }
  function bind() {
    // 登录 / 退出
    $('#loginForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#loginName').value.trim(), pass = $('#loginPass').value;
      if (doLogin(name, pass)) { afterLogin(); toast('欢迎，' + me.name); }
      else { $('#loginError').textContent = '登录名或密码不正确'; $('#loginError').hidden = false; }
    });
    $('#btnLogout').addEventListener('click', doLogout);

    // 人员管理
    $('#btnAddUser').addEventListener('click', function () { openUserDialog(); });
    $('#userForm').addEventListener('submit', saveUser);
    $('#usersBody').addEventListener('click', function (e) {
      var b = e.target.closest('[data-uact]');
      if (!b) return;
      if (b.dataset.uact === 'edit') openUserDialog(b.dataset.id);
      if (b.dataset.uact === 'del') deleteUser(b.dataset.id);
    });

    // 盘点清单筛选
    $('#ckFilters').addEventListener('click', function (e) {
      var b = e.target.closest('[data-ck]');
      if (!b) return;
      ckFilter = b.dataset.ck;
      var c = currentCount();
      if (c) renderChecklist(c);
    });

    $('#tabs').addEventListener('click', function (e) {
      var t = e.target.closest('.tab');
      if (t) switchView(t.dataset.view);
    });
    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-close]');
      if (el) { var d = $('#' + el.dataset.close); if (d && d.open) d.close(); }
    });

    // 台账
    ['#assetSearch', '#filterStatus', '#filterLocation'].forEach(function (s) {
      $(s).addEventListener('input', renderAssets);
      $(s).addEventListener('change', renderAssets);
    });
    $('#btnAdd').addEventListener('click', function () { openAssetDialog(); });
    $('#btnAddEmpty').addEventListener('click', function () { openAssetDialog(); });
    $('#btnDemo').addEventListener('click', loadDemo);
    $('#assetForm').addEventListener('submit', saveAsset);

    // 资产照片：选择 / 更换 / 移除 / 预览
    $('#btnPickPhoto').addEventListener('click', function () { $('#assetPhotoInput').click(); });
    $('#btnReplacePhoto').addEventListener('click', function () { $('#assetPhotoInput').click(); });
    $('#assetPhotoInput').addEventListener('change', function (e) {
      if (e.target.files && e.target.files[0]) handlePhotoFile(e.target.files[0]);
      e.target.value = '';
    });
    $('#btnRemovePhoto').addEventListener('click', function () {
      pendingPhoto = ''; photoBusy = false; renderPhoto('');
      toast('照片已移除，保存后生效');
    });
    $('#photoThumb').addEventListener('click', function () {
      if (pendingPhoto) openPhoto(pendingPhoto, '资产照片');
    });
    $('#checkAll').addEventListener('change', function (e) {
      filteredAssets().forEach(function (a) {
        if (e.target.checked) selected.add(a.id); else selected.delete(a.id);
      });
      renderAssets();
    });
    $('#assetBody').addEventListener('change', function (e) {
      if (!e.target.classList.contains('row-check')) return;
      if (e.target.checked) selected.add(e.target.dataset.id); else selected.delete(e.target.dataset.id);
      renderAssets();
    });
    $('#assetBody').addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var id = b.dataset.id;
      if (b.dataset.act === 'qr') openQr(id);
      if (b.dataset.act === 'edit') openAssetDialog(id);
      if (b.dataset.act === 'del') deleteAsset(id);
      if (b.dataset.act === 'photo') {
        var pa = findAsset(id);
        if (pa && pa.photo) openPhoto(pa.photo, pa.name + '（' + pa.id + '）');
      }
    });
    $('#btnPrintLabels').addEventListener('click', function () {
      openLabelView(selected.size ? 'selected' : 'all');
    });
    $('#btnPrintOne').addEventListener('click', function () {
      $('#qrDialog').close();
      openLabelView('one', qrAssetId);
    });
    $('#btnExportAssets').addEventListener('click', exportAssetsCsv);
    $('#btnImport').addEventListener('click', function () { $('#fileCsv').click(); });
    $('#fileCsv').addEventListener('change', function (e) {
      if (e.target.files[0]) importCsv(e.target.files[0]);
      e.target.value = '';
    });
    $('#btnBackup').addEventListener('click', backup);
    $('#btnRestore').addEventListener('click', function () { $('#fileJson').click(); });
    $('#fileJson').addEventListener('change', function (e) {
      if (e.target.files[0]) restore(e.target.files[0]);
      e.target.value = '';
    });
    $('#btnHelp').addEventListener('click', function () { $('#helpDialog').showModal(); });

    // 盘点
    $('#scopeField').addEventListener('change', renderCountSetup);
    $('#scopeValue').addEventListener('change', renderCountSetup);
    $('#btnStartCount').addEventListener('click', startCount);
    $('#btnFinishCount').addEventListener('click', finishCount);
    $('#btnCancelCount').addEventListener('click', cancelCount);
    $('#btnCamera').addEventListener('click', startCamera);
    $('#btnStopCamera').addEventListener('click', stopCamera);
    $('#btnManual').addEventListener('click', function () { handleCode($('#manualCode').value); });
    $('#manualCode').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); handleCode($('#manualCode').value); }
    });

    // 标签模板与打印
    $('#tplPicker').addEventListener('click', function (e) {
      var card = e.target.closest ? e.target.closest('.tpl-card') : null;
      if (card) selectTemplate(card.getAttribute('data-id'));
    });
    ['#tplLabelW', '#tplLabelH', '#tplPageW', '#tplPageH', '#tplCols', '#tplGap',
      '#tplMargin', '#tplQr', '#tplFont', '#tplLayout', '#tplStyle', '#tplTitle', '#tplShowQr', '#tplFrame']
      .forEach(function (s) { $(s).addEventListener('change', applyTemplatePreview); });
    $('#tplFields').addEventListener('change', applyTemplatePreview);
    $('#btnTplApply').addEventListener('click', applyTemplatePreview);
    $('#btnTplSave').addEventListener('click', saveAsTemplate);
    $('#btnTplDelete').addEventListener('click', deleteTemplate);
    // 预览翻页与缩放
    $('#btnPrevPage').addEventListener('click', function () { if (previewPage > 1) { previewPage--; renderLabelPreview(); } });
    $('#btnNextPage').addEventListener('click', function () { previewPage++; renderLabelPreview(); });
    $('#btnZoomIn').addEventListener('click', function () {
      zoomLevel = Math.min(3, (zoomFit ? 1 : zoomLevel) + 0.25); zoomFit = false; renderLabelPreview();
    });
    $('#btnZoomOut').addEventListener('click', function () {
      zoomLevel = Math.max(0.25, (zoomFit ? 1 : zoomLevel) - 0.25); zoomFit = false; renderLabelPreview();
    });
    $('#btnZoomFit').addEventListener('click', function () { zoomFit = true; renderLabelPreview(); });
    $('#labelScope').addEventListener('change', function (e) {
      if (e.target.name !== 'labelScope') return;
      labelScope = e.target.value;
      renderLabelScope(); renderLabelPreview();
    });
    $('#labelOneAsset').addEventListener('change', function (e) {
      labelOneId = e.target.value; renderLabelPreview();
    });
    $('#btnStdPrint').addEventListener('click', function () { stdPrint(false); });
    $('#btnPrintTest').addEventListener('click', function () { stdPrint(true); });
    $('#btnSerialConnect').addEventListener('click', serialConnect);
    $('#btnSerialClose').addEventListener('click', serialDisconnect);
    $('#btnSerialPrint').addEventListener('click', function () { serialPrint(false); });
    $('#btnSerialTest').addEventListener('click', function () { serialPrint(true); });

    // 记录
    $('#btnGoCount').addEventListener('click', function () { switchView('count'); });
    $('#historyList').addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var id = b.dataset.id;
      if (b.dataset.act === 'view') showResult(id);
      if (b.dataset.act === 'export') exportResult(id);
      if (b.dataset.act === 'del') {
        if (!confirm('删除这条盘点记录？')) return;
        counts = counts.filter(function (c) { return c.id !== id; });
        if (resultId === id) resultId = null;
        persist(); renderHistory(); toast('记录已删除');
      }
    });
    $('#btnExportResult').addEventListener('click', function () {
      if (resultId) exportResult(resultId);
    });
    window.addEventListener('beforeunload', stopCamera);
  }

  /* ================= 启动 ================= */
  initCameraEls();
  if (!window.BarcodeDetector && typeof jsQR !== 'function') {
    $('#cameraHint').textContent = '识别组件未加载，可用手动输入完成盘点。';
  } else if (location.protocol === 'file:') {
    $('#cameraHint').textContent = '直接打开文件时摄像头可能受限，建议通过 localhost 访问；也可用手动输入。';
  }
  $('#countName').placeholder = fmtTime(Date.now()).slice(0, 10) + ' 盘点';
  ensureAdminAccount();
  bind();
  initSerialUI();
  // 有会话直接进入，否则停在登录门
  if (me && findUser(me.username) && findUser(me.username).password) {
    afterLogin();
  } else {
    me = null;
    try { localStorage.removeItem(KEY_SESSION); } catch (e) { /* 忽略 */ }
    showGate();
  }
})();

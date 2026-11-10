// 把 index.html + styles.css + app.js + vendor 打包成自包含的「资产管理.html」
// 用法：node build-standalone.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(dir, p), 'utf8');
const scriptTag = (code) => '<script>\n' + code.replace(/<\/script/gi, '<\\/script') + '\n</script>';

let html = read('index.html');
const css = read('styles.css');
const libs = [read('vendor/qrcode.js'), read('vendor/jsQR.js'), read('app.js')];

const cssLink = '<link rel="stylesheet" href="styles.css">';
const scriptLinks = '<script src="vendor/qrcode.js"></script>\n' +
  '<script src="vendor/jsQR.js"></script>\n' +
  '<script src="app.js"></script>';
if (!html.includes(cssLink) || !html.includes(scriptLinks)) {
  throw new Error('index.html 结构与预期不符，请检查是否改动过资源引用');
}

// 必须用函数式 replacement：库代码中含 '$'、$& 等字符，字符串替换会被误解析
html = html.replace(cssLink, () => '<style>\n' + css + '\n</style>');
html = html.replace(scriptLinks, () => libs.map(scriptTag).join('\n'));
html = html.replace('<title>', '<!-- 单文件版：样式、脚本与二维码库已全部内嵌，双击即可使用 -->\n<title>');

const out = join(dir, '资产管理.html');
writeFileSync(out, html, 'utf8');
console.log('已生成', out, (Buffer.byteLength(html) / 1024).toFixed(0) + ' KB');

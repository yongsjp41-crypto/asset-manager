# 部署指南

本文档说明如何把资产管理应用部署到一台自己的服务器，包括 HTTPS、资产照片上传接口（WebDAV `PUT`）与安全加固建议。

文中所有域名、IP、证书路径均为占位符，请替换为你的实际值：`example.com`、`<your-server-ip>`、`/var/www/asset-manager`。

## 部署形态

应用是纯静态站点，只需要一个能把文件吐给浏览器的 Web 服务器。但有两个额外要求：

1. **必须 HTTPS**。摄像头（`getUserMedia`）、Web Serial、剪贴板等能力都要求安全上下文，`http://` 下扫码和串口不可用。
2. **需要一个接收 `PUT` 的 `/uploads/` 目录**，否则资产照片只能以 dataURL 形式存在浏览器里（功能自动降级，台账不受影响）。

照片上传的请求形态（见 `app.js` 的 `uploadPhoto()`）：

```
PUT /uploads/ZC-20261110-001-1762749600000.jpg
Content-Type: image/jpeg
<约 40KB 的 JPEG 二进制>
```

成功判定为 `2xx`，返回后页面把相对路径 `uploads/<文件名>` 存进资产记录。因此服务器端只要支持对这些路径的 `PUT` 写入即可，不需要任何应用层逻辑。

## 准备目录

```bash
sudo mkdir -p /var/www/asset-manager/uploads
sudo rsync -av --delete \
  --exclude '.git' --exclude 'node_modules' \
  ./ /var/www/asset-manager/
sudo chown -R www-data:www-data /var/www/asset-manager/uploads
sudo chmod 755 /var/www/asset-manager
```

`uploads/` 需要 Web 服务器用户可写；其余文件只读即可。不要把 `uploads/` 放在站点根目录之外再用别名暴露，路径必须与前端拼出的 `uploads/<name>` 一致。

如果希望照片不随代码发布被覆盖，`rsync --delete` 时请加上 `--exclude 'uploads'`，或把上传目录改为独立挂载点。

## Nginx 配置

需要 `http_dav_module`（多数发行版的 nginx 包已编译进去）。先确认：

```bash
nginx -V 2>&1 | tr ' ' '\n' | grep with-http_dav_module
```

没有输出的话，需要重新编译或改用 Apache / Caddy 的等价方案。

`/etc/nginx/conf.d/asset-manager.conf`：

```nginx
# HTTP 全部跳转 HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name example.com;

    root /var/www/asset-manager;
    index index.html;
    server_tokens off;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_session_cache   shared:SSL:10m;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "same-origin" always;

    # 单张照片约 40KB，留出充足余量但不要无限放大
    client_max_body_size 4m;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 入口页不缓存，避免更新后仍加载旧版脚本
    location = /index.html {
        add_header Cache-Control "no-cache";
    }

    location ~* \.(css|js)$ {
        add_header Cache-Control "public, max-age=3600";
    }

    # 上传目录：禁止列目录，未命中文件直接 404
    location /uploads/ {
        autoindex off;
    }

    # 只有这些后缀允许 PUT 写入
    location ~ "^/uploads/[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp)$" {
        dav_methods PUT;
        create_full_put_path on;
        dav_access user:rw group:r all:r;
        client_max_body_size 2m;
        autoindex off;
        # 文件名含时间戳，可长缓存
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # 隐藏文件与备份文件不对外
    location ^~ /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }
    location ~ /\..* {
        deny all;
    }
    location ~* \.(bak|sql|log|env)$ {
        deny all;
    }
}
```

> `http2 on;` 需要 nginx 1.25.1 及以上；更早的版本改为 `listen 443 ssl http2;`，并在升级后切回新语法（旧的 `listen ... http2` 已被标记为废弃）。

要点说明：

- 正则 location 的优先级高于普通前缀 location，因此 `/uploads/xxx.jpg` 会命中允许 `PUT` 的那条，`/uploads/` 下的其他路径落到前缀规则并被 `autoindex off` 保护。
- `create_full_put_path on` 允许自动创建子目录；`dav_access` 决定新文件的权限。
- 不要在这条 location 里加 `try_files`，`try_files` 与 `PUT` 组合会因为目标文件不存在而返回 404，导致上传全部失败。
- 上传目录里只应出现图片。若需要更强限制，可在反向代理层校验 `Content-Type`。

重载并验证：

```bash
sudo nginx -t && sudo systemctl reload nginx

# 上传一张测试图（本地任意 jpg）
curl -i -X PUT --data-binary @test.jpg \
  -H 'Content-Type: image/jpeg' \
  https://example.com/uploads/test-$(date +%s).jpg
# 期望返回 201 或 204

# 非图片后缀应被拒绝
curl -i -X PUT --data-binary @test.txt https://example.com/uploads/shell.php
# 期望 403 或 405
```

## 安全加固建议

默认配置下 `/uploads/` 的写入是开放的，任何能访问站点的人都可以往里塞文件。生产环境请至少按需选择以下几项：

**限制来源**：如果只有固定办公网访问，用 `allow` / `deny` 或防火墙白名单限制整个站点，而不是只限制上传目录。

```nginx
location ~ "^/uploads/[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp)$" {
    allow 203.0.113.0/24;   # 示例网段
    deny all;
    # ……其余同上
}
```

**限速**：在 `http` 块定义 `limit_req_zone $binary_remote_addr zone=upload:10m rate=30r/m;`，再在上传 location 中加 `limit_req zone=upload burst=10 nodelay;`。

**关于 HTTP Basic Auth**：页面用 `XMLHttpRequest` 发 `PUT`，不会像导航请求那样弹出登录框，加 `auth_basic` 后上传统一会以 401 失败。若必须加认证，建议在反向代理层用带 token 的校验，或改为同源会话 Cookie 校验的自建接口，而不是直接把 `auth_basic` 套在 `uploads/` 上。

**其他**：

- 关闭目录列表（`autoindex off` / `Options -Indexes`），不要在 `uploads/` 下放置任何可执行脚本，并确保该目录不解析 PHP 等动态语言。
- 定期清理孤儿文件：资产删除或照片替换后，旧文件不会被自动删除。可定期比对台账备份 JSON 中的 `photo` 字段与目录实际内容，删除无引用的文件。
- 备份服务器侧的 `uploads/` 目录，与用户导出的 JSON 备份一起归档；只备份 JSON 会在恢复后丢照片。
- 全站使用 HSTS，并确保 `example.com` 及其子域都能走 HTTPS。
- 站点若对公网开放，请第一时间修改默认管理员密码，并为每个人建立独立账号。

## Apache 等价配置

需要 `mod_dav`、`mod_dav_fs`、`mod_ssl`、`mod_headers`、`mod_rewrite`：

```apache
<VirtualHost *:443>
    ServerName example.com
    DocumentRoot /var/www/asset-manager

    SSLEngine on
    SSLCertificateFile    /etc/letsencrypt/live/example.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/example.com/privkey.pem
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"

    LimitRequestBody 2097152

    <Directory /var/www/asset-manager>
        Require all granted
        Options -Indexes
        AllowOverride None
        DirectoryIndex index.html
    </Directory>

    <Directory /var/www/asset-manager/uploads>
        Dav On
        Options -Indexes
        <LimitExcept GET HEAD OPTIONS PUT>
            Require all denied
        </LimitExcept>
    </Directory>

    # 只放行图片后缀的 PUT
    RewriteEngine On
    RewriteCond %{REQUEST_METHOD} =PUT
    RewriteCond %{REQUEST_URI} !^/uploads/[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp)$
    RewriteRule ^ - [F]
</VirtualHost>
```

`Dav On` 需要目录对 Apache 运行用户可写：`sudo chown -R www-data:www-data /var/www/asset-manager/uploads`。

## Caddy 等价配置

Caddy 的 `file_server` 本身不支持写入，需要编译 [caddy-webdav](https://github.com/mholt/caddy-webdav) 插件：

```bash
xcaddy build --with github.com/mholt/caddy-webdav
```

`Caddyfile`：

```caddyfile
example.com {
    root * /var/www/asset-manager
    encode gzip

    header Strict-Transport-Security "max-age=31536000; includeSubDomains"
    header /uploads/* Cache-Control "public, max-age=31536000, immutable"

    @upload {
        method PUT
        path_regexp upload ^/uploads/[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp)$
    }
    handle @upload {
        webdav
    }

    handle /uploads/* {
        file_server
    }

    handle {
        try_files {path} /index.html
        file_server
    }
}
```

## GitHub Pages / 其他静态托管

GitHub Pages、Netlify、Vercel 等平台不支持 `PUT` 写入静态目录，只适合演示。仓库自带的 `pages.yml` 会在 `main` 分支更新后发布站点，仓库 **Settings → Pages → Source** 选择 **GitHub Actions** 即可启用。

这类环境下照片会退化为 localStorage 中的 dataURL，只有当前浏览器能看到；更换设备或清理缓存后照片丢失，而 JSON 备份里保存的正是这些 dataURL，所以备份仍然有效。

## 部署后检查清单

1. 用 HTTPS 打开站点，确认地址栏是小锁，没有混合内容告警。
2. 修改 `admin` 默认密码，创建至少一个 `staff` 账号并验证其只能看到本人保管的资产。
3. 新增一条资产并上传照片，确认提示「已上传服务器」，且 `uploads/` 下出现对应文件。
4. 用手机浏览器打开「扫码盘点」，确认摄像头授权与识别正常。
5. 打印一张测试标签，确认纸张尺寸与边距正确。
6. 导出一次 JSON 备份，确认文件可下载且能被重新导入。

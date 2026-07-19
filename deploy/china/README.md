# GRIPLAB 中国大陆部署说明

这套版本不依赖 `chatgpt.site` 域名，可部署到腾讯云或阿里云。鼠标数据库、模具 SVG、页面样式和封面图都随站点一起部署；浏览器只访问你自己的域名。

## 两种上线方式

### 方案 A：先上线（香港节点）

购买腾讯云轻量应用服务器的中国香港地域，绑定自己的域名。非中国大陆节点无需 ICP 备案即可解析，但大陆访问速度和稳定性不能等同于大陆节点。

### 方案 B：正式稳定版（推荐）

购买腾讯云中国大陆地域轻量应用服务器，完成域名实名认证和 ICP 备案，再解析并开放网站。大陆节点未备案时不能提前开放访问。

## 服务器要求

- Ubuntu 22.04/24.04 或同类 Linux
- Docker 与 Docker Compose
- Nginx
- 2 GB 内存起步
- 已解析到服务器的域名

## 环境配置

在仓库根目录创建 `.env`：

```env
NEXT_PUBLIC_SITE_URL=https://mouse.example.com
MOUSE_IMAGE_ORIGIN=https://qyjffrmfirkwcwempawu.supabase.co/storage/v1/render/image/public/images/products/
```

`NEXT_PUBLIC_SITE_URL` 改成正式域名。`MOUSE_IMAGE_ORIGIN` 是服务器端商品图来源，用户浏览器不会直接访问它。为了彻底本地化图片，可把已获授权的图片同步到腾讯云 COS 或阿里云 OSS，然后把它改成对应目录；文件名需与 `public/mice-database.json` 的 `image` 字段一致。

## 启动

```bash
docker compose -f docker-compose.china.yml up -d --build
curl -I http://127.0.0.1:3000
```

容器只监听本机 `3000` 端口，不直接暴露到公网。把 `deploy/china/nginx.conf` 中的 `mouse.example.com` 和证书路径改成真实值，再启用 Nginx。

## 上线验收

```bash
curl -I https://你的域名/
curl -I "https://你的域名/api/mouse-image?file=finalmouse-starlight-x.png&size=560"
```

同时用中国移动、中国联通和中国电信网络分别测试首页、搜索、详情、参数对比、模具对比和商品图。大陆服务器上线后，应在页脚展示 ICP 备案号。

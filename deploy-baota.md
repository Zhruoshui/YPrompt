# 宝塔面板部署指南

本文档详细说明如何将 YPrompt 项目部署到装有宝塔面板的服务器上。

## 准备工作

### 1. 本地构建项目
在本地开发环境中构建项目：

```bash
# 安装依赖
npm install

# 构建生产版本
npm run build
```

构建完成后，`dist` 目录包含所有需要部署的静态文件。

### 2. 服务器要求
- 已安装宝塔面板
- Nginx 或 Apache 服务器
- 支持静态文件服务

## 部署步骤

### 第一步：上传文件

1. **压缩构建产物**
   ```bash
   # 在项目根目录下
   powershell Compress-Archive -Path "dist\*" -DestinationPath "yprompt-dist.zip"
   ```

2. **上传到服务器**
   - 登录宝塔面板
   - 进入"文件管理"
   - 导航到 `/www/wwwroot/` 目录
   - 创建新文件夹，例如 `yprompt.yourdomain.com`
   - 上传 `yprompt-dist.zip` 到该文件夹
   - 解压文件到当前目录

### 第二步：创建网站

1. **添加站点**
   - 在宝塔面板点击"网站" → "添加站点"
   - 域名：填入您的域名（如 `yprompt.yourdomain.com`）
   - 根目录：选择刚才创建的目录 `/www/wwwroot/yprompt.yourdomain.com`
   - PHP版本：选择"纯静态"
   - 点击"提交"

2. **配置网站设置**
   - 点击站点右侧的"设置"
   - 进入"网站目录"设置
   - 确认运行目录为根目录 `/`
   - 确认默认文档包含 `index.html`

### 第三步：配置 Nginx 重写规则（重要）

由于 YPrompt 是单页应用(SPA)，需要配置 URL 重写规则：

1. **添加 Nginx 配置**
   - 在网站设置中点击"伪静态"
   - 选择"自定义"
   - 添加以下规则：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}

# 静态资源缓存
location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# API代理（如果需要解决跨域问题）
location /api/ {
    # 如果您的API需要代理，可以在这里配置
    # proxy_pass http://your-api-server;
}
```

2. **保存配置并重载 Nginx**
   - 保存伪静态规则
   - 重启 Nginx 服务

### 第四步：配置 HTTPS（推荐）

1. **申请 SSL 证书**
   - 在网站设置中点击"SSL"
   - 选择"Let's Encrypt" 免费证书
   - 或上传您的自定义证书

2. **强制 HTTPS**
   - 开启"强制HTTPS"选项
   - 确保证书状态为"有效"

### 第五步：域名解析

在您的域名服务商处添加 A 记录：
- 主机记录：`yprompt`（如果是子域名）或 `@`（如果是主域名）
- 记录类型：`A`
- 记录值：您服务器的公网IP地址
- TTL：`600`

## 验证部署

1. **访问网站**
   - 打开浏览器访问您的域名
   - 系统将自动跳转到登录页面
   - 验证登录功能是否正常

2. **测试登录功能**
   - 默认用户名：`admin`
   - 默认密码：`YPrompt2025!`
   - 登录成功后进入主界面
   - **重要：部署后立即修改默认密码**

3. **检查控制台**
   - 按 F12 打开开发者工具
   - 检查是否有 404 或其他错误
   - 确认静态资源正常加载

## 常见问题解决

### 问题1：页面刷新后出现404错误
**原因**：SPA应用的路由问题
**解决**：确保已正确配置 nginx 重写规则（第三步）

### 问题2：静态资源加载失败
**原因**：路径配置问题
**解决**：
1. 检查 `dist/index.html` 中的资源路径
2. 确保网站根目录配置正确

### 问题3：API请求跨域错误
**原因**：浏览器跨域限制
**解决**：
1. 在 nginx 配置中添加 CORS 头：
```nginx
location /api/ {
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
    add_header Access-Control-Allow-Headers 'Content-Type, Authorization';
    
    if ($request_method = 'OPTIONS') {
        return 204;
    }
}
```

## 自动化部署脚本

为了方便后续更新，可以创建自动化部署脚本：

### Windows PowerShell 脚本
```powershell
# deploy.ps1
Write-Host "开始构建项目..."
npm run build

Write-Host "压缩构建产物..."
Compress-Archive -Path "dist\*" -DestinationPath "yprompt-dist.zip" -Force

Write-Host "构建完成！请上传 yprompt-dist.zip 到服务器并解压。"
```

### 使用方法
```bash
# 运行部署脚本
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

## 性能优化建议

1. **启用 Gzip 压缩**
   - 在宝塔面板的"网站设置" → "性能优化"中开启 Gzip

2. **配置缓存**
   - 静态资源设置长期缓存
   - HTML文件设置较短缓存时间

3. **CDN 加速**（可选）
   - 配置CDN服务加速静态资源访问
   - 在宝塔面板中可以集成多种CDN服务

## 监控和维护

1. **日志监控**
   - 定期检查 Nginx 访问日志和错误日志
   - 关注异常请求和错误

2. **备份策略**
   - 定期备份网站文件
   - 备份数据库（如果有）

3. **安全设置**
   - 定期更新系统和软件
   - 配置防火墙规则
   - 启用宝塔面板的安全设置

## 更新部署

后续更新项目时，只需：
1. 本地执行 `npm run build`
2. 上传新的构建文件覆盖旧文件
3. 清除浏览器缓存测试

---

部署完成后，您的 YPrompt 应用就可以通过域名正常访问了！
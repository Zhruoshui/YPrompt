# CentOS7 服务器安全配置指南

本文档为 YPrompt 应用在 CentOS7 服务器上的安全配置提供详细指导。

## 服务器基础安全配置

### 1. 系统更新
```bash
# 更新系统到最新版本
sudo yum update -y

# 安装必要的安全工具
sudo yum install -y epel-release
sudo yum install -y fail2ban iptables-services
```

### 2. 防火墙配置

#### 使用 firewalld（推荐）
```bash
# 启动并启用防火墙
sudo systemctl start firewalld
sudo systemctl enable firewalld

# 只开放必要的端口
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh

# 如果使用自定义端口
sudo firewall-cmd --permanent --add-port=8080/tcp

# 重载配置
sudo firewall-cmd --reload

# 查看开放的端口
sudo firewall-cmd --list-all
```

#### 或使用 iptables
```bash
# 停用firewalld，启用iptables
sudo systemctl stop firewalld
sudo systemctl disable firewalld
sudo systemctl start iptables
sudo systemctl enable iptables

# 基本iptables规则
sudo iptables -F
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP
sudo iptables -P OUTPUT ACCEPT

# 允许本地回环
sudo iptables -A INPUT -i lo -j ACCEPT

# 允许已建立的连接
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# 允许SSH（注意端口）
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# 允许HTTP和HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# 保存规则
sudo service iptables save
```

### 3. SSH 安全配置

编辑SSH配置文件：
```bash
sudo vi /etc/ssh/sshd_config
```

推荐配置：
```bash
# 禁用root直接登录
PermitRootLogin no

# 更改默认端口（可选）
Port 2222

# 禁用密码登录，强制使用密钥
PasswordAuthentication no
PubkeyAuthentication yes

# 限制登录尝试
MaxAuthTries 3
MaxSessions 5

# 禁用空密码
PermitEmptyPasswords no

# 禁用X11转发
X11Forwarding no

# 设置登录超时
LoginGraceTime 60
```

重启SSH服务：
```bash
sudo systemctl restart sshd
```

### 4. Fail2Ban 配置

创建配置文件：
```bash
sudo vi /etc/fail2ban/jail.local
```

添加以下配置：
```ini
[DEFAULT]
# 封禁时间（秒）
bantime = 3600
# 查找时间窗口（秒）
findtime = 600
# 最大尝试次数
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/secure
maxretry = 3
bantime = 7200

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
```

启动Fail2Ban：
```bash
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# 查看状态
sudo fail2ban-client status
```

## 宝塔面板安全配置

### 1. 更改默认端口
```bash
# 编辑宝塔配置
sudo vi /www/server/panel/data/port.pl

# 将8888改为其他端口，如9999
echo '9999' > /www/server/panel/data/port.pl

# 重启宝塔
sudo /etc/init.d/bt restart
```

### 2. 设置面板SSL
在宝塔面板中：
1. 进入"面板设置"
2. 开启"面板SSL"
3. 上传SSL证书或使用Let's Encrypt

### 3. IP访问限制
```bash
# 在宝塔面板中设置IP白名单
# 面板设置 -> 安全设置 -> 授权IP
```

### 4. 定期备份
设置自动备份策略：
- 网站数据每日备份
- 数据库每日备份
- 保留7天备份
- 异地备份（推荐）

## Nginx 安全配置

### 1. 基本安全配置

编辑nginx配置：
```bash
sudo vi /www/server/nginx/conf/nginx.conf
```

添加安全头：
```nginx
# 在http块中添加
add_header X-Frame-Options SAMEORIGIN;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'";

# 隐藏Nginx版本
server_tokens off;

# 限制请求大小
client_max_body_size 10M;
client_body_buffer_size 128k;

# 超时设置
client_body_timeout 12;
client_header_timeout 12;
send_timeout 10;

# 限制连接数
limit_conn_zone $binary_remote_addr zone=addr:10m;
limit_req_zone $binary_remote_addr zone=req:10m rate=5r/s;
```

### 2. 站点特定配置

为YPrompt站点添加安全配置：
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # 应用限制
    limit_conn addr 10;
    limit_req zone=req burst=10 nodelay;
    
    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # 禁止访问敏感文件
    location ~ /\. {
        deny all;
    }
    
    location ~ \.(md|json|txt)$ {
        deny all;
    }
    
    # API频率限制（如果有后端API）
    location /api/ {
        limit_req zone=req burst=5 nodelay;
        # 其他API配置
    }
    
    # 静态资源缓存和安全
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
    }
    
    # SPA路由配置
    location / {
        try_files $uri $uri/ /index.html;
        add_header X-Frame-Options SAMEORIGIN;
    }
}

# HTTP重定向到HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 系统监控和日志

### 1. 日志监控

安装logwatch：
```bash
sudo yum install -y logwatch

# 配置每日邮件报告
sudo vi /etc/logwatch/conf/logwatch.conf
```

### 2. 系统资源监控

安装htop和iotop：
```bash
sudo yum install -y htop iotop
```

设置crontab监控：
```bash
# 每小时检查系统负载
0 * * * * /usr/bin/uptime >> /var/log/system-load.log

# 每日检查磁盘空间
0 6 * * * /bin/df -h > /var/log/disk-usage.log
```

### 3. 安全扫描

安装rkhunter：
```bash
sudo yum install -y rkhunter

# 配置并运行扫描
sudo rkhunter --update
sudo rkhunter --check

# 设置定期扫描
echo "0 3 * * * /usr/bin/rkhunter --check --quiet" | sudo crontab -
```

## 数据备份策略

### 1. 应用备份脚本

创建备份脚本：
```bash
sudo vi /root/backup-yprompt.sh
```

```bash
#!/bin/bash
# YPrompt应用备份脚本

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/yprompt"
WEB_DIR="/www/wwwroot/your-domain.com"
LOG_FILE="/var/log/yprompt-backup.log"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份网站文件
echo "$(date): Starting backup..." >> $LOG_FILE
tar -czf $BACKUP_DIR/yprompt_$DATE.tar.gz -C $WEB_DIR .

# 清理7天前的备份
find $BACKUP_DIR -name "yprompt_*.tar.gz" -mtime +7 -delete

# 验证备份
if [ -f "$BACKUP_DIR/yprompt_$DATE.tar.gz" ]; then
    echo "$(date): Backup successful - yprompt_$DATE.tar.gz" >> $LOG_FILE
else
    echo "$(date): Backup failed!" >> $LOG_FILE
fi
```

设置执行权限并添加到crontab：
```bash
sudo chmod +x /root/backup-yprompt.sh

# 每日凌晨2点备份
echo "0 2 * * * /root/backup-yprompt.sh" | sudo crontab -
```

### 2. 远程备份（推荐）

配置rsync同步到远程服务器：
```bash
# 安装rsync
sudo yum install -y rsync

# 创建远程备份脚本
sudo vi /root/remote-backup.sh
```

```bash
#!/bin/bash
REMOTE_HOST="backup-server.com"
REMOTE_USER="backup"
LOCAL_BACKUP="/backup/yprompt"
REMOTE_BACKUP="/backup/yprompt"

# 同步到远程服务器
rsync -avz --delete $LOCAL_BACKUP/ $REMOTE_USER@$REMOTE_HOST:$REMOTE_BACKUP/

echo "$(date): Remote backup completed" >> /var/log/remote-backup.log
```

## 应用级安全建议

### 1. 登录配置优化

对于YPrompt应用，建议：

```javascript
// 在生产环境中修改默认配置
const productionConfig = {
  username: 'your_secure_username',  // 不要使用admin
  password: 'Your_Very_Strong_P@ssw0rd_2025!',  // 至少16位强密码
  sessionTimeout: 30,  // 30分钟超时
  maxLoginAttempts: 3,  // 最多3次登录尝试
  lockoutDuration: 15  // 锁定15分钟
}
```

### 2. 环境变量配置

创建安全的环境配置：
```bash
# 在服务器上创建配置文件
sudo vi /etc/yprompt/config.json
```

```json
{
  "auth": {
    "username": "your_admin_username",
    "password": "your_strong_password",
    "sessionTimeout": 30,
    "maxAttempts": 3,
    "lockoutTime": 900
  },
  "security": {
    "corsOrigins": ["https://your-domain.com"],
    "rateLimits": {
      "windowMs": 900000,
      "max": 100
    }
  }
}
```

设置正确的权限：
```bash
sudo chmod 600 /etc/yprompt/config.json
sudo chown root:root /etc/yprompt/config.json
```

## 定期安全检查清单

### 每周检查
- [ ] 检查系统更新
- [ ] 查看fail2ban日志
- [ ] 检查磁盘空间
- [ ] 验证备份文件

### 每月检查
- [ ] 更新密码
- [ ] 审查访问日志
- [ ] 检查SSL证书状态
- [ ] 运行安全扫描

### 每季度检查
- [ ] 审查用户权限
- [ ] 更新安全策略
- [ ] 测试备份恢复
- [ ] 检查防火墙规则

## 应急响应计划

### 安全事件响应步骤

1. **立即响应**
   ```bash
   # 立即封禁可疑IP
   sudo firewall-cmd --add-rich-rule="rule family='ipv4' source address='SUSPICIOUS_IP' reject"
   
   # 检查当前连接
   sudo netstat -an | grep :80
   sudo netstat -an | grep :443
   ```

2. **日志分析**
   ```bash
   # 检查访问日志
   sudo tail -f /var/log/nginx/access.log
   
   # 检查错误日志
   sudo tail -f /var/log/nginx/error.log
   
   # 检查系统日志
   sudo tail -f /var/log/secure
   ```

3. **系统加固**
   ```bash
   # 强制重启所有会话
   sudo pkill -u www-data
   
   # 重启服务
   sudo systemctl restart nginx
   sudo systemctl restart php-fpm
   ```

### 紧急联系信息

准备应急联系清单：
- 系统管理员联系方式
- 云服务商技术支持
- 域名服务商联系方式
- 备份服务商联系方式

## 总结

通过实施上述安全措施，您的YPrompt应用将获得多层次的安全保护：

1. **系统级安全**：防火墙、fail2ban、SSH加固
2. **应用级安全**：Nginx安全配置、访问控制
3. **数据安全**：定期备份、远程备份
4. **监控告警**：日志监控、系统监控
5. **应急响应**：事件响应计划、快速恢复

定期检查和更新这些安全配置，确保您的应用始终处于最佳安全状态。
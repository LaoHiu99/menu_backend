# Menu Backend 部署文档

## 服务器信息

- **服务器 IP**: 121.5.38.196
- **SSH 用户**: ubuntu
- **SSH 密码**: 2695428183@He

## 部署架构

```
用户请求
    ↓
Nginx (huiwen_nginx 容器, 443端口)
    ↓ /coco-menu/
Docker 网桥 (172.17.0.1)
    ↓
Menu Backend (menu_backend 容器, 3001端口)
    ↓
MySQL (mysql8 容器, 43306端口)
```

## 服务地址

| 服务 | 地址 |
|------|------|
| 后端 API | https://it.hua-cong.com/coco-menu/ |
| 直接访问 | http://121.5.38.196:3001/ |

## 一键部署

```bash
# 1. 本地构建并上传镜像
docker build -t menu-backend:latest .
docker save menu-backend:latest | ssh ubuntu@121.5.38.196 "docker load"

# 2. SSH 到服务器
ssh ubuntu@121.5.38.196

# 3. 停止旧容器
sudo docker stop menu_backend
sudo docker rm menu_backend

# 4. 启动新容器
sudo docker run -d \
  --name menu_backend \
  --restart unless-stopped \
  -p 3001:3001 \
  --env-file .env.production \
  menu-backend:latest
```

## 环境变量 (.env.production)

```env
PORT=3001

DB_HOST=121.5.38.196
DB_PORT=43306
DB_USERNAME=root
DB_PASSWORD=sangon@He
DB_DATABASE=menu_system

JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

## Nginx 反向代理配置

文件位置：`/opt/mianjingbao/nginx/nginx.conf`

```nginx
location /coco-menu/ {
    proxy_pass http://172.17.0.1:3001/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 30s;
    proxy_read_timeout 60s;
}
```

修改配置后重启 Nginx：
```bash
sudo docker restart huiwen_nginx
```

## 常用命令

```bash
# 查看容器状态
sudo docker ps | grep menu_backend

# 查看日志
sudo docker logs -f menu_backend

# 重启服务
sudo docker restart menu_backend

# 进入容器
sudo docker exec -it menu_backend sh
```

## 数据库

- **容器名**: mysql8
- **端口映射**: 43306
- **连接**: mysql -h 127.0.0.1 -P 43306 -u root -p

## 故障排查

1. **502 Bad Gateway**: 检查后端容器是否运行 `sudo docker ps | grep menu_backend`
2. **连接数据库失败**: 检查 MySQL 容器状态 `sudo docker ps | grep mysql8`
3. **Nginx 配置未生效**: 重启容器 `sudo docker restart huiwen_nginx`

# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖（包括 devDependencies 用于构建）
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM node:20-alpine AS production

WORKDIR /app

# 创建非 root 用户 (alpine 版本)
RUN apk add --no-cache shadow && \
    groupmod -g 1001 nodejs 2>/dev/null || true && \
    useradd -r -u 1001 -g nodejs -s /bin/sh -d /app nestjs || \
    (addgroup -g 1001 nodejs && adduser -S nestjs -u 1001 -G nodejs)

# 复制 package 文件并只安装生产依赖
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 复制构建产物
COPY --from=builder /app/dist ./dist

# 设置上传目录
RUN mkdir -p /app/uploads && chown -R nestjs:nodejs /app

# 切换到非 root 用户
USER nestjs

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/main"]

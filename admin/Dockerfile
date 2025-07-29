# 使用Node.js官方镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制后端package文件
COPY package*.json ./

# 安装后端依赖
RUN npm ci --only=production

# 复制后端应用代码
COPY . .

# 安装客户端依赖并构建
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
RUN npm run build

# 返回主目录
WORKDIR /app

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 设置权限
RUN chown -R nextjs:nodejs /app
USER nextjs

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 启动应用
CMD ["npm", "start"]
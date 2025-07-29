#!/bin/bash

# MarksForest 一体化部署脚本
set -e

echo "🚀 开始部署 MarksForest 一体化服务..."

# 检查Docker和Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    echo "   Mac: https://docs.docker.com/desktop/install/mac-install/"
    echo "   Windows: https://docs.docker.com/desktop/install/windows-install/"
    echo "   Linux: https://docs.docker.com/engine/install/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 创建默认配置文件
if [ ! -f .env ]; then
    echo "📝 创建默认配置文件..."
    cat > .env << EOF
# JWT密钥
JWT_SECRET=$(openssl rand -base64 32)

# 管理员密码
ADMIN_PASSWORD=admin123

# 书签文件路径
BOOKMARKS_FILE_PATH=/app/json/marksforest.json

# 服务器配置
PORT=3001
NODE_ENV=production
EOF
    echo "✅ 配置文件已创建"
fi

# 确保书签文件存在
if [ ! -f json/marksforest.json ]; then
    echo "📁 创建书签数据文件..."
    mkdir -p json
    cat > json/marksforest.json << EOF
{
  "bookmarks": [],
  "folders": [],
  "lastUpdated": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)"
}
EOF
    echo "✅ 书签文件已创建"
fi

# 设置文件权限
chmod 644 json/marksforest.json

# 构建并启动服务
echo "🏗️  构建一体化Docker镜像..."
docker-compose down --remove-orphans 2>/dev/null || true
docker-compose build --no-cache

echo "🚀 启动一体化服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
if docker-compose ps | grep -q "Up"; then
    echo "✅ 一体化服务已成功启动！"
    echo ""
    echo "🌐 访问地址："
    echo "   前台网站: http://localhost:8080"
    echo "   管理后台: http://localhost:8080/admin"
    echo ""
    echo "🔑 管理员登录："
    echo "   密码: $(grep ADMIN_PASSWORD .env | cut -d'=' -f2)"
    echo ""
    echo "📋 常用命令："
    echo "   查看日志: docker-compose logs -f"
    echo "   停止服务: docker-compose down"
else
    echo "❌ 服务启动失败，请检查日志："
    docker-compose logs
    exit 1
fi
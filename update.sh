#!/bin/bash

# MarksForest 一体化更新脚本

set -e

echo "🔄 开始更新 MarksForest 一体化服务..."

# 备份书签文件
echo "💾 备份书签文件..."
cp json/marksforest.json json/marksforest.json.backup.$(date +%Y%m%d_%H%M%S)

# 停止当前服务
echo "🛑 停止当前服务..."
docker-compose down

# 拉取最新代码（如果有git仓库）
if [ -d .git ]; then
    echo "📥 拉取最新代码..."
    git pull origin main
fi

# 重新构建镜像
echo "🏗️  重新构建一体化镜像..."
docker-compose build --no-cache

# 启动服务
echo "🚀 启动一体化服务..."
docker-compose up -d

# 检查服务状态
sleep 5
if docker-compose ps | grep -q "Up"; then
    echo "✅ 一体化服务更新完成！"
    echo ""
    echo "🌐 访问地址："
    echo "   前台网站: http://localhost:8080"
    echo "   管理后台: http://localhost:8080/admin"
    echo ""
    echo "📊 查看日志: docker-compose logs -f"
else
    echo "❌ 更新失败，请检查日志："
    docker-compose logs
    exit 1
fi
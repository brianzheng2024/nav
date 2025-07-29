const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const bookmarksRoutes = require('./routes/bookmarks');
const foldersRoutes = require('./routes/folders');

const app = express();
const PORT = process.env.PORT || 3001;

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// 限流
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// 中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 支持前端和后端
const staticPath = path.join(__dirname, 'client/dist');

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/bookmarks', bookmarksRoutes);
app.use('/api/folders', foldersRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 静态文件服务 - 优先服务静态文件
app.use(express.static(staticPath));

// 前端路由 - 处理单页应用的路由
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`管理后台: http://localhost:${PORT}`);
});

module.exports = app;
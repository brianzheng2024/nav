const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// 管理员配置
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 登录
router.post('/login', [
  body('password').notEmpty().withMessage('密码不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password } = req.body;

    // 验证密码
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: '密码错误' });
    }

    // 生成JWT
    const token = jwt.sign(
      { role: 'admin', timestamp: Date.now() },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      message: '登录成功',
      expiresIn: 24 * 60 * 60 * 1000 // 24小时
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 验证token
router.post('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: '未提供token' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, role: decoded.role });
  } catch (error) {
    res.status(401).json({ error: 'token无效' });
  }
});

module.exports = router;
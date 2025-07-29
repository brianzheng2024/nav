const express = require('express');
const fs = require('fs-extra');
const axios = require('axios');
const cheerio = require('cheerio');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const BOOKMARKS_FILE = process.env.BOOKMARKS_FILE_PATH || '../json/marksforest.json';

// 中间件：验证token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '需要登录' });
  }

  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'token无效' });
  }
};

// 读取书签数据
async function readBookmarks() {
  try {
    const data = await fs.readFile(BOOKMARKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取书签文件失败:', error);
    return [];
  }
}

// 保存书签数据
async function saveBookmarks(data) {
  try {
    await fs.writeFile(BOOKMARKS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('保存书签文件失败:', error);
    return false;
  }
}

// 获取网站信息
router.post('/fetch-info', authenticateToken, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL不能为空' });
    }

    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    const title = $('title').text().trim() || 
                  $('meta[property="og:title"]').attr('content') || 
                  $('meta[name="twitter:title"]').attr('content') ||
                  new URL(url).hostname;

    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content') ||
                       $('meta[name="twitter:description"]').attr('content') ||
                       '';

    const icon = `https://logo.clearbit.com/${new URL(url).hostname}` ||
                 $('link[rel="icon"]').attr('href') ||
                 $('link[rel="shortcut icon"]').attr('href') ||
                 '/assets/default-icon.svg';

    res.json({
      title,
      description,
      icon,
      url
    });
  } catch (error) {
    console.error('获取网站信息失败:', error);
    res.status(500).json({ 
      error: '获取网站信息失败',
      fallback: {
        title: new URL(req.body.url).hostname,
        description: '',
        icon: `https://logo.clearbit.com/${new URL(req.body.url).hostname}`,
        url: req.body.url
      }
    });
  }
});

// 获取所有书签
router.get('/', authenticateToken, async (req, res) => {
  try {
    const bookmarks = await readBookmarks();
    res.json(bookmarks);
  } catch (error) {
    res.status(500).json({ error: '获取书签失败' });
  }
});

// 添加书签
router.post('/', authenticateToken, [
  body('title').notEmpty().withMessage('标题不能为空'),
  body('url').isURL().withMessage('请输入有效的URL'),
  body('folderId').notEmpty().withMessage('文件夹ID不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, url, description, icon, folderId } = req.body;
    const bookmarks = await readBookmarks();

    const newBookmark = {
      type: 'link',
      addDate: Date.now(),
      title,
      url,
      description: description || '',
      icon: icon || `https://logo.clearbit.com/${new URL(url).hostname}`
    };

    // 查找并添加到指定文件夹
    function addToFolder(items, folderId) {
      for (let item of items) {
        if (item.type === 'folder') {
          if (item.title === folderId || item.id === folderId) {
            if (!item.children) item.children = [];
            item.children.push(newBookmark);
            return true;
          }
          if (item.children && addToFolder(item.children, folderId)) {
            return true;
          }
        }
      }
      return false;
    }

    if (!addToFolder(bookmarks, folderId)) {
      return res.status(404).json({ error: '文件夹不存在' });
    }

    await saveBookmarks(bookmarks);
    res.json({ message: '书签添加成功', bookmark: newBookmark });
  } catch (error) {
    console.error('添加书签失败:', error);
    res.status(500).json({ error: '添加书签失败' });
  }
});

// 更新书签
router.put('/:id', authenticateToken, [
  body('title').optional().notEmpty().withMessage('标题不能为空'),
  body('url').optional().isURL().withMessage('请输入有效的URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, url, description, icon, newFolderId } = req.body;
    const bookmarks = await readBookmarks();

    let bookmarkFound = false;

    // 查找并更新书签
    function updateBookmark(items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type === 'link' && (item.addDate == id || item.url === id)) {
          if (title) item.title = title;
          if (url) item.url = url;
          if (description !== undefined) item.description = description;
          if (icon) item.icon = icon;
          bookmarkFound = true;
          return item;
        }
        if (item.type === 'folder' && item.children) {
          const result = updateBookmark(item.children);
          if (result) return result;
        }
      }
      return null;
    }

    // 如果需要移动到新文件夹
    if (newFolderId) {
      let bookmarkToMove = null;
      
      // 查找并删除原书签
      function removeBookmark(items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type === 'link' && (items[i].addDate == id || items[i].url === id)) {
            bookmarkToMove = items[i];
            items.splice(i, 1);
            return true;
          }
          if (items[i].type === 'folder' && items[i].children) {
            if (removeBookmark(items[i].children)) return true;
          }
        }
        return false;
      }

      removeBookmark(bookmarks);

      if (bookmarkToMove) {
        // 更新书签信息
        if (title) bookmarkToMove.title = title;
        if (url) bookmarkToMove.url = url;
        if (description !== undefined) bookmarkToMove.description = description;
        if (icon) bookmarkToMove.icon = icon;

        // 添加到新文件夹
        function addToFolder(items, folderId) {
          for (let item of items) {
            if (item.type === 'folder' && (item.title === folderId || item.id === folderId)) {
              if (!item.children) item.children = [];
              item.children.push(bookmarkToMove);
              return true;
            }
            if (item.type === 'folder' && item.children && addToFolder(item.children, folderId)) {
              return true;
            }
          }
          return false;
        }

        if (!addToFolder(bookmarks, newFolderId)) {
          return res.status(404).json({ error: '目标文件夹不存在' });
        }
      }
    } else {
      updateBookmark(bookmarks);
    }

    if (!bookmarkFound && !newFolderId) {
      return res.status(404).json({ error: '书签不存在' });
    }

    await saveBookmarks(bookmarks);
    res.json({ message: '书签更新成功' });
  } catch (error) {
    console.error('更新书签失败:', error);
    res.status(500).json({ error: '更新书签失败' });
  }
});

// 删除书签
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const bookmarks = await readBookmarks();

    function removeBookmark(items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type === 'link' && (items[i].addDate == id || items[i].url === id)) {
          items.splice(i, 1);
          return true;
        }
        if (items[i].type === 'folder' && items[i].children) {
          if (removeBookmark(items[i].children)) return true;
        }
      }
      return false;
    }

    if (!removeBookmark(bookmarks)) {
      return res.status(404).json({ error: '书签不存在' });
    }

    await saveBookmarks(bookmarks);
    res.json({ message: '书签删除成功' });
  } catch (error) {
    console.error('删除书签失败:', error);
    res.status(500).json({ error: '删除书签失败' });
  }
});

module.exports = router;
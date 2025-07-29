const express = require('express');
const fs = require('fs-extra');
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

// 获取文件夹树结构
router.get('/tree', authenticateToken, async (req, res) => {
  try {
    const bookmarks = await readBookmarks();
    
    function buildTree(items, level = 0) {
      const result = [];
      for (const item of items) {
        if (item.type === 'folder') {
          result.push({
            id: item.title,
            title: item.title,
            level,
            children: item.children ? buildTree(item.children, level + 1) : []
          });
        }
      }
      return result;
    }

    res.json(buildTree(bookmarks));
  } catch (error) {
    res.status(500).json({ error: '获取文件夹树失败' });
  }
});

// 获取所有文件夹（扁平结构）
router.get('/', authenticateToken, async (req, res) => {
  try {
    const bookmarks = await readBookmarks();
    const folders = [];

    function collectFolders(items, path = '') {
      for (const item of items) {
        if (item.type === 'folder') {
          const fullPath = path ? `${path}/${item.title}` : item.title;
          folders.push({
            id: item.title,
            title: item.title,
            path: fullPath,
            bookmarkCount: item.children ? item.children.filter(c => c.type === 'link').length : 0,
            folderCount: item.children ? item.children.filter(c => c.type === 'folder').length : 0
          });
          
          if (item.children) {
            collectFolders(item.children, fullPath);
          }
        }
      }
    }

    collectFolders(bookmarks);
    res.json(folders);
  } catch (error) {
    res.status(500).json({ error: '获取文件夹失败' });
  }
});

// 创建文件夹
router.post('/', authenticateToken, [
  body('title').notEmpty().withMessage('文件夹名称不能为空'),
  body('parentPath').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, parentPath } = req.body;
    const bookmarks = await readBookmarks();

    // 检查文件夹是否已存在
    function checkFolderExists(items, title, path = '') {
      for (const item of items) {
        if (item.type === 'folder' && item.title === title) {
          if (!parentPath || path === parentPath) {
            return true;
          }
        }
        if (item.type === 'folder' && item.children) {
          const childPath = path ? `${path}/${item.title}` : item.title;
          if (checkFolderExists(item.children, title, childPath)) {
            return true;
          }
        }
      }
      return false;
    }

    if (checkFolderExists(bookmarks, title, parentPath)) {
      return res.status(400).json({ error: '文件夹已存在' });
    }

    const newFolder = {
      type: 'folder',
      addDate: Date.now(),
      title,
      children: []
    };

    // 添加到指定路径
    if (parentPath) {
      const pathParts = parentPath.split('/');
      let current = bookmarks;
      
      for (const part of pathParts) {
        const found = current.find(item => item.type === 'folder' && item.title === part);
        if (found && found.children) {
          current = found.children;
        } else {
          return res.status(404).json({ error: '父文件夹不存在' });
        }
      }
      
      current.push(newFolder);
    } else {
      bookmarks.push(newFolder);
    }

    await saveBookmarks(bookmarks);
    res.json({ message: '文件夹创建成功', folder: newFolder });
  } catch (error) {
    console.error('创建文件夹失败:', error);
    res.status(500).json({ error: '创建文件夹失败' });
  }
});

// 更新文件夹
router.put('/:id', authenticateToken, [
  body('title').notEmpty().withMessage('文件夹名称不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, newParentPath } = req.body;
    const bookmarks = await readBookmarks();

    let folderFound = false;

    // 查找文件夹
    function findFolder(items, folderId) {
      for (const item of items) {
        if (item.type === 'folder' && item.title === folderId) {
          return item;
        }
        if (item.type === 'folder' && item.children) {
          const result = findFolder(item.children, folderId);
          if (result) return result;
        }
      }
      return null;
    }

    // 检查新名称是否已存在
    function checkDuplicate(items, newTitle, excludeTitle) {
      for (const item of items) {
        if (item.type === 'folder' && item.title === newTitle && item.title !== excludeTitle) {
          return true;
        }
        if (item.type === 'folder' && item.children) {
          if (checkDuplicate(item.children, newTitle, excludeTitle)) {
            return true;
          }
        }
      }
      return false;
    }

    if (checkDuplicate(bookmarks, title, id)) {
      return res.status(400).json({ error: '文件夹名称已存在' });
    }

    // 如果需要移动到新位置
    if (newParentPath !== undefined) {
      let folderToMove = null;
      
      // 查找并删除原文件夹
      function removeFolder(items, folderId) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type === 'folder' && items[i].title === folderId) {
            folderToMove = items[i];
            items.splice(i, 1);
            return true;
          }
          if (items[i].type === 'folder' && items[i].children) {
            if (removeFolder(items[i].children)) return true;
          }
        }
        return false;
      }

      // 检查文件夹是否为空（只包含空文件夹的情况）
      function isFolderEmpty(folder) {
        if (!folder.children || folder.children.length === 0) return true;
        
        for (const child of folder.children) {
          if (child.type === 'link') return false;
          if (child.type === 'folder' && !isFolderEmpty(child)) return false;
        }
        return true;
      }

      if (!removeFolder(bookmarks)) {
        return res.status(404).json({ error: '文件夹不存在' });
      }

      if (folderToMove) {
        // 更新文件夹名称
        folderToMove.title = title;

        // 添加到新位置
        if (newParentPath) {
          const pathParts = newParentPath.split('/');
          let current = bookmarks;
          
          for (const part of pathParts) {
            const found = current.find(item => item.type === 'folder' && item.title === part);
            if (found && found.children) {
              current = found.children;
            } else {
              return res.status(404).json({ error: '新父文件夹不存在' });
            }
          }
          
          current.push(folderToMove);
        } else {
          bookmarks.push(folderToMove);
        }
      }
    } else {
      // 仅重命名
      function renameFolder(items, folderId, newTitle) {
        for (const item of items) {
          if (item.type === 'folder' && item.title === folderId) {
            item.title = newTitle;
            folderFound = true;
            return true;
          }
          if (item.type === 'folder' && item.children) {
            if (renameFolder(item.children, folderId, newTitle)) return true;
          }
        }
        return false;
      }

      renameFolder(bookmarks, id, title);
    }

    if (!folderFound && !newParentPath) {
      return res.status(404).json({ error: '文件夹不存在' });
    }

    await saveBookmarks(bookmarks);
    res.json({ message: '文件夹更新成功' });
  } catch (error) {
    console.error('更新文件夹失败:', error);
    res.status(500).json({ error: '更新文件夹失败' });
  }
});

// 删除文件夹
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const bookmarks = await readBookmarks();

    // 检查文件夹是否为空
    function checkFolderEmpty(items, folderId) {
      for (const item of items) {
        if (item.type === 'folder' && item.title === folderId) {
          // 检查文件夹内是否有书签或其他非空子文件夹
          if (item.children && item.children.length > 0) {
            for (const child of item.children) {
              if (child.type === 'link') return false;
              if (child.type === 'folder' && child.children && child.children.length > 0) {
                return false;
              }
            }
          }
          return true;
        }
        if (item.type === 'folder' && item.children) {
          const result = checkFolderEmpty(item.children, folderId);
          if (result !== null) return result;
        }
      }
      return null;
    }

    const isEmpty = checkFolderEmpty(bookmarks, id);
    if (isEmpty === null) {
      return res.status(404).json({ error: '文件夹不存在' });
    }

    if (!isEmpty) {
      return res.status(400).json({ error: '文件夹不为空，无法删除' });
    }

    // 删除文件夹
    function removeFolder(items, folderId) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type === 'folder' && items[i].title === folderId) {
          items.splice(i, 1);
          return true;
        }
        if (items[i].type === 'folder' && items[i].children) {
          if (removeFolder(items[i].children, folderId)) return true;
        }
      }
      return false;
    }

    if (!removeFolder(bookmarks, id)) {
      return res.status(404).json({ error: '文件夹不存在' });
    }

    await saveBookmarks(bookmarks);
    res.json({ message: '文件夹删除成功' });
  } catch (error) {
    console.error('删除文件夹失败:', error);
    res.status(500).json({ error: '删除文件夹失败' });
  }
});

// 调整文件夹顺序
router.post('/reorder', authenticateToken, [
  body('folderId').notEmpty().withMessage('文件夹ID不能为空'),
  body('newIndex').isInt({ min: 0 }).withMessage('新索引必须是非负整数'),
  body('parentPath').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { folderId, newIndex, parentPath } = req.body;
    const bookmarks = await readBookmarks();

    let folderToMove = null;
    let sourceArray = null;
    let sourceIndex = -1;

    // 查找文件夹
    function findFolder(items, path = '') {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type === 'folder' && items[i].title === folderId) {
          if (!parentPath || path === parentPath) {
            folderToMove = items[i];
            sourceArray = items;
            sourceIndex = i;
            return true;
          }
        }
        if (items[i].type === 'folder' && items[i].children) {
          const childPath = path ? `${path}/${items[i].title}` : items[i].title;
          if (findFolder(items[i].children, childPath)) return true;
        }
      }
      return false;
    }

    if (!findFolder(bookmarks)) {
      return res.status(404).json({ error: '文件夹不存在' });
    }

    // 移动文件夹
    sourceArray.splice(sourceIndex, 1);
    sourceArray.splice(newIndex, 0, folderToMove);

    await saveBookmarks(bookmarks);
    res.json({ message: '文件夹顺序调整成功' });
  } catch (error) {
    console.error('调整文件夹顺序失败:', error);
    res.status(500).json({ error: '调整文件夹顺序失败' });
  }
});

module.exports = router;
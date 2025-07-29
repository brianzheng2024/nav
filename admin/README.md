# MarksForest 管理后台

这是一个为 MarksForest 书签导航网站设计的后台管理系统，提供了完整的文件夹和书签管理功能。

## 功能特性

- 🔐 **安全认证**: 基于JWT的管理员登录系统
- 📁 **文件夹管理**: 创建、编辑、删除、排序文件夹
- 🔖 **书签管理**: 添加、编辑、删除书签，支持批量操作
- 🌐 **自动获取**: 根据URL自动获取网站标题、描述和图标
- 📊 **实时统计**: 实时显示书签和文件夹统计信息
- 🐳 **Docker支持**: 完整的Docker容器化部署
- 🎨 **现代化界面**: 基于Vue.js和Tailwind CSS的响应式设计

## 技术栈

- **后端**: Node.js + Express.js
- **前端**: Vue.js 3 + Tailwind CSS
- **认证**: JWT (JSON Web Tokens)
- **部署**: Docker + Docker Compose

## 快速开始

### 本地开发

1. **安装依赖**
   ```bash
   cd admin
   npm run install:all
   ```

2. **启动开发服务器**
   ```bash
   npm run dev
   ```

3. **访问管理后台**
   - 后端API: http://localhost:3001
   - 前端界面: http://localhost:3002

### Docker部署

1. **构建并启动**
   ```bash
   cd admin
   docker-compose up -d
   ```

2. **访问管理后台**
   - 管理后台: http://localhost:3001
   - 默认管理员密码: `admin123` (请尽快修改)

## 环境配置

### 环境变量

复制 `.env.example` 为 `.env` 并配置以下变量：

```bash
# 服务器配置
PORT=3001
NODE_ENV=production

# JWT密钥 (必须修改)
JWT_SECRET=your-super-secret-jwt-key

# 管理员密码 (必须修改)
ADMIN_PASSWORD=your-secure-password

# 书签文件路径
BOOKMARKS_FILE_PATH=../json/marksforest.json
```

### 安全配置

1. **修改默认密码**
   - 在 `.env` 文件中设置 `ADMIN_PASSWORD`
   - 使用强密码，建议包含大小写字母、数字和特殊字符

2. **修改JWT密钥**
   - 在 `.env` 文件中设置 `JWT_SECRET`
   - 使用随机生成的长字符串

## 使用指南

### 管理员登录

1. 访问管理后台地址
2. 输入管理员密码登录
3. 系统会自动保存登录状态24小时

### 文件夹管理

1. **添加文件夹**: 点击"添加文件夹"按钮
2. **编辑文件夹**: 点击文件夹旁的编辑按钮
3. **删除文件夹**: 点击文件夹旁的删除按钮（仅空文件夹可删除）
4. **调整顺序**: 使用上移/下移按钮调整顺序

### 书签管理

1. **添加书签**: 点击"添加书签"按钮
2. **自动获取信息**: 输入URL后点击"获取信息"按钮
3. **编辑书签**: 点击书签旁的编辑按钮
4. **删除书签**: 点击书签旁的删除按钮
5. **转移目录**: 编辑时选择新的文件夹

## API文档

### 认证相关

- `POST /api/auth/login` - 管理员登录
- `POST /api/auth/verify` - 验证token

### 书签管理

- `GET /api/bookmarks` - 获取所有书签
- `POST /api/bookmarks` - 添加书签
- `PUT /api/bookmarks/:id` - 更新书签
- `DELETE /api/bookmarks/:id` - 删除书签
- `POST /api/bookmarks/fetch-info` - 获取网站信息

### 文件夹管理

- `GET /api/folders` - 获取所有文件夹
- `GET /api/folders/tree` - 获取文件夹树结构
- `POST /api/folders` - 创建文件夹
- `PUT /api/folders/:id` - 更新文件夹
- `DELETE /api/folders/:id` - 删除文件夹
- `POST /api/folders/reorder` - 调整文件夹顺序

## 开发指南

### 项目结构

```
admin/
├── client/                 # 前端Vue.js应用
│   ├── src/
│   │   ├── components/    # Vue组件
│   │   ├── views/         # 页面组件
│   │   ├── router.js      # 路由配置
│   │   └── main.js        # 入口文件
│   └── package.json       # 前端依赖
├── routes/                # Express路由
├── server.js              # 主服务器文件
├── Dockerfile             # Docker配置
└── docker-compose.yml   # Docker Compose配置
```

### 开发命令

```bash
# 安装所有依赖
npm run install:all

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 故障排除

### 常见问题

1. **无法访问管理后台**
   - 检查端口是否被占用
   - 确认Docker容器正常运行
   - 查看容器日志: `docker-compose logs`

2. **书签文件权限问题**
   - 确保Docker有读写权限: `chmod 666 json/marksforest.json`
   - 检查文件路径配置是否正确

3. **自动获取网站信息失败**
   - 检查网络连接
   - 某些网站可能屏蔽了自动获取
   - 手动填写信息即可

### 日志查看

```bash
# 查看所有日志
docker-compose logs

# 查看特定服务日志
docker-compose logs marksforest-admin

# 实时查看日志
docker-compose logs -f marksforest-admin
```

## 更新和维护

### 更新系统

1. **拉取最新代码**
   ```bash
   git pull origin main
   ```

2. **重新构建容器**
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

### 备份数据

定期备份 `json/marksforest.json` 文件：

```bash
# 创建备份
cp json/marksforest.json json/marksforest-backup-$(date +%Y%m%d).json
```

## 许可证

MIT License - 详见项目根目录的LICENSE文件
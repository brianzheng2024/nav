<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">书签管理</h1>
      <button @click="showAddModal = true" class="btn btn-primary">
        添加书签
      </button>
    </div>

    <!-- 搜索和筛选 -->
    <div class="mb-6">
      <div class="flex space-x-4">
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索书签..."
            class="form-input"
          />
        </div>
        <select v-model="selectedFolder" class="form-input">
          <option value="">所有文件夹</option>
          <option v-for="folder in folders" :key="folder.id" :value="folder.id">
            {{ folder.path }}
          </option>
        </select>
      </div>
    </div>

    <!-- 书签列表 -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <div v-else class="bg-white shadow overflow-hidden sm:rounded-md">
      <ul class="divide-y divide-gray-200">
        <li v-for="bookmark in filteredBookmarks" :key="bookmark.id" class="px-6 py-4">
          <div class="flex items-center space-x-4">
            <img :src="bookmark.icon" :alt="bookmark.title" class="w-10 h-10 rounded" @error="$event.target.src='/assets/default-icon.svg'" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ bookmark.title }}</p>
              <p class="text-sm text-gray-500 truncate">{{ bookmark.url }}</p>
              <p v-if="bookmark.description" class="text-sm text-gray-400 truncate">{{ bookmark.description }}</p>
              <p class="text-xs text-gray-400">文件夹: {{ bookmark.folderPath }}</p>
            </div>
            <div class="flex space-x-2">
              <button @click="editBookmark(bookmark)" class="text-primary-600 hover:text-primary-900">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button @click="deleteBookmark(bookmark)" class="text-red-600 hover:text-red-900">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- 添加/编辑书签模态框 -->
    <div v-if="showAddModal || showEditModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 class="text-lg font-medium text-gray-900 mb-4">
          {{ showEditModal ? '编辑书签' : '添加书签' }}
        </h2>
        
        <form @submit.prevent="saveBookmark">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">URL *</label>
              <div class="flex space-x-2">
                <input
                  v-model="bookmarkForm.url"
                  type="url"
                  required
                  class="form-input flex-1"
                  :disabled="showEditModal"
                />
                <button
                  type="button"
                  @click="fetchWebsiteInfo"
                  :disabled="!bookmarkForm.url || fetchingInfo"
                  class="btn btn-secondary"
                >
                  {{ fetchingInfo ? '获取中...' : '获取信息' }}
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">标题 *</label>
              <input v-model="bookmarkForm.title" type="text" required class="form-input" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">描述</label>
              <textarea v-model="bookmarkForm.description" rows="3" class="form-input"></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">图标 URL</label>
              <input v-model="bookmarkForm.icon" type="url" class="form-input" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">文件夹 *</label>
              <select v-model="bookmarkForm.folderId" required class="form-input">
                <option v-for="folder in folders" :key="folder.id" :value="folder.id">
                  {{ folder.path }}
                </option>
              </select>
            </div>
          </div>

          <div class="mt-6 flex space-x-3">
            <button type="submit" :disabled="saving" class="btn btn-primary flex-1">
              {{ saving ? '保存中...' : '保存' }}
            </button>
            <button type="button" @click="closeModal" class="btn btn-secondary flex-1">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Bookmarks',
  data() {
    return {
      loading: true,
      bookmarks: [],
      folders: [],
      searchQuery: '',
      selectedFolder: '',
      showAddModal: false,
      showEditModal: false,
      fetchingInfo: false,
      saving: false,
      bookmarkForm: {
        title: '',
        url: '',
        description: '',
        icon: '',
        folderId: ''
      },
      editingBookmark: null
    }
  },
  async mounted() {
    await this.loadData()
  },
  computed: {
    flattenedBookmarks() {
      const bookmarks = []
      
      function collectBookmarks(items, path = '') {
        for (const item of items) {
          if (item.type === 'link') {
            bookmarks.push({
              ...item,
              id: item.addDate,
              folderPath: path || '根目录'
            })
          } else if (item.type === 'folder' && item.children) {
            const newPath = path ? `${path}/${item.title}` : item.title
            collectBookmarks(item.children, newPath)
          }
        }
      }
      
      collectBookmarks(this.bookmarks)
      return bookmarks
    },
    filteredBookmarks() {
      let filtered = this.flattenedBookmarks
      
      if (this.searchQuery) {
        filtered = filtered.filter(bookmark => 
          bookmark.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          bookmark.url.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          bookmark.description.toLowerCase().includes(this.searchQuery.toLowerCase())
        )
      }
      
      if (this.selectedFolder) {
        filtered = filtered.filter(bookmark => bookmark.folderPath.includes(this.selectedFolder))
      }
      
      return filtered
    }
  },
  methods: {
    async loadData() {
      try {
        const [bookmarksResponse, foldersResponse] = await Promise.all([
          axios.get('/api/bookmarks', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }),
          axios.get('/api/folders', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
        ])
        
        this.bookmarks = bookmarksResponse.data
        this.folders = foldersResponse.data
      } catch (error) {
        console.error('加载数据失败:', error)
      } finally {
        this.loading = false
      }
    },
    async fetchWebsiteInfo() {
      if (!this.bookmarkForm.url) return
      
      this.fetchingInfo = true
      try {
        const response = await axios.post('/api/bookmarks/fetch-info', {
          url: this.bookmarkForm.url
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        
        this.bookmarkForm.title = response.data.title
        this.bookmarkForm.description = response.data.description
        this.bookmarkForm.icon = response.data.icon
      } catch (error) {
        console.error('获取网站信息失败:', error)
      } finally {
        this.fetchingInfo = false
      }
    },
    editBookmark(bookmark) {
      this.editingBookmark = bookmark
      this.bookmarkForm = {
        title: bookmark.title,
        url: bookmark.url,
        description: bookmark.description,
        icon: bookmark.icon,
        folderId: bookmark.folderPath
      }
      this.showEditModal = true
    },
    async saveBookmark() {
      this.saving = true
      try {
        if (this.showEditModal) {
          await axios.put(`/api/bookmarks/${this.editingBookmark.id}`, {
            ...this.bookmarkForm,
            newFolderId: this.bookmarkForm.folderId
          }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
        } else {
          await axios.post('/api/bookmarks', this.bookmarkForm, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
        }
        
        await this.loadData()
        this.closeModal()
      } catch (error) {
        console.error('保存书签失败:', error)
      } finally {
        this.saving = false
      }
    },
    async deleteBookmark(bookmark) {
      if (confirm(`确定要删除书签 "${bookmark.title}" 吗？`)) {
        try {
          await axios.delete(`/api/bookmarks/${bookmark.id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
          await this.loadData()
        } catch (error) {
          console.error('删除书签失败:', error)
        }
      }
    },
    closeModal() {
      this.showAddModal = false
      this.showEditModal = false
      this.editingBookmark = null
      this.bookmarkForm = {
        title: '',
        url: '',
        description: '',
        icon: '',
        folderId: ''
      }
    }
  }
}
</script>
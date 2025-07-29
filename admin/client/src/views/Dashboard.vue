<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">概览</h1>
    
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <div v-else>
      <!-- 统计卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="card">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">文件夹数量</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.folders }}</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">书签数量</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.bookmarks }}</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">最后更新</p>
              <p class="text-lg font-bold text-gray-900">{{ stats.lastUpdate }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近添加的书签 -->
      <div class="card">
        <h2 class="text-lg font-medium text-gray-900 mb-4">最近添加的书签</h2>
        <div v-if="recentBookmarks.length === 0" class="text-gray-500 text-center py-8">
          暂无书签
        </div>
        <div v-else class="space-y-4">
          <div v-for="bookmark in recentBookmarks" :key="bookmark.addDate" class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <img :src="bookmark.icon" :alt="bookmark.title" class="w-8 h-8 rounded" @error="$event.target.src='/assets/default-icon.svg'" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ bookmark.title }}</p>
              <p class="text-sm text-gray-500 truncate">{{ bookmark.url }}</p>
            </div>
            <div class="text-sm text-gray-500">
              {{ formatDate(bookmark.addDate) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Dashboard',
  data() {
    return {
      loading: true,
      stats: {
        folders: 0,
        bookmarks: 0,
        lastUpdate: '无'
      },
      recentBookmarks: []
    }
  },
  async mounted() {
    await this.loadData()
  },
  methods: {
    async loadData() {
      try {
        const response = await axios.get('/api/bookmarks', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        })

        const data = response.data
        this.stats.folders = this.countFolders(data)
        this.stats.bookmarks = this.countBookmarks(data)
        this.recentBookmarks = this.getRecentBookmarks(data)
      } catch (error) {
        console.error('加载数据失败:', error)
      } finally {
        this.loading = false
      }
    },
    countFolders(items) {
      let count = 0
      for (const item of items) {
        if (item.type === 'folder') {
          count += 1
          if (item.children) {
            count += this.countFolders(item.children)
          }
        }
      }
      return count
    },
    countBookmarks(items) {
      let count = 0
      for (const item of items) {
        if (item.type === 'link') {
          count += 1
        } else if (item.type === 'folder' && item.children) {
          count += this.countBookmarks(item.children)
        }
      }
      return count
    },
    getRecentBookmarks(items, limit = 5) {
      const bookmarks = []
      
      function collectBookmarks(items) {
        for (const item of items) {
          if (item.type === 'link') {
            bookmarks.push(item)
          } else if (item.type === 'folder' && item.children) {
            collectBookmarks(item.children)
          }
        }
      }
      
      collectBookmarks(items)
      return bookmarks
        .sort((a, b) => b.addDate - a.addDate)
        .slice(0, limit)
    },
    formatDate(timestamp) {
      return new Date(timestamp).toLocaleDateString('zh-CN')
    }
  }
}
</script>
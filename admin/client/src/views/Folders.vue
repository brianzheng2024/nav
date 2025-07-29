<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">文件夹管理</h1>
      <button @click="showAddModal = true" class="btn btn-primary">
        添加文件夹
      </button>
    </div>

    <!-- 文件夹树 -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <div v-else class="bg-white shadow overflow-hidden sm:rounded-md">
      <div class="p-4">
        <FolderTree
          :folders="folderTree"
          @edit="editFolder"
          @delete="deleteFolder"
          @reorder="reorderFolders"
        />
      </div>
    </div>

    <!-- 添加/编辑文件夹模态框 -->
    <div v-if="showAddModal || showEditModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 class="text-lg font-medium text-gray-900 mb-4">
          {{ showEditModal ? '编辑文件夹' : '添加文件夹' }}
        </h2>
        
        <form @submit.prevent="saveFolder">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">文件夹名称 *</label>
              <input
                v-model="folderForm.title"
                type="text"
                required
                class="form-input"
              />
            </div>

            <div v-if="!showEditModal">
              <label class="block text-sm font-medium text-gray-700">父文件夹</label>
              <select v-model="folderForm.parentPath" class="form-input">
                <option value="">根目录</option>
                <option v-for="folder in allFolders" :key="folder.id" :value="folder.path">
                  {{ folder.path }}
                </option>
              </select>
            </div>

            <div v-if="showEditModal">
              <label class="block text-sm font-medium text-gray-700">移动到新位置</label>
              <select v-model="folderForm.newParentPath" class="form-input">
                <option value="">根目录</option>
                <option v-for="folder in allFolders.filter(f => f.id !== editingFolder?.id)" 
                        :key="folder.id" :value="folder.path">
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
import FolderTree from '../components/FolderTree.vue'

export default {
  name: 'Folders',
  components: {
    FolderTree
  },
  data() {
    return {
      loading: true,
      folderTree: [],
      allFolders: [],
      showAddModal: false,
      showEditModal: false,
      saving: false,
      folderForm: {
        title: '',
        parentPath: ''
      },
      editingFolder: null
    }
  },
  async mounted() {
    await this.loadData()
  },
  methods: {
    async loadData() {
      try {
        const [treeResponse, flatResponse] = await Promise.all([
          axios.get('/api/folders/tree', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }),
          axios.get('/api/folders', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
        ])
        
        this.folderTree = treeResponse.data
        this.allFolders = flatResponse.data
      } catch (error) {
        console.error('加载数据失败:', error)
      } finally {
        this.loading = false
      }
    },
    editFolder(folder) {
      this.editingFolder = folder
      this.folderForm = {
        title: folder.title,
        parentPath: '',
        newParentPath: ''
      }
      this.showEditModal = true
    },
    async deleteFolder(folder) {
      if (confirm(`确定要删除文件夹 "${folder.title}" 吗？注意：文件夹必须为空才能删除。`)) {
        try {
          await axios.delete(`/api/folders/${folder.id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
          await this.loadData()
        } catch (error) {
          alert(error.response?.data?.error || '删除文件夹失败')
        }
      }
    },
    async reorderFolders({ folderId, newIndex, parentPath }) {
      try {
        await axios.post('/api/folders/reorder', {
          folderId,
          newIndex,
          parentPath
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        await this.loadData()
      } catch (error) {
        console.error('调整顺序失败:', error)
      }
    },
    async saveFolder() {
      this.saving = true
      try {
        if (this.showEditModal) {
          await axios.put(`/api/folders/${this.editingFolder.id}`, {
            title: this.folderForm.title,
            newParentPath: this.folderForm.newParentPath
          }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
        } else {
          await axios.post('/api/folders', this.folderForm, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
        }
        
        await this.loadData()
        this.closeModal()
      } catch (error) {
        alert(error.response?.data?.error || '保存文件夹失败')
      } finally {
        this.saving = false
      }
    },
    closeModal() {
      this.showAddModal = false
      this.showEditModal = false
      this.editingFolder = null
      this.folderForm = {
        title: '',
        parentPath: ''
      }
    }
  }
}
</script>
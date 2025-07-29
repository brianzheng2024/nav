<template>
  <div class="border rounded-lg p-3" :style="{ marginLeft: level * 20 + 'px' }">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span class="font-medium">{{ folder.title }}</span>
        <span class="text-sm text-gray-500">
          ({{ folder.children?.filter(c => c.type === 'link').length || 0 }} 书签,
          {{ folder.children?.filter(c => c.type === 'folder').length || 0 }} 文件夹)
        </span>
      </div>
      
      <div class="flex space-x-1">
        <button
          @click="moveUp"
          :disabled="index === 0"
          class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          title="上移"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          @click="moveDown"
          :disabled="isLast"
          class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          title="下移"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button
          @click="$emit('edit', folder)"
          class="p-1 text-primary-600 hover:text-primary-900"
          title="编辑"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          @click="$emit('delete', folder)"
          class="p-1 text-red-600 hover:text-red-900"
          title="删除"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 子文件夹 -->
    <div v-if="folder.children && folder.children.length > 0" class="mt-3 space-y-2">
      <FolderItem
        v-for="(child, childIndex) in folder.children.filter(c => c.type === 'folder')"
        :key="child.id"
        :folder="child"
        :index="childIndex"
        :level="level + 1"
        :is-last="childIndex === folder.children.filter(c => c.type === 'folder').length - 1"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @reorder="$emit('reorder', $event)"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'FolderItem',
  props: {
    folder: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      required: true
    },
    level: {
      type: Number,
      default: 0
    },
    isLast: {
      type: Boolean,
      default: false
    }
  },
  emits: ['edit', 'delete', 'reorder'],
  methods: {
    moveUp() {
      this.$emit('reorder', {
        folderId: this.folder.title,
        newIndex: this.index - 1,
        parentPath: this.getParentPath()
      })
    },
    moveDown() {
      this.$emit('reorder', {
        folderId: this.folder.title,
        newIndex: this.index + 1,
        parentPath: this.getParentPath()
      })
    },
    getParentPath() {
      // 这里简化处理，实际应该根据文件夹路径计算
      return ''
    }
  }
}
</script>
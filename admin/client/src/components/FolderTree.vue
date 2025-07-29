<template>
  <div class="space-y-2">
    <FolderItem
      v-for="(folder, index) in folders"
      :key="folder.id"
      :folder="folder"
      :index="index"
      :level="0"
      @edit="$emit('edit', $event)"
      @delete="$emit('delete', $event)"
      @reorder="$emit('reorder', $event)"
    />
  </div>
</template>

<script>
import FolderItem from './FolderItem.vue'

export default {
  name: 'FolderTree',
  components: {
    FolderItem
  },
  props: {
    folders: {
      type: Array,
      required: true
    }
  },
  emits: ['edit', 'delete', 'reorder']
}
</script>
<template>
  <nav class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <h1 class="text-xl font-bold text-primary-600">MarksForest 管理后台</h1>
          </div>
          <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
            <router-link
              to="/dashboard"
              class="inline-flex items-center px-1 pt-1 text-sm font-medium"
              :class="$route.path === '/dashboard' ? 'border-b-2 border-primary-500 text-gray-900' : 'text-gray-500 hover:text-gray-700'"
            >
              概览
            </router-link>
            <router-link
              to="/bookmarks"
              class="inline-flex items-center px-1 pt-1 text-sm font-medium"
              :class="$route.path === '/bookmarks' ? 'border-b-2 border-primary-500 text-gray-900' : 'text-gray-500 hover:text-gray-700'"
            >
              书签管理
            </router-link>
            <router-link
              to="/folders"
              class="inline-flex items-center px-1 pt-1 text-sm font-medium"
              :class="$route.path === '/folders' ? 'border-b-2 border-primary-500 text-gray-900' : 'text-gray-500 hover:text-gray-700'"
            >
              文件夹管理
            </router-link>
          </div>
        </div>
        <div class="flex items-center">
          <button
            @click="logout"
            class="text-sm text-gray-500 hover:text-gray-700"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'Navigation',
  methods: {
    logout() {
      localStorage.removeItem('token')
      this.$router.push('/login')
    }
  }
}
</script>
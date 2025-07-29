<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          MarksForest 管理后台
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          请输入管理员密码登录
        </p>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="login">
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">
            管理员密码
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="mt-1 form-input"
            :class="{ 'border-red-500': error }"
          />
          <p v-if="error" class="mt-2 text-sm text-red-600">{{ error }}</p>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="btn btn-primary w-full flex justify-center py-2 px-4"
          >
            <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Login',
  data() {
    return {
      password: '',
      loading: false,
      error: null
    }
  },
  methods: {
    async login() {
      this.loading = true
      this.error = null

      try {
        const response = await axios.post('/api/auth/login', {
          password: this.password
        })

        localStorage.setItem('token', response.data.token)
        this.$router.push('/dashboard')
      } catch (error) {
        this.error = error.response?.data?.error || '登录失败'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
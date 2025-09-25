<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo and Title -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">YPrompt 登录</h1>
        <p class="text-gray-600">请输入您的凭据来访问应用</p>
      </div>

      <!-- Login Form -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Username Field -->
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
              用户名
            </label>
            <div class="relative">
              <input
                id="username"
                v-model="form.username"
                type="text"
                required
                :disabled="isLoading || authStore.isAccountLocked"
                class="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="请输入用户名"
                autocomplete="username"
              >
              <User class="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                :disabled="isLoading || authStore.isAccountLocked"
                class="w-full px-4 py-3 pl-10 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="请输入密码"
                autocomplete="current-password"
                @keydown.enter="handleSubmit"
              >
              <Lock class="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <button
                type="button"
                @click="showPassword = !showPassword"
                :disabled="isLoading || authStore.isAccountLocked"
                class="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye v-if="showPassword" class="h-5 w-5" />
                <EyeOff v-else class="h-5 w-5" />
              </button>
            </div>
          </div>

          <!-- Remember Session -->
          <div class="flex items-center justify-between">
            <label class="flex items-center">
              <input
                v-model="form.rememberSession"
                type="checkbox"
                :disabled="isLoading || authStore.isAccountLocked"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              >
              <span class="ml-2 text-sm text-gray-700">延长会话时间</span>
            </label>
            <span class="text-xs text-gray-500">
              {{ form.rememberSession ? '2小时' : '30分钟' }}
            </span>
          </div>

          <!-- Error Message -->
          <div
            v-if="errorMessage"
            class="p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <div class="flex items-center">
              <AlertCircle class="h-5 w-5 text-red-400 mr-2" />
              <p class="text-sm text-red-700">{{ errorMessage }}</p>
            </div>
          </div>

          <!-- Account Locked Warning -->
          <div
            v-if="authStore.isAccountLocked"
            class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <div class="flex items-center">
              <AlertTriangle class="h-5 w-5 text-yellow-400 mr-2" />
              <p class="text-sm text-yellow-700">
                账户已被锁定，请稍后再试
              </p>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isLoading || !form.username.trim() || !form.password.trim() || authStore.isAccountLocked"
            class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Loader2 v-if="isLoading" class="animate-spin h-5 w-5 mr-2" />
            <LogIn v-else class="h-5 w-5 mr-2" />
            {{ isLoading ? '登录中...' : '登录' }}
          </button>
        </form>

        <!-- Login Attempts Info -->
        <div v-if="authStore.loginAttempts.length > 0" class="mt-4 pt-4 border-t border-gray-200">
          <details class="cursor-pointer">
            <summary class="text-sm text-gray-500 hover:text-gray-700">
              安全信息 ({{ authStore.loginAttempts.length }} 次尝试)
            </summary>
            <div class="mt-2 space-y-1">
              <div
                v-for="(attempt, index) in authStore.loginAttempts.slice(-3)"
                :key="index"
                class="text-xs text-gray-400 flex justify-between"
              >
                <span>{{ formatTime(attempt.timestamp) }}</span>
                <span>{{ attempt.userAgent?.substring(0, 30) }}...</span>
              </div>
            </div>
          </details>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-8">
        <p class="text-sm text-gray-500">
          YPrompt © 2025 - 智能提示词生成工具
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  Loader2, 
  AlertCircle, 
  AlertTriangle 
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

// 表单状态
const form = ref({
  username: '',
  password: '',
  rememberSession: false
})

// UI状态
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

// 清理错误消息的定时器
let errorTimer: NodeJS.Timeout | null = null

// 处理登录提交
const handleSubmit = async () => {
  if (isLoading.value || authStore.isAccountLocked) return
  
  errorMessage.value = ''
  isLoading.value = true
  
  try {
    // 如果选择延长会话，设置为2小时
    if (form.value.rememberSession) {
      authStore.updateConfig({ sessionTimeout: 120 })
    } else {
      authStore.updateConfig({ sessionTimeout: 30 })
    }
    
    const result = await authStore.login(form.value.username, form.value.password)
    
    if (result.success) {
      // 登录成功，跳转到主页
      router.push('/')
    } else {
      errorMessage.value = result.message
      
      // 5秒后清除错误消息
      if (errorTimer) clearTimeout(errorTimer)
      errorTimer = setTimeout(() => {
        errorMessage.value = ''
      }, 5000)
      
      // 如果登录失败，清空密码字段
      form.value.password = ''
    }
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = '登录过程中发生错误，请稍后重试'
    
    if (errorTimer) clearTimeout(errorTimer)
    errorTimer = setTimeout(() => {
      errorMessage.value = ''
    }, 5000)
  } finally {
    isLoading.value = false
  }
}

// 格式化时间
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    errorMessage.value = ''
  }
}

onMounted(() => {
  // 如果已经登录，直接跳转
  if (authStore.isAuthenticated && authStore.isSessionValid) {
    router.push('/')
    return
  }
  
  // 初始化认证状态
  authStore.initialize()
  
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeydown)
  
  // 聚焦到用户名输入框
  const usernameInput = document.getElementById('username')
  if (usernameInput) {
    usernameInput.focus()
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (errorTimer) {
    clearTimeout(errorTimer)
  }
})
</script>

<style scoped>
/* 自定义滚动条样式 */
details[open] {
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 表单动画 */
.bg-white {
  transition: box-shadow 0.3s ease;
}

.bg-white:hover {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* 输入框聚焦动画 */
input:focus {
  transform: translateY(-1px);
}

/* 按钮点击动画 */
button:active {
  transform: translateY(1px);
}
</style>
<template>
  <div 
    v-if="showAdminPanel"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    @click.self="showAdminPanel = false"
  >
    <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center">
            <Shield class="w-6 h-6 text-blue-600 mr-3" />
            <h2 class="text-xl font-bold text-gray-900">管理员设置</h2>
          </div>
          <button
            @click="showAdminPanel = false"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X class="w-6 h-6" />
          </button>
        </div>

        <!-- Current Status -->
        <div class="bg-gray-50 rounded-lg p-4 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div class="text-sm text-gray-600">当前用户</div>
              <div class="font-semibold text-gray-900">{{ authStore.getConfig().username }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-600">会话时长</div>
              <div class="font-semibold text-gray-900">{{ authStore.getConfig().sessionTimeout }} 分钟</div>
            </div>
            <div>
              <div class="text-sm text-gray-600">剩余时间</div>
              <div class="font-semibold text-green-600">{{ authStore.remainingTime }} 分钟</div>
            </div>
            <div>
              <div class="text-sm text-gray-600">登录尝试</div>
              <div class="font-semibold text-gray-900">{{ authStore.loginAttempts.length }} 次记录</div>
            </div>
          </div>
        </div>

        <!-- Configuration Form -->
        <form @submit.prevent="updateConfig" class="space-y-6">
          <!-- Username -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              管理员用户名
            </label>
            <input
              v-model="formData.username"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="输入新的用户名"
            >
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              管理员密码
            </label>
            <div class="relative">
              <input
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                required
                minlength="8"
                class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="输入新密码（至少8位）"
              >
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <Eye v-if="showPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
            <div class="mt-2 text-sm text-gray-500">
              建议使用包含字母、数字和特殊字符的强密码
            </div>
          </div>

          <!-- Confirm Password -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              确认密码
            </label>
            <input
              v-model="formData.confirmPassword"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="再次输入密码"
              :class="{'border-red-300 focus:ring-red-500': formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword}"
            >
            <div v-if="formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword" class="mt-1 text-sm text-red-600">
              密码不匹配
            </div>
          </div>

          <!-- Session Timeout -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              会话超时时间（分钟）
            </label>
            <select
              v-model="formData.sessionTimeout"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option :value="15">15分钟</option>
              <option :value="30">30分钟</option>
              <option :value="60">1小时</option>
              <option :value="120">2小时</option>
              <option :value="240">4小时</option>
            </select>
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

          <!-- Success Message -->
          <div
            v-if="successMessage"
            class="p-3 bg-green-50 border border-green-200 rounded-lg"
          >
            <div class="flex items-center">
              <CheckCircle class="h-5 w-5 text-green-400 mr-2" />
              <p class="text-sm text-green-700">{{ successMessage }}</p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              :disabled="isLoading || !isFormValid"
              class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Loader2 v-if="isLoading" class="animate-spin h-5 w-5 mr-2" />
              <Settings v-else class="h-5 w-5 mr-2" />
              {{ isLoading ? '更新中...' : '更新配置' }}
            </button>
            
            <button
              type="button"
              @click="resetLoginAttempts"
              :disabled="authStore.loginAttempts.length === 0"
              class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <RotateCcw class="h-5 w-5 mr-2" />
              重置登录记录
            </button>
          </div>
        </form>

        <!-- Login Attempts History -->
        <div v-if="authStore.loginAttempts.length > 0" class="mt-8">
          <h3 class="text-lg font-medium text-gray-900 mb-4">登录记录</h3>
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="space-y-2">
              <div
                v-for="(attempt, index) in authStore.loginAttempts.slice().reverse()"
                :key="index"
                class="flex justify-between items-center text-sm py-2 border-b border-gray-200 last:border-b-0"
              >
                <div>
                  <span class="font-medium text-gray-900">
                    {{ formatTime(attempt.timestamp) }}
                  </span>
                </div>
                <div class="text-gray-500 truncate max-w-xs">
                  {{ attempt.userAgent?.substring(0, 50) }}...
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Security Tips -->
        <div class="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex items-start">
            <AlertTriangle class="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
            <div class="text-sm text-yellow-700">
              <div class="font-medium mb-1">安全建议：</div>
              <ul class="list-disc list-inside space-y-1">
                <li>定期更换管理员密码</li>
                <li>使用包含大小写字母、数字和特殊字符的强密码</li>
                <li>根据使用频率合理设置会话超时时间</li>
                <li>定期检查登录记录，发现异常及时处理</li>
                <li>建议在服务器层面配置额外的安全措施</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import {
  Shield,
  X,
  Eye,
  EyeOff,
  Settings,
  Loader2,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  AlertTriangle
} from 'lucide-vue-next'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

// Props
const props = defineProps<{
  show: boolean
}>()

// Emits
const emit = defineEmits<{
  close: []
}>()

// Local state
const showAdminPanel = ref(false)
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Form data
const formData = ref({
  username: '',
  password: '',
  confirmPassword: '',
  sessionTimeout: 30
})

// Computed
const isFormValid = computed(() => {
  return (
    formData.value.username.trim().length > 0 &&
    formData.value.password.length >= 8 &&
    formData.value.password === formData.value.confirmPassword
  )
})

// Methods
const updateConfig = async () => {
  if (!isFormValid.value) return
  
  clearMessages()
  isLoading.value = true
  
  try {
    // Update authentication configuration
    authStore.updateConfig({
      username: formData.value.username,
      password: formData.value.password,
      sessionTimeout: formData.value.sessionTimeout
    })
    
    successMessage.value = '配置更新成功！新配置将在下次登录时生效。'
    
    // Show notification
    notificationStore.addNotification({
      type: 'success',
      message: '管理员配置已更新'
    })
    
    // Clear password fields for security
    formData.value.password = ''
    formData.value.confirmPassword = ''
    
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
    
  } catch (error) {
    console.error('Config update error:', error)
    errorMessage.value = '配置更新失败，请重试'
    
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  } finally {
    isLoading.value = false
  }
}

const resetLoginAttempts = () => {
  try {
    authStore.resetLoginAttempts()
    notificationStore.addNotification({
      type: 'success',
      message: '登录记录已重置'
    })
  } catch (error) {
    console.error('Reset login attempts error:', error)
    notificationStore.addNotification({
      type: 'error',
      message: '重置登录记录失败'
    })
  }
}

const clearMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const loadCurrentConfig = () => {
  const config = authStore.getConfig()
  formData.value.username = config.username
  formData.value.sessionTimeout = config.sessionTimeout
  // Don't load password for security reasons
}

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && showAdminPanel.value) {
    showAdminPanel.value = false
  }
}

// Watch props
const updateShow = () => {
  showAdminPanel.value = props.show
  if (props.show) {
    loadCurrentConfig()
    clearMessages()
  }
}

onMounted(() => {
  updateShow()
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// Note: Props watching is handled in onMounted

// Expose close method
defineExpose({
  close: () => {
    showAdminPanel.value = false
    emit('close')
  }
})
</script>

<style scoped>
/* Custom scrollbar */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #CBD5E0 #F7FAFC;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #F7FAFC;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #CBD5E0;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #A0AEC0;
}
</style>
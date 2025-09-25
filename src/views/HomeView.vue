<template>
  <div class="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex flex-col overflow-hidden">
    <!-- 设置按钮 -->
    <SettingsModal />

    <div class="w-full flex flex-col flex-1 overflow-hidden">
      <!-- Header - 恢复美观的头部 -->
      <div class="bg-white rounded-lg shadow-sm p-4 mb-4 flex-shrink-0">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div class="min-w-0">
            <h1 class="text-xl lg:text-2xl font-bold text-gray-800 mb-1">智能提示词创建</h1>
            <p class="text-sm lg:text-base text-gray-600">AI引导式对话，帮您构建完美的提示词</p>
          </div>
          
          <!-- 模型选择器和用户信息 -->
          <div class="flex items-center gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
            <!-- 会话信息（桌面端显示） -->
            <div class="hidden lg:flex items-center text-xs text-gray-500 mr-2">
              <span class="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800">
                <span class="w-2 h-2 bg-green-400 rounded-full mr-1.5"></span>
                会话剩余: {{ authStore.remainingTime }}分钟
              </span>
            </div>
            
            <label class="text-sm font-medium text-gray-700 whitespace-nowrap">AI模型:</label>
            <select
              v-model="settingsStore.selectedProvider"
              @change="onProviderChange"
              class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 min-w-0 flex-1 sm:flex-none"
            >
              <option value="">选择提供商</option>
              <option
                v-for="provider in availableProviders"
                :key="provider.id"
                :value="provider.id"
              >
                {{ provider.name }}
              </option>
            </select>
            
            <select
              v-model="settingsStore.selectedModel"
              @change="settingsStore.saveSettings"
              :disabled="!settingsStore.selectedProvider"
              class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50 min-w-0 flex-1 sm:flex-none"
            >
              <option value="">选择模型</option>
              <option
                v-for="model in availableModels"
                :key="model.id"
                :value="model.id"
              >
                {{ model.name }}
              </option>
            </select>
            
            <!-- 用户菜单 -->
            <div class="relative" ref="userMenuRef">
              <button
                @click="showUserMenu = !showUserMenu"
                class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <User class="w-4 h-4 mr-1" />
                <span class="hidden sm:inline">{{ authStore.getConfig().username }}</span>
                <ChevronDown class="w-4 h-4 ml-1" />
              </button>
              
              <!-- 用户菜单下拉 -->
              <div
                v-if="showUserMenu"
                class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
              >
                <!-- 会话信息（移动端显示） -->
                <div class="lg:hidden px-3 py-2 border-b border-gray-100">
                  <div class="flex items-center text-xs text-gray-500">
                    <span class="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800">
                      <span class="w-2 h-2 bg-green-400 rounded-full mr-1.5"></span>
                      会话剩余: {{ authStore.remainingTime }}分钟
                    </span>
                  </div>
                </div>
                
                <button
                  @click="extendSession"
                  class="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Clock class="w-4 h-4 mr-2" />
                  延长会话
                </button>
                
                <button
                  @click="showAdminPanel"
                  class="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Shield class="w-4 h-4 mr-2" />
                  管理员设置
                </button>
                
                <hr class="my-1" />
                
                <button
                  @click="logout"
                  class="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut class="w-4 h-4 mr-2" />
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 主内容区域 - 支持移动端折叠，同时保持PC模式滚动修复 -->
      <div v-if="!isMobile" class="grid grid-cols-2 gap-4 flex-1 min-h-0 overflow-hidden">
        <!-- PC端 - Left Panel -->
        <div class="flex flex-col">
          <ChatInterface />
        </div>
        <!-- PC端 - Right Panel -->
        <div class="flex flex-col">
          <PreviewPanel />
        </div>
      </div>

      <!-- 移动端布局 -->
      <div v-else class="flex flex-col flex-1 min-h-0 overflow-hidden">
        <!-- AI助手对话折叠标题栏 - 固定在顶部 -->
        <div 
          v-if="!chatExpanded"
          @click="toggleChat"
          class="bg-white rounded-lg shadow-sm p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors flex-shrink-0 mb-2"
        >
          <h3 class="font-semibold text-gray-800">AI助手对话</h3>
          <ChevronDown class="w-5 h-5 text-gray-500" />
        </div>

        <!-- AI助手对话模块 -->
        <div v-if="chatExpanded" class="flex flex-col flex-1 min-h-0 mb-2">
          <ChatInterface 
            :is-mobile="isMobile"
            :is-expanded="chatExpanded"
            @toggle="toggleChat"
          />
        </div>

        <!-- 提示词预览模块 -->
        <div v-if="previewExpanded" class="flex flex-col flex-1 min-h-0 mb-2">
          <PreviewPanel 
            :is-mobile="isMobile"
            :is-expanded="previewExpanded"
            @toggle="togglePreview"
          />
        </div>

        <!-- 提示词预览折叠标题栏 - 固定在底部 -->
        <div 
          v-if="!previewExpanded"
          @click="togglePreview"
          class="bg-white rounded-lg shadow-sm p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          <h3 class="font-semibold text-gray-800">提示词预览</h3>
          <ChevronDown class="w-5 h-5 text-gray-500" />
        </div>
      </div>
    </div>
    
    <!-- 通知容器 -->
    <NotificationContainer />
    
    <!-- 管理员面板 -->
    <AdminPanel 
      :show="showAdminPanelModal" 
      @close="showAdminPanelModal = false" 
    />
  </div>
</template>

<script setup lang="ts">
import ChatInterface from '@/components/ChatInterface.vue'
import PreviewPanel from '@/components/PreviewPanel.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import NotificationContainer from '@/components/NotificationContainer.vue'
import AdminPanel from '@/components/AdminPanel.vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { usePromptStore } from '@/stores/promptStore'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { onMounted, onUnmounted, computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronDown, User, Clock, LogOut, Shield } from 'lucide-vue-next'

const router = useRouter()
const settingsStore = useSettingsStore()
const promptStore = usePromptStore()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

// 移动端折叠状态管理
const isMobile = ref(false)
const chatExpanded = ref(true)  // 默认展开对话
const previewExpanded = ref(false)  // 默认折叠预览

// 用户菜单状态
const showUserMenu = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)
const showAdminPanelModal = ref(false)

const connectionStatus = ref<'disconnected' | 'connected' | 'error'>('disconnected')

// 可用的提供商
const availableProviders = computed(() => {
  return settingsStore.getAvailableProviders()
})

// 当前提供商的可用模型
const availableModels = computed(() => {
  if (!settingsStore.selectedProvider) return []
  return settingsStore.getAvailableModels(settingsStore.selectedProvider)
})

// 提供商改变时重置模型选择
const onProviderChange = () => {
  settingsStore.selectedModel = ''
  const models = availableModels.value
  if (models.length > 0) {
    settingsStore.selectedModel = models[0].id
  }
  settingsStore.saveSettings()
  checkConnection()
}

// 检查连接状态 - 仅检查配置完整性，不发送实际API请求
const checkConnection = () => {
  const provider = settingsStore.getCurrentProvider()
  const model = settingsStore.getCurrentModel()
  
  if (!provider || !model || !provider.apiKey) {
    connectionStatus.value = 'disconnected'
    return
  }

  // 如果配置完整，标记为已连接，实际连接状态在使用时验证
  connectionStatus.value = 'connected'
}

// 监听模型选择变化
watch(() => [settingsStore.selectedProvider, settingsStore.selectedModel], checkConnection)

// 登出功能
const logout = async () => {
  try {
    authStore.logout()
    notificationStore.addNotification({
      type: 'success',
      message: '已成功登出'
    })
    router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
    notificationStore.addNotification({
      type: 'error',
      message: '登出过程中发生错误'
    })
  }
  showUserMenu.value = false
}

// 延长会话
const extendSession = () => {
  authStore.extendSession()
  notificationStore.addNotification({
    type: 'success',
    message: '会话已延长'
  })
  showUserMenu.value = false
}

// 显示管理员面板
const showAdminPanel = () => {
  showAdminPanelModal.value = true
  showUserMenu.value = false
}

// 监听会话状态
const checkSessionValidity = () => {
  if (!authStore.isSessionValid) {
    notificationStore.addNotification({
      type: 'warning',
      message: '会话已过期，请重新登录'
    })
    router.push('/login')
  }
}

// 点击外部关闭菜单
const handleClickOutside = (event: Event) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
    showUserMenu.value = false
  }
}

// 检测移动端设备
const checkMobile = () => {
  isMobile.value = window.innerWidth < 1024 // lg断点
}

// 切换对话模块
const toggleChat = () => {
  if (isMobile.value) {
    if (chatExpanded.value) {
      // 如果当前展开，折叠它并展开预览
      chatExpanded.value = false
      previewExpanded.value = true
    } else {
      // 如果当前折叠，展开它并折叠预览
      chatExpanded.value = true
      previewExpanded.value = false
    }
  }
}

// 切换预览模块
const togglePreview = () => {
  if (isMobile.value) {
    if (previewExpanded.value) {
      // 如果当前展开，折叠它并展开对话
      previewExpanded.value = false
      chatExpanded.value = true
    } else {
      // 如果当前折叠，展开它并折叠对话
      previewExpanded.value = true
      chatExpanded.value = false
    }
  }
}

// 监听生成状态，自动切换模块
watch(() => promptStore.isGenerating, (isGenerating) => {
  if (isMobile.value && isGenerating) {
    // 开始生成时切换到预览模块
    chatExpanded.value = false
    previewExpanded.value = true
  }
})

// 监听需求报告生成，自动切换
watch(() => promptStore.promptData.requirementReport, (report) => {
  if (isMobile.value && report && report.trim().length > 0) {
    // 生成报告后切换到预览模块
    chatExpanded.value = false
    previewExpanded.value = true
  }
})

// 会话检查定时器
let sessionCheckTimer: NodeJS.Timeout | null = null

// 初始化
onMounted(() => {
  // 初始化认证状态
  authStore.initialize()
  
  // 加载设置
  settingsStore.loadSettings()
  
  // 如果没有配置，显示设置界面
  const hasConfiguredProvider = availableProviders.value.length > 0
  if (!hasConfiguredProvider) {
    setTimeout(() => {
      settingsStore.showSettings = true
    }, 1000)
  } else {
    checkConnection()
  }

  // 检查移动端
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  // 点击外部事件监听
  document.addEventListener('click', handleClickOutside)
  
  // 定期检查会话状态（每分钟）
  sessionCheckTimer = setInterval(checkSessionValidity, 60000)

  // 对话初始化交给ChatInterface组件处理
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  document.removeEventListener('click', handleClickOutside)
  
  if (sessionCheckTimer) {
    clearInterval(sessionCheckTimer)
  }
})
</script>
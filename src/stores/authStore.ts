import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface LoginConfig {
  username: string
  password: string
  sessionTimeout: number // 会话超时时间（分钟）
}

export interface LoginAttempt {
  timestamp: number
  ip?: string
  userAgent?: string
}

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const isAuthenticated = ref(false)
  const loginTime = ref<number | null>(null)
  const sessionTimeout = ref(30) // 默认30分钟
  const loginAttempts = ref<LoginAttempt[]>([])
  const isLocked = ref(false)
  const lockUntil = ref<number | null>(null)
  
  // 配置（可以通过环境变量或配置文件设置）
  const defaultConfig: LoginConfig = {
    username: 'admin', // 默认用户名
    password: 'YPrompt2025!', // 默认密码（部署时应该修改）
    sessionTimeout: 30 // 30分钟
  }

  // 计算属性
  const isSessionValid = computed(() => {
    if (!isAuthenticated.value || !loginTime.value) return false
    const now = Date.now()
    const sessionExpiry = loginTime.value + (sessionTimeout.value * 60 * 1000)
    return now < sessionExpiry
  })

  const remainingTime = computed(() => {
    if (!loginTime.value) return 0
    const now = Date.now()
    const sessionExpiry = loginTime.value + (sessionTimeout.value * 60 * 1000)
    return Math.max(0, Math.floor((sessionExpiry - now) / 1000 / 60))
  })

  const isAccountLocked = computed(() => {
    if (!isLocked.value || !lockUntil.value) return false
    return Date.now() < lockUntil.value
  })

  // 从localStorage加载配置
  const loadConfig = (): LoginConfig => {
    try {
      const saved = localStorage.getItem('yprompt_auth_config')
      if (saved) {
        const config = JSON.parse(saved)
        return { ...defaultConfig, ...config }
      }
    } catch (error) {
      console.warn('Failed to load auth config:', error)
    }
    return defaultConfig
  }

  // 保存配置到localStorage
  const saveConfig = (config: Partial<LoginConfig>) => {
    try {
      const current = loadConfig()
      const updated = { ...current, ...config }
      localStorage.setItem('yprompt_auth_config', JSON.stringify(updated))
    } catch (error) {
      console.warn('Failed to save auth config:', error)
    }
  }

  // 从sessionStorage恢复登录状态
  const restoreSession = () => {
    try {
      const sessionData = sessionStorage.getItem('yprompt_session')
      if (sessionData) {
        const { loginTime: savedLoginTime, timeout } = JSON.parse(sessionData)
        loginTime.value = savedLoginTime
        sessionTimeout.value = timeout
        
        if (isSessionValid.value) {
          isAuthenticated.value = true
          return true
        } else {
          // 会话已过期，清理
          clearSession()
        }
      }
    } catch (error) {
      console.warn('Failed to restore session:', error)
      clearSession()
    }
    return false
  }

  // 保存会话到sessionStorage
  const saveSession = () => {
    try {
      const sessionData = {
        loginTime: loginTime.value,
        timeout: sessionTimeout.value
      }
      sessionStorage.setItem('yprompt_session', JSON.stringify(sessionData))
    } catch (error) {
      console.warn('Failed to save session:', error)
    }
  }

  // 清理会话
  const clearSession = () => {
    sessionStorage.removeItem('yprompt_session')
    loginTime.value = null
    isAuthenticated.value = false
  }

  // 记录登录尝试
  const recordLoginAttempt = (success: boolean) => {
    const attempt: LoginAttempt = {
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    }
    
    loginAttempts.value.push(attempt)
    
    // 只保留最近的10次尝试记录
    if (loginAttempts.value.length > 10) {
      loginAttempts.value = loginAttempts.value.slice(-10)
    }
    
    // 检查是否需要锁定账户（5分钟内失败超过5次）
    if (!success) {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      const recentFailures = loginAttempts.value.filter(
        attempt => attempt.timestamp > fiveMinutesAgo
      ).length
      
      if (recentFailures >= 5) {
        isLocked.value = true
        lockUntil.value = Date.now() + 15 * 60 * 1000 // 锁定15分钟
      }
    } else {
      // 登录成功，重置锁定状态
      isLocked.value = false
      lockUntil.value = null
    }
    
    // 保存到localStorage
    try {
      localStorage.setItem('yprompt_login_attempts', JSON.stringify({
        attempts: loginAttempts.value,
        isLocked: isLocked.value,
        lockUntil: lockUntil.value
      }))
    } catch (error) {
      console.warn('Failed to save login attempts:', error)
    }
  }

  // 恢复登录尝试记录
  const restoreLoginAttempts = () => {
    try {
      const saved = localStorage.getItem('yprompt_login_attempts')
      if (saved) {
        const data = JSON.parse(saved)
        loginAttempts.value = data.attempts || []
        isLocked.value = data.isLocked || false
        lockUntil.value = data.lockUntil || null
        
        // 检查锁定是否已过期
        if (isLocked.value && lockUntil.value && Date.now() > lockUntil.value) {
          isLocked.value = false
          lockUntil.value = null
        }
      }
    } catch (error) {
      console.warn('Failed to restore login attempts:', error)
    }
  }

  // 登录方法
  const login = async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
    // 检查账户是否被锁定
    if (isAccountLocked.value) {
      const remainingLockTime = Math.ceil((lockUntil.value! - Date.now()) / 1000 / 60)
      return {
        success: false,
        message: `账户已被锁定，请 ${remainingLockTime} 分钟后再试`
      }
    }

    const config = loadConfig()
    
    // 简单的用户名密码验证
    if (username === config.username && password === config.password) {
      isAuthenticated.value = true
      loginTime.value = Date.now()
      sessionTimeout.value = config.sessionTimeout
      
      saveSession()
      recordLoginAttempt(true)
      
      return {
        success: true,
        message: '登录成功'
      }
    } else {
      recordLoginAttempt(false)
      return {
        success: false,
        message: '用户名或密码错误'
      }
    }
  }

  // 登出方法
  const logout = () => {
    clearSession()
    // 不清理登录尝试记录，保留安全信息
  }

  // 延长会话
  const extendSession = () => {
    if (isAuthenticated.value) {
      loginTime.value = Date.now()
      saveSession()
    }
  }

  // 更新登录配置
  const updateConfig = (newConfig: Partial<LoginConfig>) => {
    saveConfig(newConfig)
  }

  // 获取当前配置（不包含密码）
  const getConfig = () => {
    const config = loadConfig()
    return {
      username: config.username,
      sessionTimeout: config.sessionTimeout
    }
  }

  // 重置登录尝试记录（管理员功能）
  const resetLoginAttempts = () => {
    loginAttempts.value = []
    isLocked.value = false
    lockUntil.value = null
    localStorage.removeItem('yprompt_login_attempts')
  }

  // 初始化
  const initialize = () => {
    restoreLoginAttempts()
    restoreSession()
  }

  return {
    // 状态
    isAuthenticated,
    loginTime,
    sessionTimeout,
    isLocked,
    lockUntil,
    loginAttempts,
    
    // 计算属性
    isSessionValid,
    remainingTime,
    isAccountLocked,
    
    // 方法
    login,
    logout,
    extendSession,
    updateConfig,
    getConfig,
    resetLoginAttempts,
    initialize
  }
})
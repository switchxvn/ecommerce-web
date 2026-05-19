import { ref } from 'vue'
import { useToastNotification } from '~/utils/vueToast'
// Không cần import CSS ở đây vì đã được import trong plugin

export interface NotificationOptions {
  title: string
  description?: string
  icon?: string
  timeout?: number
  color?: 'primary' | 'success' | 'info' | 'warning' | 'danger' | 'gray' | 'green' | 'red' | 'blue' | 'amber'
}

export interface Notification extends NotificationOptions {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
}

export function useNotification() {
  const notifications = ref<Notification[]>([])

  // Tạo ID ngẫu nhiên cho thông báo
  const generateId = () => Math.random().toString(36).substring(2, 9)

  // Thêm thông báo mới
  const addNotification = (notification: Notification) => {
    notifications.value.push(notification)
    
    // Tự động xóa thông báo sau timeout
    if (notification.timeout !== 0) {
      setTimeout(() => {
        removeNotification(notification.id)
      }, notification.timeout || 5000)
    }
  }

  // Xóa thông báo
  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  // Khởi tạo toast
  const toast = useToastNotification()

  // Thông báo thành công
  const success = (options: NotificationOptions) => {
    toast.success(`${options.title}${options.description ? '\n' + options.description : ''}`, {
      position: 'top-right',
      duration: options.timeout || 5000,
      dismissible: true
    })
  }

  // Thông báo lỗi
  const error = (options: NotificationOptions) => {
    toast.error(`${options.title}${options.description ? '\n' + options.description : ''}`, {
      position: 'top-right',
      duration: options.timeout || 5000,
      dismissible: true
    })
  }

  // Thông báo thông tin
  const info = (options: NotificationOptions) => {
    toast.info(`${options.title}${options.description ? '\n' + options.description : ''}`, {
      position: 'top-right',
      duration: options.timeout || 5000,
      dismissible: true
    })
  }

  // Thông báo cảnh báo
  const warning = (options: NotificationOptions) => {
    toast.warning(`${options.title}${options.description ? '\n' + options.description : ''}`, {
      position: 'top-right',
      duration: options.timeout || 5000,
      dismissible: true
    })
  }

  return {
    notifications,
    success,
    error,
    info,
    warning,
    toast // Trả về toast gốc để có thể sử dụng các phương thức khác nếu cần
  }
}

export default useNotification 

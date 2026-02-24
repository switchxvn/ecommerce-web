import { ref } from 'vue'
import { useTrpc } from './useTrpc'
import { useNotificationToast } from './useNotificationToast'

export interface UploadOptions {
  file: File
  folder?: string
  onProgress?: (percent: number) => void
}

export interface UploadResult {
  url: string
  key?: string
  uploadId?: number
}

export function useUpload() {
  const trpc = useTrpc()
  const isUploading = ref(false)
  const toast = useNotificationToast()

  const uploadFile = async ({
    file,
    folder = 'general',
    onProgress = () => {}
  }: UploadOptions): Promise<UploadResult> => {
    try {
      isUploading.value = true
      
      // Báo cáo tiến trình bắt đầu
      onProgress(10)
      
      // Chuyển đổi file thành base64 để gửi qua tRPC
      const base64 = await fileToBase64(file)
      onProgress(30)
      
      // Upload trực tiếp qua tRPC
      console.log(`Uploading file through tRPC: ${file.name}, type: ${file.type}, size: ${file.size} bytes, folder: ${folder}`)
      const uploadResult = await trpc.upload.uploadFile.mutate({
        file: base64,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        folder
      })
      
      if (!uploadResult || !uploadResult.url) {
        throw new Error('Server returned invalid upload result')
      }
      
      console.log('Upload completed successfully', uploadResult)
      onProgress(100)
      
      return {
        url: uploadResult.url,
        key: uploadResult.key,
        uploadId: uploadResult.uploadId
      }
    } catch (error: any) {
      console.error('Upload failed:', error)
      const errorMessage = error?.message || 'Unknown error occurred'
      toast.error(`Upload failed: ${errorMessage}`)
      throw error
    } finally {
      isUploading.value = false
    }
  }

  // Hàm tiện ích để chuyển đổi File thành Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const uploadImage = async (file: File, folder = 'avatars'): Promise<string> => {
    try {
      isUploading.value = true
      const result = await uploadFile({ file, folder })
      return result.url
    } catch (error: any) {
      console.error('Image upload failed:', error)
      throw error
    } finally {
      isUploading.value = false
    }
  }

  return {
    uploadFile,
    uploadImage,
    isUploading
  }
} 

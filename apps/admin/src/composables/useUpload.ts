import { ref } from 'vue'
import axios from 'axios'
import { useTrpc } from './useTrpc'
import { useNotification } from './useNotification'

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
  const runtimeConfig = useRuntimeConfig()
  const isUploading = ref(false)
  const { showError } = useNotification()

  const uploadFile = async ({
    file,
    folder = 'general',
    onProgress = () => {}
  }: UploadOptions): Promise<UploadResult> => {
    try {
      isUploading.value = true
      
      // Báo cáo tiến trình bắt đầu
      onProgress(10)
      
      console.log(`Starting upload process for: ${file.name}`);
      
      // 1. Lấy presigned URL từ API
      console.log(`Getting presigned URL for: ${file.name}, type: ${file.type}, size: ${file.size} bytes, folder: ${folder}`)
      const presignedData = await trpc.upload.getPresignedUrl.mutate({
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        folder
      })
      
      if (!presignedData?.presignedUrl || !presignedData?.url) {
        const errorMsg = 'Failed to get presigned URL from server'
        console.error(errorMsg, presignedData)
        throw new Error(errorMsg)
      }
      
      console.log('Presigned URL obtained successfully', {
        uploadId: presignedData.uploadId,
        hasUrl: !!presignedData.url,
        hasKey: !!presignedData.key
      })
      
      onProgress(30)
      
      // 2. Tạo FormData để gửi lên server Nuxt
      const formData = new FormData()
      formData.append('file', file)
      formData.append('presignedUrl', presignedData.presignedUrl)
      formData.append('key', presignedData.key || '')
      formData.append('uploadId', String(presignedData.uploadId || 0))
      formData.append('url', presignedData.url)
      
      console.log('Uploading file to server middleware...')
      
      // 3. Upload file thông qua server-side API để tránh CORS - sử dụng axios thay vì $fetch
      try {
        onProgress(50)
        
        // Sử dụng axios thay vì $fetch
        const baseURL = runtimeConfig.app.baseURL || '/'
        const normalizedBaseURL = baseURL.endsWith('/') ? baseURL : `${baseURL}/`
        const uploadEndpoint = `${normalizedBaseURL}admin-upload/upload-image`

        const response = await axios.post(uploadEndpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              console.log(`Upload progress: ${percentCompleted}%`);
              onProgress(50 + percentCompleted * 0.5) // 50% -> 100%
            }
          }
        })
        
        const uploadResult = response.data
        
        console.log('Upload completed successfully', uploadResult)
        onProgress(100)
        
        if (!uploadResult || !uploadResult.url) {
          throw new Error('Server returned invalid upload result')
        }
        
        return {
          url: uploadResult.url,
          key: uploadResult.key,
          uploadId: uploadResult.uploadId
        }
      } catch (uploadError: any) {
        console.error('Error during server upload:', uploadError)
        
        // Hiển thị lỗi chi tiết hơn để debug
        const errorMessage = uploadError?.response?.data?.message || 
                            uploadError?.message || 
                            'Unknown upload error'
        const statusCode = uploadError?.response?.status || 'unknown'
        const responseData = uploadError?.response?.data || 'No response data';
        
        console.error(`Upload server error - Status: ${statusCode}, Message: ${errorMessage}`, responseData);
        
        showError(`Upload failed (${statusCode}): ${errorMessage}`)
        throw new Error(`Upload failed: ${errorMessage}`)
      }
    } catch (error: any) {
      console.error('Upload failed:', error)
      const errorMessage = error?.message || 'Unknown error occurred'
      showError(`Upload failed: ${errorMessage}`)
      throw error
    } finally {
      isUploading.value = false
    }
  }

  const uploadImage = async (file: File, folder = 'products'): Promise<string> => {
    try {
      isUploading.value = true
      console.log(`Uploading image: ${file.name} to folder: ${folder}`);
      const result = await uploadFile({ file, folder })
      console.log(`Upload successful, URL: ${result.url}`);
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

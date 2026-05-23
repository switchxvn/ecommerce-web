<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useLocalization } from '~/composables/useLocalization';
import { useTrpc } from '~/composables/useTrpc';
import { X, Check, Send } from 'lucide-vue-next';
import PhoneInput from '~/components/form/PhoneInput.vue';
import { useVuelidate } from '@vuelidate/core';
import { required, email, helpers } from '@vuelidate/validators';
import { useNotification } from '~/composables/useNotification';

const props = defineProps<{
  isOpen: boolean;
  productId: number;
  productName: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const { t } = useLocalization();
const trpc = useTrpc();
const notification = useNotification();

const translateWithFallback = (key: string, fallback: string) => {
  const value = t(key);
  return typeof value === 'string' && value.trim() ? value : fallback;
};

// Form data
const fullName = ref('');
const emailValue = ref('');
const phoneNumber = ref('');
const selectedPhoneCode = ref('+84'); // Default to Vietnam
const message = ref('');

// Form validation
const errors = ref({
  fullName: '',
  email: '',
  phoneNumber: '',
});

// Phone validation state
const phoneValidation = ref<{ valid: boolean; message?: string }>({
  valid: true,
  message: ''
});

// Form submission
const isSubmitting = ref(false);
const submitSuccess = ref(false);

// Tham chiếu đến component PhoneInput
const phoneInputRef = ref<any>(null);

// Kiểm tra xem trường nào là bắt buộc
const isPhoneRequired = true;

// Định nghĩa quy tắc xác thực
const rules = computed(() => {
  return {
    fullName: { 
      required: helpers.withMessage(
        translateWithFallback('priceRequest.fullNameRequired', 'Vui lòng nhập họ tên'),
        required
      ) 
    },
    emailValue: { 
      required: helpers.withMessage(
        translateWithFallback('priceRequest.emailRequired', 'Vui lòng nhập email'),
        required
      ),
      email: helpers.withMessage(
        translateWithFallback('priceRequest.emailInvalid', 'Email không hợp lệ'),
        email
      )
    }
    // Loại bỏ validation cho phoneNumber ở đây, sẽ xử lý riêng
  };
});

// Tạo đối tượng Vuelidate
const v$ = useVuelidate(rules, { fullName, emailValue });

// Xử lý khi nhận kết quả xác thực từ PhoneInput
const handlePhoneValidation = (result: { valid: boolean; message?: string }) => {
  // Chỉ lưu trạng thái validation, không hiển thị lỗi ngay
  phoneValidation.value = result;
};

// Add new method to validate phone field
const validatePhoneField = async () => {
  // Reset thông báo lỗi
  errors.value.phoneNumber = '';
  
  // Kiểm tra xem số điện thoại có được nhập không
  if (!phoneNumber.value.trim()) {
    errors.value.phoneNumber = translateWithFallback('priceRequest.phoneRequired', 'Vui lòng nhập số điện thoại');
    return false;
  }
  
  // Xác thực số điện thoại
  let isPhoneValid = true;
  if (phoneInputRef.value) {
    // Gọi phương thức validate của PhoneInput để kiểm tra số điện thoại có phù hợp với quốc gia đã chọn không
    isPhoneValid = await phoneInputRef.value.validate();
  }
  
  // Cập nhật thông báo lỗi cho số điện thoại
  if (!isPhoneValid && phoneValidation.value && !phoneValidation.value.valid) {
    errors.value.phoneNumber = phoneValidation.value.message || translateWithFallback('validation.invalidPhone', 'Số điện thoại không hợp lệ');
  }
  
  return isPhoneValid;
};

// Validate full name field
const validateFullNameField = async () => {
  // Reset error message
  errors.value.fullName = '';
  
  // Check if name is empty
  if (!fullName.value.trim()) {
    errors.value.fullName = translateWithFallback('priceRequest.fullNameRequired', 'Vui lòng nhập họ tên');
    return false;
  }
  
  // Validate with vuelidate
  await v$.value.$validate();
  
  // Cập nhật thông báo lỗi nếu có
  if (v$.value.fullName.$error) {
    errors.value.fullName = v$.value.fullName.$errors[0].$message as string;
    return false;
  }
  
  return true;
};

// Validate email field
const validateEmailField = async () => {
  // Reset error message
  errors.value.email = '';
  
  // Check if email is empty
  if (!emailValue.value.trim()) {
    errors.value.email = translateWithFallback('priceRequest.emailRequired', 'Vui lòng nhập email');
    return false;
  }
  
  // Validate with vuelidate
  await v$.value.$validate();
  
  // Cập nhật thông báo lỗi nếu có
  if (v$.value.emailValue.$error) {
    errors.value.email = v$.value.emailValue.$errors[0].$message as string;
    return false;
  }
  
  return true;
};

// Validate form
const validateForm = async () => {
  // Reset thông báo lỗi
  errors.value = {
    fullName: '',
    email: '',
    phoneNumber: '',
  };
  
  // Xác thực từng trường riêng biệt
  const isFullNameValid = await validateFullNameField();
  const isEmailValid = await validateEmailField();
  const isPhoneValid = await validatePhoneField();
  
  return isFullNameValid && isEmailValid && isPhoneValid;
};

// Submit form
const submitForm = async () => {
  const isValid = await validateForm();
  if (!isValid) return;

  isSubmitting.value = true;

  try {
    // Format phone number correctly by removing spaces and other formatting characters
    // Only keep the actual phone number
    const formattedPhoneNumber = phoneNumber.value.replace(/\D/g, '');
    const completePhoneNumber = `${selectedPhoneCode.value}${formattedPhoneNumber}`;

    await trpc.priceRequest.create.mutate({
      fullName: fullName.value,
      email: emailValue.value,
      phone: completePhoneNumber,
      message: message.value,
      productId: props.productId,
      productName: props.productName,
    });

    // Hiển thị thông báo thành công
    notification.success({
      title: translateWithFallback('priceRequest.successToast', 'Yêu cầu báo giá đã được gửi'),
      description: translateWithFallback('priceRequest.successToastDescription', 'Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất')
    });
    
    // Đóng modal sau khi gửi thành công
    closeModal();
    // Không emit success để tránh hiển thị 2 toast
    // emit('success');
  } catch (error) {
    console.error('Error submitting price request:', error);
    notification.error({
      title: t('priceRequest.error') || 'Lỗi',
      description: translateWithFallback('priceRequest.errorDescription', 'Có lỗi xảy ra khi gửi yêu cầu báo giá. Vui lòng thử lại sau.')
    });
  } finally {
    isSubmitting.value = false;
  }
};

// Reset form
const resetForm = () => {
  fullName.value = '';
  emailValue.value = '';
  phoneNumber.value = '';
  message.value = '';
  errors.value = {
    fullName: '',
    email: '',
    phoneNumber: '',
  };
  phoneValidation.value = {
    valid: true,
    message: ''
  };
  submitSuccess.value = false;
  
  // Reset validation
  v$.value.$reset();
};

// Close modal
const closeModal = () => {
  resetForm();
  emit('close');
};

// Computed properties
const modalTitle = computed(() => {
  return submitSuccess.value
    ? translateWithFallback('priceRequest.successTitle', 'Yêu cầu đã được gửi')
    : translateWithFallback('priceRequest.title', 'Yêu cầu báo giá');
});

// Debug log khi props.isOpen thay đổi
watch(() => props.isOpen, (newValue) => {

});

watch(phoneNumber, (newValue) => {
  if (newValue?.trim() && errors.value.phoneNumber) {
    errors.value.phoneNumber = '';
  }
});

</script>

<template>
  <div class="price-request-modal">
    <div class="modal-header">
      <h2 class="text-xl font-semibold">{{ modalTitle }}</h2>
      <button @click="$emit('close')" class="close-button">
        <X class="w-5 h-5" />
      </button>
    </div>

    <div class="modal-body">
      <form @submit.prevent="submitForm" class="space-y-4">
        <!-- Form fields -->
        <div class="form-group">
          <label for="fullName" class="form-label">{{ translateWithFallback('priceRequest.fullName', 'Họ tên') }}</label>
          <input
            id="fullName"
            v-model="fullName"
            type="text"
            class="form-input"
            :class="{ 'error': errors.fullName }"
            :placeholder="translateWithFallback('priceRequest.fullNamePlaceholder', 'Nhập họ tên của bạn')"
          />
          <span v-if="errors.fullName" class="error-message">{{ errors.fullName }}</span>
        </div>

        <div class="form-group">
          <label for="email" class="form-label">{{ translateWithFallback('priceRequest.email', 'Email') }}</label>
          <input
            id="email"
            v-model="emailValue"
            type="email"
            class="form-input"
            :class="{ 'error': errors.email }"
            :placeholder="translateWithFallback('priceRequest.emailPlaceholder', 'Nhập email của bạn')"
          />
          <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label for="phone" class="form-label">
            {{ translateWithFallback('priceRequest.phone', 'Số điện thoại') }}
            <span v-if="isPhoneRequired" class="required-mark">*</span>
            <span v-else class="optional-field">({{ translateWithFallback('common.optional', 'Không bắt buộc') }})</span>
          </label>
          <PhoneInput
            ref="phoneInputRef"
            v-model="phoneNumber"
            v-model:phoneCode="selectedPhoneCode"
            :error="!!errors.phoneNumber"
            :placeholder="translateWithFallback('priceRequest.phonePlaceholder', 'Nhập số điện thoại của bạn')"
            @validation="handlePhoneValidation"
          />
          <span v-if="errors.phoneNumber" class="error-message">{{ errors.phoneNumber }}</span>
        </div>

        <div class="form-group">
          <label for="message" class="form-label">{{ translateWithFallback('priceRequest.message', 'Lời nhắn') }}</label>
          <textarea
            id="message"
            v-model="message"
            class="form-textarea"
            :placeholder="translateWithFallback('priceRequest.messagePlaceholder', 'Nhập lời nhắn của bạn (không bắt buộc)')"
            rows="4"
          ></textarea>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="submit-button hover:bg-blue-800"
            :disabled="isSubmitting"
            style="background-color: rgb(29, 78, 216) !important; color: white !important;"
          >
            <Send v-if="!isSubmitting" class="w-5 h-5 mr-2" />
            <span v-else class="loading-spinner"></span>
            {{ translateWithFallback('priceRequest.submit', 'Gửi yêu cầu') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.price-request-modal {
  width: 100%;
  max-width: 600px;
  background: white;
  border-radius: 0.5rem;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.close-button {
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #f3f4f6;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  ring: 2px solid #3b82f6;
}

.form-input.error,
.form-textarea.error {
  border-color: #ef4444;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.optional-field {
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: normal;
  font-style: italic;
  margin-left: 0.25rem;
}

.required-mark {
  color: #ef4444;
  margin-left: 0.25rem;
}

.form-actions {
  margin-top: 1.5rem;
}

.submit-button {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  padding: 0.75rem 1rem !important;
  background-color: rgb(var(--primary)) !important;
  color: rgb(var(--primary-foreground)) !important;
  border-radius: 0.375rem !important;
  font-weight: 500 !important;
  transition: background-color 0.2s !important;
  gap: 0.5rem !important;
}

.submit-button:hover {
  background-color: rgb(var(--primary-700, var(--primary))) !important;
}

.submit-button:disabled {
  opacity: 0.7 !important;
  cursor: not-allowed !important;
}

.loading-spinner {
  display: inline-flex !important;
  width: 1.25rem !important;
  height: 1.25rem !important;
  border: 2px solid currentColor !important;
  border-right-color: transparent !important;
  border-radius: 50% !important;
  animation: spin 0.75s linear infinite !important;
  margin-right: 0.5rem !important;
  vertical-align: middle !important;
}

.success-message {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  gap: 0.5rem !important;
  color: #10b981 !important;
}

/* Thêm style cho icon */
.submit-button svg,
.success-message svg {
  width: 1.25rem !important;
  height: 1.25rem !important;
  flex-shrink: 0 !important;
}

/* Đảm bảo text luôn căn giữa với icon */
.submit-button > span {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0.5rem !important;
  width: 100% !important;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Dark mode support */
:root.dark .price-request-modal {
  background: #1f2937;
}

:root.dark .modal-header {
  border-bottom-color: #374151;
}

:root.dark .close-button:hover {
  background-color: #374151;
}

:root.dark .form-input,
:root.dark .form-textarea {
  background-color: #1f2937;
  border-color: #374151;
  color: white;
}

:root.dark .form-input:focus,
:root.dark .form-textarea:focus {
  border-color: #3b82f6;
}
</style> 

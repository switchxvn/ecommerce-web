<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useLocalization } from '~/composables/useLocalization';
import { useTrpc } from '~/composables/useTrpc';
import PhoneInput from '~/components/form/PhoneInput.vue';
import { useNotification } from '~/composables/useNotification';

const props = defineProps<{
  isOpen: boolean;
  productId?: number;
  productName?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const { t } = useLocalization();
const trpc = useTrpc();
const notification = useNotification();

const formState = reactive({
  customerName: '',
  email: '',
  phoneNumber: '',
  phoneCode: '+84',
  message: ''
});

const errors = reactive({
  customerName: '',
  email: '',
  phoneNumber: ''
});

const isSubmitting = ref(false);
const phoneValidation = ref<{ valid: boolean; message?: string }>({
  valid: true
});

const modalTitle = computed(() => t('products.quickPurchaseTitle') || 'Mua hàng nhanh');
const modalDescription = computed(() => t('products.quickPurchaseDescription') || 'Chúng tôi sẽ liên hệ để xác nhận đơn hàng trong thời gian sớm nhất.');

const modalUiConfig = {
  // Force the modal to render above sticky navigation layers
  wrapper: 'fixed inset-0 z-[2000] overflow-y-auto',
  container: 'flex min-h-full items-center justify-center p-4 text-center sm:p-6 z-[2001]',
  base: 'relative z-[2002]',
  background: 'fixed inset-0 bg-gray-500/75 transition-opacity z-[1999]'
} as const;

const resetForm = () => {
  formState.customerName = '';
  formState.email = '';
  formState.phoneNumber = '';
  formState.phoneCode = '+84';
  formState.message = '';
  errors.customerName = '';
  errors.email = '';
  errors.phoneNumber = '';
  phoneValidation.value = { valid: true };
};

const handlePhoneValidation = (result: { valid: boolean; message?: string }) => {
  phoneValidation.value = result;
  if (!result.valid) {
    errors.phoneNumber = result.message || (t('validation.phoneInvalid') as string);
  }
};

const validateForm = () => {
  errors.customerName = '';
  errors.email = '';
  errors.phoneNumber = '';
  let isValid = true;

  if (!formState.customerName.trim()) {
    errors.customerName = t('validation.required') as string;
    isValid = false;
  }

  if (!formState.phoneNumber.trim()) {
    errors.phoneNumber = t('validation.required') as string;
    isValid = false;
  } else if (!phoneValidation.value.valid) {
    errors.phoneNumber = phoneValidation.value.message || (t('validation.phoneInvalid') as string);
    isValid = false;
  }

  if (formState.email && formState.email.length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formState.email)) {
      errors.email = t('validation.email') as string;
      isValid = false;
    }
  }

  return isValid;
};

const submitForm = async () => {
  if (!validateForm()) return;

  isSubmitting.value = true;
  try {
    await trpc.order.quickPurchase.mutate({
      customerName: formState.customerName.trim(),
      phoneCode: formState.phoneCode,
      phoneNumber: formState.phoneNumber,
      email: formState.email?.trim() || undefined,
      message: formState.message?.trim() || undefined,
      productId: props.productId,
      productName: props.productName
    });

    notification.success({
      title: t('products.quickPurchaseSuccessTitle') || 'Gửi thông tin thành công',
      description: t('products.quickPurchaseSuccessMessage') || 'Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.'
    });

    emit('success');
    emit('close');
    resetForm();
  } catch (error) {
    console.error('Quick purchase submission failed:', error);
    notification.error({
      title: t('common.error') || 'Có lỗi xảy ra',
      description: t('products.quickPurchaseError') || 'Không thể gửi yêu cầu mua hàng nhanh. Vui lòng thử lại.'
    });
  } finally {
    isSubmitting.value = false;
  }
};

const handleModalUpdate = (value: boolean) => {
  if (!value && !isSubmitting.value) {
    emit('close');
  }
};

watch(() => props.isOpen, (open) => {
  if (!open) {
    resetForm();
  }
});
</script>

<template>
  <UModal
    :model-value="isOpen"
    :prevent-close="isSubmitting"
    :ui="modalUiConfig"
    @update:model-value="handleModalUpdate"
  >
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold">
              {{ modalTitle }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ modalDescription }}
            </p>
          </div>
          <UButton
            icon="i-lucide-x"
            color="gray"
            variant="ghost"
            :disabled="isSubmitting"
            @click="emit('close')"
          />
        </div>
      </template>

      <form class="space-y-4" @submit.prevent="submitForm">
        <UFormGroup
          :label="t('priceRequest.fullName')"
          :error="errors.customerName"
          required
        >
          <UInput
            v-model="formState.customerName"
            :placeholder="t('priceRequest.fullNamePlaceholder')"
          />
        </UFormGroup>

        <UFormGroup
          :label="t('priceRequest.email')"
          :error="errors.email"
        >
          <UInput
            v-model="formState.email"
            type="email"
            :placeholder="t('priceRequest.emailPlaceholder')"
          />
        </UFormGroup>

        <UFormGroup
          :label="t('priceRequest.phone')"
          :error="errors.phoneNumber"
          required
        >
          <PhoneInput
            v-model="formState.phoneNumber"
            v-model:phone-code="formState.phoneCode"
            :error="!!errors.phoneNumber"
            :show-error-message="false"
            @validation="handlePhoneValidation"
          />
          <p v-if="errors.phoneNumber" class="text-sm text-red-500 mt-1">
            {{ errors.phoneNumber }}
          </p>
        </UFormGroup>

        <UFormGroup :label="t('priceRequest.message')">
          <UTextarea
            v-model="formState.message"
            :rows="4"
            :placeholder="t('priceRequest.messagePlaceholder')"
          />
        </UFormGroup>

        <div class="flex items-center justify-end gap-3 pt-2">
          <UButton
            color="gray"
            variant="ghost"
            :disabled="isSubmitting"
            @click="emit('close')"
          >
            {{ t('priceRequest.cancel') || 'Hủy' }}
          </UButton>
          <UButton
            type="submit"
            color="primary"
            :loading="isSubmitting"
          >
            {{ t('products.quickPurchaseSubmit') || 'Gửi yêu cầu' }}
          </UButton>
        </div>
      </form>
    </UCard>
  </UModal>
</template>

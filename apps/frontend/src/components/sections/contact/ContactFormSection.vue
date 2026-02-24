<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { z } from 'zod';
import type { Form, FormError, FormSubmitEvent } from '@nuxt/ui/dist/runtime/types';
import { useNotificationToast } from '~/composables/useNotificationToast';
import { useTrpc } from '~/composables/useTrpc';
import { useLocalization } from '~/composables/useLocalization';

interface Props {
  settings: Record<string, any>;
  translations: {
    title: string;
    subtitle?: string;
    content?: string;
  };
}

const props = defineProps<Props>();

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const toast = useNotificationToast();
const trpc = useTrpc();
const { t } = useLocalization();

// Form state and ref
const form = ref<Form<ContactForm>>();
const state = reactive<ContactForm>({
  name: '',
  email: '',
  phone: '',
  message: ''
});

// Phone input state
const phoneCode = ref('+84');
const phoneValid = ref(true);
const phoneErrorMessage = ref('');

// Form validation schema
const schema = z.object({
  name: z.string().min(1, t('validation.required')),
  email: z.string().email(t('validation.email')),
  phone: z.string().min(1, t('validation.required')),
  message: z.string().min(1, t('validation.required'))
});

const isLoading = ref(false);

// Handle phone validation
const handlePhoneValidation = ({ valid, message }: { valid: boolean; message?: string }) => {
  phoneValid.value = valid;
  phoneErrorMessage.value = message || '';
  
  if (!valid && form.value) {
    form.value.setErrors([{
      path: 'phone',
      message: message || t('validation.phoneInvalid')
    }]);
  }
};

const resetForm = () => {
  if (form.value) {
    form.value.clear();
  }
  state.name = '';
  state.email = '';
  state.phone = '';
  state.message = '';
  phoneCode.value = '+84';
  phoneValid.value = true;
  phoneErrorMessage.value = '';
};

const handleSubmit = async (event: FormSubmitEvent<ContactForm>) => {
  if (!phoneValid.value) {
    if (form.value) {
      form.value.setErrors([{
        path: 'phone',
        message: phoneErrorMessage.value || t('validation.phoneInvalid')
      }]);
    }
    return;
  }

  isLoading.value = true;
  
  try {
    const response = await trpc.contact.create.mutate({
      ...event.data,
      phone: `${phoneCode.value}${event.data.phone}`
    });

    if (response.success) {
      toast.success(response.message);
      resetForm();
    } else {
      toast.error(response.message);
    }
  } catch (error) {
    console.error('Contact form error:', error);
    toast.error(t('common.error'));
  } finally {
    isLoading.value = false;
  }
};

const handleError = (error: FormError[]) => {
  toast.error(t('validation.required'));
};

const backgroundColor = computed(() => {
  return props.settings.backgroundColor || 'bg-white dark:bg-gray-800';
});

const textColor = computed(() => {
  return props.settings.textColor || 'text-gray-900 dark:text-white';
});

const padding = computed(() => {
  return props.settings.padding || '4rem 0';
});

const titleSize = computed(() => {
  return props.settings.titleSize || 'text-4xl md:text-5xl';
});

const titleWeight = computed(() => {
  return props.settings.titleWeight || 'font-extrabold';
});

const subtitleSize = computed(() => {
  return props.settings.subtitleSize || 'text-2xl md:text-3xl';
});

const contentSize = computed(() => {
  return props.settings.contentSize || 'text-xl';
});

const formLabelSize = computed(() => {
  return props.settings.formLabelSize || 'text-base';
});

const formLabelWeight = computed(() => {
  return props.settings.formLabelWeight || 'font-semibold';
});

const titleColor = computed(() => {
  return props.settings.titleColor || 'text-primary-600 dark:text-primary-400';
});

const subtitleColor = computed(() => {
  return props.settings.subtitleColor || 'text-gray-700 dark:text-gray-300';
});

const contentColor = computed(() => {
  return props.settings.contentColor || 'text-gray-600 dark:text-gray-400';
});
</script>

<template>
  <section 
    class="w-full"
    :class="[backgroundColor, textColor]"
    :style="{ padding }"
  >
    <div class="container mx-auto px-4">
      <div class="text-center mb-16">
        <h2 :class="[titleSize, titleWeight, titleColor, 'mb-6 leading-tight']">{{ translations.title }}</h2>
        
        <p v-if="translations.subtitle" :class="[subtitleSize, subtitleColor, 'mb-6 font-medium']">
          {{ translations.subtitle }}
        </p>
        
        <p v-if="translations.content" :class="[contentSize, contentColor, 'max-w-3xl mx-auto leading-relaxed']">
          {{ translations.content }}
        </p>
      </div>
      
      <div class="max-w-2xl mx-auto">
        <UForm
          ref="form"
          :schema="schema"
          :state="state"
          class="space-y-8"
          @submit="handleSubmit"
          @error="handleError"
        >
          <UFormGroup
            :label="t('priceRequest.fullName')"
            name="name"
            required
            :class="[formLabelSize, formLabelWeight]"
          >
            <UInput
              v-model="state.name"
              type="text"
              :placeholder="t('priceRequest.fullNamePlaceholder')"
              color="gray"
              variant="outline"
              size="lg"
              :ui="{
                base: 'h-[48px] text-base',
                input: 'h-[48px] text-base'
              }"
            />
          </UFormGroup>

          <UFormGroup
            :label="t('auth.email')"
            name="email"
            required
            :class="[formLabelSize, formLabelWeight]"
          >
            <UInput
              v-model="state.email"
              type="email"
              :placeholder="t('priceRequest.emailPlaceholder')"
              color="gray"
              variant="outline"
              size="lg"
              :ui="{
                base: 'h-[48px] text-base',
                input: 'h-[48px] text-base'
              }"
            />
          </UFormGroup>

          <UFormGroup
            :label="t('priceRequest.phone')"
            name="phone"
            required
            :error="!phoneValid ? phoneErrorMessage : undefined"
            :class="[formLabelSize, formLabelWeight]"
          >
            <div class="phone-input-wrapper">
              <PhoneInput
                v-model="state.phone"
                v-model:phoneCode="phoneCode"
                :placeholder="t('priceRequest.phonePlaceholder')"
                :error="!phoneValid"
                :showErrorMessage="true"
                @validation="handlePhoneValidation"
              />
            </div>
          </UFormGroup>

          <UFormGroup
            :label="t('priceRequest.message')"
            name="message"
            required
            :class="[formLabelSize, formLabelWeight]"
          >
            <UTextarea
              v-model="state.message"
              :placeholder="t('priceRequest.messagePlaceholder')"
              :rows="4"
              color="gray"
              variant="outline"
              size="lg"
              :ui="{
                base: 'text-base',
                input: 'text-base resize-none'
              }"
            />
          </UFormGroup>

          <div class="flex justify-center">
            <UButton
              type="submit"
              color="primary"
              :loading="isLoading"
              class="w-full md:w-auto h-[48px] text-lg font-semibold px-10"
              variant="solid"
            >
              {{ isLoading ? t('common.loading') : t('common.submit') }}
            </UButton>
          </div>
        </UForm>
      </div>
    </div>
  </section>
</template>

<style scoped>
.phone-input-wrapper :deep(.phone-input-container) {
  @apply relative;

  .phone-code-selector button {
    @apply h-[48px] text-base border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 transition-colors duration-200;
  }

  .u-input {
    @apply h-[48px] text-base;
  }

  &.error {
    .phone-code-selector button,
    .u-input {
      @apply border-red-500;
    }
  }
}

/* Fix border radius for phone input */
.phone-input-wrapper :deep(.phone-code-selector button) {
  @apply rounded-l-md border-r-0;
}

.phone-input-wrapper :deep(.u-input) {
  @apply rounded-l-none;
}

/* Consistent hover states */
.phone-input-wrapper :deep(.phone-code-selector button:hover) {
  @apply bg-gray-100 dark:bg-gray-600;
}

/* Fix dropdown styling */
.phone-input-wrapper :deep(.phone-code-selector .absolute) {
  @apply mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg z-50;
}

:deep(.form-group) {
  @apply mb-8;
}

:deep(.form-label) {
  @apply mb-3 text-gray-700 dark:text-gray-200;
}

:deep(.u-input),
:deep(.u-textarea) {
  @apply relative block w-full appearance-none rounded-md border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm shadow-sm;
}

:deep(.u-input.error),
:deep(.u-textarea.error) {
  @apply border-red-500 focus:border-red-500 focus:ring-red-500;
}

:deep(.dark .u-input),
:deep(.dark .u-textarea) {
  @apply bg-gray-700 border-gray-600 text-white placeholder-gray-400;
}

:deep(.error-message) {
  @apply mt-2 text-sm text-red-500 font-medium;
}
</style> 

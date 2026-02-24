<script setup lang="ts">
// Auto-imported by Nuxt 3;
import { useAuth } from '@/composables/useAuth';
import { useVuelidate } from '@vuelidate/core';
import { required, email } from '@vuelidate/validators';
import { useNotificationToast } from '@/composables/useNotificationToast';

definePageMeta({
  layout: 'auth',
  middleware: ['guest']
});

const { login, isLoading, error: authError } = useAuth();
const toast = useNotificationToast();

const form = ref({
  email: '',
  password: '',
  rememberMe: false
});

const rules = {
  email: { 
    required,
    email
  },
  password: { 
    required
  }
};

const v$ = useVuelidate(rules, form);

const handleSubmit = async () => {
  const isValid = await v$.value.$validate();
  if (!isValid) return;
  
  try {
    await login({
      email: form.value.email,
      password: form.value.password,
    });
    
    toast.success('Đăng nhập thành công!');
  } catch (err: any) {
    if (err.shape?.message) {
      toast.error(err.shape.message);
    } else {
      toast.error('Đã xảy ra lỗi khi đăng nhập');
    }
  }
};

// Handle enter key press
const handleKeyPress = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    handleSubmit();
  }
};
</script>

<template>
  <div class="space-y-8">
    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <UFormGroup
        label="Email"
        :error="v$.email.$error ? String(v$.email.$errors[0].$message) : undefined"
        required
      >
        <UInput
          v-model="form.email"
          type="email"
          placeholder="example@email.com"
          :error="v$.email.$error"
          @blur="v$.email.$touch"
          @keypress="handleKeyPress"
        />
      </UFormGroup>

      <UFormGroup
        label="Mật khẩu"
        :error="v$.password.$error ? String(v$.password.$errors[0].$message) : undefined"
        required
      >
        <UInput
          v-model="form.password"
          type="password"
          placeholder="••••••••"
          :error="v$.password.$error"
          @blur="v$.password.$touch"
          @keypress="handleKeyPress"
        />
      </UFormGroup>

      <div class="flex items-center justify-between">
        <UCheckbox
          v-model="form.rememberMe"
          label="Ghi nhớ đăng nhập"
        />
        <NuxtLink
          to="/auth/forgot-password"
          class="text-sm text-primary hover:underline"
        >
          Quên mật khẩu?
        </NuxtLink>
      </div>

      <div v-if="authError" class="rounded-md bg-destructive/10 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <UIcon name="i-heroicons-exclamation-circle" class="h-5 w-5 text-destructive" />
          </div>
          <div class="ml-3">
            <p class="text-sm text-destructive">
              {{ authError }}
            </p>
          </div>
        </div>
      </div>

      <UButton
        type="submit"
        color="primary"
        block
        :loading="isLoading"
        :disabled="isLoading"
        size="lg"
      >
        {{ isLoading ? 'Đang xử lý...' : 'Đăng nhập' }}
      </UButton>

      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-border"></div>
        </div>
        <div class="relative flex justify-center text-xs uppercase">
          <span class="bg-background px-2 text-muted-foreground">
            Hoặc
          </span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <UButton
          color="gray"
          variant="outline"
          block
          icon="i-simple-icons-google"
        >
          Google
        </UButton>
        <UButton
          color="gray"
          variant="outline"
          block
          icon="i-simple-icons-facebook"
        >
          Facebook
        </UButton>
      </div>

      <div class="text-center text-sm">
        <span class="text-muted-foreground">Chưa có tài khoản?</span>
        <NuxtLink
          to="/auth/register"
          class="ml-1 text-primary hover:underline"
        >
          Đăng ký ngay
        </NuxtLink>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* Add logo animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style> 

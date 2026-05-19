<script setup lang="ts">
// Auto-imported by Nuxt 3;
import FormInput from '@/components/ui/form/FormInput.vue';
import { useAuth, type RegisterCredentials } from '@/composables/useAuth';
import { AUTH_ROUTE_PATHS } from '@/utils/routes';

definePageMeta({
  layout: 'auth',
});

const { register, isLoading, error } = useAuth();

const credentials = ref<RegisterCredentials>({
  name: '',
  email: '',
  password: '',
});

const handleSubmit = async () => {
  await register(credentials.value);
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <FormInput
      v-model="credentials.name"
      label="Name"
      placeholder="Enter your name"
      required
    />
    <FormInput
      v-model="credentials.email"
      label="Email"
      type="email"
      placeholder="Enter your email"
      required
    />
    <FormInput
      v-model="credentials.password"
      label="Password"
      type="password"
      placeholder="Create a password"
      required
    />
    <div v-if="error" class="text-sm text-destructive">
      {{ error }}
    </div>
    <button
      type="submit"
      class="form-button primary w-full h-10"
      :disabled="isLoading"
    >
      {{ isLoading ? 'Creating account...' : 'Create account' }}
    </button>
    <div class="text-center text-sm">
      <span class="text-muted-foreground">Already have an account?</span>
      <NuxtLink :to="AUTH_ROUTE_PATHS.login" class="ml-1 text-primary hover:underline">
        Sign in
      </NuxtLink>
    </div>
  </form>
</template>

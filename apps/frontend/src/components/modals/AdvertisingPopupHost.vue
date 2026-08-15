<script setup lang="ts">
import { onMounted } from 'vue';

import { useAdvertisingPopup } from '../../composables/useAdvertisingPopup';
import AdvertisingPopup from './AdvertisingPopup.vue';

const {
  campaign,
  shouldShow,
  initialize,
  close: closeAdvertisingPopup,
} = useAdvertisingPopup();

onMounted(() => {
  void initialize();
});
</script>

<template>
  <AdvertisingPopup
    v-if="shouldShow && campaign"
    :campaign="campaign"
    @close="closeAdvertisingPopup"
  />
</template>

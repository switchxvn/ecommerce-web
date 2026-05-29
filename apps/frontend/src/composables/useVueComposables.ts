import {
  ref as vueRef,
  computed as vueComputed,
  onMounted as vueOnMounted,
  watch as vueWatch,
  reactive as vueReactive,
  toRef as vueToRef,
  toRefs as vueToRefs,
  nextTick as vueNextTick,
} from 'vue';

// Keep a compatibility wrapper without overriding Nuxt auto-import keys.
export {
  vueRef,
  vueComputed,
  vueOnMounted,
  vueWatch,
  vueReactive,
  vueToRef,
  vueToRefs,
  vueNextTick,
};

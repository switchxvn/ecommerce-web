<!-- Team section for about page -->
<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';

interface TeamMember {
  name: string;
  position: string;
  imageUrl: string;
  bio?: string;
  socialLinks?: Record<string, string>;
}

interface Props {
  settings: {
    teamLayout?: string;
    teamColumns?: number;
    teamMembers?: TeamMember[];
    backgroundColor?: string;
    textColor?: string;
    padding?: string;
    animation?: {
      enabled: boolean;
      type: string;
      duration: number;
      delay: number;
    };
  };
  translations: {
    title: string;
    subtitle?: string;
    content?: string;
    data?: {
      teamMembers?: TeamMember[];
    };
  };
}

const props = withDefaults(defineProps<Props>(), {
  settings: () => ({}),
  translations: () => ({ title: '' })
});

const sectionStyle = computed(() => ({
  backgroundColor: props.settings.backgroundColor || 'transparent',
  color: props.settings.textColor || 'inherit',
  padding: props.settings.padding || '4rem 0'
}));

const gridClass = computed(() => {
  const columns = props.settings.teamColumns || 3;
  return `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-8`;
});

const teamMembers = computed(() => {
  return props.translations.data?.teamMembers || props.settings.teamMembers || [];
});

const socialIconMap: Record<string, string> = {
  facebook: 'mdi:facebook',
  instagram: 'mdi:instagram',
  linkedin: 'mdi:linkedin',
  youtube: 'mdi:youtube',
  tiktok: 'ic:baseline-tiktok',
  twitter: 'mdi:twitter',
  x: 'mdi:twitter',
  zalo: 'simple-icons:zalo'
};

const getSocialIcon = (platform: string) => {
  return socialIconMap[platform.toLowerCase()] || 'mdi:web';
};
</script>

<template>
  <section 
    class="w-full"
    :style="sectionStyle"
    :data-aos="settings.animation?.enabled ? settings.animation.type : null"
    :data-aos-duration="settings.animation?.duration"
    :data-aos-delay="settings.animation?.delay"
  >
    <div class="container mx-auto px-4">
      <div class="text-center mb-12">
        <h2 class="text-3xl md:text-4xl font-bold mb-4">
          {{ translations.title }}
        </h2>
        <p v-if="translations.subtitle" class="text-xl text-muted-foreground">
          {{ translations.subtitle }}
        </p>
        <div v-if="translations.content" class="prose dark:prose-invert mx-auto mt-4" v-html="translations.content"></div>
      </div>

      <div :class="gridClass">
        <div 
          v-for="member in teamMembers" 
          :key="member.name"
          class="bg-card text-card-foreground rounded-lg shadow-lg overflow-hidden"
          :data-aos="settings.animation?.enabled ? 'fade-up' : null"
          :data-aos-delay="settings.animation?.delay"
        >
          <img 
            v-if="member.imageUrl"
            :src="member.imageUrl" 
            :alt="member.name"
            class="w-full h-64 object-cover"
          />
          <div class="p-6">
            <h3 class="text-xl font-semibold mb-2">{{ member.name }}</h3>
            <p class="text-primary mb-3">{{ member.position }}</p>
            <p v-if="member.bio" class="text-muted-foreground text-sm mb-4">
              {{ member.bio }}
            </p>

            <div v-if="member.socialLinks" class="flex space-x-4">
              <a
                v-for="(url, platform) in member.socialLinks"
                :key="platform"
                :href="url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-muted-foreground hover:text-primary transition-colors"
              >
                <Icon :icon="getSocialIcon(platform)" class="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template> 

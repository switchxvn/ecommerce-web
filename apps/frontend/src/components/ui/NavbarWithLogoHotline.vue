<script setup lang="ts">
import { ref, computed } from "vue";
import Icon from "./Icon.vue";
import { useLocalization } from "~/composables/useLocalization";

// Props cho component
interface NavbarProps {
  settings?: {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    logo?: {
      src: string;
      alt: string;
      width: number;
      height: number;
      darkModeSrc?: string;
    };
    slogan?: {
      text: string;
      subText: string;
      fontSize: string;
      fontWeight: string;
      translations?: {
        locale: string;
        text: string;
        subText: string;
      }[];
    };
    hotlines?: {
      sales: {
        text: string;
        number: string;
        translations?: {
          locale: string;
          text: string;
        }[];
      };
      support: {
        text: string;
        number: string;
        translations?: {
          locale: string;
          text: string;
        }[];
      };
    };
  };
}

const props = withDefaults(defineProps<NavbarProps>(), {
  settings: () => ({
    backgroundColor: "#ffffff",
    textColor: "#000000",
    borderColor: "#e5e7eb",
    logo: {
      src: "/images/logo.png",
      alt: "Logo",
      width: 120,
      height: 60,
      darkModeSrc: "/images/logo-dark.png"
    },
    slogan: {
      text: "XE NÂNG MGA FORKLIFT LẮP RÁP SKD TẠI VIỆT NAM",
      subText: "ĐỘNG CƠ ISUZU NHẬP KHẨU NỘI ĐỊA TỪ NHẬT BẢN",
      fontSize: "lg",
      fontWeight: "bold"
    },
    hotlines: {
      sales: {
        text: "Mua hàng",
        number: "0901.20.30.70"
      },
      support: {
        text: "Hỗ trợ kỹ thuật", 
        number: "028.3620.80.81"
      }
    }
  })
});

// Import localization
const { locale } = useLocalization();

// Hàm lấy bản dịch cho slogan
const getTranslation = (item: any, field: string, targetLocale: string) => {
  if (!item?.translations || item.translations.length === 0) {
    return item[field];
  }

  const translation = item.translations.find((t: any) => t.locale === targetLocale);
  if (translation) {
    return translation[field];
  }

  return item[field];
};

// Computed cho slogan text đã được dịch
const translatedSloganText = computed(() => {
  return getTranslation(props.settings?.slogan, 'text', locale.value);
});

// Computed cho slogan subText đã được dịch
const translatedSloganSubText = computed(() => {
  return getTranslation(props.settings?.slogan, 'subText', locale.value);
});

// Computed cho hotline sales text đã được dịch
const translatedSalesText = computed(() => {
  return getTranslation(props.settings?.hotlines?.sales, 'text', locale.value);
});

// Computed cho hotline support text đã được dịch
const translatedSupportText = computed(() => {
  return getTranslation(props.settings?.hotlines?.support, 'text', locale.value);
});

// Computed styles based on settings
const navbarStyles = computed(() => {
  const styles: Record<string, string> = {};
  
  if (props.settings?.backgroundColor) {
    styles.backgroundColor = props.settings.backgroundColor;
  }
  if (props.settings?.textColor) {
    styles.color = props.settings.textColor;
  }
  if (props.settings?.borderColor) {
    styles.borderColor = props.settings.borderColor;
  }
  
  return styles;
});
</script>

<template>
  <nav class="w-full border-b" :style="navbarStyles">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between py-4">
        <!-- Logo -->
        <div class="flex-shrink-0">
          <UImage
            v-if="props.settings?.logo"
            :src="props.settings.logo.src"
            :alt="props.settings.logo.alt"
            :width="props.settings.logo.width"
            :height="props.settings.logo.height"
            class="h-auto w-auto object-contain"
          />
        </div>

        <!-- Slogan -->
        <div class="flex flex-col items-center justify-center text-center">
          <p v-if="props.settings?.slogan" class="text-xl font-bold text-red-600">
            {{ translatedSloganText }}
          </p>
          <p v-if="props.settings?.slogan" class="text-lg font-bold text-red-600">
            {{ translatedSloganSubText }}
          </p>
        </div>

        <!-- Hotlines -->
        <div class="flex flex-col items-end justify-center gap-2">
          <!-- Mua hàng -->
          <div v-if="props.settings?.hotlines?.sales" class="flex items-center gap-2">
            <div class="flex items-center justify-center rounded-full bg-white p-2 shadow-md">
              <Icon name="Phone" class="h-5 w-5 text-red-600" />
            </div>
            <div class="flex flex-col">
              <span class="text-sm text-gray-600">{{ translatedSalesText }}</span>
              <span class="text-lg font-bold text-red-600">{{ props.settings.hotlines.sales.number }}</span>
            </div>
          </div>

          <!-- Hỗ trợ kỹ thuật -->
          <div v-if="props.settings?.hotlines?.support" class="flex items-center gap-2">
            <div class="flex items-center justify-center rounded-full bg-white p-2 shadow-md">
              <Icon name="Phone" class="h-5 w-5 text-red-600" />
            </div>
            <div class="flex flex-col">
              <span class="text-sm text-gray-600">{{ translatedSupportText }}</span>
              <span class="text-lg font-bold text-red-600">{{ props.settings.hotlines.support.number }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  /* Add any additional navbar styles here */
}
</style> 

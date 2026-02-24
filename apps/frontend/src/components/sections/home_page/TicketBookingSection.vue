<!-- TicketBookingSection.vue -->
<template>
  <section :class="[backgroundColor]" class="relative pb-16">
    <div :class="[currentSettings.width, currentSettings.margin]" class="px-4">
      <!-- Booking Card -->
      <div
        :class="[
          currentSettings.backgroundColor,
          currentSettings.borderRadius,
          currentSettings.cardShadow,
          currentSettings.padding,
          'relative',
          currentSettings.zIndex,
          'border-2 border-primary-500'
        ]"
        style="margin-top: -7.5rem;"
      >
        <h2
          :class="[currentSettings.typography.heading, currentSettings.colors.heading]"
          class="mb-6 uppercase tracking-wide text-center"
        >
          {{
            selectedProduct?.translations
              ? getTranslationByLocale(selectedProduct.translations, "title")
              : "Đặt vé tham quan"
          }}
        </h2>

        <!-- Ticket Products Slider -->
        <div class="mb-8">
          <div v-if="isLoadingProducts" class="text-center py-8">
            <div
              class="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto"
            ></div>
            <div class="mt-4 text-gray-600 dark:text-gray-400">
              Đang tải danh sách vé...
            </div>
          </div>

          <template v-else>
            <div
              v-if="products.length === 0"
              class="text-center py-8 text-gray-600 dark:text-gray-400"
            >
              Không tìm thấy vé nào
            </div>

            <Swiper
              v-else
              :modules="[SwiperNavigation, SwiperPagination]"
              :slides-per-view="1"
              :space-between="20"
              :breakpoints="{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }"
              :navigation="true"
              :pagination="{ clickable: true }"
              class="ticket-swiper"
            >
              <SwiperSlide v-for="product in products" :key="product.id">
                <div
                  class="p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer w-[360px] mx-auto hover:shadow-lg"
                  :class="[
                    selectedProduct?.id === product.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 shadow-md'
                      : 'border-primary-500/50 dark:border-primary-500/50 hover:border-primary-500 dark:hover:border-primary-500',
                  ]"
                >
                  <div class="flex gap-4 items-center" @click="selectProduct(product)">
                    <div class="w-32 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        :src="product.thumbnail"
                        :alt="product.translations[0]?.title"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1.5">
                        <TicketIcon class="w-4 h-4 text-primary-500" />
                        <h3
                          class="font-semibold text-base text-gray-900 dark:text-gray-100 truncate"
                        >
                          {{ getTranslationByLocale(product.translations, "title") }}
                        </h3>
                      </div>
                      <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {{
                          getTranslationByLocale(product.translations, "shortDescription")
                        }}
                      </p>
                    </div>
                  </div>
                  <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <NuxtLink
                      :to="`/tickets/${getTranslationByLocale(
                        product.translations,
                        'slug'
                      )}`"
                      class="flex items-center justify-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                    >
                      Xem chi tiết
                      <ArrowRight class="w-4 h-4" />
                    </NuxtLink>
                  </div>
                </div>
              </SwiperSlide>
            </Swiper>
          </template>
        </div>

        <!-- Benefits Information -->
        <div
          v-if="currentSettings.benefits"
          class="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800"
        >
          <div class="flex flex-col gap-3">
            <div
              v-if="currentSettings.benefits.freeTicket"
              class="flex items-center gap-3"
            >
              <CheckCircleIcon class="w-6 h-6 text-green-500 flex-shrink-0" />
              <span class="text-base font-bold text-gray-800 dark:text-gray-200">{{
                currentSettings.benefits.freeTicket
              }}</span>
            </div>
            <div
              v-if="currentSettings.benefits.freeShuttle"
              class="flex items-center gap-3"
            >
              <CheckCircleIcon class="w-6 h-6 text-green-500 flex-shrink-0" />
              <span class="text-base font-bold text-gray-800 dark:text-gray-200">{{
                currentSettings.benefits.freeShuttle
              }}</span>
            </div>
            
            <!-- Tier Discount Benefits -->
            <div v-if="selectedProduct && tierDiscounts.length > 0" 
                 class="flex flex-col gap-2 mt-2">
              <div class="text-lg font-semibold text-green-700 border-t border-green-200 pt-2">
                {{ t('products.tierDiscounts.title') }}
              </div>
              <div 
                v-for="(tier, index) in sortedTierDiscounts" 
                :key="tier.id"
                class="flex items-center gap-3"
              >
                <CheckCircleIcon class="w-6 h-6 text-green-500 flex-shrink-0" />
                <span class="text-base font-bold text-gray-800 dark:text-gray-200">
                  <template v-if="index < sortedTierDiscounts.length - 1">
                    {{ locale === 'vi' ? 
                      `Quý khách mua từ ${tier.minQuantity} đến ${sortedTierDiscounts[index+1].minQuantity-1} vé chiết khấu ${tier.discountPercent}%` : 
                      `Purchase ${tier.minQuantity} to ${sortedTierDiscounts[index+1].minQuantity-1} tickets for ${tier.discountPercent}% discount` }}
                  </template>
                  <template v-else>
                    {{ locale === 'vi' ? 
                      `Quý khách mua từ ${tier.minQuantity} vé chiết khấu ${tier.discountPercent}%` : 
                      `Purchase ${tier.minQuantity} or more tickets for ${tier.discountPercent}% discount` }}
                  </template>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Booking Form -->
        <form v-if="selectedProduct" @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Variants Selection -->
          <div v-if="indexedVariants.length" class="space-y-4">
            <div class="space-y-2">
              <label class="block font-medium text-gray-700 dark:text-gray-300">
                Loại vé
              </label>
              <div class="space-y-3">
                <div
                  v-for="(variant, index) in indexedVariants"
                  :key="index"
                  class="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                >
                  <div class="flex flex-col">
                    <span class="font-medium text-gray-900 dark:text-gray-100">{{
                      getVariantName(variant.id)
                    }}</span>
                    <span class="text-sm text-gray-600 dark:text-gray-400">{{
                      formatPrice(getVariantPrice(variant))
                    }}</span>
                    <!-- Hiển thị thông tin giảm giá nếu có -->
                    <div v-if="getVariantCount(variant.id) > 0" class="mt-1">
                      <span 
                        v-if="variantDiscounts[variant.id] > 0" 
                        class="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800"
                      >
                        Giảm {{ variantDiscounts[variant.id] }}% cho {{ getVariantCount(variant.id) }} vé
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center">
                    <button
                      type="button"
                      class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      :disabled="getVariantCount(variant.id) <= 0"
                      @click="decreaseVariantCount(variant)"
                    >
                      <MinusIcon class="w-5 h-5" />
                    </button>
                    <span
                      class="w-12 text-center text-lg font-medium"
                      :class="currentSettings.colors.heading"
                    >
                      {{ getVariantCount(variant.id) }}
                    </span>
                    <button
                      type="button"
                      class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      :disabled="
                        getVariantCount(variant.id) >= currentSettings.form.maxGuests
                      "
                      @click="increaseVariantCount(variant)"
                    >
                      <PlusIcon class="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Date Picker -->
          <div class="space-y-2">
            <label
              :class="currentSettings.colors.secondary"
              class="flex items-center gap-2"
            >
              <CalendarIcon class="w-6 h-6" />
              {{ currentSettings.form.datePickerLabel || "Ngày tham quan" }}
            </label>
            <DatePicker
              v-model="selectedDate"
              :min-date="new Date()"
              :masks="masks"
              :disabled-dates="disabledDates"
              class="w-full [&_.vc-highlight-base-start]:!bg-primary-500 [&_.vc-highlight-base-start]:!text-white [&_.vc-disabled]:!opacity-25 [&_.vc-disabled]:!cursor-not-allowed"
            >
              <template #default="{ inputValue, inputEvents }">
                <input
                  :value="inputValue"
                  v-on="inputEvents"
                  placeholder="Chọn ngày"
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none dark:bg-gray-800"
                  readonly
                />
              </template>
            </DatePicker>
          </div>

       

          <!-- Total and Submit -->
          <div
            class="flex items-center justify-between pt-4 border-t dark:border-gray-700"
          >
            <div :class="currentSettings.colors.secondary">
              <div class="text-sm">Tổng tiền</div>
              <div v-if="discountedTotal < originalTotal" class="flex flex-col">
                <div class="text-2xl font-semibold" :class="currentSettings.colors.primary">
                  {{ formatPrice(discountedTotal) }}
                </div>
                <div class="text-sm text-gray-500 line-through">
                  {{ formatPrice(originalTotal) }}
                </div>
              </div>
              <div v-else class="text-2xl font-semibold" :class="currentSettings.colors.primary">
                {{ formatPrice(discountedTotal) }}
              </div>
              <div class="text-xs mt-1 text-gray-600 dark:text-gray-400">
                {{ totalTickets }} vé
              </div>
            </div>

            <button
              type="submit"
              :disabled="!isFormValid"
              :class="[
                currentSettings.form.buttonColor || 'bg-primary-500',
                currentSettings.form.buttonTextColor || 'text-white',
                'px-8 py-3 rounded-lg text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed',
              ]"
            >
              {{ currentSettings.form.buttonText || "Đặt vé ngay" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useProduct } from "@/composables/useProduct";
import type { Settings, Product } from "@/types/ticket";
import { defaultSettings } from "@/types/ticket";
import { ProductType } from "@ew/shared";
import {
  ArrowRight,
  Calendar as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Minus as MinusIcon,
  Plus as PlusIcon,
  Ticket as TicketIcon,
} from "lucide-vue-next";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import {
  Navigation as SwiperNavigation,
  Pagination as SwiperPagination,
} from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/vue";
import { DatePicker } from "v-calendar";
import "v-calendar/style.css";
import { computed, onMounted, ref, watch } from "vue";
import { useLocalization } from "../../../composables/useLocalization";
import { useTicketBooking } from '~/composables/useTicketBooking';
import { useRouter } from 'vue-router';
import { useTierPricing } from '~/composables/useTierPricing';
import TierPricingTable from '~/components/product/TierPricingTable.vue';

const props = withDefaults(
  defineProps<{
    backgroundColor?: string;
    settings?: Settings;
    config?: Partial<Settings>;
  }>(),
  {
    backgroundColor: "bg-gray-100 dark:bg-gray-900",
  }
);

const { locale, t } = useLocalization();
const { products, isLoadingProducts, filters, fetchProducts } = useProduct();
const router = useRouter();
const { saveBookingData } = useTicketBooking();
const { getDiscountForQuantity, fetchTierDiscountsForProduct, tierDiscounts } = useTierPricing();

const selectedProduct = ref<Product | null>(null);
const selectedDate = ref<Date | null>(null);
const adultCount = ref(1);
const normalizeSettings = (raw?: Partial<Settings>): Settings => {
  const source = raw || {};

  return {
    ...defaultSettings,
    ...source,
    form: {
      ...defaultSettings.form,
      ...(source.form || {}),
    },
    colors: {
      ...defaultSettings.colors,
      ...(source.colors || {}),
    },
    typography: {
      ...defaultSettings.typography,
      ...(source.typography || {}),
    },
    benefits: {
      ...defaultSettings.benefits,
      ...(source.benefits || {}),
    },
  };
};

const currentSettings = ref<Settings>(
  normalizeSettings(props.config || (props.settings as Partial<Settings>))
);
const selectedVariant = ref<any>(null);
const indexedVariants = ref<any[]>([]);
const variantCounts = ref<Record<number, number>>({});
const variantDiscounts = ref<Record<number, number>>({});

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

const calculateTotal = computed(async () => {
  if (!selectedProduct.value) return formatPrice(0);

  // Tính tổng dựa trên số lượng của mỗi variant
  let total = 0;
  Object.entries(variantCounts.value).forEach(([variantId, count]) => {
    const variant = indexedVariants.value.find((v) => v.id === Number(variantId));
    if (variant && count > 0) {
      total += getVariantPrice(variant) * count;
    }
  });

  return formatPrice(total);
});

// Tổng tiền gốc và đã áp dụng giảm giá
const originalTotal = ref(0);
const discountedTotal = ref(0);

// Cập nhật tổng tiền với giảm giá
const updateDiscountedTotal = async () => {
  if (!selectedProduct.value || totalTickets.value <= 0) {
    originalTotal.value = 0;
    discountedTotal.value = 0;
    return;
  }

  // Tính tổng cơ bản
  let total = 0;
  
  // Mảng lưu thông tin chi tiết từng variant để tính chiết khấu
  const variantDetails: Array<{
    variantId: number;
    quantity: number;
    originalTotal: number;
    price: number;
  }> = [];
  
  // Tính tổng tiền gốc cho từng variant
  Object.entries(variantCounts.value).forEach(([variantId, count]) => {
    const variant = indexedVariants.value.find((v) => v.id === Number(variantId));
    if (variant && count > 0) {
      const variantPrice = getVariantPrice(variant);
      const variantOriginalTotal = variantPrice * count;
      total += variantOriginalTotal;
      
      variantDetails.push({
        variantId: Number(variantId),
        quantity: count,
        originalTotal: variantOriginalTotal,
        price: variantPrice
      });
    }
  });

  // Lưu tổng tiền gốc
  originalTotal.value = total;

  // Tính tổng tiền sau khi áp dụng chiết khấu cho từng variant riêng biệt
  let discounted = 0;
  
  // Áp dụng chiết khấu cho từng variant dựa trên số lượng riêng của nó
  for (const variantDetail of variantDetails) {
    let variantDiscounted = variantDetail.originalTotal;
    
    // Lấy phần trăm chiết khấu cho variant cụ thể này
    if (variantDetail.quantity > 0 && selectedProduct.value.id) {
      const discountPercent = await getDiscountForQuantity(
        selectedProduct.value.id,
        variantDetail.variantId, // Truyền ID variant cụ thể
        variantDetail.quantity
      );
      
      if (discountPercent > 0) {
        const discountAmount = (variantDetail.originalTotal * discountPercent) / 100;
        variantDiscounted = variantDetail.originalTotal - discountAmount;
      }
    }
    
    discounted += variantDiscounted;
  }

  discountedTotal.value = discounted;
};

const isFormValid = computed(() => {
  if (!selectedProduct.value) return false;

  // Kiểm tra xem tổng số vé > 0 và có chọn ngày không
  const totalTickets = Object.values(variantCounts.value).reduce(
    (sum, count) => sum + count,
    0
  );

  return selectedDate.value && totalTickets > 0;
});

const totalTickets = computed(() => {
  return Object.values(variantCounts.value).reduce((sum, count) => sum + count, 0);
});

watch(
  () => [props.settings, props.config],
  () => {
    currentSettings.value = normalizeSettings(
      props.config || (props.settings as Partial<Settings>)
    );
  },
  { deep: true }
);

// Sort tier discounts by minQuantity for display
const sortedTierDiscounts = computed(() => {
  return [...tierDiscounts.value]
    .filter(discount => discount.isActive)
    .sort((a, b) => a.minQuantity - b.minQuantity);
});

const selectProduct = async (product: Product) => {
  selectedProduct.value = product;
  variantCounts.value = {};

  // Khởi tạo variants có index
  if (product.variants && product.variants.length > 0) {
    indexedVariants.value = product.variants.map((variant: any, index: number) => ({
      ...variant,
      _index: index,
    }));

    // Khởi tạo số lượng mỗi variant là 0
    indexedVariants.value.forEach((variant) => {
      variantCounts.value[variant.id] = 0;
    });
  } else {
    indexedVariants.value = [];
  }
  
  // Fetch tier discounts for the selected product
  if (product.id) {
    try {
      await fetchTierDiscountsForProduct(product.id);
      // The tierDiscounts are now updated in the composable
    } catch (error) {
      console.error('Error fetching tier discounts:', error);
    }
  }
};

const selectVariant = (variant: any) => {
  selectedVariant.value = variant;
};

const handleSubmit = async () => {
  if (!selectedProduct.value || !selectedDate.value) return;

  // Make sure discounted total is updated
  await updateDiscountedTotal();

  // Get active variants (quantity > 0)
  const activeVariants = Object.entries(variantCounts.value)
    .filter(([_, count]) => count > 0)
    .map(([variantId, count]) => {
      const variant = indexedVariants.value.find(v => v.id === Number(variantId));
      return {
        id: Number(variantId),
        name: getVariantName(Number(variantId)),
        quantity: count,
        unitPrice: getVariantPrice(variant),
        totalPrice: getVariantPrice(variant) * count
      };
    });

  if (activeVariants.length === 0) return;

  // Save booking data with discounted total amount and original amount
  saveBookingData({
    productId: selectedProduct.value.id,
    productName: getTranslationByLocale(selectedProduct.value.translations, "title"),
    date: selectedDate.value,
    variants: activeVariants,
    totalAmount: discountedTotal.value,
    originalAmount: originalTotal.value
  });

  // Navigate to checkout
  router.push('/checkout/ticket');
};

const transformToProduct = (item: any): Product => {
  return {
    id: item.id,
    translations: (item.translations || []).map((t: any) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt),
    })),
    thumbnail: item.thumbnail || "",
    price: item.price || 0,
    variants: item.variants || [],
    variantAttributes: item.variantAttributes || undefined,
  };
};

const fetchTicketProducts = async () => {
  // Cập nhật filters
  filters.value = {
    ...filters.value,
    type: ProductType.TICKET,
    locale: locale.value,
  };

  await fetchProducts();

  if (products.value.length) {
    // Auto-select first product
    await selectProduct(products.value[0]);
  }
};

// Theo dõi thay đổi của totalTickets để cập nhật tổng tiền có giảm giá
watch(totalTickets, async (newValue, oldValue) => {
  if (newValue !== oldValue) {
    await updateDiscountedTotal();
  }
});

// Theo dõi thay đổi của selectedProduct
watch(selectedProduct, async (newValue) => {
  if (newValue) {
    await updateDiscountedTotal();
  } else {
    discountedTotal.value = 0;
  }
});

onMounted(async () => {
  await fetchTicketProducts();
  await updateDiscountedTotal();
});

// Date picker configuration
const masks = {
  input: 'DD/MM/YYYY',
  data: 'YYYY-MM-DD'
};

// Thêm computed property cho disabledDates
const disabledDates = computed(() => {
  const dates = [];
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Add all dates from the past up to yesterday
  let currentDate = new Date(0); // Start from epoch
  while (currentDate <= yesterday) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
});

// Hàm trợ giúp lấy translation theo locale
const getTranslationByLocale = (translations: any[], field: string = "name") => {
  if (!translations || translations.length === 0) {
    return "";
  }

  // Tìm translation theo locale hiện tại
  const translation = translations.find((t: any) => t.locale === locale.value);
  // Nếu không tìm thấy, sử dụng translation đầu tiên
  return translation?.[field] || translations[0]?.[field] || "";
};

// Hàm lấy tên của variant theo locale
const getVariantName = (variantId: number): string => {
  const variant = indexedVariants.value.find(v => v.id === variantId);
  return variant ? getTranslationByLocale(variant.translations, "name") || "Vé mặc định" : `Loại vé #${variantId}`;
};

const getVariantPrice = (variant: any) => {
  return variant.price || 0;
};

const getVariantCount = (variantId: number): number => {
  return variantCounts.value[variantId] || 0;
};

// Thêm hàm cập nhật tất cả giảm giá variant
const updateAllVariantDiscounts = async () => {
  if (!selectedProduct.value) return;

  for (const [variantId, quantity] of Object.entries(variantCounts.value)) {
    if (quantity > 0) {
      try {
        const discount = await getDiscountForQuantity(
          selectedProduct.value.id,
          Number(variantId),
          quantity
        );
        variantDiscounts.value[variantId] = discount;
      } catch (error) {
        console.error('Error updating discount for variant', variantId, error);
        variantDiscounts.value[variantId] = 0;
      }
    } else {
      variantDiscounts.value[variantId] = 0;
    }
  }
};

// Cập nhật hàm tăng giảm số lượng để cập nhật mức giảm giá
const increaseVariantCount = async (variant: any) => {
  const currentCount = variantCounts.value[variant.id] || 0;
  if (currentCount < currentSettings.value.form.maxGuests) {
    variantCounts.value[variant.id] = currentCount + 1;
    
    // Cập nhật mức giảm giá
    const discount = await getDiscountForQuantity(
      selectedProduct.value!.id, 
      variant.id, 
      currentCount + 1
    );
    variantDiscounts.value[variant.id] = discount;
    
    // Cập nhật tổng tiền
    await updateDiscountedTotal();
  }
};

const decreaseVariantCount = async (variant: any) => {
  if (variantCounts.value[variant.id] > 0) {
    variantCounts.value[variant.id]--;
    
    const newCount = variantCounts.value[variant.id];
    if (newCount > 0) {
      // Cập nhật mức giảm giá
      const discount = await getDiscountForQuantity(
        selectedProduct.value!.id, 
        variant.id, 
        newCount
      );
      variantDiscounts.value[variant.id] = discount;
    } else {
      variantDiscounts.value[variant.id] = 0;
    }
    
    // Cập nhật tổng tiền
    await updateDiscountedTotal();
  }
};

</script>

<style>
.ticket-swiper {
  padding: 1rem;
  margin: -1rem;
}

.ticket-swiper :deep(.swiper-button-next),
.ticket-swiper :deep(.swiper-button-prev) {
  color: theme("colors.primary.500");
}

.ticket-swiper :deep(.swiper-pagination-bullet-active) {
  background-color: theme("colors.primary.500");
}

.vc-container {
  --vc-font-family: inherit;
  --vc-rounded-full: 9999px;
  --vc-font-bold: 600;
  --vc-font-semibold: 500;
  --vc-text-lg: 1.125rem;
}
</style>

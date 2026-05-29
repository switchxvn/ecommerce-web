import { computed, ref, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLocalization } from './useLocalization';
import { useTrpc } from './useTrpc';
import { useProductVariants } from './useProduct';
import { formatFullProductContent } from '~/utils/contentFormatter';
import { useNotification } from './useNotification';
import { resolveSeoCanonicalUrl } from '~/utils/seo';
import { fetchProductDetailPayload } from './productDetailPayload';
import { formatPrice } from '@ew/shared';
import type { Product } from '@ew/shared';

export function useProductDetail() {
  const { t, locale } = useLocalization();
  const trpc = useTrpc();
  const route = useRoute();
  const router = useRouter();
  const slug = computed(() => route.params.slug as string);

  // Xác định locale từ URL path và loại sản phẩm
  const currentLocale = computed(() => {
    // Nếu URL bắt đầu bằng /san-pham/ hoặc /ve/ thì là tiếng Việt
    if (route.path.startsWith("/san-pham/") || route.path.startsWith("/tickets/")) {
      return "vi";
    }
    // Nếu URL bắt đầu bằng /products/ hoặc /tickets/ (en) thì là tiếng Anh
    if (route.path.startsWith("/products/") || route.path.startsWith("/tickets/")) {
      return "en";
    }
    // Mặc định lấy từ useLocalization
    return locale.value;
  });

  // Xác định loại route (product hay ticket)
  const isTicketRoute = computed(() => route.path.includes("/tickets/"));

  // Sử dụng useAsyncData với tRPC
  const { data: productDetailPayload, pending: isLoading, error, refresh } = useAsyncData(
    `product-${route.params.slug}`,
    async () => {
      try {
        return await fetchProductDetailPayload({
          slug: slug.value,
          locale: currentLocale.value,
          isTicketRoute: isTicketRoute.value,
          trpc: {
            product: trpc.product,
            review: trpc.review,
          },
        });
      } catch (err: any) {
        console.error("Error fetching product:", err);
        throw new Error(err.message || "Có lỗi xảy ra khi tải chi tiết sản phẩm");
      }
    },
    {
      default: () => ({
        product: null,
        productReviewAggregate: null,
        productReviews: [],
      }),
    },
  );
  const productData = computed<Product | null>(() => productDetailPayload.value?.product ?? null);
  const productReviewAggregate = computed(
    () => productDetailPayload.value?.productReviewAggregate ?? null,
  );
  const productReviews = computed(() => productDetailPayload.value?.productReviews ?? []);

  // Đảm bảo dữ liệu được tải ở phía client nếu cần
  onMounted(() => {
    if (!productData.value) {
      refresh();
    }
  });

  // Theo dõi thay đổi của slug hoặc locale
  watch([slug, currentLocale], () => {
    refresh();
  });

  watch(
    () => productData.value?.id,
    () => {
      const translation = productData.value?.translations?.find(t => t.locale === currentLocale.value) || productData.value?.translations?.[0];
      if (!translation?.slug || !process.client) {
        return;
      }

      const resolvedPath = isTicketRoute.value
        ? `/tickets/${translation.slug}`
        : currentLocale.value === "vi"
          ? `/san-pham/${translation.slug}`
          : `/products/${translation.slug}`;

      if (route.path !== resolvedPath) {
        router.replace({ path: resolvedPath, query: route.query });
      }
    },
  );

  // Tạo các computed properties để truy cập dữ liệu sản phẩm an toàn
  const productTitle = computed(() => productData.value?.title || "");
  const productContent = computed(() => productData.value?.content || "");
  const productShortDescription = computed(() => productData.value?.shortDescription || "");

  // Lấy URL hiện tại từ server
  let serverUrl = "";
  if (process.server) {
    try {
      const config = useRuntimeConfig();
      const reqURL = useRequestURL();
      const requestOrigin = `${reqURL.protocol}//${reqURL.host}`;
      const configuredSiteUrl =
        config.public && typeof config.public.siteUrl === "string"
          ? config.public.siteUrl.trim()
          : "";

      // Prefer configured public site URL only when it is a real public domain.
      if (
        configuredSiteUrl &&
        !configuredSiteUrl.includes("localhost") &&
        !configuredSiteUrl.includes("127.0.0.1")
      ) {
        serverUrl = configuredSiteUrl;
      } else {
        serverUrl = requestOrigin;
      }
    } catch (e) {
      console.error("Error in server URL setup:", e);
    }
  }

  // Sử dụng ref để lưu trữ URL
  const baseUrl = ref(serverUrl);

  // Cập nhật URL ở client side khi component được mount
  onMounted(() => {
    if (process.client && !baseUrl.value) {
      baseUrl.value = window.location.origin;
    }
  });

  const runtimeConfig = useRuntimeConfig();

  // Sử dụng giá trị đã lưu trong ref
  const currentURL = computed(() => {
    return baseUrl.value || "";
  });

  const normalizedSiteUrl = computed(() => {
    const configured =
      runtimeConfig.public && typeof runtimeConfig.public.siteUrl === "string"
        ? runtimeConfig.public.siteUrl.trim()
        : "";
    return configured.replace(/\/+$/, "");
  });

  const currentProductPath = computed(() => route.path.split("?")[0] || "");
  const currentProductUrl = computed(() => {
    const base =
      currentURL.value ||
      (process.client ? window.location.origin : "") ||
      normalizedSiteUrl.value;

    if (!base) {
      return currentProductPath.value;
    }

    return new URL(currentProductPath.value || "/", `${base.replace(/\/+$/, "")}/`).toString();
  });
  const canonicalProductSlugByLocale = computed(() => ({
    vi: productData.value?.translations?.find((translation) => translation.locale === "vi")?.slug,
    en: productData.value?.translations?.find((translation) => translation.locale === "en")?.slug,
  }));
  const canonicalProductUrl = computed(() =>
    resolveSeoCanonicalUrl({
      siteUrl: normalizedSiteUrl.value || currentURL.value || (process.client ? window.location.origin : ""),
      currentPath: currentProductPath.value || route.path,
      locale: currentLocale.value === "en" ? "en" : "vi",
      routeKey: isTicketRoute.value ? "ticket-detail" : "product-detail",
      slugByLocale: canonicalProductSlugByLocale.value,
      candidate: null,
    }),
  );
  const canonicalUrl = computed(() => canonicalProductUrl.value);

  const translateWithFallback = (key: string, fallback: string) => {
    const translated = t(key);
    return translated && translated.trim() && translated.trim() !== key ? translated : fallback;
  };

  // Tạo URL chia sẻ với UTM parameters
  const createShareUrl = (medium: string, campaign: string) => {
    const translation =
      productData.value?.translations?.find((t) => t.locale === "vi") ||
      productData.value?.translations?.find((t) => t.locale === currentLocale.value) ||
      productData.value?.translations?.[0];
    const utmParams = new URLSearchParams({
      utm_source: "share",
      utm_medium: medium,
      utm_campaign: campaign,
      utm_content: translation?.slug || "",
    });
    const base =
      canonicalProductUrl.value ||
      (process.client ? window.location.origin : "") ||
      normalizedSiteUrl.value;
    if (!base) return `${currentProductPath.value}?${utmParams.toString()}`;
    return new URL(`?${utmParams.toString()}`, base).toString();
  };

  const shareUrl = computed(() => canonicalProductUrl.value || currentProductUrl.value);
  const shareTitle = computed(
    () => {
      const translation = productData.value?.translations?.find(t => t.locale === currentLocale.value) || productData.value?.translations?.[0];
      return translation?.metaTitle || productTitle.value || "";
    }
  );
  const shareDescription = computed(
    () => {
      const translation = productData.value?.translations?.find(t => t.locale === currentLocale.value) || productData.value?.translations?.[0];
      return translation?.metaDescription || productShortDescription.value || "";
    }
  );
  const shareImage = computed(
    () => {
      const translation = productData.value?.translations?.find(t => t.locale === currentLocale.value) || productData.value?.translations?.[0];
      return translation?.ogImage || productData.value?.thumbnail || "";
    }
  );

  // Thêm hàm để xử lý chia sẻ mạng xã hội
  const shareToFacebook = () => {
    if (process.client) {
      const shareUrlWithUtm = createShareUrl("facebook", "social");
      const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrlWithUtm
      )}`;
      window.open(url, "_blank", "width=600,height=400");
    }
  };

  // Hàm chia sẻ lên Twitter
  const shareToTwitter = () => {
    if (process.client) {
      const shareUrlWithUtm = createShareUrl("twitter", "social");
      const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        shareUrlWithUtm
      )}&text=${encodeURIComponent(shareTitle.value)}`;
      window.open(url, "_blank", "width=600,height=400");
    }
  };

  // Hàm chia sẻ lên LinkedIn
  const shareToLinkedIn = () => {
    if (process.client) {
      const shareUrlWithUtm = createShareUrl("linkedin", "social");
      const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        shareUrlWithUtm
      )}`;
      window.open(url, "_blank", "width=600,height=400");
    }
  };

  // Hàm chia sẻ qua Email
  const shareViaEmail = () => {
    if (process.client) {
      const shareUrlWithUtm = createShareUrl("email", "referral");
      const url = `mailto:?subject=${encodeURIComponent(
        shareTitle.value
      )}&body=${encodeURIComponent(`${shareDescription.value}\n\n${shareUrlWithUtm}`)}`;
      window.location.href = url;
    }
  };

  // Hàm copy link sản phẩm
  const copyProductLink = async () => {
    if (process.client && navigator.clipboard) {
      try {
        // Sử dụng UTM cho link copy
        const shareUrlWithUtm = createShareUrl("copy", "direct");
        await navigator.clipboard.writeText(shareUrlWithUtm);
        // Hiển thị thông báo thành công với notification
        useNotification().success({
          title: t("products.linkCopied") || "Đã sao chép liên kết sản phẩm",
          description:
            t("products.linkCopiedDescription") ||
            "Liên kết đã được sao chép vào clipboard",
          icon: "i-heroicons-check-circle",
          timeout: 3000,
        });
      } catch (err) {
        console.error("Failed to copy link:", err);
        // Hiển thị thông báo lỗi
        useNotification().error({
          title: t("products.linkCopyFailed") || "Không thể sao chép liên kết",
          description:
            t("products.linkCopyFailedDescription") ||
            "Đã xảy ra lỗi khi sao chép liên kết",
          icon: "i-heroicons-exclamation-circle",
          timeout: 3000,
        });
      }
    }
  };

  // Tạo ID cho phần nội dung sản phẩm để sử dụng với TableOfContents
  const productContentId = computed(
    () => `product-content-${productData.value?.id || "detail"}`
  );

  // Định dạng nội dung sản phẩm với các thẻ h2 và ID
  const formattedProductContent = computed(() => {
    return formatFullProductContent(productContent.value);
  });

  // Tab cho mô tả sản phẩm và video review
  const activeTab = ref("description");

  // Kiểm tra xem sản phẩm có video review không
  const hasVideoReview = computed(() => !!productData.value?.videoReview);

  // Theo dõi thay đổi của activeTab để cập nhật lại TableOfContents
  watch(activeTab, (newTab, oldTab) => {
    if (newTab === "description") {
      // Đợi DOM cập nhật xong
      nextTick(() => {
        // Đợi thêm một chút để đảm bảo transition đã hoàn thành
        setTimeout(() => {
          // Kích hoạt lại TableOfContents
          const event = new Event("tab-changed");
          window.dispatchEvent(event);

          // Đảm bảo nội dung đã được render
          const contentElement = document.querySelector(`#${productContentId.value}`);
          if (contentElement) {
            // Kích hoạt MutationObserver
            const observer = new MutationObserver(() => {
              window.dispatchEvent(new Event("tab-changed"));
            });

            observer.observe(contentElement, {
              childList: true,
              subtree: true,
              characterData: true,
            });

            // Cleanup sau 1 giây
            setTimeout(() => {
              observer.disconnect();
            }, 1000);
          }
        }, 300);
      });
    }
  });

  // Định nghĩa tabs
  const tabs = computed(() => [
    {
      id: "description",
      label: translateWithFallback("products.description", "MÔ TẢ SẢN PHẨM"),
    },
    {
      id: "specifications",
      label: translateWithFallback("products.specifications", "THÔNG SỐ KỸ THUẬT"),
    },
    {
      id: "video",
      label: translateWithFallback("products.videoReview", "VIDEO REVIEW"),
      badge: hasVideoReview.value
        ? { label: translateWithFallback("products.new", "Mới"), color: "blue" }
        : undefined,
    },
  ]);

  // Ref cho modal yêu cầu báo giá
  const isPriceRequestModalOpen = ref(false);

  // Thêm ref cho selectedAttributes
  const selectedAttributes = ref<{ [key: number]: number }>({});

  // Cập nhật cách sử dụng useProductVariants
  const {
    productAttributes,
    matchingVariant,
    variantPrice,
    hasRequiredAttributes,
    isAttributeValueAvailable,
    selectAttributeValue,
    resetSelectedAttributes
  } = useProductVariants(computed(() => productData.value));

  // Xử lý chọn variant
  const handleSelectAttribute = (attributeId: number, valueId: number) => {
    selectedAttributes.value[attributeId] = valueId;
    selectAttributeValue(attributeId, valueId);
  };

  // Reset selected attributes khi product thay đổi
  watch(() => productData.value, () => {
    selectedAttributes.value = {};
    resetSelectedAttributes();
  }, { immediate: true });

  // Tìm giá thấp nhất trong các variants
  const minVariantPrice = computed(() => {
    if (!productData.value?.variantAttributes?.variants?.length) return null;
    
    const validPrices = productData.value.variantAttributes.variants
      .map((v: { price: string | number | null }) => {
        if (v.price === null) return null;
        return typeof v.price === 'string' ? parseFloat(v.price) : v.price;
      })
      .filter((price: number | null): price is number => price !== null && !isNaN(price));
      
    if (!validPrices.length) return null;
    
    return Math.min(...validPrices);
  });

  // Kiểm tra xem có cần hiển thị "Từ XXX đồng" không
  const shouldShowFromPrice = computed(() => {
    return !matchingVariant.value && minVariantPrice.value !== null;
  });

  // Kiểm tra xem có cần hiển thị nút yêu cầu báo giá không
  const shouldShowPriceRequest = computed(() => {
    if (!productData.value) return false;
    
    // Nếu sản phẩm có variants
    if (productData.value?.variantAttributes?.variants?.length) {
      // Chỉ hiện yêu cầu báo giá khi:
      // 1. Đã chọn variant và variant đó không có giá, HOẶC
      // 2. Tất cả variants đều không có giá
      const allVariantsNoPrices = productData.value.variantAttributes.variants.every(variant => !variant.price);
      const selectedVariantNoPrice = matchingVariant.value && !matchingVariant.value.price;
      
      return allVariantsNoPrices || selectedVariantNoPrice;
    }
    
    // Nếu không có variants thì kiểm tra giá sản phẩm
    return !productData.value?.price;
  });

  // Kiểm tra xem có thể thêm vào giỏ hàng không
  const canAddToCart = computed(() => {
    if (!productData.value) return false;
    
    // Nếu sản phẩm có variants
    if (productData.value?.variantAttributes?.variants?.length) {
      // Có thể add to cart nếu có ít nhất 1 variant có giá
      // (Nếu chưa chọn variant sẽ mở modal, nếu đã chọn variant có giá thì add luôn)
      const hasVariantWithPrice = productData.value.variantAttributes.variants.some(variant => variant.price);
      return hasVariantWithPrice;
    }
    
    // Nếu không có variants thì chỉ cần có giá sản phẩm
    return !!productData.value?.price;
  });

  // Kiểm tra xem có thể "Mua ngay" không (yêu cầu đã chọn variant nếu có)
  const canBuyNow = computed(() => {
    if (!productData.value) return false;
    
    // Nếu sản phẩm có variants
    if (productData.value?.variantAttributes?.variants?.length) {
      // Phải có matching variant và variant đó phải có giá
      return matchingVariant.value && matchingVariant.value.price;
    }
    
    // Nếu không có variants thì chỉ cần có giá sản phẩm
    return !!productData.value?.price;
  });

  // Tính toán giá hiển thị
  const displayPrice = computed(() => {
    if (!productData.value) return 'Liên hệ';
    
    if (matchingVariant.value) {
      return matchingVariant.value.formattedPrice;
    }
    if (shouldShowFromPrice.value && minVariantPrice.value !== null) {
      return `Từ ${formatPrice(minVariantPrice.value)}`;
    }
    return productData.value.formattedPrice || 'Liên hệ';
  });

  // Tính toán giá so sánh
  const displayComparePrice = computed(() => {
    if (matchingVariant.value?.comparePrice) {
      return formatPrice(matchingVariant.value.comparePrice);
    }
    return null;
  });

  // Lấy thông tin sản phẩm cho giỏ hàng
  const getProductForCart = computed(() => {
    if (!productData.value) return null;

    const hasRequiredAttributes = productData.value?.variantAttributes?.attributes?.some(attr => attr.required) || false;
    const hasSelectedAllAttributes = hasRequiredAttributes ? 
      productData.value?.variantAttributes?.attributes?.every(attr => 
        !attr.required || selectedAttributes.value[attr.id]
      ) : true;

    return {
      id: productData.value.id,
      title: productTitle.value,
      thumbnail: productData.value.thumbnail,
      price: matchingVariant.value?.price || productData.value.price,
      comparePrice: matchingVariant.value?.comparePrice || productData.value.comparePrice,
      formattedPrice: matchingVariant.value?.formattedPrice || productData.value.formattedPrice,
      variantId: matchingVariant.value?.id,
      variantName: matchingVariant.value ? Object.entries(selectedAttributes.value).map(([attributeId, valueId]) => {
        const attribute = productAttributes.value.find(attr => attr.id === Number(attributeId));
        const value = attribute?.values.find(val => val.id === Number(valueId));
        return value?.displayValue;
      }).join(' - ') : undefined,
      sku: matchingVariant.value?.sku || productData.value.sku,
      stock: matchingVariant.value?.stock || productData.value.stock,
      hasRequiredAttributes,
      hasSelectedAllAttributes,
      // Thêm thông tin variants để AddToCartButton có thể mở modal
      variantAttributes: productData.value.variantAttributes,
      variants: productData.value.variantAttributes?.variants
    };
  });

  // Hàm mở modal yêu cầu báo giá
  const openPriceRequestModal = () => {
    isPriceRequestModalOpen.value = true;
  };

  // Hàm đóng modal yêu cầu báo giá
  const closePriceRequestModal = () => {
    isPriceRequestModalOpen.value = false;
  };

  // Hàm xử lý khi gửi yêu cầu báo giá thành công
  const handlePriceRequestSuccess = () => {
    const notification = useNotification();
    notification.success({
      title: t("priceRequest.successToast") || "Yêu cầu báo giá đã được gửi",
      description:
        t("priceRequest.successToastDescription") ||
        "Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất",
      icon: "i-heroicons-check-circle",
      timeout: 5000,
    });
  };

  // Hàm helper để lấy icon cho từng tab
  const getTabIcon = (tabId: string) => {
    switch (tabId) {
      case 'description':
        return 'FileText';
      case 'specifications':
        return 'Settings';
      case 'video':
        return 'Video';
      default:
        return 'FileText';
    }
  };

  return {
    // Data
    productData,
    isLoading,
    error,
    refresh,
    currentLocale,
    
    // Computed
    productTitle,
    productContent,
    productShortDescription,
    productContentId,
    formattedProductContent,
    hasVideoReview,
    tabs,
    shareUrl,
    shareTitle,
    shareDescription,
    shareImage,
    canonicalUrl,
    productReviewAggregate,
    productReviews,
    
    // Refs
    activeTab,
    isPriceRequestModalOpen,
    selectedAttributes,
    
    // Product variants
    productAttributes,
    matchingVariant,
    variantPrice,
    hasRequiredAttributes,
    isAttributeValueAvailable,
    minVariantPrice,
    shouldShowFromPrice,
    shouldShowPriceRequest,
    canAddToCart,
    canBuyNow,
    displayPrice,
    displayComparePrice,
    getProductForCart,
    
    // Methods
    handleSelectAttribute,
    openPriceRequestModal,
    closePriceRequestModal,
    handlePriceRequestSuccess,
    shareToFacebook,
    shareToTwitter,
    shareToLinkedIn,
    shareViaEmail,
    copyProductLink,
    getTabIcon
  };
} 

declare module '@ew/shared' {
  export type Product = any;
  export type ProductTranslation = any;
  export type ProductSpecification = any;
  export type ProductType = any;
  export type Service = any;
  export type Author = any;
  export type Tag = any;
  export type Post = any;
  export type Profile = any;
  export type Seo = any;
  export type Category = any;
  export type CategoryTranslation = any;
  export type CategoryType = any;
  export type MenuItem = any;
  export type MenuColumn = any;
  export type GetMenuItemsInput = any;
  export type VideoThumbnail = any;
  export type CommentStatus = any;
  export type ReviewStatus = any;
  export type PageType = any;
  export type Theme = any;
  export type ThemeSection = any;
  export type ThemeSectionTranslation = any;
  export type Order = any;
  export type OrderType = any;
  export type RefundReason = any;
  export type RefundType = any;
  export type FoodCategory = any;
  export type FoodItem = any;
  export type CreateFooterInput = any;
  export type UpdateFooterInput = any;
  export const formatPrice: (...args: any[]) => any;
}

declare module '@ew/shared/types' {
  const value: any;
  export = value;
}

declare module '#app/nuxt' {
  export const useNuxtApp: (...args: any[]) => any;
}

declare module '#imports' {
  export const useHead: any;
  export const useAsyncData: any;
  export const ref: any;
  export const onMounted: any;
  export const useNuxtApp: any;
}

declare module '#components' {
  const value: any;
  export = value;
}

interface Window {
  fbq?: (...args: any[]) => void;
}

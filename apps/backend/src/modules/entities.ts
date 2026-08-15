// Payment
import { PaymentMethod } from './payment/entities/payment-method.entity';
import { PaymentTransaction } from './payment/entities/payment-transaction.entity';

// Order
import { Order } from './order/entities/order.entity';
import { OrderItem } from './order/entities/order-item.entity';
import { OrderTicketScanHistory } from './order/entities/order-ticket-scan-history.entity';

// Cart
import { Cart } from './cart/entities/cart.entity';
import { CartItem } from './cart/entities/cart-item.entity';

// Mail
import { MailConfig } from './mail/entities/mail-config.entity';
import { MailLog } from './mail/entities/mail-log.entity';
import { MailTemplate } from './mail/entities/mail-template.entity';

// Upload
import { Upload } from './upload/entities/upload.entity';
import { UploadConfig } from './upload/entities/upload-config.entity';

// Product
import { Product } from './product/entities/product.entity';
import { ProductTranslation } from './product/entities/product-translation.entity';
import { CrossSellProduct } from './product/entities/cross-sell-product.entity';
import { ProductSpecification } from './product/entities/product-specification.entity';
import { ProductSpecificationTranslation } from './product/entities/product-specification-translation.entity';
import { ProductCombo } from './product/entities/product-combo.entity';
import { ProductVariant } from './product/entities/product-variant.entity';
import { ProductVariantTranslation } from './product/entities/product-variant-translation.entity';
import { ProductAttribute } from './product/entities/product-attribute.entity';
import { ProductAttributeValue } from './product/entities/product-attribute-value.entity';
import { ProductAttributeTranslation } from './product/entities/product-attribute-translation.entity';
import { ProductAttributeValueTranslation } from './product/entities/product-attribute-value-translation.entity';
import { ProductStockHistory } from './product/entities/product-stock-history.entity';
import { ProductTierDiscount } from './product/entities/product-tier-discount.entity';

// Category
import { Category } from './category/entities/category.entity';
import { CategoryTranslation } from './category/entities/category-translation.entity';

// Language
import { Language } from './language/entities/language.entity';
import { Translation } from './language/entities/translation.entity';

// Post
import { Post } from './post/entities/post.entity';
import { PostTranslation } from './post/entities/post-translation.entity';
import { PostTag } from './post/entities/post-tag.entity';

// User
import { User } from './user/entities/user.entity';
import { Role } from './user/entities/role.entity';
import { Permission } from './user/entities/permission.entity';

// User Session
import { UserSession } from './user-session/entities/user-session.entity';
import { UserPageVisit } from './user-session/entities/user-page-visit.entity';

// Profile
import { UserProfile } from './profile/entities/user-profile.entity';

// Common
import { CountryPhoneCode } from './common/entities/country-phone-code.entity';

// Settings
import { Tag } from './settings/entities/tag.entity';
import { Logo } from './settings/entities/logo.entity';
import { Settings } from './settings/entities/settings.entity';
import { MenuItem } from './settings/entities/menu-item.entity';
import { MenuItemTranslation } from './settings/entities/menu-item-translation.entity';

// Price Request
import { PriceRequest } from './price-request/entities/price-request.entity';

// SEO
import { Seo } from './seo/entities/seo.entity';

// Customer Logo
import { CustomerLogo as ThemeCustomerLogo } from './theme/entities/customer-logo.entity';
import { CustomerLogo } from './customer-logo/entities/customer-logo.entity';

// Service
import { Service } from './service/entities/service.entity';
import { ServiceTranslation } from './service/entities/service-translation.entity';

// Hero
import { Hero } from './hero/entities/hero.entity';
import { HeroSlider } from './hero/entities/hero-slider.entity';
import { HeroVideo } from './hero/entities/hero-video.entity';

// Theme
import { Theme } from './theme/entities/theme.entity';
import { ThemeSection } from './theme/entities/theme-section.entity';
import { ComponentStyleConfig } from './theme/entities/component-style-config.entity';
import { ThemeSectionTranslation } from './theme/entities/theme-section-translation.entity';

// About
import { AboutSection } from './about/entities/about-section.entity';
import { AboutSectionTranslation } from './about/entities/about-section-translation.entity';

// Food Menu
import { FoodItem } from './food-menu/entities/food-item.entity';
import { FoodCategory } from './food-menu/entities/food-category.entity';
import { FoodCategoryTranslation } from './food-menu/entities/food-category-translation.entity';
import { FoodItemTranslation } from './food-menu/entities/food-item-translation.entity';

// Feature Flags
import { FeatureFlag } from './feature-flags/entities/feature-flag.entity';

// Gallery
import { Gallery } from './gallery/entities/gallery.entity';
import { GalleryTranslation } from './gallery/entities/gallery-translation.entity';

// Footer
import { Footer } from './footer/entities/footer.entity';

// Contact
import { Contact } from './contact/entities/contact.entity';
import { ContactSection } from './contact/entities/contact-section.entity';
import { ContactSectionTranslation } from './contact/entities/contact-section-translation.entity';

// Comment
import { Comment } from './comment/entities/comment.entity';

// Dashboard
import { DashboardStats } from './dashboard/entities/dashboard-stats.entity';

// Review
import { Review } from './review/entities/review.entity';
import { ReviewTranslation } from './review/entities/review-translation.entity';
import { ReviewServiceType } from './review/entities/review-service-type.entity';
import { ReviewServiceTypeTranslation } from './review/entities/review-service-type-translation.entity';

// Site Statistics
import { SiteStatistics } from './site-statistics/entities/site-statistics.entity';
import { SiteStatisticsTranslation } from './site-statistics/entities/site-statistics-translation.entity';
import { SiteStatisticsHistory } from './site-statistics/entities/site-statistics-history.entity';
import { SiteStatisticsSettings } from './site-statistics/entities/site-statistics-settings.entity';

// Admin Menu
import { AdminMenuItem } from './admin-menu/entities/admin-menu-item.entity';
import { AdminMenuItemTranslation } from './admin-menu/entities/admin-menu-item-translation.entity';

// API Key
import { ApiKey } from './api-key/entities/api-key.entity';

// ZNS
import { ZnsConfiguration } from './zns/entities/zns-configuration.entity';
import { ZnsTemplate } from './zns/entities/zns-template.entity';
import { ZnsLog } from './zns/entities/zns-log.entity';
import { ZnsWebhookEvent } from './zns/entities/zns-webhook-event.entity';

// Advertising Popup
import { AdvertisingPopup } from './advertising-popup/entities/advertising-popup.entity';

// Type for TypeORM entities
import { EntitySchema } from 'typeorm';

export const entities: (new () => any)[] = [
  // Payment
  PaymentMethod,
  PaymentTransaction,
  
  // Order
  Order,
  OrderItem,
  OrderTicketScanHistory,
  
  // Cart
  Cart,
  CartItem,
  
  // Mail
  MailConfig,
  MailLog,
  MailTemplate,
  
  // Upload
  Upload,
  UploadConfig,
  
  // Product
  Product,
  ProductTranslation,
  CrossSellProduct,
  ProductSpecification,
  ProductSpecificationTranslation,
  ProductCombo,
  ProductVariant,
  ProductVariantTranslation,
  ProductAttribute,
  ProductAttributeValue,
  ProductAttributeTranslation,
  ProductAttributeValueTranslation,
  ProductStockHistory,
  ProductTierDiscount,
  
  // Category
  Category,
  CategoryTranslation,
  
  // Language
  Language,
  Translation,
  
  // Post
  Post,
  PostTranslation,
  PostTag,
  
  // User
  User,
  Role,
  Permission,
  
  // User Session
  UserSession,
  UserPageVisit,
  
  // Profile
  UserProfile,
  
  // Common
  CountryPhoneCode,
  
  // Settings
  Tag,
  Logo,
  Settings,
  MenuItem,
  MenuItemTranslation,
  
  // Price Request
  PriceRequest,
  
  // SEO
  Seo,
  
  // Customer Logo
  ThemeCustomerLogo,
  CustomerLogo,
  
  // Service
  Service,
  ServiceTranslation,
  
  // Hero
  Hero,
  HeroSlider,
  HeroVideo,
  
  // Theme
  Theme,
  ThemeSection,
  ThemeSectionTranslation,
  ComponentStyleConfig,
  
  // About
  AboutSection,
  AboutSectionTranslation,
  
  // Food Menu
  FoodItem,
  FoodCategory,
  FoodCategoryTranslation,
  FoodItemTranslation,
  
  // Feature Flags
  FeatureFlag,
  
  // Gallery
  Gallery,
  GalleryTranslation,
  
  // Footer
  Footer,
  
  // Contact
  Contact,
  ContactSection,
  ContactSectionTranslation,
  
  // Comment
  Comment,
  
  // Dashboard
  DashboardStats,
  
  // Review
  Review,
  ReviewTranslation,
  ReviewServiceType,
  ReviewServiceTypeTranslation,
  
  // Site Statistics
  SiteStatistics,
  SiteStatisticsTranslation,
  SiteStatisticsHistory,
  SiteStatisticsSettings,
  
  // Admin Menu
  AdminMenuItem,
  AdminMenuItemTranslation,
  
  // API Key
  ApiKey,
  
  // ZNS
  ZnsConfiguration,
  ZnsTemplate,
  ZnsLog,
  ZnsWebhookEvent,

  // Advertising Popup
  AdvertisingPopup,
];

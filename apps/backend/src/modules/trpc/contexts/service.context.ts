import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ITrpcServices } from '../interfaces/trpc-services.interface';
import { UserService } from '../../user/services/user.service';
import { UserAdminService } from '../../user/services/admin/user-admin.service';
import { PostFrontendService } from '../../post/frontend/services/post-frontend.service';
import { PostAdminService } from '../../post/admin/services/post-admin.service';
import { ProfileService } from '../../profile/services/profile.service';
import { SettingsAdminService } from '../../settings/admin/services/settings-admin.service';
import { SettingsFrontendService } from '../../settings/frontend/services/settings-frontend.service';
import { AuthAdminService } from '../../auth/admin/services/auth-admin.service';
import { AuthFrontendService } from '../../auth/frontend/services/auth-frontend.service';
import { SeoAdminService } from '../../seo/admin/services/seo-admin.service';
import { SeoFrontendService } from '../../seo/frontend/services/seo-frontend.service';
import { FooterAdminService } from '../../footer/admin/services/footer-admin.service';
import { FooterFrontendService } from '../../footer/frontend/services/footer-frontend.service';
import { CategoryFrontendService } from '../../category/frontend/services/category-frontend.service';
import { CategoryAdminService } from '../../category/admin/services/category-admin.service';
import { ServiceAdminService } from '../../service/admin/services/service-admin.service';
import { ServiceFrontendService } from '../../service/frontend/services/service-frontend.service';
import { ProductAdminService } from '../../product/admin/services/product-admin.service';
import { ProductFrontendService } from '../../product/frontend/services/product-frontend.service';
import { CrossSellService } from '../../product/frontend/services/cross-sell.service';
import { ProductSpecificationService } from '../../product/services/product-specification.service';
import { ProductComboService } from '../../product/frontend/services/product-combo.service';
import { PriceRequestService } from '../../price-request/services/price-request.service';
import { PriceRequestAdminService } from '../../price-request/admin/services/price-request-admin.service';
import { FeatureFlagsAdminService } from '../../feature-flags/admin/services/feature-flags-admin.service';
import { FeatureFlagsFrontendService } from '../../feature-flags/frontend/services/feature-flags-frontend.service';
import { HeroService } from '../../hero/admin/services/hero.service';
import { HeroSliderService } from '../../hero/admin/services/hero-slider.service';
import { HeroVideoService } from '../../hero/services/hero-video.service';
import { ThemeAdminService } from '../../theme/admin/services/theme-admin.service';
import { ThemeFrontendService } from '../../theme/frontend/services/theme-frontend.service';
import { ThemeSectionAdminService } from '../../theme/admin/services/theme-section-admin.service';
import { ThemeSectionFrontendService } from '../../theme/frontend/services/theme-section-frontend.service';
import { ComponentStyleConfigAdminService } from '../../theme/admin/services/component-style-config-admin.service';
import { ComponentStyleConfigFrontendService } from '../../theme/frontend/services/component-style-config-frontend.service';
import { LanguageFrontendService } from '../../language/frontend/services/language-frontend.service';
import { LanguageAdminService } from '../../language/admin/services/language-admin.service';
import { AboutAdminService } from '../../about/admin/services/about-admin.service';
import { AboutFrontendService } from '../../about/frontend/services/about-frontend.service';
import { LogoFrontendService } from '../../settings/frontend/services/logo-frontend.service';
import { LogoAdminService } from '../../settings/admin/services/logo-admin.service';
import { CustomerLogoFrontendService } from '../../customer-logo/frontend/services/customer-logo-frontend.service';
import { CustomerLogoAdminService } from '../../customer-logo/admin/services/customer-logo-admin.service';
import { ContactAdminService } from '../../contact/admin/services/contact-admin.service';
import { ContactFrontendService } from '../../contact/frontend/services/contact-frontend.service';
import { GalleryFrontendService } from '../../gallery/frontend/services/gallery-frontend.service';
import { GalleryAdminService } from '../../gallery/admin/services/gallery-admin.service';
import { ContactSectionAdminService } from '../../contact/admin/services/contact-section-admin.service';
import { ContactSectionFrontendService } from '../../contact/frontend/services/contact-section-frontend.service';
import { TicketPricingSectionAdminService } from '../../ticket-pricing/admin/services/ticket-pricing-section-admin.service';
import { TicketPricingSectionFrontendService } from '../../ticket-pricing/frontend/services/ticket-pricing-section-frontend.service';
import { FoodMenuFrontendService } from '../../food-menu/frontend/services/food-menu-frontend.service';
import { FoodMenuAdminService } from '../../food-menu/admin/services/food-menu-admin.service';
import { PaymentFrontendService } from '../../payment/frontend/services/payment-frontend.service';
import { PaymentAdminService } from '../../payment/admin/services/payment-admin.service';
import { OrderFrontendService } from '../../order/frontend/services/order-frontend.service';
import { OrderAdminService } from '../../order/admin/services/order-admin.service';
import { UploadFrontendService } from '../../upload/frontend/services/upload-frontend.service';
import { UploadAdminService } from '../../upload/admin/services/upload-admin.service';
import { OrderTicketSectionAdminService } from '../../order-ticket/admin/services/order-ticket-section-admin.service';
import { OrderTicketSectionFrontendService } from '../../order-ticket/frontend/services/order-ticket-section-frontend.service';
import { SettingsService } from '../../settings/services/settings.service';
import { DashboardAdminService } from '../../dashboard/admin/services/dashboard-admin.service';
import { ProductStockHistoryService } from '../../product/services/product-stock-history.service';
import { AdminProductTierDiscountService } from '../../product/admin/services/product-tier-discount.service';
import { FrontendProductTierDiscountService } from '../../product/frontend/services/product-tier-discount.service';
import { CommentAdminService } from '../../comment/admin/services/comment-admin.service';
import { CommentFrontendService } from '../../comment/frontend/services/comment-frontend.service';
import { AdminReviewService } from '../../review/admin/services/admin-review.service';
import { FrontendReviewService } from '../../review/frontend/services/frontend-review.service';
import { SiteStatisticsAdminService } from '../../site-statistics/admin/services/site-statistics-admin.service';
import { SiteStatisticsFrontendService } from '../../site-statistics/frontend/services/site-statistics-frontend.service';
import { MailService } from '../../mail/services/mail.service';
import { AdminMenuAdminService } from '../../admin-menu/admin/services/admin-menu-admin.service';
import { AdminMenuFrontendService } from '../../admin-menu/frontend/services/admin-menu-frontend.service';
import { RoleAdminService } from '../../user/admin/services/role-admin.service';
import { UserSessionAdminService } from '../../user-session/admin/services/user-session-admin.service';
import { UserSessionFrontendService } from '../../user-session/frontend/services/user-session-frontend.service';
import { UserPageVisitAdminService } from '../../user-session/admin/services/user-page-visit-admin.service';
import { UserPageVisitFrontendService } from '../../user-session/frontend/services/user-page-visit-frontend.service';
import { MenuItemAdminService } from '../../settings/admin/services/menu-item-admin.service';
import { ApiKeyAdminService } from '../../api-key/admin/services/api-key-admin.service';
import { ApiKeyFrontendService } from '../../api-key/frontend/services/api-key-frontend.service';
import { CartFrontendService } from '../../cart/frontend/services/cart-frontend.service';
import { AdvertisingPopupAdminService } from '../../advertising-popup/admin/services/advertising-popup-admin.service';
import { AdvertisingPopupFrontendService } from '../../advertising-popup/frontend/services/advertising-popup-frontend.service';

@Injectable()
export class ServiceContext {
  private readonly logger = new Logger(ServiceContext.name);

  constructor(
    private readonly userService: UserService,
    private readonly userAdminService: UserAdminService,
    private readonly postFrontendService: PostFrontendService,
    private readonly postAdminService: PostAdminService,
    private readonly profileService: ProfileService,
    private readonly settingsAdminService: SettingsAdminService,
    private readonly settingsFrontendService: SettingsFrontendService,
    private readonly authAdminService: AuthAdminService,
    private readonly authFrontendService: AuthFrontendService,
    private readonly seoAdminService: SeoAdminService,
    private readonly seoFrontendService: SeoFrontendService,
    private readonly footerAdminService: FooterAdminService,
    private readonly footerFrontendService: FooterFrontendService,
    private readonly categoryFrontendService: CategoryFrontendService,
    private readonly categoryAdminService: CategoryAdminService,
    private readonly serviceAdminService: ServiceAdminService,
    private readonly serviceFrontendService: ServiceFrontendService,
    private readonly productAdminService: ProductAdminService,
    private readonly productFrontendService: ProductFrontendService,
    private readonly crossSellService: CrossSellService,
    private readonly productSpecificationService: ProductSpecificationService,
    private readonly productComboService: ProductComboService,
    private readonly featureFlagsAdminService: FeatureFlagsAdminService,
    private readonly featureFlagsFrontendService: FeatureFlagsFrontendService,
    private readonly heroService: HeroService,
    private readonly heroSliderService: HeroSliderService,
    private readonly heroVideoService: HeroVideoService,
    private readonly themeAdminService: ThemeAdminService,
    private readonly themeFrontendService: ThemeFrontendService,
    private readonly themeSectionAdminService: ThemeSectionAdminService,
    private readonly themeSectionFrontendService: ThemeSectionFrontendService,
    private readonly componentStyleConfigAdminService: ComponentStyleConfigAdminService,
    private readonly componentStyleConfigFrontendService: ComponentStyleConfigFrontendService,
    private readonly languageFrontendService: LanguageFrontendService,
    private readonly languageAdminService: LanguageAdminService,
    private readonly aboutAdminService: AboutAdminService,
    private readonly aboutFrontendService: AboutFrontendService,
    private readonly logoFrontendService: LogoFrontendService,
    private readonly logoAdminService: LogoAdminService,
    private readonly customerLogoFrontendService: CustomerLogoFrontendService,
    private readonly customerLogoAdminService: CustomerLogoAdminService,
    private readonly contactAdminService: ContactAdminService,
    private readonly contactFrontendService: ContactFrontendService,
    private readonly galleryFrontendService: GalleryFrontendService,
    private readonly galleryAdminService: GalleryAdminService,
    private readonly contactSectionAdminService: ContactSectionAdminService,
    private readonly contactSectionFrontendService: ContactSectionFrontendService,
    private readonly ticketPricingSectionAdminService: TicketPricingSectionAdminService,
    private readonly ticketPricingSectionFrontendService: TicketPricingSectionFrontendService,
    private readonly foodMenuFrontendService: FoodMenuFrontendService,
    private readonly foodMenuAdminService: FoodMenuAdminService,
    private readonly paymentFrontendService: PaymentFrontendService,
    private readonly paymentAdminService: PaymentAdminService,
    private readonly orderFrontendService: OrderFrontendService,
    private readonly orderAdminService: OrderAdminService,
    private readonly uploadFrontendService: UploadFrontendService,
    private readonly uploadAdminService: UploadAdminService,
    private readonly orderTicketSectionAdminService: OrderTicketSectionAdminService,
    private readonly orderTicketSectionFrontendService: OrderTicketSectionFrontendService,
    private readonly settingsService: SettingsService,
    private readonly dashboardAdminService: DashboardAdminService,
    private readonly productStockHistoryService: ProductStockHistoryService,
    private readonly commentAdminService: CommentAdminService,
    private readonly commentFrontendService: CommentFrontendService,
    private readonly adminReviewService: AdminReviewService,
    private readonly frontendReviewService: FrontendReviewService,
    private readonly siteStatisticsAdminService: SiteStatisticsAdminService,
    private readonly siteStatisticsFrontendService: SiteStatisticsFrontendService,
    private readonly mailService: MailService,
    private readonly adminMenuAdminService: AdminMenuAdminService,
    private readonly adminMenuFrontendService: AdminMenuFrontendService,
    private readonly roleAdminService: RoleAdminService,
    private readonly userSessionAdminService: UserSessionAdminService,
    private readonly userSessionFrontendService: UserSessionFrontendService,
    private readonly userPageVisitAdminService: UserPageVisitAdminService,
    private readonly userPageVisitFrontendService: UserPageVisitFrontendService,
    private readonly menuItemAdminService: MenuItemAdminService,
    private readonly adminProductTierDiscount: AdminProductTierDiscountService,
    private readonly frontendProductTierDiscount: FrontendProductTierDiscountService,
    private readonly apiKeyAdminService: ApiKeyAdminService,
    private readonly apiKeyFrontendService: ApiKeyFrontendService,
    private readonly cartFrontendService: CartFrontendService,
    private readonly advertisingPopupAdminService: AdvertisingPopupAdminService,
    private readonly advertisingPopupFrontendService: AdvertisingPopupFrontendService,
    @Inject(forwardRef(() => PriceRequestService))
    private readonly priceRequestService: PriceRequestService,
    @Inject(forwardRef(() => PriceRequestAdminService))
    private readonly priceRequestAdminService: PriceRequestAdminService,
  ) {}

  public getServices(): ITrpcServices {
    return {
      userService: this.userService,
      userAdminService: this.userAdminService,
      postService: this.postFrontendService,
      postAdminService: this.postAdminService,
      profileService: this.profileService,
      settingsAdminService: this.settingsAdminService,
      settingsFrontendService: this.settingsFrontendService,
      authAdminService: this.authAdminService,
      authFrontendService: this.authFrontendService,
      seoAdminService: this.seoAdminService,
      seoFrontendService: this.seoFrontendService,
      footerAdminService: this.footerAdminService,
      footerFrontendService: this.footerFrontendService,
      categoryFrontendService: this.categoryFrontendService,
      categoryAdminService: this.categoryAdminService,
      serviceAdminService: this.serviceAdminService,
      serviceFrontendService: this.serviceFrontendService,
      productAdminService: this.productAdminService,
      productFrontendService: this.productFrontendService,
      crossSellService: this.crossSellService,
      productSpecificationService: this.productSpecificationService,
      productComboService: this.productComboService,
      productStockHistoryService: this.productStockHistoryService,
      adminProductTierDiscount: this.adminProductTierDiscount,
      frontendProductTierDiscount: this.frontendProductTierDiscount,
      priceRequestService: this.priceRequestService,
      priceRequestAdminService: this.priceRequestAdminService,
      featureFlagsAdminService: this.featureFlagsAdminService,
      featureFlagsFrontendService: this.featureFlagsFrontendService,
      heroService: this.heroService,
      heroSliderService: this.heroSliderService,
      heroVideoService: this.heroVideoService,
      themeAdminService: this.themeAdminService,
      themeFrontendService: this.themeFrontendService,
      themeSectionAdminService: this.themeSectionAdminService,
      themeSectionFrontendService: this.themeSectionFrontendService,
      componentStyleConfigAdminService: this.componentStyleConfigAdminService,
      componentStyleConfigFrontendService: this.componentStyleConfigFrontendService,
      languageFrontendService: this.languageFrontendService,
      languageAdminService: this.languageAdminService,
      aboutAdminService: this.aboutAdminService,
      aboutFrontendService: this.aboutFrontendService,
      logoFrontendService: this.logoFrontendService,
      logoAdminService: this.logoAdminService,
      customerLogoFrontendService: this.customerLogoFrontendService,
      customerLogoAdminService: this.customerLogoAdminService,
      contactAdminService: this.contactAdminService,
      contactFrontendService: this.contactFrontendService,
      galleryFrontendService: this.galleryFrontendService,
      galleryAdminService: this.galleryAdminService,
      contactSectionAdminService: this.contactSectionAdminService,
      contactSectionFrontendService: this.contactSectionFrontendService,
      ticketPricingSectionAdminService: this.ticketPricingSectionAdminService,
      ticketPricingSectionFrontendService: this.ticketPricingSectionFrontendService,
      foodMenuFrontendService: this.foodMenuFrontendService,
      foodMenuAdminService: this.foodMenuAdminService,
      paymentFrontendService: this.paymentFrontendService,
      paymentAdminService: this.paymentAdminService,
      orderFrontendService: this.orderFrontendService,
      orderAdminService: this.orderAdminService,
      uploadFrontendService: this.uploadFrontendService,
      uploadAdminService: this.uploadAdminService,
      orderTicketSectionAdminService: this.orderTicketSectionAdminService,
      orderTicketSectionFrontendService: this.orderTicketSectionFrontendService,
      settingsService: this.settingsService,
      dashboardAdminService: this.dashboardAdminService,
      commentAdminService: this.commentAdminService,
      commentService: this.commentFrontendService,
      reviewAdminService: this.adminReviewService,
      reviewService: this.frontendReviewService,
      siteStatisticsAdmin: this.siteStatisticsAdminService,
      siteStatisticsFrontend: this.siteStatisticsFrontendService,
      mailService: this.mailService,
      adminMenuAdminService: this.adminMenuAdminService,
      adminMenuFrontendService: this.adminMenuFrontendService,
      roleAdminService: this.roleAdminService,
      userSessionAdminService: this.userSessionAdminService,
      userSessionFrontendService: this.userSessionFrontendService,
      userPageVisitAdminService: this.userPageVisitAdminService,
      userPageVisitFrontendService: this.userPageVisitFrontendService,
      menuItemAdminService: this.menuItemAdminService,
      apiKeyAdminService: this.apiKeyAdminService,
      apiKeyFrontendService: this.apiKeyFrontendService,
      cartFrontendService: this.cartFrontendService,
      advertisingPopupAdminService: this.advertisingPopupAdminService,
      advertisingPopupFrontendService: this.advertisingPopupFrontendService,
      
      // Grouped services by namespace
      admin: {
        review: this.adminReviewService,
        comment: this.commentAdminService,
        user: this.userAdminService,
        post: this.postAdminService,
        settings: this.settingsAdminService,
        seo: this.seoAdminService,
        footer: this.footerAdminService,
        category: this.categoryAdminService,
        service: this.serviceAdminService,
        product: this.productAdminService,
        featureFlags: this.featureFlagsAdminService,
        theme: this.themeAdminService,
        themeSection: this.themeSectionAdminService,
        componentStyleConfig: this.componentStyleConfigAdminService,
        language: this.languageAdminService,
        about: this.aboutAdminService,
        logo: this.logoAdminService,
        customerLogo: this.customerLogoAdminService,
        auth: this.authAdminService,
        contact: this.contactAdminService,
        contactSection: this.contactSectionAdminService,
        ticketPricingSection: this.ticketPricingSectionAdminService,
        foodMenu: this.foodMenuAdminService,
        payment: this.paymentAdminService,
        order: this.orderAdminService,
        upload: this.uploadAdminService,
        orderTicketSection: this.orderTicketSectionAdminService,
        dashboard: this.dashboardAdminService,
        gallery: this.galleryAdminService,
        adminMenu: this.adminMenuAdminService,
        role: this.roleAdminService,
        userSession: this.userSessionAdminService,
        userPageVisit: this.userPageVisitAdminService,
        priceRequest: this.priceRequestAdminService,
        apiKey: this.apiKeyAdminService,
        advertisingPopup: this.advertisingPopupAdminService,
      },
      
      frontend: {
        review: this.frontendReviewService,
        comment: this.commentFrontendService,
        post: this.postFrontendService,
        settings: this.settingsFrontendService,
        seo: this.seoFrontendService,
        footer: this.footerFrontendService,
        category: this.categoryFrontendService,
        service: this.serviceFrontendService,
        product: this.productFrontendService,
        featureFlags: this.featureFlagsFrontendService,
        theme: this.themeFrontendService,
        themeSection: this.themeSectionFrontendService,
        componentStyleConfig: this.componentStyleConfigFrontendService,
        language: this.languageFrontendService,
        about: this.aboutFrontendService,
        logo: this.logoFrontendService,
        customerLogo: this.customerLogoFrontendService,
        auth: this.authFrontendService,
        contact: this.contactFrontendService,
        contactSection: this.contactSectionFrontendService,
        ticketPricingSection: this.ticketPricingSectionFrontendService,
        foodMenu: this.foodMenuFrontendService,
        payment: this.paymentFrontendService,
        order: this.orderFrontendService,
        upload: this.uploadFrontendService,
        orderTicketSection: this.orderTicketSectionFrontendService,
        gallery: this.galleryFrontendService,
        adminMenu: this.adminMenuFrontendService,
        userSession: this.userSessionFrontendService,
        userPageVisit: this.userPageVisitFrontendService,
        apiKey: this.apiKeyFrontendService,
        cart: this.cartFrontendService,
        advertisingPopup: this.advertisingPopupFrontendService,
      },
    };
  }
}

import { authRouter } from './auth.router';
import { postRouter } from './post.router';
import { userRouter } from './user.router';
import { settingsRouter } from './settings.router';
import { seoRouter } from './seo.router';
import { categoryRouter } from './category.router';
import { serviceRouter } from './service.router';
import { featureFlagsRouter } from './feature-flags.router';
import { productRouter } from './product.router';
import { priceRequestRouter } from './price-request.router';
import { profileRouter } from './profile.router';
import { footerRouter } from './footer.router';
import { heroRouter } from './hero.router';
import { themeRouter } from './theme.router';
import { languageRouter } from './language.router';
import { componentStyleConfigRouter } from './component-style-config.router';
import { logoRouter } from './logo.router';
import { customerLogoRouter } from './customer-logo.router';
import { contactRouter } from './contact.router';
import { aboutRouter } from './about.router';
import { galleryRouter } from './gallery.router';
import { foodMenuRouter } from './food-menu.router';
import { contactSectionRouter } from './contact-section.router';
import { orderTicketSectionRouter } from './order-ticket-section.router';
import { paymentRouter } from './payment.router';
import { orderRouter } from './order.router';
import { uploadRouter } from './upload.router';
import { commentRouter } from './comment.router';
import { reviewRouter } from './review.router';
import { adminRouter } from './admin';
import { router } from '../procedures';
import { siteStatisticsRouter } from './site-statistics.router';
import { adminMenuAdminRouter } from './admin/admin-menu.router';
import { userSessionRouter } from './user-session.router';
import { productTierDiscountRouter } from './product-tier-discount.router';
import { cartRouter } from './cart.router';
import { advertisingPopupRouter } from './advertising-popup.router';

// Export all routers
export * from './app.router';
export * from './auth.router';
export * from './post.router';
export * from './category.router';
export * from './service.router';
export * from './user.router';
export * from './profile.router';
export * from './common.router';
export * from './settings.router';
export * from './seo.router';
export * from './footer.router';
export * from './product.router';
export * from './price-request.router';
export * from './feature-flags.router';
export * from './hero.router';
export * from './theme.router';
export * from './component-style-config.router';
export * from './language.router';
export * from './about.router';
export * from './logo.router';
export * from './customer-logo.router';
export * from './contact.router';
export * from './gallery.router';
export * from './contact-section.router';
export * from './order-ticket-section.router';
export * from './food-menu.router';
export * from './payment.router';
export * from './order.router';
export * from './upload.router';
export * from './comment.router';
export * from './review.router';
export * from './site-statistics.router';
export * from './user-session.router';
export * from './product-tier-discount.router';
export * from './cart.router';
export * from './advertising-popup.router';

export const appRouter = (commonRouter) => router({
  auth: authRouter,
  post: postRouter,
  user: userRouter,
  settings: settingsRouter,
  seo: seoRouter,
  category: categoryRouter,
  service: serviceRouter,
  featureFlags: featureFlagsRouter,
  product: productRouter,
  priceRequest: priceRequestRouter,
  profile: profileRouter,
  footer: footerRouter,
  hero: heroRouter,
  theme: themeRouter,
  common: commonRouter.router,
  language: languageRouter,
  componentStyleConfig: componentStyleConfigRouter,
  logo: logoRouter,
  customerLogo: customerLogoRouter,
  contact: contactRouter,
  about: aboutRouter,
  gallery: galleryRouter,
  foodMenu: foodMenuRouter,
  contactSection: contactSectionRouter,
  orderTicketSection: orderTicketSectionRouter,
  payment: paymentRouter,
  order: orderRouter,
  upload: uploadRouter,
  comment: commentRouter,
  review: reviewRouter,
  admin: adminRouter,
  siteStatistics: siteStatisticsRouter,
  userSession: userSessionRouter,
  productTierDiscount: productTierDiscountRouter,
  cart: cartRouter,
  advertisingPopup: advertisingPopupRouter,
});

export type AppRouter = ReturnType<typeof appRouter>;

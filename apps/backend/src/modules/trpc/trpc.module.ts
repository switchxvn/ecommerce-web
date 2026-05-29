import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AboutModule } from '../about/about.module';
import { AdminMenuModule } from '../admin-menu/admin-menu.module';
import { ApiKeyModule } from '../api-key/api-key.module';
import { AuthModule } from '../auth/auth.module';
import { CartModule } from '../cart/cart.module';
import { CategoryModule } from '../category/category.module';
import { CommentModule } from '../comment/comment.module';
import { CommonModule } from '../common';
import { ContactModule } from '../contact/contact.module';
import { CustomerLogoModule } from '../customer-logo/customer-logo.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module';
import { FoodMenuModule } from '../food-menu/food-menu.module';
import { FooterModule } from '../footer/footer.module';
import { GalleryModule } from '../gallery/gallery.module';
import { HeroModule } from '../hero/hero.module';
import { LanguageModule } from '../language/language.module';
import { OrderTicketModule } from '../order-ticket/order-ticket.module';
import { OrderModule } from '../order/order.module';
import { PaymentModule } from '../payment/payment.module';
import { PostModule } from '../post/post.module';
import { PriceRequestModule } from '../price-request/price-request.module';
import { ProductModule } from '../product/product.module';
import { ProfileModule } from '../profile/profile.module';
import { ReviewModule } from '../review/review.module';
import { SeoModule } from '../seo/seo.module';
import { ServiceModule } from '../service/service.module';
import { SettingsModule } from '../settings/settings.module';
import { SiteStatisticsModule } from '../site-statistics/site-statistics.module';
import { ThemeModule } from '../theme/theme.module';
import { TicketPricingModule } from '../ticket-pricing/ticket-pricing.module';
import { UploadModule } from '../upload/upload.module';
import { UserModule } from '../user/user.module';
import { UserSessionModule } from '../user-session/user-session.module';
import { CommonRouter } from './routers/common.router';
import { TrpcController } from './trpc.controller';
import { TrpcRouter } from './trpc.router';
import { TRPCContextManager } from './contexts/trpc.context';
import { ServiceContext } from './contexts/service.context';
import { DataSourceContext } from './contexts/datasource.context';
import { AuthContext } from './contexts/auth.context';
/**
 * TrpcModule - Main module for tRPC integration with NestJS
 * 
 * This module integrates tRPC with NestJS, allowing for type-safe API calls
 * between the frontend and backend. It imports all necessary modules that
 * will be exposed through tRPC endpoints.
 * 
 * Features:
 * - User management and authentication
 * - Content management (posts, products, categories)
 * - Site configuration (settings, SEO, footer)
 * - Theme management and customization
 * - Feature flags for conditional functionality
 * - Language and translation management
 * - About page management
 * - Customer logos management
 */
@Module({
  controllers: [TrpcController],
  imports: [
    // Feature modules that will be exposed through tRPC
    UserModule,
    PostModule,
    ProfileModule,
    SettingsModule,
    SeoModule,
    FooterModule,
    CategoryModule,
    ServiceModule,
    ProductModule,
    PriceRequestModule,
    FeatureFlagsModule,
    HeroModule,
    CommonModule,
    ThemeModule,
    LanguageModule,
    AboutModule,
    CustomerLogoModule,
    AuthModule,
    CartModule,
    ContactModule,
    GalleryModule,
    TicketPricingModule,
    OrderTicketModule,
    FoodMenuModule,
    OrderModule,
    UploadModule,
    CommentModule,
    ReviewModule,
    SiteStatisticsModule,
    AdminMenuModule,
    UserSessionModule,
    ApiKeyModule,
    forwardRef(() => PriceRequestModule),

    // Auth module is imported with forwardRef to avoid circular dependency
    forwardRef(() => AuthModule),

    // JWT configuration for authentication
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'your-secret-key'),
      }),
      inject: [ConfigService],
    }),

    // Reuse global ConfigModule registered in AppModule
    ConfigModule,
    PaymentModule,
    DashboardModule,
  ],
  providers: [
    CommonRouter,
    TrpcRouter,
    TRPCContextManager,
    ServiceContext,
    DataSourceContext,
    AuthContext,
  ],
  exports: [TrpcRouter],
})
export class TrpcModule { } 

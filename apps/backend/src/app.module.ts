import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminMenuModule } from './modules/admin-menu/admin-menu.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoryModule } from './modules/category/category.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { FooterModule } from './modules/footer/footer.module';
import { PostModule } from './modules/post/post.module';
import { PriceRequestModule } from './modules/price-request/price-request.module';
import { ProductModule } from './modules/product/product.module';
import { ProfileModule } from './modules/profile/profile.module';
import { SeoModule } from './modules/seo/seo.module';
import { ServiceModule } from './modules/service/service.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TrpcModule } from './modules/trpc/trpc.module';
import { UserModule } from './modules/user/user.module';
import { ThemeModule } from './modules/theme/theme.module';
import { NestFactory } from '@nestjs/core';
import { CustomerLogoModule } from './modules/customer-logo/customer-logo.module';
import { ContactModule } from './modules/contact/contact.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ApiKeyModule } from './modules/api-key/api-key.module';
import { CartModule } from './modules/cart/cart.module';
import { ZnsModule } from './modules/zns/zns.module';
import * as path from 'path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.resolve(process.cwd(), '.env'), override: true });

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(__dirname, '../../../.env'),
        '.env',
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const normalizeSecret = (value: string | undefined, fallback: string) => {
          const raw = value ?? fallback;
          const withoutCR = raw.replace(/\r/g, '');
          const unquoted = withoutCR.match(/^(['"])(.*)\1$/)?.[2] ?? withoutCR;
          return unquoted;
        };

        const dbHost = process.env['DB_HOST'] || configService.get('DB_HOST', 'localhost');
        const dbPort = Number(process.env['DB_PORT'] || configService.get('DB_PORT', 5432));
        const dbUsername = process.env['DB_USERNAME'] || configService.get('DB_USERNAME', 'postgres');
        const dbPassword = normalizeSecret(process.env['DB_PASSWORD'] || configService.get('DB_PASSWORD'), 'postgres');
        const dbDatabase = process.env['DB_DATABASE'] || configService.get('DB_DATABASE', 'ecommerce');

        if ((process.env['DB_DEBUG'] || configService.get('DB_DEBUG', 'false')) === 'true') {
          const passwordHex = Buffer.from(dbPassword).toString('hex');
          process.stderr.write(`[DB_DEBUG] host=${dbHost} port=${dbPort} user=${dbUsername} db=${dbDatabase}\n`);
          process.stderr.write(`[DB_DEBUG] passwordLength=${dbPassword.length} passwordHex=${passwordHex}\n`);
        }

        return {
          type: 'postgres',
          host: dbHost,
          port: dbPort,
          username: dbUsername,
          password: dbPassword,
          database: dbDatabase,
          autoLoadEntities: true,
          entities: [__dirname + '/modules/**/*.entity{.ts,.js}'],
          synchronize: false,
          logging: configService.get('NODE_ENV') === 'development',
          extra: configService.get('NODE_ENV') === 'production' ? {
            ssl: {
              rejectUnauthorized: false,
            },
          } : {},
        };
      },
    }),
    UserModule,
    AuthModule,
    PostModule,
    TrpcModule,
    SettingsModule,
    SeoModule,
    FooterModule,
    ProfileModule,
    CategoryModule,
    ServiceModule,
    ProductModule,
    PriceRequestModule,
    FeatureFlagsModule,
    ThemeModule,
    CustomerLogoModule,
    ContactModule,
    DashboardModule,
    AdminMenuModule,
    ApiKeyModule,
    CartModule,
    ZnsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  private static app: any;

  static async getApp() {
    if (!this.app) {
      this.app = await NestFactory.create(AppModule);
    }
    return this.app;
  }
}

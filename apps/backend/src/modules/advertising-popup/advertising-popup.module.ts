import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvertisingPopupAdminService } from './admin/services/advertising-popup-admin.service';
import { AdvertisingPopup } from './entities/advertising-popup.entity';
import { AdvertisingPopupFrontendService } from './frontend/services/advertising-popup-frontend.service';

@Module({
  imports: [TypeOrmModule.forFeature([AdvertisingPopup])],
  providers: [AdvertisingPopupAdminService, AdvertisingPopupFrontendService],
  exports: [AdvertisingPopupAdminService, AdvertisingPopupFrontendService],
})
export class AdvertisingPopupModule {}

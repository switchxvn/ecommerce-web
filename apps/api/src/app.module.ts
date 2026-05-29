import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentModule } from './payment/payment.module';
import { TicketModule } from './ticket/ticket.module';
import { OrderModule } from './order/order.module';
import { ZnsModule } from './zns/zns.module';
import { CommonModule } from './common/common.module';
import * as entities from '../../../apps/backend/src/modules/entities';
import * as path from 'path';

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
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: entities.entities,
        synchronize: configService.get('DB_SYNCHRONIZE') === 'true',
        logging: configService.get('NODE_ENV') === 'development',
        extra: configService.get('NODE_ENV') === 'production' ? {
          ssl: {
            rejectUnauthorized: false,
          },
        } : {},
      }),
    }),
    CommonModule,
    PaymentModule,
    TicketModule,
    OrderModule,
    ZnsModule,
  ],
})
export class AppModule { } 

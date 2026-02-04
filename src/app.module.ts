import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './core/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { RedisModule } from './core/redis/redis.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmAsyncConfig } from './config/typeorm.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/role.guard';
import { AdminModule } from './modules/admin/admin.module';
import { ProductModule } from './modules/product/product.module';
import { FarmModule } from './modules/farm/farm.module';
import { AddressModule } from './modules/address/address.module';
import { ReviewModule } from './modules/review/review.module';
import { PaymentModule } from './modules/payment/payment.module';
import { OrderModule } from './modules/order/order.module';
import { CropManagementModule } from './modules/crop-management/crop-management.module';
import { TwilioModule } from './core/twilio/twilio.module';
import { FirebaseModule } from './core/firebase/firebase.module';
import { NotificationModule } from './modules/notification/notification.module';
import { FileStorageModule } from './core/file-storage/file-storage.module';
import { StringValue } from 'ms';
import { AuditModule } from './core/audit/audit.module';
import { QrModule } from './modules/qr/qr.module';
import { FtesModule } from './modules/ftes/ftes.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';

@Module({
    imports: [
        TypeOrmModule.forRootAsync(typeOrmAsyncConfig),

        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.dev', '.env']
        }),

        // JWT configuration
        JwtModule.registerAsync({
            global: true,
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>("JWT_ACCESS_TOKEN_SECRET") || 'fallback_secret',
                signOptions: {
                    expiresIn: configService.get<StringValue>("JWT_ACCESS_TOKEN_EXPIRATION") || '15m',
                },
            }),
        }),

        // Rate limiting
        // ThrottlerModule.forRootAsync({
        //   inject: [],
        //   useFactory: () => ({
        //     throttlers: [
        //       {
        //         ttl: parseInt(process.env.THROTTLE_TTL || '60') * 1000,
        //         limit: parseInt(process.env.THROTTLE_LIMIT || '10'),
        //       },
        //     ],
        //   }),
        // }),

        AuthModule,
        UserModule,
        RedisModule,
        AdminModule,
        ProductModule,
        FarmModule,
        AddressModule,
        ReviewModule,
        PaymentModule,
        OrderModule,
        CropManagementModule,
        TwilioModule,
        FirebaseModule,
        NotificationModule,
        RouterModule.register([
            {
                path: "crop-management",
                module: CropManagementModule
            },
            {
                path: "admin",
                module: AdminModule
            }
        ]),
        FileStorageModule,
        AuditModule,
        QrModule,
        FtesModule,
        BlockchainModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
    ],
})
export class AppModule { }

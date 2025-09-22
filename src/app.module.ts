import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './core/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { MailModule } from './core/mail/mail.module';
import { SmsModule } from './core/sms/sms.module';
import { RedisModule } from './core/redis/redis.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmAsyncConfig } from './config/typeorm.config';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/role.guard';
import { AdminModule } from './modules/admin/admin.module';
import { ProductModule } from './modules/product/product.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),

    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // JWT configuration
    JwtModule.registerAsync({
      global: true,
      inject: [],
      useFactory: () => ({
        secret: process.env.JWT_ACCESS_TOKEN_SECRET || 'fallback_secret',
        signOptions: {
          expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION || '15m',
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

    AuthModule, UserModule, MailModule, SmsModule, RedisModule, AdminModule, ProductModule],
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

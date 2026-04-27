import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from 'src/modules/auth/passport/local.strategy';
import { UsersModule } from 'src/modules/users/users.module';
import { JwtStrategy } from 'src/modules/auth/passport/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import ms from 'ms';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RolesModule } from '../roles/roles.module';
import { ApiConfigService } from 'src/shared';
// import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    RolesModule,
    // EmailModule,
    JwtModule.registerAsync({
      useFactory: (configService: ApiConfigService) => ({
        secret: configService.authConfig.access_token_key,
        signOptions: {
          expiresIn: ms(configService.authConfig.access_expiration_time as ms.StringValue) / 1000,
        },
      }),
      inject: [ApiConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
})
export class AuthModule {}

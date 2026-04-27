import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiConfigService } from './services/api-config.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [ApiConfigService],
  exports: [ApiConfigService],
})
export class SharedModule {}

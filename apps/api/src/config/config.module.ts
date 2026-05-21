import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';
import { validate } from './config.validation';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: ['.env.development', '.env.staging', '.env.production', '.env'],
      expandVariables: true,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}

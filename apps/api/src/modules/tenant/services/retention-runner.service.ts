import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../../../config/config.service';
import { RetentionService } from './retention.service';

@Injectable()
export class RetentionRunnerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RetentionRunnerService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly retentionService: RetentionService,
  ) {}

  onModuleInit(): void {
    if (this.config.isDevelopment) {
      return;
    }

    this.timer = setInterval(() => {
      this.retentionService.cleanup().catch((err: unknown) => {
        this.logger.error(`Retention cleanup failed: ${String(err)}`);
      });
    }, 24 * 60 * 60 * 1000);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

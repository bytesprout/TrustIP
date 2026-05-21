import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../../../config/config.service';
import { TenantService } from './tenant.service';

@Injectable()
export class EnterpriseInitializerService implements OnModuleInit {
  private readonly logger = new Logger(EnterpriseInitializerService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly tenantService: TenantService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.config.isEnterpriseMode) {
      return;
    }

    await this.tenantService.ensureInternalEnterpriseTenant();
    this.logger.log('Enterprise internal tenant is ready');
  }
}

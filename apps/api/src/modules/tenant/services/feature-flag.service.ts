import { Injectable } from '@nestjs/common';
import { FeatureFlagsService } from '../../feature-flags/feature-flags.service';

@Injectable()
export class TenantFeatureFlagService {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  async getTenantFlags(tenantId: string) {
    return this.featureFlagsService.findAll(tenantId);
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Overall system health' })
  @ApiResponse({
    status: 200,
    description: 'Health status of all services',
    schema: {
      example: {
        healthy: true,
        database: 'healthy',
        redis: 'healthy',
        version: '1.0.0',
        uptime: 3600,
      },
    },
  })
  async getHealth() {
    return this.healthService.getOverallHealth();
  }

  @Get('db')
  @ApiOperation({ summary: 'PostgreSQL health check' })
  @ApiResponse({ status: 200, description: 'Database health status' })
  async getDatabaseHealth() {
    return this.healthService.getDatabaseHealth();
  }

  @Get('redis')
  @ApiOperation({ summary: 'Redis health check' })
  @ApiResponse({ status: 200, description: 'Redis health status' })
  async getRedisHealth() {
    return this.healthService.getRedisHealth();
  }

  @Get('datasets')
  @ApiOperation({ summary: 'Dataset pipeline health check' })
  @ApiResponse({ status: 200, description: 'Dataset health status' })
  async getDatasetsHealth() {
    return this.healthService.getDatasetsHealth();
  }

  @Get('trust-engine')
  @ApiOperation({ summary: 'Trust engine health check' })
  @ApiResponse({ status: 200, description: 'Trust engine health status' })
  async getTrustEngineHealth() {
    return this.healthService.getTrustEngineHealth();
  }

  @Get('billing')
  @ApiOperation({ summary: 'Billing engine health check' })
  @ApiResponse({ status: 200, description: 'Billing engine health status' })
  async getBillingHealth() {
    return this.healthService.getBillingHealth();
  }
}

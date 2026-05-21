import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DatasetHealthService } from '@trustip/dataset-updater';

@ApiTags('internal')
@Controller('internal/dataset')
export class DatasetHealthController {
  constructor(private readonly datasetHealthService: DatasetHealthService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dataset health status for all managed datasets' })
  @ApiResponse({
    status: 200,
    description: 'Per-dataset health with staleness and last update info',
  })
  async getDatasetHealth() {
    return this.datasetHealthService.getHealth();
  }
}

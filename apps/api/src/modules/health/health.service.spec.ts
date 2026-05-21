import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { HealthStatus } from '@trustip/shared-types';

const mockPrismaService = {
  healthCheck: jest.fn(),
  datasetRegistry: {
    findMany: jest.fn(),
  },
  trustHistory: {
    findFirst: jest.fn(),
  },
  plan: {
    count: jest.fn(),
  },
  subscription: {
    count: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockRedisService = {
  healthCheck: jest.fn(),
};

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    jest.clearAllMocks();
  });

  describe('getOverallHealth', () => {
    it('should return healthy when both DB and Redis are healthy', async () => {
      mockPrismaService.healthCheck.mockResolvedValue(true);
      mockRedisService.healthCheck.mockResolvedValue(true);
      mockPrismaService.datasetRegistry.findMany.mockResolvedValue([
        { datasetName: 'geolite', status: 'ACTIVE', lastUpdatedAt: new Date() },
      ]);
      mockPrismaService.trustHistory.findFirst.mockResolvedValue(null);
      mockPrismaService.$transaction.mockResolvedValue([1, 1]);

      const result = await service.getOverallHealth();

      expect(result.healthy).toBe(true);
      expect(result.database).toBe(HealthStatus.HEALTHY);
      expect(result.redis).toBe(HealthStatus.HEALTHY);
    });

    it('should return unhealthy when DB is down', async () => {
      mockPrismaService.healthCheck.mockResolvedValue(false);
      mockRedisService.healthCheck.mockResolvedValue(true);
      mockPrismaService.datasetRegistry.findMany.mockResolvedValue([
        { datasetName: 'geolite', status: 'ACTIVE', lastUpdatedAt: new Date() },
      ]);
      mockPrismaService.trustHistory.findFirst.mockResolvedValue(null);
      mockPrismaService.$transaction.mockResolvedValue([1, 1]);

      const result = await service.getOverallHealth();

      expect(result.healthy).toBe(false);
      expect(result.database).toBe(HealthStatus.UNHEALTHY);
    });

    it('should return unhealthy when Redis is down', async () => {
      mockPrismaService.healthCheck.mockResolvedValue(true);
      mockRedisService.healthCheck.mockResolvedValue(false);
      mockPrismaService.datasetRegistry.findMany.mockResolvedValue([
        { datasetName: 'geolite', status: 'ACTIVE', lastUpdatedAt: new Date() },
      ]);
      mockPrismaService.trustHistory.findFirst.mockResolvedValue(null);
      mockPrismaService.$transaction.mockResolvedValue([1, 1]);

      const result = await service.getOverallHealth();

      expect(result.healthy).toBe(false);
      expect(result.redis).toBe(HealthStatus.UNHEALTHY);
    });
  });

  describe('getDatabaseHealth', () => {
    it('should return healthy status', async () => {
      mockPrismaService.healthCheck.mockResolvedValue(true);
      const result = await service.getDatabaseHealth();
      expect(result.status).toBe(HealthStatus.HEALTHY);
    });

    it('should return unhealthy with message on failure', async () => {
      mockPrismaService.healthCheck.mockRejectedValue(new Error('Connection refused'));
      const result = await service.getDatabaseHealth();
      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.message).toBe('Connection refused');
    });
  });

  describe('getRedisHealth', () => {
    it('should return healthy status', async () => {
      mockRedisService.healthCheck.mockResolvedValue(true);
      const result = await service.getRedisHealth();
      expect(result.status).toBe(HealthStatus.HEALTHY);
    });
  });

  describe('getDatasetsHealth', () => {
    it('should return unhealthy when no datasets are registered', async () => {
      mockPrismaService.datasetRegistry.findMany.mockResolvedValue([]);

      const result = await service.getDatasetsHealth();
      expect(result.status).toBe(HealthStatus.UNHEALTHY);
    });
  });

  describe('getBillingHealth', () => {
    it('should return healthy when billing queries succeed', async () => {
      mockPrismaService.$transaction.mockResolvedValue([2, 3]);

      const result = await service.getBillingHealth();
      expect(result.status).toBe(HealthStatus.HEALTHY);
    });
  });
});

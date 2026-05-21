import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../../prisma/prisma.service';

const mockPrisma = {
  apiUsageLog: {
    create: jest.fn().mockResolvedValue({}),
  },
} as unknown as PrismaService;

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AnalyticsService(mockPrisma);
  });

  it('should fire-and-forget without throwing', async () => {
    const payload = {
      tenantId: 'tenant-1',
      apiKeyId: 'key-1',
      endpoint: '/api/v1/ip/basic',
      queryIp: '8.8.8.8',
      country: 'US',
      statusCode: 200,
      latencyMs: 12,
      cacheHit: false,
      scope: 'basic_lookup',
    };

    expect(() => service.track(payload)).not.toThrow();
    // Allow the async fire-and-forget to settle
    await new Promise((r) => setTimeout(r, 10));
    expect(mockPrisma.apiUsageLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        apiKeyId: 'key-1',
        endpoint: '/api/v1/ip/basic',
        queryIp: '8.8.8.8',
        scope: 'basic_lookup',
      }),
    });
  });

  it('should not propagate errors from DB write failures', async () => {
    (mockPrisma.apiUsageLog.create as jest.Mock).mockRejectedValueOnce(
      new Error('DB connection lost'),
    );

    const payload = {
      tenantId: 'tenant-1',
      apiKeyId: 'key-1',
      endpoint: '/api/v1/ip/basic',
      queryIp: '1.2.3.4',
      country: undefined,
      statusCode: 200,
      latencyMs: 5,
      cacheHit: true,
      scope: 'basic_lookup',
    };

    // Should not throw even if DB fails
    expect(() => service.track(payload)).not.toThrow();
    await new Promise((r) => setTimeout(r, 20));
    // No assertion — we just verify no unhandled rejection
  });
});

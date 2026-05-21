import { SecurityAbuseService } from './security-abuse.service';

describe('SecurityAbuseService', () => {
  const mockRedis = {
    getJson: jest.fn(),
    setJson: jest.fn(),
    del: jest.fn(),
  };
  const mockConfig = {
    securityAbuseWindowSeconds: 300,
    securityAbuseThreshold: 2,
    securityBlockSeconds: 600,
  };
  const mockAuditLog = {
    log: jest.fn(),
  };
  const mockAlerting = {
    emit: jest.fn(),
  };
  const mockMetrics = {
    recordBlockedRequest: jest.fn(),
  };

  let service: SecurityAbuseService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SecurityAbuseService(
      mockRedis as never,
      mockConfig as never,
      mockAuditLog as never,
      mockAlerting as never,
      mockMetrics as never,
    );
  });

  it('should return default state when redis has no entry', async () => {
    mockRedis.getJson.mockResolvedValue(null);
    const state = await service.getState('auth', 'id-1');
    expect(state).toEqual({ attempts: 0, blockedUntil: null });
  });

  it('should emit alert and log when threshold exceeded', async () => {
    mockRedis.getJson.mockResolvedValue({ attempts: 1, blockedUntil: null });

    await service.recordFailure({
      scope: 'auth',
      identifier: 'id-1',
      source: 'test',
    });

    expect(mockAlerting.emit).toHaveBeenCalledTimes(1);
    expect(mockAuditLog.log).toHaveBeenCalledTimes(1);
    expect(mockRedis.setJson).toHaveBeenCalledTimes(1);
  });
});

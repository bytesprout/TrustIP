import { TenantValidationService } from './tenant-validation.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../../redis/redis.service';
import { DOMAIN_LOCK_MODES, IP_WHITELIST_MODES } from '../constants/ip.constants';
import * as crypto from 'crypto';

const RAW_KEY = 'tk_abc1validkeyfor123';
const HASH = crypto.createHash('sha256').update(RAW_KEY).digest('hex');

const buildMockApiKey = (tenantOverrides: Record<string, unknown> = {}, keyOverrides: Record<string, unknown> = {}) => ({
  id: 'apikey-1',
  keyHash: HASH,
  keyPrefix: 'tk_abc1',
  isActive: true,
  expiresAt: null,
  scopes: ['basic_lookup'],
  tenant: {
    id: 'tenant-1',
    name: 'Test Tenant',
    slug: 'test',
    isActive: true,
    rateLimitPerMinute: 60,
    domainLockMode: DOMAIN_LOCK_MODES.DISABLED,
    allowedDomains: [],
    ipWhitelistMode: IP_WHITELIST_MODES.DISABLED,
    allowedIps: [],
    ...tenantOverrides,
  },
  ...keyOverrides,
});

const mockRedisClient = { incr: jest.fn(), expire: jest.fn() };

const mockRedis = {
  getClient: jest.fn().mockReturnValue(mockRedisClient),
  getJson: jest.fn(),
  setJson: jest.fn().mockResolvedValue(undefined),
  get: jest.fn(),
  set: jest.fn(),
} as unknown as RedisService;

const mockPrisma = {
  apiKey: {
    findMany: jest.fn(),
    update: jest.fn().mockResolvedValue({}),
  },
} as unknown as PrismaService;

/** Helper to mock DB returning one key (findMany returns array) */
function mockDb(key: ReturnType<typeof buildMockApiKey> | null) {
  (mockPrisma.apiKey.findMany as jest.Mock).mockResolvedValueOnce(key ? [key] : []);
}

describe('TenantValidationService', () => {
  let service: TenantValidationService;

  beforeEach(() => {
    jest.clearAllMocks();
    (mockRedis.getClient as jest.Mock).mockReturnValue(mockRedisClient);
    (mockRedisClient.incr as jest.Mock).mockResolvedValue(1);
    (mockRedisClient.expire as jest.Mock).mockResolvedValue(1);
    (mockRedis.getJson as jest.Mock).mockResolvedValue(null);
    (mockRedis.setJson as jest.Mock).mockResolvedValue(undefined);
    service = new TenantValidationService(mockPrisma, mockRedis);
  });

  describe('validate', () => {
    it('should return invalid when API key is too short', async () => {
      const result = await service.validate('short', undefined, undefined, undefined);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_API_KEY');
    });

    it('should return invalid when API key not found in DB', async () => {
      mockDb(null);
      const result = await service.validate('tk_abc1xxxxxxxxxxxxxx', undefined, undefined, undefined);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_API_KEY');
    });

    it('should succeed when API key resolves correctly', async () => {
      mockDb(buildMockApiKey());
      const result = await service.validate(RAW_KEY, undefined, undefined, undefined);
      expect(result.valid).toBe(true);
      expect(result.tenant?.id).toBe('tenant-1');
      expect(result.apiKey?.id).toBe('apikey-1');
    });

    it('should return invalid when tenant is disabled', async () => {
      mockDb(buildMockApiKey({ isActive: false }));
      const result = await service.validate(RAW_KEY, undefined, undefined, undefined);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('TENANT_DISABLED');
    });

    it('should return invalid when domain lock strict and origin not allowed', async () => {
      mockDb(buildMockApiKey({
        domainLockMode: DOMAIN_LOCK_MODES.STRICT,
        allowedDomains: ['allowed.com'],
      }));
      const result = await service.validate(RAW_KEY, 'https://evil.com', undefined, undefined);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('DOMAIN_NOT_ALLOWED');
    });

    it('should succeed when domain lock strict and origin matches', async () => {
      mockDb(buildMockApiKey({
        domainLockMode: DOMAIN_LOCK_MODES.STRICT,
        allowedDomains: ['allowed.com'],
      }));
      const result = await service.validate(RAW_KEY, 'https://allowed.com', undefined, undefined);
      expect(result.valid).toBe(true);
    });

    it('should return invalid when IP whitelist STRICT and IP not in list', async () => {
      mockDb(buildMockApiKey({
        ipWhitelistMode: IP_WHITELIST_MODES.STRICT,
        allowedIps: ['10.0.0.1'],
      }));
      const result = await service.validate(RAW_KEY, undefined, undefined, '192.168.0.1');
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('IP_NOT_WHITELISTED');
    });

    it('should allow when IP is within CIDR range', async () => {
      mockDb(buildMockApiKey({
        ipWhitelistMode: IP_WHITELIST_MODES.STRICT,
        allowedIps: ['192.168.1.0/24'],
      }));
      const result = await service.validate(RAW_KEY, undefined, undefined, '192.168.1.100');
      expect(result.valid).toBe(true);
    });

    it('should block when IP is outside CIDR range', async () => {
      mockDb(buildMockApiKey({
        ipWhitelistMode: IP_WHITELIST_MODES.STRICT,
        allowedIps: ['192.168.1.0/24'],
      }));
      const result = await service.validate(RAW_KEY, undefined, undefined, '192.168.2.1');
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('IP_NOT_WHITELISTED');
    });
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', async () => {
      (mockRedisClient.incr as jest.Mock).mockResolvedValueOnce(5);
      const result = await service.checkRateLimit('tenant-1', 60);
      expect(result.exceeded).toBe(false);
      expect(result.remaining).toBe(55);
      expect(result.limit).toBe(60);
    });

    it('should block requests over the limit', async () => {
      (mockRedisClient.incr as jest.Mock).mockResolvedValueOnce(61);
      const result = await service.checkRateLimit('tenant-1', 60);
      expect(result.exceeded).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('should set resetAt to a future epoch second', async () => {
      (mockRedisClient.incr as jest.Mock).mockResolvedValueOnce(1);
      const before = Math.floor(Date.now() / 1000);
      const result = await service.checkRateLimit('tenant-1', 60);
      expect(result.resetAt).toBeGreaterThan(before);
    });
  });
});

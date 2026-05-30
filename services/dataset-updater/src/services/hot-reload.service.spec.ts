import { HotReloadService } from './hot-reload.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DATASET_EVENTS, DATASET_REDIS_KEYS } from '../constants/dataset.constants';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

let tmpBase: string;

jest.mock('../constants/dataset.constants', () => {
  const original = jest.requireActual('../constants/dataset.constants') as Record<string, unknown>;
  return {
    ...original,
    DATASET_PATHS: {
      base: () => tmpBase,
      current: (type: string) => path.join(tmpBase, 'current', type),
    },
    DATASET_FILENAMES: {
      tor: 'tor-exit-nodes.txt',
      firehol: 'firehol_level1.netset',
      vpn: 'vpn-ips.txt',
    },
  };
});

describe('HotReloadService', () => {
  let service: HotReloadService;
  let eventEmitter: EventEmitter2;
  let mockRedis: {
    pipeline: jest.Mock;
    sismember: jest.Mock;
  };
  let mockPipeline: {
    del: jest.Mock;
    sadd: jest.Mock;
    exec: jest.Mock;
  };

  beforeEach(async () => {
    tmpBase = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'hot-reload-test-'));
    eventEmitter = new EventEmitter2();

    mockPipeline = {
      del: jest.fn().mockReturnThis(),
      sadd: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };

    mockRedis = {
      pipeline: jest.fn().mockReturnValue(mockPipeline),
      sismember: jest.fn().mockResolvedValue(0),
    };

    service = new HotReloadService(eventEmitter, mockRedis as never);
  });

  afterEach(async () => {
    await fs.promises.rm(tmpBase, { recursive: true, force: true });
  });

  it('should emit geolite_city reload event', async () => {
    const handler = jest.fn();
    eventEmitter.on(DATASET_EVENTS.RELOADED_GEOLITE_CITY, handler);

    await service.reload('geolite_city');
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ datasetType: 'geolite_city' }));
  });

  it('should emit tor reload event and load IPs to Redis', async () => {
    // Create test tor file
    const torDir = path.join(tmpBase, 'current', 'tor');
    await fs.promises.mkdir(torDir, { recursive: true });
    await fs.promises.writeFile(
      path.join(torDir, 'tor-exit-nodes.txt'),
      '1.2.3.4\n5.6.7.8\n# comment\n9.10.11.12',
    );

    const handler = jest.fn();
    eventEmitter.on(DATASET_EVENTS.RELOADED_TOR, handler);

    await service.reload('tor');

    expect(mockRedis.pipeline).toHaveBeenCalled();
    expect(mockPipeline.del).toHaveBeenCalledWith(DATASET_REDIS_KEYS.torIps);
    expect(mockPipeline.del).toHaveBeenCalledWith(`${DATASET_REDIS_KEYS.torIps}:cidr`);
    expect(mockPipeline.sadd).toHaveBeenCalled();
    expect(mockPipeline.exec).toHaveBeenCalled();
    expect(handler).toHaveBeenCalled();
  });

  it('should handle missing tor file gracefully', async () => {
    // No file created, should not throw
    await expect(service.reload('tor')).resolves.not.toThrow();
  });

  it('stores CIDR entries in dedicated CIDR Redis set', async () => {
    const torDir = path.join(tmpBase, 'current', 'tor');
    await fs.promises.mkdir(torDir, { recursive: true });
    await fs.promises.writeFile(
      path.join(torDir, 'tor-exit-nodes.txt'),
      '1.2.3.0/24\n9.9.9.9',
    );

    await service.reload('tor');

    expect(mockPipeline.sadd).toHaveBeenCalledWith(`${DATASET_REDIS_KEYS.torIps}:cidr`, '1.2.3.0/24');
    expect(mockPipeline.sadd).toHaveBeenCalledWith(DATASET_REDIS_KEYS.torIps, '9.9.9.9');
  });

  it('should check IP membership in Redis set', async () => {
    mockRedis.sismember.mockResolvedValueOnce(1);
    const result = await service.isIpInSet(DATASET_REDIS_KEYS.torIps, '1.2.3.4');
    expect(result).toBe(true);
  });

  it('should return false on Redis error', async () => {
    mockRedis.sismember.mockRejectedValueOnce(new Error('Redis error'));
    const result = await service.isIpInSet(DATASET_REDIS_KEYS.torIps, '1.2.3.4');
    expect(result).toBe(false);
  });
});

import { RollbackService } from './rollback.service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Override DATASET_BASE_PATH for tests
let tmpBase: string;

jest.mock('../constants/dataset.constants', () => {
  const original = jest.requireActual('../constants/dataset.constants') as Record<string, unknown>;
  return {
    ...original,
    DATASET_PATHS: {
      base: () => tmpBase,
      current: (type: string) => path.join(tmpBase, 'current', type),
      staging: () => path.join(tmpBase, 'staging'),
      backup: (type: string, version: string) => path.join(tmpBase, 'backup', type, version),
      temp: () => path.join(tmpBase, 'temp'),
    },
    DATASET_FILENAMES: {
      tor: 'tor-exit-nodes.txt',
      geolite_city: 'GeoLite2-City.mmdb',
    },
    MAX_BACKUP_VERSIONS: 3,
  };
});

describe('RollbackService', () => {
  let service: RollbackService;

  beforeEach(async () => {
    tmpBase = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'rollback-test-'));
    service = new RollbackService();
  });

  afterEach(async () => {
    await fs.promises.rm(tmpBase, { recursive: true, force: true });
  });

  describe('backupCurrent', () => {
    it('should return false when no current file exists', async () => {
      const result = await service.backupCurrent('tor', '2024-01-01');
      expect(result).toBe(false);
    });

    it('should backup existing file', async () => {
      const currentDir = path.join(tmpBase, 'current', 'tor');
      await fs.promises.mkdir(currentDir, { recursive: true });
      await fs.promises.writeFile(path.join(currentDir, 'tor-exit-nodes.txt'), '1.2.3.4\n5.6.7.8');

      const result = await service.backupCurrent('tor', '2024-01-01');
      expect(result).toBe(true);

      const backupFile = path.join(tmpBase, 'backup', 'tor', '2024-01-01', 'tor-exit-nodes.txt');
      expect(fs.existsSync(backupFile)).toBe(true);
    });

    it('should return false for unknown dataset type', async () => {
      const result = await service.backupCurrent('unknown_type', '2024-01-01');
      expect(result).toBe(false);
    });
  });

  describe('rollback', () => {
    it('should restore file from backup', async () => {
      const backupDir = path.join(tmpBase, 'backup', 'tor', '2024-01-01');
      await fs.promises.mkdir(backupDir, { recursive: true });
      await fs.promises.writeFile(path.join(backupDir, 'tor-exit-nodes.txt'), 'backup-content');

      const currentDir = path.join(tmpBase, 'current', 'tor');
      await fs.promises.mkdir(currentDir, { recursive: true });

      const result = await service.rollback('tor', '2024-01-01');
      expect(result).toBe(true);

      const content = await fs.promises.readFile(
        path.join(currentDir, 'tor-exit-nodes.txt'),
        'utf-8',
      );
      expect(content).toBe('backup-content');
    });

    it('should return false when backup not found', async () => {
      const result = await service.rollback('tor', 'nonexistent-version');
      expect(result).toBe(false);
    });
  });

  describe('atomicSwap', () => {
    it('should copy staging file to target', async () => {
      const staging = path.join(tmpBase, 'staging.txt');
      await fs.promises.writeFile(staging, 'new-content');

      const targetDir = path.join(tmpBase, 'target-dir');
      await fs.promises.mkdir(targetDir, { recursive: true });
      const target = path.join(targetDir, 'file.txt');

      await service.atomicSwap(staging, target);

      expect(fs.existsSync(target)).toBe(true);
      expect(await fs.promises.readFile(target, 'utf-8')).toBe('new-content');
    });
  });

  describe('getLatestBackupVersion', () => {
    it('should return null when no backups exist', async () => {
      const result = await service.getLatestBackupVersion('tor');
      expect(result).toBeNull();
    });

    it('should return latest version sorted lexicographically', async () => {
      for (const v of ['2024-01-01', '2024-01-03', '2024-01-02']) {
        const dir = path.join(tmpBase, 'backup', 'tor', v);
        await fs.promises.mkdir(dir, { recursive: true });
        await fs.promises.writeFile(path.join(dir, 'tor-exit-nodes.txt'), v);
      }

      const result = await service.getLatestBackupVersion('tor');
      expect(result).toBe('2024-01-03');
    });
  });
});

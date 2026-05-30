import { DatasetBootstrapService } from './bootstrap.service';
import { DatasetType } from '../constants/dataset.constants';

describe('DatasetBootstrapService', () => {
  it('preloads existing threat-intel files and queues missing datasets', async () => {
    const hotReload = { reload: jest.fn().mockResolvedValue(undefined) };
    const registry = {
      getOne: jest
        .fn()
        .mockResolvedValueOnce({ lastUpdatedAt: new Date(), status: 'ACTIVE' }) // geolite_city
        .mockResolvedValueOnce({ lastUpdatedAt: new Date(), status: 'ACTIVE' }) // geolite_asn
        .mockResolvedValueOnce(null) // tor
        .mockResolvedValueOnce({ lastUpdatedAt: null, status: 'ACTIVE' }) // firehol
        .mockResolvedValueOnce({ lastUpdatedAt: new Date(), status: 'ACTIVE' }), // vpn
    };
    const scheduler = { triggerNow: jest.fn().mockResolvedValue('job-1') };
    const validator = {
      fileExists: jest
        .fn()
        .mockImplementation((type: string) => type === DatasetType.TOR || type === DatasetType.VPN),
    };

    const service = new DatasetBootstrapService(
      hotReload as never,
      registry as never,
      scheduler as never,
      validator as never,
    );

    await service.onModuleInit();

    expect(hotReload.reload).toHaveBeenCalledWith(DatasetType.TOR);
    expect(hotReload.reload).toHaveBeenCalledWith(DatasetType.VPN);
    expect(scheduler.triggerNow).toHaveBeenCalledWith(DatasetType.TOR);
    expect(scheduler.triggerNow).toHaveBeenCalledWith(DatasetType.FIREHOL);
  });
});

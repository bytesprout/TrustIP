import { HostingDetectorService } from './hosting-detector.service';
import { ConnectionType } from '@trustip/geo-engine';

describe('HostingDetectorService', () => {
  let service: HostingDetectorService;

  beforeEach(() => {
    service = new HostingDetectorService();
  });

  it('returns true when connectionType is HOSTING', () => {
    expect(service.detect('Comcast', ConnectionType.HOSTING)).toBe(true);
  });

  it('returns true when ISP matches AWS pattern', () => {
    expect(service.detect('Amazon AWS', ConnectionType.RESIDENTIAL)).toBe(true);
  });

  it('returns true when ISP matches digitalocean pattern', () => {
    expect(service.detect('DigitalOcean LLC', ConnectionType.UNKNOWN)).toBe(true);
  });

  it('returns false for residential ISP with RESIDENTIAL connection type', () => {
    expect(service.detect('Comcast Cable', ConnectionType.RESIDENTIAL)).toBe(false);
  });

  it('returns false for unknown ISP with UNKNOWN connection type', () => {
    expect(service.detect('Some Local ISP', ConnectionType.UNKNOWN)).toBe(false);
  });

  it('returns true when ISP contains "datacenter"', () => {
    expect(service.detect('Global Datacenter LLC', undefined)).toBe(true);
  });

  it('returns true when ISP contains hosting keyword', () => {
    expect(service.detect('OVH Hosting SAS', ConnectionType.BUSINESS)).toBe(true);
  });
});

import { IspClassifierService } from './isp-classifier.service';
import { ConnectionType } from '../constants/geo.constants';

describe('IspClassifierService', () => {
  let service: IspClassifierService;

  beforeEach(() => {
    service = new IspClassifierService();
  });

  it('should classify AWS as HOSTING', () => {
    expect(service.classify('Amazon AWS')).toBe(ConnectionType.HOSTING);
    expect(service.classify('Amazon.com Inc.')).toBe(ConnectionType.HOSTING);
  });

  it('should classify DigitalOcean as HOSTING', () => {
    expect(service.classify('DigitalOcean LLC')).toBe(ConnectionType.HOSTING);
  });

  it('should classify Hetzner as HOSTING', () => {
    expect(service.classify('Hetzner Online GmbH')).toBe(ConnectionType.HOSTING);
  });

  it('should classify mobile carriers as MOBILE', () => {
    expect(service.classify('Reliance Jio Infocomm Ltd')).toBe(ConnectionType.MOBILE);
    expect(service.classify('Vodafone Mobile')).toBe(ConnectionType.MOBILE);
    expect(service.classify('T-Mobile USA')).toBe(ConnectionType.MOBILE);
  });

  it('should classify broadband ISPs as RESIDENTIAL', () => {
    expect(service.classify('Comcast Cable')).toBe(ConnectionType.RESIDENTIAL);
    expect(service.classify('Airtel Broadband')).toBe(ConnectionType.RESIDENTIAL);
  });

  it('should return UNKNOWN for unrecognized ISPs', () => {
    expect(service.classify('Unknown ISP XYZ')).toBe(ConnectionType.UNKNOWN);
    expect(service.classify('')).toBe(ConnectionType.UNKNOWN);
  });

  it('should be case insensitive', () => {
    expect(service.classify('AMAZON WEB SERVICES')).toBe(ConnectionType.HOSTING);
    expect(service.classify('reliance jio')).toBe(ConnectionType.MOBILE);
  });
});

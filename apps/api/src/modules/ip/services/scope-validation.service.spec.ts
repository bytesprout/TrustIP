import { ScopeValidationService } from './scope-validation.service';
import { API_SCOPES } from '../constants/ip.constants';

describe('ScopeValidationService', () => {
  let service: ScopeValidationService;

  beforeEach(() => {
    service = new ScopeValidationService();
  });

  describe('hasScope', () => {
    it('should return true when scope is present', () => {
      expect(service.hasScope([API_SCOPES.BASIC_LOOKUP], API_SCOPES.BASIC_LOOKUP)).toBe(true);
    });

    it('should return false when scope is absent', () => {
      expect(service.hasScope([API_SCOPES.BASIC_LOOKUP], API_SCOPES.INTELLIGENCE_LOOKUP)).toBe(false);
    });

    it('should return false for empty scopes array', () => {
      expect(service.hasScope([], API_SCOPES.BASIC_LOOKUP)).toBe(false);
    });
  });

  describe('hasAllScopes', () => {
    it('should return true when all required scopes are present', () => {
      const scopes = [API_SCOPES.BASIC_LOOKUP, API_SCOPES.INTELLIGENCE_LOOKUP];
      expect(service.hasAllScopes(scopes, [API_SCOPES.BASIC_LOOKUP, API_SCOPES.INTELLIGENCE_LOOKUP])).toBe(true);
    });

    it('should return false when one required scope is missing', () => {
      const scopes = [API_SCOPES.BASIC_LOOKUP];
      expect(service.hasAllScopes(scopes, [API_SCOPES.BASIC_LOOKUP, API_SCOPES.INTELLIGENCE_LOOKUP])).toBe(false);
    });

    it('should return true for empty required scopes array', () => {
      expect(service.hasAllScopes([API_SCOPES.BASIC_LOOKUP], [])).toBe(true);
    });
  });

  describe('hasAnyScope', () => {
    it('should return true when at least one scope matches', () => {
      expect(
        service.hasAnyScope([API_SCOPES.BASIC_LOOKUP], [API_SCOPES.BASIC_LOOKUP, API_SCOPES.TRUST_LOOKUP]),
      ).toBe(true);
    });

    it('should return false when no scopes match', () => {
      expect(
        service.hasAnyScope([API_SCOPES.ADMIN_LOOKUP], [API_SCOPES.BASIC_LOOKUP, API_SCOPES.TRUST_LOOKUP]),
      ).toBe(false);
    });
  });
});

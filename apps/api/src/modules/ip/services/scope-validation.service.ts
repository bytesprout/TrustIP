import { Injectable } from '@nestjs/common';
import type { ApiScope } from '../constants/ip.constants';

@Injectable()
export class ScopeValidationService {
  /** Check if the API key scopes satisfy the required scope */
  hasScope(keyScopes: string[], requiredScope: ApiScope | string): boolean {
    return keyScopes.includes(requiredScope);
  }

  /** Check if the API key has all listed scopes */
  hasAllScopes(keyScopes: string[], requiredScopes: string[]): boolean {
    return requiredScopes.every((s) => keyScopes.includes(s));
  }

  /** Check if the API key has at least one of the listed scopes */
  hasAnyScope(keyScopes: string[], scopes: string[]): boolean {
    return scopes.some((s) => keyScopes.includes(s));
  }
}

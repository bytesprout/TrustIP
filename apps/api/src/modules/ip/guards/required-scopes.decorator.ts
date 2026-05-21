import { SetMetadata } from '@nestjs/common';
import { REQUIRED_SCOPES_KEY } from '../constants/ip.constants';

export const RequiredScopes = (...scopes: string[]) =>
  SetMetadata(REQUIRED_SCOPES_KEY, scopes);

import { BadRequestException } from '@nestjs/common';
import { SecuritySanitizationMiddleware } from './security-sanitization.middleware';

describe('SecuritySanitizationMiddleware', () => {
  const middleware = new SecuritySanitizationMiddleware();

  it('should pass safe payload', () => {
    const next = jest.fn();
    middleware.use(
      {
        query: { ip: '8.8.8.8' },
        body: { email: 'admin@trustip.io' },
      } as never,
      {} as never,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should block malicious payload', () => {
    expect(() => {
      middleware.use(
        {
          query: { q: 'union select * from users' },
          body: {},
        } as never,
        {} as never,
        jest.fn(),
      );
    }).toThrow(BadRequestException);
  });
});

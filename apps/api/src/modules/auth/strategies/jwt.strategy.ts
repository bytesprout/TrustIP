import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '../../../config/config.service';
import { PrismaService } from '../../../prisma/prisma.service';
import type { JwtPayload } from '@trustip/shared-types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, tenantId: true, isActive: true },
    });

    if (!user?.isActive) {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      iat: payload.iat,
      exp: payload.exp,
    } as JwtPayload;
  }
}

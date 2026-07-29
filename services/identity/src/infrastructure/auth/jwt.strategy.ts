import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: fs.readFileSync(path.join(process.cwd(), 'keys', 'public.pem'), 'utf8'),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    if (!payload.sub || !payload.tid) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return {
      userId: payload.sub,
      tenantId: payload.tid,
      sessionId: payload.sid,
      email: payload.email,
    };
  }
}

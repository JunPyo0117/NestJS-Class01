import {
  BadRequestException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { envVariableKeys } from 'src/common/const/env.const';

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    // basic token
    // bearer token
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      next();
      return;
    }

    const token = this.validateBearerToken(authHeader);

    try {
      const decodedPayload = this.jwtService.decode(token);

      if (
        decodedPayload.type !== 'refresh' &&
        decodedPayload.type !== 'access'
      ) {
        throw new BadRequestException('Invalid token');
      }

      const secretKey = this.configService.get<string>(
        decodedPayload.type === 'refresh'
          ? envVariableKeys.refreshTokenSecret
          : envVariableKeys.accessTokenSecret,
      )!;
      const payload = await this.jwtService.verifyAsync(token, {
        secret: secretKey,
      });

      req.user = payload;
      next();
    } catch (e) {
      throw new UnauthorizedException('토큰이 만료되었습니다');
    }
  }

  validateBearerToken(rawToken: string) {
    const bearerSplit = rawToken.split(' ');

    if (bearerSplit.length !== 2) {
      throw new BadRequestException('Invalid token');
    }

    const [bearer, token] = bearerSplit;

    if (bearer.toLocaleLowerCase() !== 'bearer') {
      throw new BadRequestException('Invalid token');
    }

    return token;
  }
}

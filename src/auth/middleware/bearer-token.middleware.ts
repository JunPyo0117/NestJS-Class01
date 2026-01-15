import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
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
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
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

    const tokenKey = `TOKEN_${token}`;

    const blockToken = await this.cacheManager.get(`BLOCK_TOKEN_${token}`);

    if (blockToken) {
      throw new UnauthorizedException('토큰이 만료되었습니다');
    }

    const cachePayload = await this.cacheManager.get(tokenKey);

    if (cachePayload) {
      console.log('cache 토큰 사용');
      req.user = cachePayload;

      return next();
    }

    const decodedPayload = this.jwtService.decode(token);

    if (decodedPayload.type !== 'refresh' && decodedPayload.type !== 'access') {
      throw new BadRequestException('Invalid token');
    }

    try {
      const secretKey = this.configService.get<string>(
        decodedPayload.type === 'refresh'
          ? envVariableKeys.refreshTokenSecret
          : envVariableKeys.accessTokenSecret,
      )!;
      const payload = await this.jwtService.verifyAsync(token, {
        secret: secretKey,
      });

      // payload['exp'] 토큰 만료 시간
      const expiryDate = +new Date(payload['exp'] * 1000);
      const now = +new Date();

      const diffrenceInSeconds = (expiryDate - now) / 1000;

      await this.cacheManager.set(
        tokenKey,
        payload,
        Math.max((diffrenceInSeconds - 30) * 1000, 1),
      );

      req.user = payload;
      next();
    } catch (e) {
      if (e.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('토큰이 만료되었습니다');
      }
      next();
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

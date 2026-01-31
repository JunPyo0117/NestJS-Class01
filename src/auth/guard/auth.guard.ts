import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Reflector } from '@nestjs/core';
import { Public } from '../decorator/public.decorator';
import { REFRESH_TOKEN_ONLY_KEY } from '../decorator/refresh-token-only.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // 공개 여부 확인
    const isPublic = this.reflector.get(Public, context.getHandler());

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Refresh Token 전용 라우트 (예: POST /auth/token/access) → type === 'refresh' 허용
    const isRefreshTokenOnly = this.reflector.get<boolean>(
      REFRESH_TOKEN_ONLY_KEY,
      context.getHandler(),
    );
    if (isRefreshTokenOnly) {
      if (!request.user || request.user.type !== 'refresh') {
        throw new UnauthorizedException('유효한 Refresh Token이 필요합니다.');
      }
      return true;
    }

    // 그 외 라우트는 Access Token만 허용
    if (!request.user || request.user.type !== 'access') {
      throw new UnauthorizedException('유효한 Access Token이 필요합니다.');
    }

    return true;
  }
}

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Reflector } from '@nestjs/core';
import { Public } from '../decorator/public.decorator';
import { RefreshTokenOnly } from '../decorator/refresh-token-only.decorator';

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
    const isRefreshTokenOnly = this.reflector.get(
      RefreshTokenOnly,
      context.getHandler(),
    );
    if (isRefreshTokenOnly) {
      return !!request.user && request.user.type === 'refresh';
    }

    // 그 외 라우트는 Access Token만 허용
    if (!request.user || request.user.type !== 'access') {
      return false;
    }

    return true;
  }
}

import { Reflector } from '@nestjs/core';

/** 이 라우트는 Refresh Token만 허용 (Access Token 불가). POST /auth/token/access 등 */
export const RefreshTokenOnly = Reflector.createDecorator();

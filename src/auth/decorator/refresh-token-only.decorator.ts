import { SetMetadata } from '@nestjs/common';

export const REFRESH_TOKEN_ONLY_KEY = 'refreshTokenOnly';

/** 이 라우트는 Refresh Token만 허용 (Access Token 불가). POST /auth/token/access 등 */
export const RefreshTokenOnly = () => SetMetadata(REFRESH_TOKEN_ONLY_KEY, true);

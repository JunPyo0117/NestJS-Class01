import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './strategy/local.strategy';
import { JwtAuthGuard } from './strategy/jwt.strategy';
import { Public } from './decorator/public.decorator';
import {
  ApiBasicAuth,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Authorization } from './decorator/authorization.decorator';

@Controller('auth')
@ApiBearerAuth()
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiBasicAuth()
  @Post('register')
  @ApiOperation({ description: '사용자 회원가입 (Basic Auth). body.role: 0=admin, 1=paidUser, 2=user' })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: 409, description: '이미 존재하는 이메일' })
  // authorization: Basic <token>, body: { role?: number }
  registerUser(
    @Authorization() token: string,
    @Body() body?: { role?: number },
  ) {
    return this.authService.register(token, body?.role);
  }

  @Public()
  @ApiBasicAuth()
  @Post('login')
  @ApiOperation({ description: '사용자 로그인 (Basic Auth)' })
  @ApiResponse({
    status: 201,
    description: '로그인 성공, Access Token과 Refresh Token 반환',
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  @ApiResponse({
    status: 401,
    description: '이메일 또는 비밀번호가 일치하지 않음',
  })
  loginUser(@Authorization() token: string) {
    return this.authService.login(token);
  }

  @Post('token/block')
  @ApiOperation({ description: '토큰 블랙리스트 등록 (로그아웃)' })
  @ApiResponse({ status: 201, description: '토큰 블랙리스트 등록 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  blockToken(@Body('token') token: string) {
    return this.authService.tokenBlock(token);
  }

  @Post('token/access')
  @ApiOperation({ description: 'Refresh Token으로 새로운 Access Token 발급' })
  @ApiResponse({ status: 201, description: 'Access Token 발급 성공' })
  @ApiResponse({ status: 401, description: '유효하지 않은 Refresh Token' })
  async rotateAccessToken(@Request() req: any) {
    return {
      accessToken: await this.authService.issueToken(req.user, false),
    };
  }

  @UseGuards(LocalAuthGuard)
  @Post('login/passport')
  @ApiOperation({ description: 'Passport 전략을 사용한 로그인 (테스트용)' })
  @ApiResponse({
    status: 201,
    description: '로그인 성공, Access Token과 Refresh Token 반환',
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async loginUserPassport(@Request() req) {
    return {
      refreshToken: await this.authService.issueToken(req.user, true),
      accessToken: await this.authService.issueToken(req.user, false),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('private')
  @ApiOperation({ description: 'JWT 전략을 사용한 인증 테스트' })
  @ApiResponse({ status: 200, description: '인증 성공, 사용자 정보 반환' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  private(@Request() req) {
    return req.user;
  }
}

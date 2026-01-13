import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

export class LocalAuthGuard extends AuthGuard('local') {}

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  /**
   * LocalStrategy 클래스의 validate 메서드
   *
   * validate : username, password를 받아서 user 객체를 반환
   * return -> Request()
   */
  async validate(email: string, password: string) {
    const user = await this.authService.authenticate(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    return user;
  }
}

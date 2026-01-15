import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Reflector } from '@nestjs/core';
import { RBAC } from '../decorator/rbac.decorator';
import { Role } from 'src/user/entity/user.entity';

@Injectable()
export class RBACGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const rbac = this.reflector.get<Role>(RBAC, context.getHandler());

    // Role Enum에 해당되는 값이 데코레이터에 들어갔는지 확인하기
    if (!Object.values(Role).includes(rbac)) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    return user.role <= rbac;
  }
}

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Reflector } from '@nestjs/core';
import { RBAC } from '../decorator/rbac.decorator';
import { Role } from 'src/user/entity/user.entity';
// import { Role } from '@prisma/client';

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
      throw new ForbiddenException('사용자 정보를 찾을 수 없습니다.');
    }

    if (!user.role) {
      throw new ForbiddenException('사용자 권한 정보가 없습니다.');
    }

    const roleAccessLevel = {
      [Role.admin]: 0,
      [Role.paidUser]: 1,
      [Role.user]: 2,
    };

    const userLevel = roleAccessLevel[user.role];
    const requiredLevel = roleAccessLevel[rbac];

    if (userLevel === undefined) {
      throw new ForbiddenException(`유효하지 않은 사용자 권한: ${user.role}`);
    }

    if (userLevel > requiredLevel) {
      throw new ForbiddenException(
        `권한이 부족합니다. 필요한 권한: ${rbac}, 현재 권한: ${user.role}`,
      );
    }

    // return user.role <= rbac;
    return roleAccessLevel[user.role] <= roleAccessLevel[rbac];
  }
}

import { Reflector } from '@nestjs/core';
import { Role } from 'src/user/entity/user.entity';
// import { Role } from '@prisma/client';

export const RBAC = Reflector.createDecorator<Role>();

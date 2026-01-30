import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Role } from '../entity/user.entity';

export class CreateUserDto {
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  @ApiProperty({
    description: '사용자 이메일',
    example: 'test@test.com',
  })
  email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '사용자 비밀번호',
    example: 'password123',
  })
  password: string;

  @IsOptional()
  @IsEnum(Role)
  @ApiProperty({
    description: '역할 (0: admin, 1: paidUser, 2: user). 미입력 시 user',
    example: 0,
    required: false,
  })
  role?: Role;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

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
  password: string;
}

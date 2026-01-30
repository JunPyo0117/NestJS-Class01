import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class CreateDirectorDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '감독 이름',
    example: '봉준호',
  })
  name: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: '감독 생년월일',
    example: '1970-07-30',
  })
  dob: Date;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '감독 국적',
    example: 'South Korea',
  })
  nationality: string;
}

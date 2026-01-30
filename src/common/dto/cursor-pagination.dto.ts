import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class CursorPaginationDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: '페이지네이션 커서',
    example: '',
    required: false,
  })
  // id_82, likeCount =_20
  cursor?: string;

  @IsArray()
  @IsString({
    each: true,
  })
  @IsOptional()
  @ApiProperty({
    description: '내림차순, 오름차순 정렬',
    example: ['id_DESC'],
  })
  @Transform(({ value }) => {
    if (value === undefined || value === null) return ['id_DESC'];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value.includes(',') ? value.split(',').map((s) => s.trim()) : [value];
    }
    return [value];
  })
  // id_ASC id_DESC
  // [id_DESC, likeCount_ASC]
  order: string[] = ['id_DESC'];

  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === '' ? 2 : Number(value)))
  @Type(() => Number)
  @IsInt()
  @ApiProperty({
    description: '페이지네이션 페이지 당 아이템 수',
    example: 2,
  })
  take: number = 2;
}

import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class CursorPaginationDto {
  @IsString()
  @IsOptional()
  // id_82, likeCount =_20
  cursor?: string;

  @IsArray()
  @IsString({
    each: true,
  })
  @IsOptional()
  // id_ASC id_DESC
  // [id_DESC, likeCount_ASC]
  order: string[] = ['id_DESC'];

  @IsOptional()
  @IsInt()
  take: number = 5;
}

import { IsInt, IsOptional } from 'class-validator';

export class PagePagenationDto {
  @IsOptional()
  @IsInt()
  page: number = 1;

  @IsOptional()
  @IsInt()
  take: number = 5;
}

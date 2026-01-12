import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateGenreDto {
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  name?: string;
}

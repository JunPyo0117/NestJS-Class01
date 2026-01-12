import { IsNotEmpty, IsDefined } from 'class-validator';

export class CreateMovieDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  genre: string;

  // null || undefined 일 경우 에러 발생
  @IsDefined()
  test: string;
}

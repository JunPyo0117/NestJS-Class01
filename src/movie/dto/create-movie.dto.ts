import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '영화 제목',
    example: '더글로리',
  })
  title: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '영화 상세 내용',
    example: '한국 드라마 더글로리',
  })
  detail: string;

  @IsNotEmpty()
  @IsNumber()
  // @IsString()
  @Type(() => Number)
  // @Type(() => String)
  @ApiProperty({
    description: '감독 객체 ID',
    example: 1,
  })
  directorId: number;
  // directorId: string;

  @IsArray()
  // @IsString({ each: true })
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  // @Type(() => String)
  @ApiProperty({
    description: '장르 객체 ID 배열',
    example: [1, 2],
    type: [Number],
  })
  genreIds: number[];
  // genreIds: string[];

  @IsString()
  @ApiProperty({
    description: '영화 파일 이름',
    example: 'aaa-bbb-ccc-ddd.mp4',
  })
  movieFileName: string;
}

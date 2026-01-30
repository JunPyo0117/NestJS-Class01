import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { CursorPaginationDto } from 'src/common/dto/cursor-pagination.dto';

// page pagination
// export class GetMoviesDto extends PagePaginationDto {
//   @IsOptional()
//   @IsString()
//   title?: string;
// }

// cursor pagination
export class GetMoviesDto extends CursorPaginationDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '영화 제목',
    example: '',
    required: false,
  })
  title?: string;

  /** 프론트 캐시 무효화용 쿼리(_=timestamp). 검증만 통과하고 사용하지 않음 */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  _?: number;
}

import { IsOptional, IsString } from 'class-validator';
import { CursorPaginationDto } from 'src/common/dto/cursor-pagination.dto';
import { PagePagenationDto as PagePaginationDto } from 'src/common/dto/page-pagination.dto';

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
  title?: string;
}

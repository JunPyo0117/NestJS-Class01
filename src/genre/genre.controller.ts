import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseIntPipe,
} from '@nestjs/common';
import { GenreService } from './genre.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@Controller('genre')
@ApiBearerAuth()
@ApiTags('Genre')
// @UseInterceptors(ClassSerializerInterceptor)
export class GenreController {
  constructor(private readonly genreService: GenreService) {}

  @Post()
  @ApiOperation({ description: '새로운 장르 생성' })
  @ApiResponse({ status: 201, description: '장르 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  create(@Body() createGenreDto: CreateGenreDto) {
    return this.genreService.create(createGenreDto);
  }

  @Get()
  @ApiOperation({ description: '모든 장르 목록 조회' })
  @ApiResponse({ status: 200, description: '장르 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  findAll() {
    return this.genreService.findAll();
  }

  @Get(':id')
  @ApiOperation({ description: '특정 장르 정보 조회' })
  @ApiResponse({ status: 200, description: '장르 정보 조회 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 404, description: '장르를 찾을 수 없음' })
  // findOne(@Param('id', ParseIntPipe) id: string) {
  findOne(@Param('id') id: string) {
    // return this.genreService.findOne(+id);
    return this.genreService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ description: '장르 정보 수정' })
  @ApiResponse({ status: 200, description: '장르 정보 수정 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 404, description: '장르를 찾을 수 없음' })
  // update(
  //   @Param('id', ParseIntPipe) id: string,
  //   @Body() updateGenreDto: UpdateGenreDto,
  // ) {
  update(@Param('id') id: string, @Body() updateGenreDto: UpdateGenreDto) {
    // return this.genreService.update(+id, updateGenreDto);
    return this.genreService.update(id, updateGenreDto);
  }

  @Delete(':id')
  @ApiOperation({ description: '장르 삭제' })
  @ApiResponse({ status: 200, description: '장르 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 404, description: '장르를 찾을 수 없음' })
  // remove(@Param('id', ParseIntPipe) id: string) {
  remove(@Param('id') id: string) {
    // return this.genreService.remove(+id);
    return this.genreService.remove(id);
  }
}

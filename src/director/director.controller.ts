import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ClassSerializerInterceptor,
  UseInterceptors,
  ParseIntPipe,
} from '@nestjs/common';
import { DirectorService } from './director.service';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@Controller('director')
@ApiBearerAuth()
// @UseInterceptors(ClassSerializerInterceptor)
@ApiTags('Director')
export class DirectorController {
  constructor(private readonly directorService: DirectorService) {}

  @Get()
  @ApiOperation({ description: '모든 감독 목록 조회' })
  @ApiResponse({ status: 200, description: '감독 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  findAll() {
    return this.directorService.findAll();
  }

  @Get(':id')
  @ApiOperation({ description: '특정 감독 정보 조회' })
  @ApiResponse({ status: 200, description: '감독 정보 조회 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 404, description: '감독을 찾을 수 없음' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    // findOne(@Param('id') id: string) {
    return this.directorService.findOne(id);
    // return this.directorService.findOne(id);
  }

  @Post()
  @ApiOperation({ description: '새로운 감독 생성' })
  @ApiResponse({ status: 201, description: '감독 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  create(@Body() createDirectorDto: CreateDirectorDto) {
    return this.directorService.create(createDirectorDto);
  }

  @Patch(':id')
  @ApiOperation({ description: '감독 정보 수정' })
  @ApiResponse({ status: 200, description: '감독 정보 수정 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 404, description: '감독을 찾을 수 없음' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDirectorDto: UpdateDirectorDto,
  ) {
    // update(
    //   @Param('id') id: string,
    //   @Body() updateDirectorDto: UpdateDirectorDto,
    // ) {
    return this.directorService.update(id, updateDirectorDto);
    // return this.directorService.update(id, updateDirectorDto);
  }

  @Delete(':id')
  @ApiOperation({ description: '감독 삭제' })
  @ApiResponse({ status: 200, description: '감독 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 404, description: '감독을 찾을 수 없음' })
  remove(@Param('id', ParseIntPipe) id: number) {
    // remove(@Param('id') id: string) {
    return this.directorService.remove(id);
    // return this.directorService.remove(id);
  }
}

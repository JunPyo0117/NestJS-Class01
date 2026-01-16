import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/user/entity/user.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { UserId } from 'src/user/decorator/user-id.decorator';
import type { QueryRunner as QR } from 'typeorm';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import {
  CacheInterceptor as CI,
  CacheKey,
  CacheTTL,
} from '@nestjs/cache-manager';
import { Throttle } from 'src/common/decorator/throttle.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@Controller('movie')
@ApiBearerAuth()
@ApiTags('Movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  @Public()
  @Throttle({ count: 5, unit: 'minute', ttl: 60000 })
  // @UseInterceptors(CacheInterceptor) // 캐시 확인용
  @ApiOperation({ description: '[Movie]를 페이지네이션 하는 API' })
  @ApiResponse({ status: 200, description: '영화 목록 조회 성공' })
  @ApiResponse({
    status: 400,
    description: '페이지네이션 데이터를 잘못 입력 했을 때',
  })
  getMovies(@Query() dto: GetMoviesDto, @UserId() UserId?: number) {
    // title 쿼리의 타입이 string 타입인지?
    return this.movieService.findAll(dto, UserId);
  }

  // /movie/recent
  @Get('recent')
  @UseInterceptors(CI)
  @CacheKey('getMoviesRecent')
  @CacheTTL(3000)
  @ApiOperation({ description: '최근 생성된 영화 목록 조회 (캐싱 적용)' })
  @ApiResponse({ status: 200, description: '최근 영화 목록 조회 성공' })
  getMoviesRecent() {
    return this.movieService.findRecent();
  }

  // /movie/asdasd
  @Get(':id')
  @Public()
  @ApiOperation({ description: '특정 영화의 상세 정보 조회 (인증 불필요)' })
  @ApiResponse({ status: 200, description: '영화 상세 정보 조회 성공' })
  @ApiResponse({ status: 404, description: '영화를 찾을 수 없음' })
  getMovie(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.movieService.findOne(id);
  }

  @Post()
  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterceptor)
  @ApiOperation({ description: '새로운 영화 생성 (관리자 권한 필요)' })
  @ApiResponse({ status: 201, description: '영화 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 403, description: '관리자 권한 필요' })
  createMovie(
    @Body() body: CreateMovieDto,
    @QueryRunner() queryRunner: QR,
    @UserId() userId: number,
  ) {
    return this.movieService.create(body, queryRunner, userId);
  }

  @Patch(':id')
  @RBAC(Role.admin)
  @ApiOperation({ description: '영화 정보 수정 (관리자 권한 필요)' })
  @ApiResponse({ status: 200, description: '영화 정보 수정 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 403, description: '관리자 권한 필요' })
  @ApiResponse({ status: 404, description: '영화를 찾을 수 없음' })
  updateMovie(
    @Param('id', ParseIntPipe) id: string,
    @Body() body: UpdateMovieDto,
  ) {
    return this.movieService.update(+id, body);
  }

  @Delete(':id')
  @RBAC(Role.admin)
  @ApiOperation({ description: '영화 삭제 (관리자 권한 필요)' })
  @ApiResponse({ status: 200, description: '영화 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 403, description: '관리자 권한 필요' })
  @ApiResponse({ status: 404, description: '영화를 찾을 수 없음' })
  deleteMovie(@Param('id', ParseIntPipe) id: string) {
    return this.movieService.remove(+id);
  }

  @Post(':id/like')
  @ApiOperation({ description: '영화 좋아요 토글 (좋아요 추가/취소)' })
  @ApiResponse({ status: 201, description: '좋아요 처리 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 404, description: '영화를 찾을 수 없음' })
  createMovieLike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, true);
  }

  @Post(':id/dislike')
  @ApiOperation({ description: '영화 싫어요 토글 (싫어요 추가/취소)' })
  @ApiResponse({ status: 201, description: '싫어요 처리 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 404, description: '영화를 찾을 수 없음' })
  createMovieDislike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, false);
  }
}

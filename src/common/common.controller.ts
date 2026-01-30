import {
  BadGatewayException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CommonService } from './common.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Controller('common')
@ApiBearerAuth()
@ApiTags('Common')
export class CommonController {
  constructor(
    private readonly commonService: CommonService,
    @InjectQueue('thumbnail-generation')
    private readonly thumbnailQueue: Queue,
  ) {}
  @Post('video')
  @ApiOperation({
    description: '영화 비디오 파일 업로드 (MP4만 가능, 최대 10MB)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: '파일 업로드 성공' })
  @ApiResponse({
    status: 400,
    description: '파일 크기 초과 또는 잘못된 파일 형식',
  })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @UseInterceptors(
    FileInterceptor('video', {
      limits: {
        fileSize: 1024 * 1024 * 10, // 10MB
      },
      fileFilter: (req, file, callback) => {
        console.log(file);

        if (file.mimetype !== 'video/mp4') {
          return callback(
            new BadGatewayException('MP4 파일만 업로드 가능합니다.'),
            false,
          );
        }

        return callback(null, true); // true: 파일 허용, false: 파일 거절
      },
    }),
  )
  async createVideo(@UploadedFile() movie: Express.Multer.File) {
    if (!movie?.filename) {
      throw new BadGatewayException(
        '업로드된 파일이 없습니다. 필드명은 "video"이고, Content-Type은 multipart/form-data여야 합니다.',
      );
    }
    await this.thumbnailQueue.add('thumbnail', {
      videoId: movie.filename,
      videoPath: movie.path,
    });

    return {
      filename: movie.filename,
    };
  }

  @Post('presigned-url')
  @ApiOperation({
    description:
      'S3 업로드용 presigned URL 발급. 응답의 key로 업로드 후 /common/trigger-thumbnail 호출 시 썸네일 생성',
  })
  async createPresignedUrl() {
    return this.commonService.createPresignedUrl();
  }

  @Post('trigger-thumbnail')
  @ApiOperation({
    description:
      'presigned-url로 S3에 업로드한 영상의 썸네일 생성 트리거. body에 key(예: public/temp/xxx.mp4) 전달',
  })
  @ApiResponse({ status: 201, description: '썸네일 작업 큐에 등록됨' })
  async triggerThumbnail(@Body() body: { key: string }) {
    if (!body?.key || typeof body.key !== 'string') {
      throw new BadGatewayException('key (S3 객체 키)가 필요합니다.');
    }
    await this.thumbnailQueue.add('thumbnail', { s3Key: body.key });
    return { message: '썸네일 생성이 큐에 등록되었습니다.', key: body.key };
  }
}

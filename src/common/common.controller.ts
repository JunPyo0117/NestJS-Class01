import {
  BadGatewayException,
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
    await this.thumbnailQueue.add(
      'thumbnail',
      {
        videoId: movie.filename,
        videoPath: movie.path,
      },
      // {
      //   priority: 1,
      //   delay: 100,
      //   attempts: 3,
      //   lifo: true,
      //   removeOnComplete: true,
      //   removeOnFail: true,
      // },
    );

    return {
      filename: movie.filename,
    };
  }

  @Post('presigned-url')
  async createPresignedUrl() {
    return {
      url: await this.commonService.createPresignedUrl(),
    };
  }
}

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

@Controller('common')
@ApiBearerAuth()
@ApiTags('Common')
export class CommonController {
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
  createVideo(@UploadedFile() movie: Express.Multer.File) {
    return {
      filename: movie.filename,
    };
  }
}

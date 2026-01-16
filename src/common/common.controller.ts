import {
  BadGatewayException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';

@Controller('common')
@ApiBearerAuth()
@ApiTags('Common')
export class CommonController {
  @Post('video')
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

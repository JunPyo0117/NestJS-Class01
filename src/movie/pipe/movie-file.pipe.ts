import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { v4 } from 'uuid';
import { rename } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class MovieFilePipe implements PipeTransform<
  Express.Multer.File,
  Promise<Express.Multer.File>
> {
  constructor(
    private readonly options: {
      maxSize: number;
      minetype: string;
    },
  ) {}

  async transform(value: Express.Multer.File): Promise<Express.Multer.File> {
    if (!value) {
      throw new BadRequestException('movie file은 필수 입니다.');
    }

    const byteSize = this.options.maxSize * 1000000;

    if (value.size > byteSize) {
      throw new BadRequestException(
        `movie file은 ${this.options.maxSize}MB 이하여야 합니다.`,
      );
    }

    if (value.mimetype !== this.options.minetype) {
      throw new BadRequestException(
        `movie file은 ${this.options.minetype} 형식이어야 합니다.`,
      );
    }

    const split = value.originalname.split('.');
    let extension = 'mp4';

    if (split.length > 1) {
      extension = split[split.length - 1];
    }

    const filename = `${v4()}_${Date.now()}.${extension}`;
    const newPath = join(process.cwd(), 'public', 'movie', filename);

    await rename(value.path, newPath);

    return {
      ...value,
      path: newPath,
      filename,
    };
  }
}

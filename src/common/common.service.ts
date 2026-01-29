import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { PagePagenationDto } from './dto/page-pagination.dto';
import { CursorPaginationDto } from './dto/cursor-pagination.dto';
// import * as AWS from 'aws-sdk';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  GetObjectCommand,
  ObjectCannedACL,
  PutObjectCommand,
  S3,
} from '@aws-sdk/client-s3';
import { v4 as Uuid } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { envVariableKeys } from './const/env.const';
import { readFile } from 'fs/promises';

@Injectable()
export class CommonService {
  private s3: S3;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3({
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>(
          envVariableKeys.awsAccessKeyId,
        ),
        secretAccessKey: this.configService.getOrThrow<string>(
          envVariableKeys.awsSecretAccessKey,
        ),
      },

      region: this.configService.get<string>(envVariableKeys.awsRegion),
    });
  }

  async saveMovieToPermanentStorage(fileName: string) {
    try {
      const bucketName = this.configService.getOrThrow<string>(
        envVariableKeys.bucketName,
      );
      await this.s3.copyObject({
        Bucket: bucketName,
        CopySource: `${bucketName}/public/temp/${fileName}`,
        Key: `public/movie/${fileName}`,
        ACL: 'public-read',
      });

      await this.s3.deleteObject({
        Bucket: bucketName,
        Key: `public/temp/${fileName}`,
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('S3 영화 저장 실패');
    }
  }

  async createPresignedUrl(expiresIn = 3000) {
    const key = `public/temp/${Uuid()}.mp4`;
    const params = {
      Bucket: this.configService.get<string>(envVariableKeys.bucketName),
      Key: key,
      ACL: ObjectCannedACL.public_read,
    };

    try {
      const url = await getSignedUrl(this.s3, new PutObjectCommand(params), {
        expiresIn,
      });
      return { url, key };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('S3 presigned url 생성 실패');
    }
  }

  /** 로컬 썸네일 파일을 S3 public/thumbnail/ 에 업로드 */
  async uploadThumbnailToS3(localFilePath: string, thumbnailFileName: string) {
    const bucketName = this.configService.getOrThrow<string>(
      envVariableKeys.bucketName,
    );
    const key = `public/thumbnail/${thumbnailFileName}`;
    try {
      const body = await readFile(localFilePath);
      await this.s3.putObject({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: 'image/png',
        ACL: 'public-read',
      });
      return key;
    } catch (error) {
      console.error('썸네일 S3 업로드 실패', error);
      throw new InternalServerErrorException('썸네일 S3 업로드 실패');
    }
  }

  /** S3에서 비디오를 로컬 임시 파일로 다운로드 (워커용) */
  async downloadVideoFromS3ToTemp(s3Key: string): Promise<string> {
    const bucketName = this.configService.getOrThrow<string>(
      envVariableKeys.bucketName,
    );
    const { createWriteStream } = await import('fs');
    const { pipeline } = await import('stream/promises');
    const { tmpdir } = await import('os');
    const path = await import('path');
    const tmpPath = path.join(
      tmpdir(),
      `video_${Date.now()}_${path.basename(s3Key)}`,
    );
    const response = await this.s3.send(
      new GetObjectCommand({ Bucket: bucketName, Key: s3Key }),
    );
    const writeStream = createWriteStream(tmpPath);
    await pipeline(response.Body as NodeJS.ReadableStream, writeStream);
    return tmpPath;
  }

  applyPagiPaginationParamsToQb<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    dto: PagePagenationDto,
  ) {
    const { page, take } = dto;
    const skip = (page - 1) * take;
    qb.take(take);
    qb.skip(skip);
  }

  async applyCursorPaginationParamsToQb<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    dto: CursorPaginationDto,
  ) {
    let { cursor, take, order } = dto;

    if (cursor) {
      const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');

      /**
       * {
       * values : {
       * id: 27
       * },
       * order: ['id_DESC']
       * }
       */
      const cursorObj = JSON.parse(decodedCursor);

      order = cursorObj.order;

      const { values } = cursorObj;

      // WHERE (column1 > value1)
      // OR (column1 = value1 AND column2 < value2)
      // OR (column1 = value1 AND column2 = value2 AND column3 > value3)
      // (column1, column2, column3) > (value1, value2, value3)
      const colums = Object.keys(values);
      const comparisonOperator = order.some((o) => o.endsWith('DESC'))
        ? '<'
        : '>';

      const whereConditions = colums.map((c) => `${qb.alias}.${c}`).join(',');
      const whereParams = colums.map((c) => `:${c}`).join(',');

      qb.where(
        `(${whereConditions}) ${comparisonOperator} (${whereParams})`,
        values,
      );
    }

    // ["likeCount_ASC", "id_DESC"]
    for (let i = 0; i < order.length; i++) {
      const [column, direction] = order[i].split('_');

      if (direction !== 'ASC' && direction !== 'DESC') {
        throw new BadRequestException(
          'Order는 ASC 또는 DESC 형식이어야 합니다.',
        );
      }

      if (i === 0) {
        qb.orderBy(`${qb.alias}.${column}`, direction);
      } else {
        qb.addOrderBy(`${qb.alias}.${column}`, direction);
      }
    }

    // if (id) {
    //   const direction = order === 'ASC' ? '>' : '<'; // 오름차순인 경우 더 큰 값, 내림차순인 경우 더 작은 값
    //   qb.where(`${qb.alias}.id ${direction} :id`, { id });
    // }

    // qb.orderBy(`${qb.alias}.id`, order);

    qb.take(take);

    const results = await qb.getMany();

    const nextCursor = this.generateNextCursor(results, order);
    return {
      qb,
      nextCursor,
    };
  }

  generateNextCursor<T>(results: T[], order: string[]): string | null {
    if (results.length === 0) {
      return null;
    }

    /**
     * {
     * values : {
     * id: 27
     * },
     * order: ['id_DESC']
     * }
     */
    const lastItem = results[results.length - 1];

    const values = {};

    order.forEach((columnOrder) => {
      const [column] = columnOrder.split('_');
      values[column] = lastItem[column];
    });

    const cursorObj = { values, order };
    const nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString(
      'base64',
    );

    return nextCursor;
  }
}

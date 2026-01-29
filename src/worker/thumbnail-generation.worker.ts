import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { spawn } from 'child_process';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { cwd } from 'process';
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { CommonService } from '../common/common.service';

const THUMBNAIL_TIMEOUT_MS = 30_000; // 30초

@Processor('thumbnail-generation')
export class ThumbnailGenerationProcess extends WorkerHost {
  constructor(private readonly commonService: CommonService) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { videoPath, videoId, s3Key } = job.data;

    let localVideoPath: string;
    let thumbnailFileName: string;
    let tempVideoPath: string | null = null;

    if (s3Key) {
      // presigned-url로 S3에 올린 경우: S3에서 다운로드 후 썸네일 생성
      console.log(`S3 영상 썸네일 생성 중... key: ${s3Key}`);
      tempVideoPath = await this.commonService.downloadVideoFromS3ToTemp(s3Key);
      localVideoPath = tempVideoPath;
      const baseName =
        s3Key
          .replace(/\.mp4$/i, '')
          .split('/')
          .pop() || 'thumbnail';
      thumbnailFileName = `${baseName}.png`;
    } else if (videoPath && videoId) {
      // POST /common/video로 서버에 올린 경우
      localVideoPath = videoPath;
      thumbnailFileName = videoId.replace(/\.mp4$/i, '.png');
    } else {
      throw new Error('job.data에 videoPath+videoId 또는 s3Key가 필요합니다.');
    }

    console.log(`영상 트랜스코딩중... path: ${localVideoPath}`);

    if (!existsSync(localVideoPath)) {
      throw new Error(`영상 파일 없음: ${localVideoPath}`);
    }

    const outputDirectory = join(cwd(), 'public', 'thumbnail');
    if (!existsSync(outputDirectory)) {
      mkdirSync(outputDirectory, { recursive: true });
      console.log(`썸네일 출력 폴더 생성: ${outputDirectory}`);
    }

    const outputPath = join(outputDirectory, thumbnailFileName);

    await Promise.race([
      new Promise<void>((resolve, reject) => {
        const ffmpegPath = ffmpegInstaller.path;
        const ffmpeg = spawn(ffmpegPath, [
          '-ss',
          '0',
          '-i',
          localVideoPath,
          '-vframes',
          '1',
          '-f',
          'image2',
          '-y',
          outputPath,
        ]);

        let stderr = '';
        ffmpeg.stderr.on('data', (chunk) => {
          stderr += chunk.toString();
        });

        ffmpeg.on('close', (code) => {
          if (code === 0) {
            console.log(`썸네일 생성 완료! ${thumbnailFileName}`);
            resolve();
          } else {
            console.error(`썸네일 생성 실패! ${thumbnailFileName}`, stderr);
            reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(-500)}`));
          }
        });

        ffmpeg.on('error', (error) => {
          console.error(`썸네일 생성 실패! ${thumbnailFileName}`, error);
          reject(error);
        });
      }),
      new Promise<void>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `썸네일 생성 타임아웃 (${THUMBNAIL_TIMEOUT_MS / 1000}초)`,
              ),
            ),
          THUMBNAIL_TIMEOUT_MS,
        ),
      ),
    ]);

    // 썸네일을 S3에 업로드
    const s3KeyUploaded = await this.commonService.uploadThumbnailToS3(
      outputPath,
      thumbnailFileName,
    );
    console.log(`썸네일 S3 업로드 완료: ${s3KeyUploaded}`);

    // S3에서 다운로드한 임시 비디오 파일 삭제
    if (tempVideoPath && existsSync(tempVideoPath)) {
      try {
        unlinkSync(tempVideoPath);
      } catch (e) {
        console.warn('임시 비디오 파일 삭제 실패:', tempVideoPath, e);
      }
    }
  }
}

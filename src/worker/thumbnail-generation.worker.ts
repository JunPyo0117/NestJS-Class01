import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { cwd } from 'process';
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

const THUMBNAIL_TIMEOUT_MS = 30_000; // 30초

@Processor('thumbnail-generation')
export class ThumbnailGenerationProcess extends WorkerHost {
  async process(job: Job): Promise<void> {
    const { videoPath, videoId } = job.data;

    console.log(`영상 트랜스코딩중... ID: ${videoId}, path: ${videoPath}`);

    if (!existsSync(videoPath)) {
      throw new Error(`영상 파일 없음: ${videoPath}`);
    }

    const outputDirectory = join(cwd(), 'public', 'thumbnail');
    if (!existsSync(outputDirectory)) {
      mkdirSync(outputDirectory, { recursive: true });
      console.log(`썸네일 출력 폴더 생성: ${outputDirectory}`);
    }

    const outputPath = join(outputDirectory, `${videoId}.png`);

    await Promise.race([
      new Promise<void>((resolve, reject) => {
        // -ss 0: 0초 지점 (입력 앞에 두면 빠른 seek)
        // -i: 입력, -vframes 1: 1프레임, -f image2: 이미지, -y: 덮어쓰기
        const ffmpegPath = ffmpegInstaller.path;
        const ffmpeg = spawn(ffmpegPath, [
          '-ss',
          '0',
          '-i',
          videoPath,
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
            console.log(`썸네일 생성 완료! ID: ${videoId}`);
            resolve();
          } else {
            console.error(`썸네일 생성 실패! ID: ${videoId}`, stderr);
            reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(-500)}`));
          }
        });

        ffmpeg.on('error', (error) => {
          console.error(`썸네일 생성 실패! ID: ${videoId}`, error);
          reject(error);
        });
      }),
      new Promise<void>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `썸네일 생성 타임아웃 (${THUMBNAIL_TIMEOUT_MS / 1000}초) ID: ${videoId}`,
              ),
            ),
          THUMBNAIL_TIMEOUT_MS,
        ),
      ),
    ]);
  }
}

import { Module } from '@nestjs/common';
import { ThumbnailGenerationProcess } from './thumbnail-generation.worker';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [ThumbnailGenerationProcess],
})
export class WorkerModule {}

import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { v4 } from 'uuid';
import { TaskService } from './task.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from 'src/movie/entity/movie.entity';
import { DefaultLogger } from './logger/default.logger';
import { BullModule } from '@nestjs/bullmq';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: join(process.cwd(), 'public', 'temp'),
        filename: (req, file, callback) => {
          const split = file.originalname.split('.');
          let extension = 'mp4';

          if (split.length > 1) {
            extension = split[split.length - 1];
          }

          callback(null, `${v4()}_${Date.now()}.${extension}`);
        },
      }),
    }),
    TypeOrmModule.forFeature([Movie]),
    BullModule.forRoot({
      connection: {
        host: 'redis-12299.c340.ap-northeast-2-1.ec2.cloud.redislabs.com',
        port: 12299,
        username: 'default',
        password: 'qIIpGPYrcEDz8JSEIGx1qr47N73zoCDO',
      },
    }),
    BullModule.registerQueue({
      name: 'thumbnail-generation',
    }),
  ],
  controllers: [CommonController],
  providers: [CommonService, TaskService, DefaultLogger, PrismaService],
  exports: [CommonService, TaskService, DefaultLogger, PrismaService],
})
export class CommonModule {}

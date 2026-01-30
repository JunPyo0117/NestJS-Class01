import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as ffmpeg from '@ffmpeg-installer/ffmpeg';
import * as ffmpegFluent from 'fluent-ffmpeg';
import * as ffprobe from 'ffprobe-static';
import session from 'express-session';
import { join } from 'path';

ffmpegFluent.setFfmpegPath(ffmpeg.path);
ffmpegFluent.setFfprobePath(ffprobe.path);

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['verbose'],
  });

  // EB 배포 시 API는 /api 아래로 (프론트 정적 서빙과 분리)
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Netflix API')
    .setDescription('Netflix API Description')
    .setVersion('1.0')
    .addBasicAuth()
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('doc', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.use(
    session({
      secret: 'secret',
      // resave: false, // 변경되지 않으면 저장 안 함
      // saveUninitialized: false, // 초기화되지 않은 세션 저장 안 함
    }),
  );

  // 프론트엔드(frontend/)가 다른 도메인에서 API 호출 시 필요
  app.enableCors({ origin: true, credentials: true });

  // EB 배포: 프론트 빌드(public/client)가 있으면 SPA 폴백 (API·정적 제외 경로 → index.html)
  if (process.env.ENV === 'prod') {
    const clientPath = join(process.cwd(), 'public', 'client', 'index.html');
    app.use((req, res, next) => {
      if (
        req.method === 'GET' &&
        !req.path.startsWith('/api') &&
        !req.path.startsWith('/socket.io') &&
        !req.path.startsWith('/public') &&
        !req.path.startsWith('/doc') &&
        !req.path.startsWith('/assets')
      ) {
        return res.sendFile(clientPath);
      }
      next();
    });
  }

  const isWorker = process.env.TYPE === 'worker';
  if (isWorker) {
    // 워커는 HTTP 서버 없이 BullMQ 프로세서만 실행 (같은 인스턴스에서 web이 8080 사용)
    await app.init();
    return app;
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

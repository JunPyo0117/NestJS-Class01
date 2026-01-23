import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as ffmpeg from '@ffmpeg-installer/ffmpeg';
import * as ffmpegFluent from 'fluent-ffmpeg';
import * as ffprobe from 'ffprobe-static';
import session from 'express-session';

ffmpegFluent.setFfmpegPath(ffmpeg.path);
ffmpegFluent.setFfprobePath(ffprobe.path);

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['verbose'],
  });
  // app.setGlobalPrefix('v1'); // v1/movies, v1/directors, v1/genres, v1/users, v1/auth 글로벌
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

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

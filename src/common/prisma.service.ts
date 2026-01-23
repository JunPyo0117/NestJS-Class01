import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { envVariableKeys } from './const/env.const';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {
    // Prisma 6에서는 환경 변수 DATABASE_URL을 사용
    const dbUrl = configService.get<string>(envVariableKeys.dbUrl);
    if (dbUrl) {
      process.env.DATABASE_URL = dbUrl;
    }
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }
}

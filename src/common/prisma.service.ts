import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { PrismaClient } from '@prisma/client';
// import { PrismaPg } from '@prisma/adapter-pg';
// import { Pool } from 'pg';
// import { envVariableKeys } from './const/env.const';

@Injectable()
//   extends PrismaClient
//   implements OnModuleInit, OnModuleDestroy
export class PrismaService {
  //   constructor(private readonly configService: ConfigService) {
  //     // Prisma 7에서는 adapter를 사용해야 함
  //     const dbUrl = configService.get<string>(envVariableKeys.dbUrl);
  //     const pool = new Pool({ connectionString: dbUrl });
  //     const adapter = new PrismaPg(pool);
  //     super({
  //       adapter,
  //     });
  //   }
  //   async onModuleInit() {
  //     await this.$connect();
  //   }
  //   async onModuleDestroy() {
  //     await this.$disconnect();
  //   }
}

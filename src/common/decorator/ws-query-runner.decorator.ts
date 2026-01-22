import {
  ExecutionContext,
  InternalServerErrorException,
  createParamDecorator,
} from '@nestjs/common';

export const WsQueryRunner = createParamDecorator(
  (data: any, context: ExecutionContext) => {
    const client = context.switchToWs().getClient();

    if (!client || !client.data.queryRunner) {
      throw new InternalServerErrorException(
        'Query runner를 찾을 수 없습니다.',
      );
    }
    return client.data.queryRunner;
  },
);

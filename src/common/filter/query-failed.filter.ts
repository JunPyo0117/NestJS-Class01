import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class QueryFailedFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = 400;

    let message = '쿼리 실패!!!';

    if (exception.message.includes('duplicate key value')) {
      message = '중복된 값이 있습니다!!!';
    }

    // 원인 파악용: 실제 DB 에러 (원인 해결 후 detail 제거 가능)
    const detail = exception.message;
    console.error('[QueryFailed]', detail, (exception as any).driverError);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      detail,
    });
  }
}

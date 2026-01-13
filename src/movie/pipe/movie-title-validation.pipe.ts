import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class MovieTitleValidationPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!value) {
      return value;
    }
    // 만약의 글자 길이가 2자 이하일 경우 에러 발생
    if (value.length <= 2) {
      throw new BadRequestException('제목은 3자 이상이어야 합니다.');
    }
    return value;
  } 
}

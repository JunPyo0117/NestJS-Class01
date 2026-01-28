import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateChatDto {
  @IsString()
  @ApiProperty({
    description: '채팅 메시지',
    example: '안녕하세요!',
  })
  message: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    description: '채팅방 번호',
    example: 1,
    required: false,
  })
  room?: number;
}

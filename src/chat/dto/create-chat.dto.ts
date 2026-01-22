import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateChatDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsNumber()
  room?: number;

  
}

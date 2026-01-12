import { IsNotEmpty, IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateDirectorDto {
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  name?: string;

  @IsNotEmpty()
  @IsDateString()
  @IsOptional()
  @IsString()
  dob?: Date;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  nationality?: string;
}

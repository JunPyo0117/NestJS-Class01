import {
  Equals,
  IsDefined,
  IsNotEmpty,
  IsOptional,
  NotEquals,
  IsEmpty,
  IsIn,
  IsNotIn,
  IsBoolean,
  IsString,
  IsNumber,
  IsInt,
  IsArray,
  IsEnum,
  IsDateString,
  IsDivisibleBy,
  IsPositive,
  IsNegative,
  Max,
  Min,
  Contains,
  NotContains,
  IsAlphanumeric,
  IsEmail,
  IsCreditCard,
  IsHexColor,
  MaxLength,
  MinLength,
  IsUUID,
  IsLatLong,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

enum MovieGenre {
  Fantasy = 'fantasy',
  Action = 'action',
}

@ValidatorConstraint({
  async: true,
})
class PasswordValidator implements ValidatorConstraintInterface {
  validate(
    value: any,
    validationArguments?: ValidationArguments,
  ): Promise<boolean> | boolean {
    return value.length >= 4 && value.length <= 8;
  }
  defaultMessage(validationArguments?: ValidationArguments): string {
    return 'Password must be between 4 and 8 characters 입력한 비밀번호 {$value}';
  }
}

function IsPasswordValid(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: PasswordValidator,
    });
  };
}

export class UpdateMovieDto {
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  title?: string;

  @IsArray()
  @IsNotEmpty()
  @IsNumber({}, { each: true })
  @IsOptional()
  genreIds?: number[];

  // null || undefined 일 경우 에러 발생
  // @IsDefined()
  // @IsOptional()
  // @Equals('code Factory')
  // @NotEquals('code Factory')
  // null || undefined || '' 일 경우 에러 발생
  // @IsEmpty()
  // @IsNotEmpty()
  // @IsIn(['action', 'fantasy'])
  // @IsNotIn(['action', 'fantasy'])
  // @IsBoolean()
  // @IsString()
  // @IsNumber()
  // @IsInt()
  // @IsArray()
  // @IsEnum(MovieGenre)
  // @IsDateString()
  // @IsDivisibleBy(5)
  // @IsPositive()
  // @IsNegative()
  // @Min(1)
  // @Max(100)
  // @Contains('code Factory')
  // @NotContains('code Factory')
  // @IsAlphanumeric()
  // @IsCreditCard()
  // @IsHexColor()
  // @MaxLength(10)
  // @MinLength(5)
  // @IsUUID()
  // @IsLatLong()
  // @IsEmail()
  // @Validate(PasswordValidator, {
  //   message: '다른 에러 메시지',
  // })
  // @IsPasswordValid()
  // test: string;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  detail?: string;

  @IsNotEmpty()
  @IsOptional()
  @IsNumber()
  directorId?: number;
}

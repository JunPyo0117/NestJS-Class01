# Ch 1. Class Validator 인트로 정리

## 📋 프로젝트 개요

이 챕터에서는 **DTO (Data Transfer Object)**와 **Class Validator**를 학습하여 API 요청 데이터의 타입 안정성과 유효성 검증을 구현했습니다.

## 🏗️ 프로젝트 구조 변화

### Before (DTO 없이)

```typescript
// 컨트롤러에서 개별 파라미터로 받음
@Post()
createMovie(@Body('title') title: string, @Body('genre') genre: string) {
  return this.movieService.createMovie(title, genre);
}
```

**문제점:**
- ❌ 타입 안정성 부족
- ❌ 유효성 검증 없음
- ❌ 파라미터가 많아질수록 복잡해짐
- ❌ 재사용 불가능

### After (DTO 사용)

```typescript
// DTO 클래스로 받음
@Post()
createMovie(@Body() body: CreateMovieDto) {
  return this.movieService.createMovie(body);
}
```

**장점:**
- ✅ 타입 안정성 확보
- ✅ 자동 유효성 검증
- ✅ 코드 가독성 향상
- ✅ 재사용 가능

---

## 🎯 핵심 개념

### 1. DTO (Data Transfer Object)란?

**DTO**는 계층 간 데이터를 전달하기 위한 객체입니다. 주로 API 요청/응답의 데이터 구조를 정의합니다.

#### DTO의 목적

1. **타입 안정성**: TypeScript의 타입 체크 활용
2. **유효성 검증**: 입력 데이터의 유효성 검사
3. **문서화**: API 스펙을 코드로 표현
4. **재사용성**: 여러 곳에서 동일한 구조 사용

#### DTO vs Interface

```typescript
// Interface: 타입만 정의
interface Movie {
  title: string;
  genre: string;
}

// DTO: 타입 + 유효성 검증
export class CreateMovieDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  genre: string;
}
```

**차이점:**
- **Interface**: 컴파일 타임에만 존재 (런타임에 사라짐)
- **DTO**: 런타임에도 존재하여 유효성 검증 가능

---

### 2. Class Validator란?

**Class Validator**는 TypeScript 클래스에 데코레이터를 사용하여 유효성 검증 규칙을 정의하는 라이브러리입니다.

#### 주요 기능

- ✅ 데코레이터 기반 검증 규칙 정의
- ✅ 자동 유효성 검증
- ✅ 상세한 에러 메시지 제공
- ✅ 커스텀 검증 규칙 작성 가능

#### 설치

```bash
pnpm add class-validator class-transformer
```

**의존성:**
- `class-validator`: 유효성 검증 라이브러리
- `class-transformer`: 객체 변환 라이브러리 (DTO 변환에 필요)

---

## 📝 현재 프로젝트 구조

### 1. CreateMovieDto

**파일 위치:** `src/movie/dto/create-movie.dto.ts`

```typescript
import { IsNotEmpty } from 'class-validator';

export class CreateMovieDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  genre: string;
}
```

**역할:**
- 새 영화를 생성할 때 사용하는 DTO
- `title`과 `genre` 필드가 필수
- 빈 값이 들어오면 자동으로 에러 발생

**검증 규칙:**
- `@IsNotEmpty()`: 값이 비어있으면 안 됨 (null, undefined, 빈 문자열 불가)

---

### 2. UpdateMovieDto

**파일 위치:** `src/movie/dto/update-movie.dto.ts`

```typescript
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateMovieDto {
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsNotEmpty()
  @IsOptional()
  genre?: string;
}
```

**역할:**
- 영화 정보를 수정할 때 사용하는 DTO
- 모든 필드가 선택적 (optional)
- 값이 제공되면 유효성 검증 수행

**검증 규칙:**
- `@IsOptional()`: 필드가 없어도 됨 (undefined 허용)
- `@IsNotEmpty()`: 값이 제공되면 비어있으면 안 됨

**주의사항:**
- `@IsOptional()`과 `@IsNotEmpty()`를 함께 사용하면:
  - 필드가 없으면 → 통과 (optional)
  - 필드가 있으면 → 비어있으면 안 됨 (not empty)

---

### 3. MovieController (DTO 적용)

**파일 위치:** `src/movie/movie.controller.ts`

```typescript
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Controller('movie')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Post()
  createMovie(@Body() body: CreateMovieDto) {
    return this.movieService.createMovie(body);
  }

  @Patch(':id')
  updateMovie(@Param('id') id: string, @Body() body: UpdateMovieDto) {
    return this.movieService.updateMovie(+id, body);
  }
}
```

**변경사항:**
- `@Body('title') title: string` → `@Body() body: CreateMovieDto`
- 개별 파라미터 대신 DTO 객체로 받음
- 타입 안정성과 유효성 검증 자동 적용

---

### 4. MovieService (DTO 사용)

**파일 위치:** `src/movie/movie.service.ts`

```typescript
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Injectable()
export class MovieService {
  createMovie(CreateMovieDto: CreateMovieDto) {
    const newMovie: Movie = {
      id: this.idCounter++,
      ...CreateMovieDto,  // 스프레드 연산자로 모든 필드 복사
    };
    this.movies.push(newMovie);
    return newMovie;
  }

  updateMovie(id: number, UpdateMovieDto: UpdateMovieDto) {
    const movie = this.movies.find((m) => m.id === +id);
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    Object.assign(movie, UpdateMovieDto);  // DTO의 필드만 업데이트
    return movie;
  }
}
```

**변경사항:**
- 개별 파라미터 대신 DTO 객체를 받음
- 스프레드 연산자(`...`)로 객체 복사
- `Object.assign()`으로 부분 업데이트

---

### 5. ValidationPipe 설정

**파일 위치:** `src/main.ts`

```typescript
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}
```

**역할:**
- 전역적으로 모든 요청에 대해 유효성 검증 수행
- DTO의 검증 규칙을 자동으로 실행
- 검증 실패 시 자동으로 에러 응답

**작동 방식:**
1. 요청이 들어옴
2. `ValidationPipe`가 DTO 클래스로 변환
3. `class-validator`가 검증 규칙 확인
4. 검증 실패 시 `400 Bad Request` 에러 반환
5. 검증 성공 시 컨트롤러로 전달

---

## 🔍 Class Validator 데코레이터

### 주요 검증 데코레이터

#### 1. @IsNotEmpty()

값이 비어있으면 안 됩니다.

```typescript
@IsNotEmpty()
title: string;
```

**검증 실패 조건:**
- `null`
- `undefined`
- 빈 문자열 `""`
- 빈 배열 `[]`

**예시:**
```json
// ❌ 실패
{ "title": "" }
{ "title": null }

// ✅ 성공
{ "title": "해리포터" }
```

---

#### 2. @IsOptional()

필드가 없어도 됩니다 (선택적 필드).

```typescript
@IsOptional()
title?: string;
```

**예시:**
```json
// ✅ 모두 성공
{}
{ "title": "해리포터" }
{ "title": null }  // null도 허용
```

---

#### 3. @IsString()

문자열 타입이어야 합니다.

```typescript
@IsString()
title: string;
```

**예시:**
```json
// ❌ 실패
{ "title": 123 }
{ "title": true }

// ✅ 성공
{ "title": "해리포터" }
```

---

#### 4. @IsNumber()

숫자 타입이어야 합니다.

```typescript
@IsNumber()
id: number;
```

---

#### 5. @IsEmail()

이메일 형식이어야 합니다.

```typescript
@IsEmail()
email: string;
```

---

#### 6. @Min() / @Max()

숫자의 최소/최대값을 제한합니다.

```typescript
@Min(1)
@Max(100)
age: number;
```

---

#### 7. @Length()

문자열 길이를 제한합니다.

```typescript
@Length(1, 100)
title: string;
```

---

### 데코레이터 조합

여러 데코레이터를 함께 사용할 수 있습니다.

```typescript
@IsNotEmpty()
@IsString()
@Length(1, 100)
title: string;
```

**검증 순서:**
1. `@IsNotEmpty()`: 비어있지 않은지 확인
2. `@IsString()`: 문자열 타입인지 확인
3. `@Length(1, 100)`: 길이가 1~100인지 확인

---

## 🔄 전환 과정

### 1단계: DTO 클래스 생성

#### CreateMovieDto 생성

```typescript
// Before: 개별 파라미터
@Post()
createMovie(@Body('title') title: string, @Body('genre') genre: string) {
  // ...
}

// After: DTO 사용
export class CreateMovieDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  genre: string;
}

@Post()
createMovie(@Body() body: CreateMovieDto) {
  // ...
}
```

#### UpdateMovieDto 생성

```typescript
export class UpdateMovieDto {
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsNotEmpty()
  @IsOptional()
  genre?: string;
}
```

---

### 2단계: ValidationPipe 설정

```typescript
// main.ts
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());  // 전역 검증 파이프 추가
  await app.listen(process.env.PORT ?? 3000);
}
```

---

### 3단계: 컨트롤러 수정

```typescript
// Before
@Post()
createMovie(@Body('title') title: string, @Body('genre') genre: string) {
  return this.movieService.createMovie(title, genre);
}

// After
@Post()
createMovie(@Body() body: CreateMovieDto) {
  return this.movieService.createMovie(body);
}
```

---

### 4단계: 서비스 수정

```typescript
// Before
createMovie(title: string, genre: string) {
  const newMovie: Movie = {
    id: this.idCounter++,
    title: title,
    genre: genre,
  };
  // ...
}

// After
createMovie(CreateMovieDto: CreateMovieDto) {
  const newMovie: Movie = {
    id: this.idCounter++,
    ...CreateMovieDto,  // 스프레드 연산자 사용
  };
  // ...
}
```

---

## 🎯 DTO 사용의 장점

### 1. 타입 안정성

```typescript
// Before: 타입 체크 없음
@Body('title') title: string  // 실제로는 any 타입일 수 있음

// After: 명확한 타입
@Body() body: CreateMovieDto  // CreateMovieDto 타입 보장
```

---

### 2. 자동 유효성 검증

```typescript
// Before: 수동 검증 필요
if (!title || title.trim() === '') {
  throw new BadRequestException('Title is required');
}

// After: 자동 검증
@IsNotEmpty()
title: string;  // 자동으로 검증됨
```

---

### 3. 코드 가독성

```typescript
// Before: 파라미터가 많아지면 복잡
createMovie(
  title: string,
  genre: string,
  year: number,
  director: string,
  // ...
) { }

// After: 하나의 객체로 명확
createMovie(body: CreateMovieDto) { }
```

---

### 4. 재사용성

```typescript
// 여러 곳에서 동일한 DTO 사용
@Post()
createMovie(@Body() body: CreateMovieDto) { }

@Put(':id')
replaceMovie(@Body() body: CreateMovieDto) { }
```

---

### 5. 문서화

DTO 클래스 자체가 API 스펙 문서 역할을 합니다.

```typescript
// 코드만 봐도 어떤 필드가 필요한지 알 수 있음
export class CreateMovieDto {
  @IsNotEmpty()
  title: string;  // 필수 필드

  @IsNotEmpty()
  genre: string;  // 필수 필드
}
```

---

## 🚨 에러 처리

### 검증 실패 시 응답

```json
// 요청
POST /movie
{
  "title": "",
  "genre": "fantasy"
}

// 응답 (400 Bad Request)
{
  "statusCode": 400,
  "message": [
    "title should not be empty"
  ],
  "error": "Bad Request"
}
```

**에러 형식:**
- `statusCode`: 400 (Bad Request)
- `message`: 검증 실패한 필드들의 에러 메시지 배열
- `error`: 에러 타입

---

## 🎓 학습한 내용 요약

### 강의 내용 체크리스트

1. ✅ **DTO 소개 및 사용해보기**
   - DTO의 개념과 목적 이해
   - DTO 클래스 생성 방법
   - 컨트롤러에서 DTO 사용

2. ✅ **Class Validator 소개**
   - Class Validator 라이브러리 이해
   - 주요 검증 데코레이터 학습
   - 데코레이터 조합 방법

3. ✅ **Class Validator 프로젝트에 적용하기**
   - `ValidationPipe` 설정
   - `CreateMovieDto`와 `UpdateMovieDto` 구현
   - 컨트롤러와 서비스에 DTO 적용

---

## 🔑 핵심 정리

### DTO vs 일반 파라미터

| 구분 | 일반 파라미터 | DTO |
|------|-------------|-----|
| **타입 안정성** | 낮음 | 높음 |
| **유효성 검증** | 수동 | 자동 |
| **가독성** | 낮음 (파라미터 많을 때) | 높음 |
| **재사용성** | 낮음 | 높음 |
| **문서화** | 어려움 | 쉬움 |

### ValidationPipe의 역할

1. **요청 데이터를 DTO로 변환**: `class-transformer` 사용
2. **유효성 검증 수행**: `class-validator` 사용
3. **에러 처리**: 검증 실패 시 자동으로 에러 응답

### DTO 네이밍 규칙

- **생성**: `Create[Entity]Dto` (예: `CreateMovieDto`)
- **수정**: `Update[Entity]Dto` (예: `UpdateMovieDto`)
- **조회**: `Get[Entity]Dto` 또는 `[Entity]QueryDto`
- **응답**: `[Entity]ResponseDto` (선택적)

---

## 🚀 다음 단계

현재 구조의 장점:
- ✅ DTO로 타입 안정성 확보
- ✅ 자동 유효성 검증
- ✅ 코드 가독성 향상

향후 개선 가능한 부분:
- 더 다양한 검증 데코레이터 사용
- 커스텀 검증 데코레이터 작성
- 중첩된 객체 검증 (Nested DTO)
- 배열 검증
- 조건부 검증 (조건에 따라 다른 검증 규칙)

---

## 📌 참고사항

### ValidationPipe 옵션

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,        // DTO에 없는 속성 제거
    forbidNonWhitelisted: true,  // DTO에 없는 속성 있으면 에러
    transform: true,        // 자동 타입 변환
    transformOptions: {
      enableImplicitConversion: true,  // 암시적 타입 변환
    },
  }),
);
```

### DTO 파일 위치

일반적으로 `dto` 폴더에 저장:
```
src/
└── movie/
    └── dto/
        ├── create-movie.dto.ts
        └── update-movie.dto.ts
```

### DTO와 Entity의 차이

- **DTO**: 데이터 전송용 (요청/응답)
- **Entity**: 데이터베이스 모델 (도메인 모델)

DTO는 API 계층에서, Entity는 비즈니스 로직 계층에서 사용합니다.

---

# Ch 2. Class Validator 완전정복

## 📋 개요

이 챕터에서는 Class Validator의 다양한 검증 데코레이터들을 체계적으로 학습하고, 커스텀 검증 데코레이터를 작성하는 방법을 배웠습니다.

---

## 1. 기본 Validator 정리

### @IsDefined()

값이 정의되어 있어야 합니다 (`null`과 `undefined`만 허용하지 않음).

```typescript
@IsDefined()
test: string;
```

**검증 실패 조건:**
- `undefined`
- `null`

**예시:**
```json
// ❌ 실패
{ "test": null }
{}  // undefined

// ✅ 성공
{ "test": "" }  // 빈 문자열은 허용
{ "test": "value" }
```

**@IsNotEmpty()와의 차이:**
- `@IsDefined()`: `null`과 `undefined`만 거부 (빈 문자열 허용)
- `@IsNotEmpty()`: `null`, `undefined`, 빈 문자열 모두 거부

---

### @IsOptional()

필드가 없어도 됩니다 (선택적 필드).

```typescript
@IsOptional()
title?: string;
```

**예시:**
```json
// ✅ 모두 성공
{}
{ "title": "해리포터" }
{ "title": null }
{ "title": "" }
```

---

### @Equals() / @NotEquals()

특정 값과 같거나 같지 않아야 합니다.

```typescript
@Equals('code Factory')
company: string;

@NotEquals('code Factory')
company: string;
```

**예시:**
```json
// @Equals('code Factory')
// ❌ 실패
{ "company": "other" }

// ✅ 성공
{ "company": "code Factory" }
```

---

### @IsEmpty()

값이 비어있어야 합니다.

```typescript
@IsEmpty()
description?: string;
```

**검증 성공 조건:**
- `null`
- `undefined`
- 빈 문자열 `""`
- 빈 배열 `[]`

**예시:**
```json
// ✅ 성공
{ "description": "" }
{ "description": null }
{}

// ❌ 실패
{ "description": "value" }
```

---

### @IsIn() / @IsNotIn()

특정 배열의 값 중 하나여야 합니다.

```typescript
@IsIn(['action', 'fantasy'])
genre: string;

@IsNotIn(['action', 'fantasy'])
genre: string;
```

**예시:**
```json
// @IsIn(['action', 'fantasy'])
// ❌ 실패
{ "genre": "comedy" }

// ✅ 성공
{ "genre": "action" }
{ "genre": "fantasy" }
```

---

## 2. 타입 Validator 정리

### @IsBoolean()

불리언 타입이어야 합니다.

```typescript
@IsBoolean()
isPublished: boolean;
```

**예시:**
```json
// ❌ 실패
{ "isPublished": "true" }
{ "isPublished": 1 }

// ✅ 성공
{ "isPublished": true }
{ "isPublished": false }
```

---

### @IsString()

문자열 타입이어야 합니다.

```typescript
@IsString()
title: string;
```

**예시:**
```json
// ❌ 실패
{ "title": 123 }
{ "title": true }

// ✅ 성공
{ "title": "해리포터" }
```

---

### @IsNumber()

숫자 타입이어야 합니다 (정수, 소수 모두 허용).

```typescript
@IsNumber()
price: number;
```

**예시:**
```json
// ❌ 실패
{ "price": "100" }
{ "price": "100.5" }

// ✅ 성공
{ "price": 100 }
{ "price": 100.5 }
```

---

### @IsInt()

정수 타입이어야 합니다.

```typescript
@IsInt()
year: number;
```

**예시:**
```json
// ❌ 실패
{ "year": 2024.5 }
{ "year": "2024" }

// ✅ 성공
{ "year": 2024 }
```

---

### @IsArray()

배열 타입이어야 합니다.

```typescript
@IsArray()
tags: string[];
```

**예시:**
```json
// ❌ 실패
{ "tags": "tag1" }
{ "tags": {} }

// ✅ 성공
{ "tags": ["tag1", "tag2"] }
{ "tags": [] }
```

---

### @IsEnum()

열거형(Enum) 값이어야 합니다.

```typescript
enum MovieGenre {
  Fantasy = 'fantasy',
  Action = 'action',
}

@IsEnum(MovieGenre)
genre: MovieGenre;
```

**예시:**
```json
// ❌ 실패
{ "genre": "comedy" }

// ✅ 성공
{ "genre": "fantasy" }
{ "genre": "action" }
```

---

### @IsDateString()

날짜 문자열 형식이어야 합니다 (ISO 8601).

```typescript
@IsDateString()
releaseDate: string;
```

**예시:**
```json
// ❌ 실패
{ "releaseDate": "2024-01-01" }  // 시간 정보 없음
{ "releaseDate": "invalid" }

// ✅ 성공
{ "releaseDate": "2024-01-01T00:00:00.000Z" }
```

---

## 3. 숫자 Validator 정리

### @IsDivisibleBy()

특정 숫자로 나누어떨어져야 합니다.

```typescript
@IsDivisibleBy(5)
price: number;
```

**예시:**
```json
// ❌ 실패
{ "price": 13 }

// ✅ 성공
{ "price": 10 }
{ "price": 15 }
{ "price": 20 }
```

---

### @IsPositive()

양수여야 합니다.

```typescript
@IsPositive()
price: number;
```

**예시:**
```json
// ❌ 실패
{ "price": -10 }
{ "price": 0 }

// ✅ 성공
{ "price": 10 }
```

---

### @IsNegative()

음수여야 합니다.

```typescript
@IsNegative()
temperature: number;
```

**예시:**
```json
// ❌ 실패
{ "temperature": 10 }
{ "temperature": 0 }

// ✅ 성공
{ "temperature": -10 }
```

---

### @Min() / @Max()

최소값/최대값을 제한합니다.

```typescript
@Min(1)
@Max(100)
rating: number;
```

**예시:**
```json
// ❌ 실패
{ "rating": 0 }
{ "rating": 101 }

// ✅ 성공
{ "rating": 1 }
{ "rating": 50 }
{ "rating": 100 }
```

---

## 4. 문자 Validator 정리

### @Contains() / @NotContains()

특정 문자열을 포함하거나 포함하지 않아야 합니다.

```typescript
@Contains('code Factory')
description: string;

@NotContains('code Factory')
description: string;
```

**예시:**
```json
// @Contains('code Factory')
// ❌ 실패
{ "description": "other text" }

// ✅ 성공
{ "description": "code Factory is great" }
```

---

### @IsAlphanumeric()

알파벳과 숫자만 허용합니다.

```typescript
@IsAlphanumeric()
username: string;
```

**예시:**
```json
// ❌ 실패
{ "username": "user-name" }
{ "username": "user_name" }

// ✅ 성공
{ "username": "user123" }
{ "username": "User123" }
```

---

### @IsEmail()

이메일 형식이어야 합니다.

```typescript
@IsEmail()
email: string;
```

**예시:**
```json
// ❌ 실패
{ "email": "invalid-email" }
{ "email": "test@" }

// ✅ 성공
{ "email": "test@example.com" }
```

---

### @IsCreditCard()

신용카드 번호 형식이어야 합니다.

```typescript
@IsCreditCard()
cardNumber: string;
```

---

### @IsHexColor()

16진수 색상 코드 형식이어야 합니다.

```typescript
@IsHexColor()
color: string;
```

**예시:**
```json
// ❌ 실패
{ "color": "red" }
{ "color": "#GGG" }

// ✅ 성공
{ "color": "#FF0000" }
{ "color": "#fff" }
```

---

### @MaxLength() / @MinLength()

문자열 길이를 제한합니다.

```typescript
@MinLength(5)
@MaxLength(10)
title: string;
```

**예시:**
```json
// ❌ 실패
{ "title": "abc" }  // 너무 짧음
{ "title": "abcdefghijkl" }  // 너무 김

// ✅ 성공
{ "title": "abcde" }
{ "title": "abcdefghij" }
```

---

### @IsUUID()

UUID 형식이어야 합니다.

```typescript
@IsUUID()
id: string;
```

**예시:**
```json
// ❌ 실패
{ "id": "123" }
{ "id": "invalid-uuid" }

// ✅ 성공
{ "id": "550e8400-e29b-41d4-a716-446655440000" }
```

---

### @IsLatLong()

위도/경도 좌표 형식이어야 합니다.

```typescript
@IsLatLong()
location: string;
```

**예시:**
```json
// ❌ 실패
{ "location": "invalid" }

// ✅ 성공
{ "location": "37.5665,126.9780" }
```

---

## 5. Custom Validator (커스텀 검증 데코레이터)

### 방법 1: @Validate() 데코레이터 사용

커스텀 검증 클래스를 만들고 `@Validate()` 데코레이터로 사용합니다.

**파일 위치:** `src/movie/dto/update-movie.dto.ts`

```typescript
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
} from 'class-validator';

@ValidatorConstraint({
  async: true,  // 비동기 검증 가능
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

export class UpdateMovieDto {
  @Validate(PasswordValidator)
  test: string;
}
```

**특징:**
- `@ValidatorConstraint()`: 검증 클래스를 데코레이터로 표시
- `async: true`: 비동기 검증 가능 (데이터베이스 조회 등)
- `validate()`: 검증 로직 구현
- `defaultMessage()`: 에러 메시지 커스터마이징
- `{$value}`: 입력된 값을 에러 메시지에 포함

**에러 메시지 커스터마이징:**
```typescript
@Validate(PasswordValidator, {
  message: '다른 에러 메시지',
})
test: string;
```

---

### 방법 2: registerDecorator() 사용 (권장)

더 깔끔한 커스텀 데코레이터 함수를 만듭니다.

```typescript
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

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

// 커스텀 데코레이터 함수 생성
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
  @IsPasswordValid()  // 깔끔한 사용법
  test: string;
}
```

**장점:**
- 더 직관적인 사용법
- 다른 검증 데코레이터와 동일한 스타일
- 재사용 가능
- 에러 메시지 커스터마이징 가능

**사용 예시:**
```typescript
@IsPasswordValid({
  message: '비밀번호는 4자 이상 8자 이하여야 합니다',
})
password: string;
```

---

### 커스텀 Validator 작성 가이드

#### 1. ValidatorConstraint 클래스 작성

```typescript
@ValidatorConstraint({
  async: false,  // 동기 검증 (기본값)
  // async: true,  // 비동기 검증
})
class MyValidator implements ValidatorConstraintInterface {
  validate(value: any, args?: ValidationArguments): boolean {
    // 검증 로직
    return true;  // 또는 false
  }

  defaultMessage(args?: ValidationArguments): string {
    return '에러 메시지';
  }
}
```

#### 2. registerDecorator로 데코레이터 함수 생성

```typescript
function IsMyValidator(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: MyValidator,
    });
  };
}
```

#### 3. DTO에서 사용

```typescript
export class MyDto {
  @IsMyValidator()
  field: string;
}
```

---

## 6. ValidationPipe 주요 옵션 알아보기

### 현재 프로젝트 설정

**파일 위치:** `src/main.ts`

```typescript
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
```

---

### 주요 옵션 설명

#### 1. whitelist: true

DTO에 정의되지 않은 속성을 자동으로 제거합니다.

```typescript
new ValidationPipe({
  whitelist: true,
})
```

**예시:**
```typescript
// DTO
export class CreateMovieDto {
  @IsNotEmpty()
  title: string;
}

// 요청
{
  "title": "해리포터",
  "hacker": "malicious data"  // DTO에 없음
}

// whitelist: true → "hacker" 속성 제거됨
// 컨트롤러에 전달되는 데이터: { "title": "해리포터" }
```

**보안상 중요:** 악의적인 데이터가 서버로 전달되는 것을 방지합니다.

---

#### 2. forbidNonWhitelisted: true

DTO에 정의되지 않은 속성이 있으면 에러를 발생시킵니다.

```typescript
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
})
```

**예시:**
```typescript
// DTO
export class CreateMovieDto {
  @IsNotEmpty()
  title: string;
}

// 요청
{
  "title": "해리포터",
  "hacker": "malicious data"
}

// 응답 (400 Bad Request)
{
  "statusCode": 400,
  "message": ["property hacker should not exist"],
  "error": "Bad Request"
}
```

**장점:**
- 클라이언트가 잘못된 필드를 보내는 것을 즉시 알 수 있음
- API 스펙을 엄격하게 지킬 수 있음

---

#### 3. transform: true

요청 데이터를 DTO 클래스 인스턴스로 자동 변환합니다.

```typescript
new ValidationPipe({
  transform: true,
})
```

**예시:**
```typescript
// Before (transform: false)
@Get(':id')
getMovie(@Param('id') id: string) {
  // id는 문자열
  return this.movieService.getMovieById(+id);  // 수동 변환 필요
}

// After (transform: true)
@Get(':id')
getMovie(@Param('id') id: number) {
  // id는 자동으로 숫자로 변환됨
  return this.movieService.getMovieById(id);
}
```

---

#### 4. transformOptions

타입 변환 옵션을 설정합니다.

```typescript
new ValidationPipe({
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,  // 암시적 타입 변환
  },
})
```

**enableImplicitConversion: true**
- 문자열을 숫자로 자동 변환
- 문자열을 불리언으로 자동 변환
- 등등

**예시:**
```typescript
// DTO
export class QueryDto {
  @IsNumber()
  page: number;  // 문자열 "1"이 자동으로 숫자 1로 변환됨
}
```

---

#### 5. disableErrorMessages: true

에러 메시지를 비활성화합니다 (보안상의 이유로).

```typescript
new ValidationPipe({
  disableErrorMessages: true,
})
```

**응답:**
```json
{
  "statusCode": 400,
  "message": [],  // 빈 배열
  "error": "Bad Request"
}
```

---

#### 6. exceptionFactory

커스텀 예외를 생성할 수 있습니다.

```typescript
new ValidationPipe({
  exceptionFactory: (errors) => {
    return new BadRequestException({
      customMessage: 'Validation failed',
      errors: errors,
    });
  },
})
```

---

### 권장 설정

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,                    // DTO에 없는 속성 제거
    forbidNonWhitelisted: true,         // DTO에 없는 속성 있으면 에러
    transform: true,                    // 자동 타입 변환
    transformOptions: {
      enableImplicitConversion: true,   // 암시적 타입 변환
    },
    disableErrorMessages: false,         // 에러 메시지 표시
  }),
);
```

---

## 🎓 Ch 2 학습한 내용 요약

### 강의 내용 체크리스트

1. ✅ **기본 Validator 정리**
   - `@IsDefined()`, `@IsOptional()`, `@Equals()`, `@IsIn()` 등
   - 각 데코레이터의 동작 방식과 차이점 이해

2. ✅ **타입 Validator 정리**
   - `@IsBoolean()`, `@IsString()`, `@IsNumber()`, `@IsArray()`, `@IsEnum()` 등
   - 타입별 검증 규칙 학습

3. ✅ **숫자 Validator 정리**
   - `@IsDivisibleBy()`, `@IsPositive()`, `@IsNegative()`, `@Min()`, `@Max()` 등
   - 숫자 범위 및 조건 검증

4. ✅ **문자 Validator 정리**
   - `@Contains()`, `@IsEmail()`, `@MaxLength()`, `@IsUUID()` 등
   - 문자열 형식 및 길이 검증

5. ✅ **Custom Validator**
   - `@ValidatorConstraint()` 사용법
   - `registerDecorator()`로 커스텀 데코레이터 함수 생성
   - 비동기 검증 구현

6. ✅ **ValidationPipe 주요 옵션 알아보기**
   - `whitelist`, `forbidNonWhitelisted`, `transform` 등
   - 각 옵션의 역할과 보안상의 중요성

---

## 🔑 핵심 정리

### Validator 데코레이터 분류

| 카테고리 | 주요 데코레이터 |
|---------|---------------|
| **기본** | `@IsDefined()`, `@IsOptional()`, `@IsNotEmpty()`, `@IsEmpty()`, `@Equals()`, `@IsIn()` |
| **타입** | `@IsBoolean()`, `@IsString()`, `@IsNumber()`, `@IsInt()`, `@IsArray()`, `@IsEnum()`, `@IsDateString()` |
| **숫자** | `@IsDivisibleBy()`, `@IsPositive()`, `@IsNegative()`, `@Min()`, `@Max()` |
| **문자** | `@Contains()`, `@IsAlphanumeric()`, `@IsEmail()`, `@IsCreditCard()`, `@MaxLength()`, `@MinLength()`, `@IsUUID()` |

### 커스텀 Validator 작성 방법

1. **ValidatorConstraint 클래스 작성**
2. **registerDecorator로 데코레이터 함수 생성** (권장)
3. **DTO에서 사용**

### ValidationPipe 보안 옵션

- `whitelist: true`: DTO에 없는 속성 제거
- `forbidNonWhitelisted: true`: DTO에 없는 속성 있으면 에러
- **두 옵션을 함께 사용하면 보안이 강화됨**

---

## 📌 참고사항

### 프로젝트에서 사용 중인 Validator

**CreateMovieDto:**
```typescript
@IsNotEmpty()
title: string;

@IsNotEmpty()
genre: string;

@IsDefined()
test: string;
```

**UpdateMovieDto:**
```typescript
@IsNotEmpty()
@IsOptional()
title?: string;

@IsNotEmpty()
@IsOptional()
genre?: string;

@IsPasswordValid()  // 커스텀 Validator
test: string;
```

### 에러 메시지 커스터마이징

```typescript
// 방법 1: defaultMessage에서
defaultMessage(): string {
  return '커스텀 에러 메시지 {$value}';
}

// 방법 2: 데코레이터 옵션에서
@IsPasswordValid({
  message: '커스텀 에러 메시지',
})
```

### 비동기 검증

```typescript
@ValidatorConstraint({
  async: true,
})
class AsyncValidator implements ValidatorConstraintInterface {
  async validate(value: any): Promise<boolean> {
    // 데이터베이스 조회 등 비동기 작업
    const exists = await this.repository.exists(value);
    return exists;
  }
}
```

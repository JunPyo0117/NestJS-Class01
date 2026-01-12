# Ch 3. Class Transformer 정리

## 📋 프로젝트 개요

이 챕터에서는 **Class Transformer**를 학습하여 객체 변환과 직렬화(Serialization)를 구현했습니다. Class Transformer는 객체를 다른 형태로 변환하거나, 응답 데이터를 제어하는 데 사용됩니다.

## 🎯 핵심 개념

### 1. Class Transformer란?

**Class Transformer**는 TypeScript 클래스와 일반 객체(Plain Object) 간의 변환을 도와주는 라이브러리입니다.

#### 주요 기능

- ✅ **객체 → 클래스 인스턴스 변환**: `plainToInstance()`
- ✅ **클래스 인스턴스 → 객체 변환**: `instanceToPlain()`
- ✅ **응답 데이터 제어**: `@Expose()`, `@Exclude()` 데코레이터
- ✅ **데이터 변환**: `@Transform()` 데코레이터로 커스텀 변환

#### 설치

```bash
pnpm add class-transformer
```

**참고:** `class-validator`와 함께 사용되며, NestJS의 `ValidationPipe`에서도 내부적으로 사용됩니다.

---

### 2. 왜 Class Transformer가 필요한가?

#### 문제 상황

```typescript
// 서비스에서 반환하는 데이터
const movie = {
  id: 1,
  title: '해리포터',
  genre: 'fantasy',
  password: 'secret123',  // 민감한 정보
  internalId: 999,        // 내부 사용 정보
};

// 클라이언트에 모든 데이터가 그대로 노출됨 ❌
return movie;
```

**문제점:**
- 민감한 정보가 응답에 포함됨
- 내부 사용 필드가 노출됨
- 불필요한 데이터가 전송됨

#### 해결 방법: Class Transformer

```typescript
import { Exclude, Expose } from 'class-transformer';

export class MovieResponseDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  genre: string;

  @Exclude()  // 응답에서 제외
  password: string;

  @Exclude()  // 응답에서 제외
  internalId: number;
}
```

**장점:**
- ✅ 민감한 정보 제외
- ✅ 필요한 필드만 노출
- ✅ 데이터 보안 강화

---

### 3. Class Transformer vs Class Validator

| 구분 | Class Validator | Class Transformer |
|------|---------------|------------------|
| **목적** | 데이터 검증 | 데이터 변환 |
| **사용 시점** | 요청 데이터 검증 | 요청/응답 데이터 변환 |
| **주요 기능** | 유효성 검증 | 직렬화/역직렬화 |
| **데코레이터** | `@IsNotEmpty()`, `@IsString()` 등 | `@Expose()`, `@Exclude()`, `@Transform()` |

**함께 사용:**
- `ValidationPipe`가 내부적으로 두 라이브러리를 모두 사용
- DTO에서 검증과 변환을 동시에 수행

---

## 📝 현재 프로젝트 구조

### 1. Movie Entity (변환 규칙 정의)

**파일 위치:** `src/movie/entity/movie.entity.ts`

```typescript
import { Expose, Exclude, Transform } from 'class-transformer';

export class Movie {
  id: number;
  title: string;
  
  @Transform(({ value }) => value.toString().toUpperCase())
  genre: string;
}
```

**역할:**
- 영화 데이터의 구조 정의
- `@Transform()` 데코레이터로 `genre` 필드를 대문자로 변환
- 응답 시 자동으로 변환 규칙 적용

**변환 규칙:**
- `genre` 필드가 응답될 때 자동으로 대문자로 변환됨
- 예: `"fantasy"` → `"FANTASY"`

---

### 2. MovieController (직렬화 인터셉터 사용)

**파일 위치:** `src/movie/movie.controller.ts`

```typescript
import { ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  // ...
}
```

**역할:**
- `ClassSerializerInterceptor`를 사용하여 응답 데이터 직렬화
- Entity의 `@Expose()`, `@Exclude()`, `@Transform()` 데코레이터 자동 적용

**작동 방식:**
1. 컨트롤러에서 데이터 반환
2. `ClassSerializerInterceptor`가 응답을 가로챔
3. Entity의 변환 규칙 적용
4. 변환된 데이터를 클라이언트에 전송

---

## 🔍 주요 데코레이터

### 1. @Expose()

특정 필드를 응답에 포함시킵니다.

```typescript
import { Expose } from 'class-transformer';

export class MovieResponseDto {
  @Expose()
  id: number;

  @Expose()
  title: string;
}
```

**특징:**
- `@Expose()`가 없는 필드는 기본적으로 제외됨
- 명시적으로 노출할 필드만 지정

**예시:**
```typescript
// Entity
export class Movie {
  @Expose()
  id: number;

  @Expose()
  title: string;

  password: string;  // @Expose() 없음 → 제외됨
}

// 응답
{
  "id": 1,
  "title": "해리포터"
  // password는 제외됨
}
```

---

### 2. @Exclude()

특정 필드를 응답에서 제외시킵니다.

```typescript
import { Exclude } from 'class-transformer';

export class Movie {
  id: number;
  title: string;

  @Exclude()
  password: string;  // 응답에서 제외

  @Exclude()
  internalId: number;  // 응답에서 제외
}
```

**사용 사례:**
- 비밀번호, 토큰 등 민감한 정보
- 내부 사용 필드
- 임시 데이터

**예시:**
```typescript
// Entity
export class User {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Exclude()
  password: string;  // 제외됨
}

// 응답
{
  "id": 1,
  "email": "user@example.com"
  // password는 제외됨
}
```

---

### 3. @Transform()

필드 값을 커스텀 변환합니다.

**파일 위치:** `src/movie/entity/movie.entity.ts`

```typescript
import { Transform } from 'class-transformer';

export class Movie {
  @Transform(({ value }) => value.toString().toUpperCase())
  genre: string;
}
```

**구문:**
```typescript
@Transform(({ value, key, obj, type }) => {
  // value: 현재 필드의 값
  // key: 필드 이름
  // obj: 전체 객체
  // type: 변환 타입 (plainToInstance, instanceToPlain 등)
  return 변환된_값;
})
```

**예시:**

#### 1. 문자열 변환
```typescript
@Transform(({ value }) => value.toString().toUpperCase())
genre: string;

// "fantasy" → "FANTASY"
```

#### 2. 숫자 변환
```typescript
@Transform(({ value }) => parseInt(value))
id: number;

// "123" → 123
```

#### 3. 날짜 변환
```typescript
@Transform(({ value }) => new Date(value))
createdAt: Date;

// "2024-01-01" → Date 객체
```

#### 4. 조건부 변환
```typescript
@Transform(({ value }) => {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  return value;
})
description: string;
```

#### 5. 객체 변환
```typescript
@Transform(({ value }) => {
  return {
    fullName: `${value.firstName} ${value.lastName}`,
    age: value.age,
  };
})
user: User;
```

---

## 🔄 변환 함수

### 1. plainToInstance()

일반 객체를 클래스 인스턴스로 변환합니다.

```typescript
import { plainToInstance } from 'class-transformer';

const plainObject = {
  id: 1,
  title: '해리포터',
  genre: 'fantasy',
};

const movie = plainToInstance(Movie, plainObject);
// Movie 클래스 인스턴스로 변환됨
```

**사용 사례:**
- 데이터베이스에서 가져온 데이터를 Entity로 변환
- API 요청 데이터를 DTO로 변환

**예시:**
```typescript
// 데이터베이스에서 가져온 데이터
const dbData = {
  id: 1,
  title: '해리포터',
  genre: 'fantasy',
};

// Entity로 변환
const movie = plainToInstance(Movie, dbData);
// 이제 @Transform() 데코레이터가 적용됨
```

---

### 2. instanceToPlain()

클래스 인스턴스를 일반 객체로 변환합니다.

```typescript
import { instanceToPlain } from 'class-transformer';

const movie = new Movie();
movie.id = 1;
movie.title = '해리포터';
movie.genre = 'fantasy';

const plainObject = instanceToPlain(movie);
// 일반 객체로 변환됨
```

**사용 사례:**
- 클래스 인스턴스를 JSON으로 직렬화
- 응답 데이터 변환

---

### 3. classToPlain() (deprecated)

`instanceToPlain()`의 이전 이름입니다. 현재는 `instanceToPlain()` 사용을 권장합니다.

---

## 🛠️ NestJS에서의 사용

### 1. ClassSerializerInterceptor

NestJS에서 Class Transformer를 사용하는 가장 간단한 방법입니다.

**파일 위치:** `src/movie/movie.controller.ts`

```typescript
import { ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  @Get()
  getMovies() {
    return this.movieService.getManyMovies();
  }
}
```

**작동 방식:**
1. 컨트롤러 메서드가 데이터 반환
2. `ClassSerializerInterceptor`가 응답을 가로챔
3. Entity의 `@Expose()`, `@Exclude()`, `@Transform()` 데코레이터 적용
4. 변환된 데이터를 클라이언트에 전송

---

### 2. 전역 설정

모든 컨트롤러에 적용하려면 `main.ts`에서 전역 설정:

```typescript
import { ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
  );
  
  await app.listen(3000);
}
```

**장점:**
- 모든 컨트롤러에 자동 적용
- 개별 컨트롤러에 `@UseInterceptors()` 추가 불필요

---

### 3. ValidationPipe와 함께 사용

`ValidationPipe`는 내부적으로 `class-transformer`를 사용합니다.

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,  // 자동으로 plainToInstance 수행
    whitelist: true,
  }),
);
```

**작동 순서:**
1. 요청 데이터가 들어옴
2. `ValidationPipe`가 `plainToInstance()`로 DTO 변환
3. `class-validator`로 검증
4. 컨트롤러로 전달

---

## 📚 실전 예제

### 예제 1: 민감한 정보 제외

```typescript
import { Exclude, Expose } from 'class-transformer';

export class User {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  name: string;

  @Exclude()
  password: string;  // 응답에서 제외

  @Exclude()
  refreshToken: string;  // 응답에서 제외
}
```

**응답:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "홍길동"
  // password, refreshToken은 제외됨
}
```

---

### 예제 2: 데이터 변환

```typescript
import { Transform, Expose } from 'class-transformer';

export class Movie {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  @Transform(({ value }) => value.toString().toUpperCase())
  genre: string;

  @Expose()
  @Transform(({ value }) => {
    const date = new Date(value);
    return date.toISOString().split('T')[0];  // YYYY-MM-DD 형식
  })
  releaseDate: Date;
}
```

**응답:**
```json
{
  "id": 1,
  "title": "해리포터",
  "genre": "FANTASY",  // 대문자로 변환됨
  "releaseDate": "2024-01-01"  // 날짜 형식 변환됨
}
```

---

### 예제 3: 조건부 노출

```typescript
import { Expose, Transform } from 'class-transformer';

export class Movie {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  @Transform(({ value, obj }) => {
    // 관리자인 경우에만 상세 정보 노출
    if (obj.userRole === 'admin') {
      return value;
    }
    return '***';  // 일반 사용자에게는 숨김
  })
  internalNote: string;
}
```

---

### 예제 4: 중첩 객체 변환

```typescript
import { Expose, Type } from 'class-transformer';

export class Author {
  @Expose()
  id: number;

  @Expose()
  name: string;
}

export class Movie {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  @Type(() => Author)  // 중첩 객체 타입 지정
  author: Author;
}
```

**@Type() 데코레이터:**
- 중첩 객체를 올바르게 변환하기 위해 필요
- 배열의 경우: `@Type(() => Author)` 또는 `@Type(() => String)`

---

## 🎓 학습한 내용 요약

### 강의 내용 체크리스트

1. ✅ **Class Transformer 인트로**
   - Class Transformer의 개념과 목적 이해
   - Class Validator와의 차이점
   - 객체 변환의 필요성

2. ✅ **Expose와 Exclude 적용해보기**
   - `@Expose()` 데코레이터로 필드 노출
   - `@Exclude()` 데코레이터로 필드 제외
   - 응답 데이터 제어 방법

3. ✅ **Custom Transformer 사용해보기**
   - `@Transform()` 데코레이터로 커스텀 변환
   - 다양한 변환 예제
   - `plainToInstance()`, `instanceToPlain()` 함수 사용

---

## 🔑 핵심 정리

### Class Transformer의 주요 용도

1. **응답 데이터 제어**
   - 민감한 정보 제외
   - 필요한 필드만 노출

2. **데이터 변환**
   - 형식 변환 (문자열 → 대문자 등)
   - 타입 변환 (문자열 → 숫자 등)

3. **객체 변환**
   - 일반 객체 → 클래스 인스턴스
   - 클래스 인스턴스 → 일반 객체

### 데코레이터 비교

| 데코레이터 | 용도 | 예시 |
|-----------|------|------|
| `@Expose()` | 필드 노출 | `@Expose() id: number` |
| `@Exclude()` | 필드 제외 | `@Exclude() password: string` |
| `@Transform()` | 값 변환 | `@Transform(({ value }) => value.toUpperCase())` |
| `@Type()` | 중첩 객체 타입 지정 | `@Type(() => Author) author: Author` |

### NestJS 통합

- **ClassSerializerInterceptor**: 응답 직렬화 자동 처리
- **ValidationPipe**: 요청 데이터 변환 및 검증
- **전역 설정**: 모든 컨트롤러에 일괄 적용 가능

---

## 🚀 실전 팁

### 1. DTO와 Entity 분리

```typescript
// Entity: 데이터베이스 모델
export class Movie {
  id: number;
  title: string;
  genre: string;
  password: string;  // 내부 사용
}

// Response DTO: 응답용
export class MovieResponseDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  genre: string;

  // password는 제외
}
```

**장점:**
- Entity는 데이터베이스 구조 그대로 유지
- Response DTO는 API 스펙에 맞게 구성
- 관심사 분리

---

### 2. 그룹별 노출 제어

```typescript
import { Expose } from 'class-transformer';

export class User {
  @Expose({ groups: ['admin'] })
  internalId: number;

  @Expose({ groups: ['user', 'admin'] })
  email: string;

  @Expose()
  name: string;
}
```

**사용:**
```typescript
instanceToPlain(user, { groups: ['user'] });
// admin 전용 필드는 제외됨
```

---

### 3. 버전별 응답 제어

```typescript
import { Expose } from 'class-transformer';

export class Movie {
  @Expose()
  id: number;

  @Expose({ since: 2.0 })  // v2.0부터 노출
  newField: string;

  @Expose({ until: 2.0 })  // v2.0까지만 노출
  oldField: string;
}
```

---

## 📌 참고사항

### 프로젝트에서 사용 중인 기능

**Movie Entity:**
```typescript
@Transform(({ value }) => value.toString().toUpperCase())
genre: string;
```

**MovieController:**
```typescript
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  // ...
}
```

### 성능 고려사항

- `ClassSerializerInterceptor`는 모든 응답에 대해 변환을 수행
- 대용량 데이터의 경우 성능 영향 가능
- 필요한 경우에만 사용하거나, 특정 엔드포인트에만 적용

### 보안 주의사항

- `@Exclude()`로 민감한 정보 제외
- 기본적으로 모든 필드를 `@Expose()`로 명시하는 것이 안전
- 실수로 민감한 정보가 노출되는 것을 방지

---

## 🔄 다음 단계

현재 구조의 장점:
- ✅ 응답 데이터 제어 가능
- ✅ 데이터 변환 자동화
- ✅ 보안 강화

향후 개선 가능한 부분:
- Response DTO 분리
- 그룹별 노출 제어
- 버전별 API 관리
- 성능 최적화

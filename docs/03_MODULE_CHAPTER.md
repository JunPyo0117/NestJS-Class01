# Ch 4. 모듈 (Module) 정리

## 📋 프로젝트 개요

이 챕터에서는 NestJS의 **모듈(Module)** 개념을 학습하고, 기존의 `AppController`와 `AppService`를 독립적인 `MovieModule`로 분리하여 더 나은 코드 구조를 만들었습니다.

## 🏗️ 프로젝트 구조 변화

### Before (Ch 3 - 단일 모듈 구조)

```
src/
├── app.controller.ts    # 모든 컨트롤러가 여기에
├── app.service.ts       # 모든 서비스가 여기에
├── app.module.ts        # 모든 것을 관리
└── main.ts
```

**문제점:**
- 애플리케이션이 커질수록 `app.module.ts`가 비대해짐
- 관련 기능들이 분산되어 있음
- 재사용이 어려움
- 테스트가 복잡해짐

### After (Ch 4 - 기능별 모듈 구조)

```
src/
├── app.module.ts        # 루트 모듈 (MovieModule만 import)
├── main.ts
└── movie/
    ├── movie.module.ts      # Movie 기능 모듈
    ├── movie.controller.ts  # Movie 컨트롤러
    ├── movie.service.ts     # Movie 서비스
    ├── movie.controller.spec.ts
    └── movie.service.spec.ts
```

**장점:**
- ✅ 기능별로 코드가 그룹화됨
- ✅ 모듈 단위로 재사용 가능
- ✅ 테스트가 쉬워짐
- ✅ 확장성이 좋아짐

---

## 🎯 모듈(Module)의 개념

### 1. 모듈이란?

**모듈**은 관련된 기능(컨트롤러, 서비스, 프로바이더 등)을 하나로 묶는 NestJS의 기본 구성 단위입니다.

```typescript
@Module({
  controllers: [MovieController],
  providers: [MovieService],
  imports: [],
  exports: [],
})
export class MovieModule {}
```

### 2. 모듈의 역할

#### 캡슐화 (Encapsulation)

모듈은 관련된 기능들을 하나의 단위로 묶어서 관리합니다.

```typescript
// Movie 관련 모든 기능이 movie 폴더에 모여있음
movie/
├── movie.module.ts      // 모듈 정의
├── movie.controller.ts  // HTTP 엔드포인트
├── movie.service.ts     // 비즈니스 로직
└── ...
```

#### 의존성 관리

모듈은 자신이 사용하는 의존성을 명시적으로 선언합니다.

```typescript
@Module({
  controllers: [MovieController],  // 이 모듈이 사용하는 컨트롤러
  providers: [MovieService],       // 이 모듈이 사용하는 서비스
  imports: [OtherModule],          // 다른 모듈 import
  exports: [MovieService],         // 다른 모듈에서 사용할 수 있도록 export
})
export class MovieModule {}
```

#### 스코프 관리

모듈 내부의 프로바이더는 기본적으로 해당 모듈 내에서만 사용 가능합니다.

```typescript
// MovieModule 내부
@Module({
  providers: [MovieService],  // MovieModule 내부에서만 사용 가능
})
export class MovieModule {}

// 다른 모듈에서 사용하려면 export 필요
@Module({
  providers: [MovieService],
  exports: [MovieService],  // 다른 모듈에서도 사용 가능
})
export class MovieModule {}
```

---

## 🛠️ NestJS CLI를 사용한 리소스 생성

### 명령어

```bash
nest g resource movie
```

### 생성 과정

1. **리소스 이름 입력**: `movie`
2. **전송 계층 선택**: `REST API`
3. **CRUD 엔드포인트 생성 여부**: `Yes`

### 생성된 파일들

```
CREATE src/movie/movie.controller.spec.ts  # 컨트롤러 테스트 파일
CREATE src/movie/movie.controller.ts       # 컨트롤러
CREATE src/movie/movie.module.ts           # 모듈
CREATE src/movie/movie.service.spec.ts     # 서비스 테스트 파일
CREATE src/movie/movie.service.ts          # 서비스
CREATE src/movie/dto/create-movie.dto.ts   # 생성 DTO
CREATE src/movie/dto/update-movie.dto.ts   # 수정 DTO
CREATE src/movie/entities/movie.entity.ts  # 엔티티
UPDATE src/app.module.ts                   # AppModule 업데이트
```

### CLI 명령어의 장점

- ✅ 일관된 파일 구조 생성
- ✅ 필요한 파일들을 자동으로 생성
- ✅ 모듈 설정 자동 완성
- ✅ 테스트 파일도 함께 생성

---

## 📝 현재 프로젝트 구조

### 1. MovieModule (기능 모듈)

**파일 위치:** `src/movie/movie.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';

@Module({
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
```

**역할:**
- Movie 관련 컨트롤러와 서비스를 하나로 묶음
- Movie 기능의 독립적인 단위
- 다른 모듈에서 import하여 사용 가능

**주요 특징:**
- `controllers`: 이 모듈이 사용하는 컨트롤러 등록
- `providers`: 이 모듈이 사용하는 서비스 등록
- `imports`: 다른 모듈에서 가져올 것들 (현재 없음)
- `exports`: 다른 모듈에서 사용할 수 있도록 내보낼 것들 (현재 없음)

---

### 2. MovieController (컨트롤러)

**파일 위치:** `src/movie/movie.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { MovieService } from './movie.service';

@Controller('movie')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  getMovies(@Query('title') title?: string) {
    return this.movieService.getManyMovies(title);
  }

  @Get(':id')
  getMovie(@Param('id') id: string) {
    return this.movieService.getMovieById(+id);
  }

  @Post()
  createMovie(@Body('title') title: string) {
    return this.movieService.createMovie(title);
  }

  @Patch(':id')
  updateMovie(@Param('id') id: string, @Body('title') title: string) {
    return this.movieService.updateMovie(+id, title);
  }

  @Delete(':id')
  deleteMovie(@Param('id') id: string) {
    return this.movieService.deleteMovie(+id);
  }
}
```

**변경사항:**
- `@Controller('movies')` → `@Controller('movie')` (단수형으로 변경)
- 경로가 `/movie`로 변경됨
- 나머지 로직은 동일

---

### 3. MovieService (서비스)

**파일 위치:** `src/movie/movie.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';

export interface Movie {
  id: number;
  title: string;
  character: string[];
}

@Injectable()
export class MovieService {
  private movies: Movie[] = [
    {
      id: 1,
      title: '해리포터',
      character: ['해리포터', '엠마왓슨', '론 위즐리'],
    },
    {
      id: 2,
      title: '반지의 제왕',
      character: ['호비트 배리', '갈루아 배리', '아라곤 배리'],
    },
  ];

  private idCounter = 3;

  getManyMovies(title?: string) { ... }
  getMovieById(id: number) { ... }
  createMovie(title: string) { ... }
  updateMovie(id: number, title: string) { ... }
  deleteMovie(id: number) { ... }
}
```

**변경사항:**
- `AppService` → `MovieService`로 이름 변경
- `Movie` 인터페이스도 이 파일에 포함
- 비즈니스 로직은 동일

---

### 4. AppModule (루트 모듈)

**파일 위치:** `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MovieModule } from './movie/movie.module';

@Module({
  imports: [MovieModule],
})
export class AppModule {}
```

**변경사항:**
- `controllers`와 `providers` 제거
- `imports`에 `MovieModule`만 추가
- 매우 간결해짐

**역할:**
- 애플리케이션의 루트 모듈
- 다른 기능 모듈들을 import하여 통합
- 애플리케이션의 진입점 역할

---

## 🔄 전환 과정

### 1단계: CLI로 리소스 생성

```bash
nest g resource movie
```

이 명령어로 기본 구조가 생성되었습니다.

### 2단계: 기존 로직 이전

#### AppService → MovieService

```typescript
// Before: src/app.service.ts
@Injectable()
export class AppService {
  // ...
}

// After: src/movie/movie.service.ts
@Injectable()
export class MovieService {
  // 동일한 로직 이전
}
```

#### AppController → MovieController

```typescript
// Before: src/app.controller.ts
@Controller('movies')
export class AppController {
  constructor(private readonly appService: AppService) {}
  // ...
}

// After: src/movie/movie.controller.ts
@Controller('movie')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}
  // ...
}
```

### 3단계: AppModule 정리

```typescript
// Before
@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

// After
@Module({
  imports: [MovieModule],
})
export class AppModule {}
```

### 4단계: 기존 파일 삭제

- `src/app.controller.ts` 삭제
- `src/app.service.ts` 삭제 (또는 다른 용도로 사용)

---

## 🎯 모듈의 장점

### 1. 코드 조직화 (Code Organization)

```typescript
// 관련 기능들이 한 곳에 모여있음
movie/
├── movie.module.ts
├── movie.controller.ts
├── movie.service.ts
└── ...
```

**장점:**
- 관련 코드를 쉽게 찾을 수 있음
- 기능별로 명확하게 분리됨
- 프로젝트 구조가 직관적임

---

### 2. 재사용성 (Reusability)

```typescript
// MovieModule을 다른 프로젝트에서도 사용 가능
@Module({
  imports: [MovieModule],  // 재사용
})
export class AnotherModule {}
```

**장점:**
- 모듈을 다른 프로젝트에 복사하여 사용 가능
- 공통 기능을 모듈로 만들어 재사용
- 라이브러리처럼 사용 가능

---

### 3. 확장성 (Scalability)

```typescript
// 새로운 기능 추가 시 새 모듈 생성
@Module({
  imports: [MovieModule, UserModule, OrderModule],
})
export class AppModule {}
```

**장점:**
- 새로운 기능을 추가해도 기존 코드에 영향 없음
- 모듈 단위로 독립적으로 개발 가능
- 팀 단위로 모듈을 나눠서 개발 가능

---

### 4. 테스트 용이성 (Testability)

```typescript
// 모듈 단위로 테스트 가능
describe('MovieModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [MovieModule],
    }).compile();
  });
});
```

**장점:**
- 모듈 단위로 독립적인 테스트 가능
- 다른 모듈과 격리하여 테스트 가능
- Mock 모듈로 쉽게 대체 가능

---

### 5. 의존성 관리 (Dependency Management)

```typescript
// 명시적인 의존성 선언
@Module({
  imports: [DatabaseModule],      // 필요한 모듈 import
  exports: [MovieService],        // 다른 모듈에서 사용 가능
})
export class MovieModule {}
```

**장점:**
- 모듈 간 의존성이 명확함
- 순환 의존성을 쉽게 파악 가능
- 의존성 주입이 체계적으로 관리됨

---

## 📚 모듈 데코레이터 속성

### @Module() 데코레이터 속성

```typescript
@Module({
  imports: [],      // 다른 모듈 import
  controllers: [], // 이 모듈의 컨트롤러
  providers: [],   // 이 모듈의 프로바이더
  exports: [],     // 다른 모듈에서 사용할 수 있도록 export
})
export class MovieModule {}
```

#### 1. imports

다른 모듈에서 export된 프로바이더를 사용하기 위해 import합니다.

```typescript
@Module({
  imports: [DatabaseModule, ConfigModule],
})
export class MovieModule {}
```

#### 2. controllers

이 모듈이 사용하는 컨트롤러를 등록합니다.

```typescript
@Module({
  controllers: [MovieController],
})
export class MovieModule {}
```

#### 3. providers

이 모듈이 사용하는 서비스나 프로바이더를 등록합니다.

```typescript
@Module({
  providers: [MovieService, MovieRepository],
})
export class MovieModule {}
```

#### 4. exports

다른 모듈에서 이 모듈의 프로바이더를 사용할 수 있도록 export합니다.

```typescript
@Module({
  providers: [MovieService],
  exports: [MovieService],  // 다른 모듈에서 사용 가능
})
export class MovieModule {}
```

---

## 🔗 모듈 간 통신

### 모듈 Export & Import

#### Export 예시

```typescript
// movie.module.ts
@Module({
  providers: [MovieService],
  exports: [MovieService],  // MovieService를 export
})
export class MovieModule {}
```

#### Import 예시

```typescript
// user.module.ts
@Module({
  imports: [MovieModule],  // MovieModule import
  providers: [UserService],
})
export class UserModule {
  constructor(private readonly movieService: MovieService) {}
  // MovieService 사용 가능 (MovieModule에서 export된 경우)
}
```

**주의사항:**
- 모듈에서 export하지 않으면 다른 모듈에서 사용 불가
- 순환 의존성(circular dependency) 주의

---

## 🎓 학습한 내용 요약

### 강의 내용 체크리스트

1. ✅ **Module 개념 공부 및 CLI 사용해서 생성해보기**
   - 모듈의 개념과 역할 이해
   - `nest g resource` 명령어로 모듈 생성
   - 생성된 파일 구조 이해

2. ✅ **Movie 모듈로 엔드포인트 이전하기**
   - 기존 `AppController`, `AppService`를 `MovieModule`로 이전
   - `AppModule`을 루트 모듈로 정리
   - 기능별 모듈 구조로 개선

---

## 🔑 핵심 정리

### 모듈의 4가지 역할

1. **캡슐화**: 관련 기능을 하나로 묶음
2. **의존성 관리**: 모듈 간 의존성을 명시적으로 선언
3. **스코프 관리**: 모듈 내부 프로바이더의 접근 범위 제어
4. **재사용성**: 모듈을 다른 곳에서 재사용 가능

### 모듈 구조의 장점

| 구분 | 단일 모듈 | 기능별 모듈 |
|------|---------|------------|
| **코드 조직** | 모든 것이 한 곳 | 기능별로 분리 |
| **확장성** | 낮음 | 높음 |
| **재사용성** | 낮음 | 높음 |
| **테스트** | 복잡 | 간단 |
| **유지보수** | 어려움 | 쉬움 |

### 모듈 생성 방법

1. **수동 생성**: 파일을 직접 만들고 설정
2. **CLI 사용**: `nest g resource [name]` (권장)
   - 일관된 구조
   - 필요한 파일 자동 생성
   - 테스트 파일 포함

---

## 🚀 다음 단계

현재 구조의 장점:
- ✅ 기능별 모듈 분리 완료
- ✅ 확장 가능한 구조
- ✅ 테스트 가능한 구조

향후 개선 가능한 부분:
- 다른 기능 모듈 추가 (User, Order 등)
- 공통 모듈 생성 (Database, Config 등)
- 모듈 간 통신 구현
- 동적 모듈(Dynamic Module) 학습

---

## 📌 참고사항

### 모듈 네이밍 규칙

- 모듈 파일: `[name].module.ts`
- 모듈 클래스: `[Name]Module` (PascalCase)
- 폴더 구조: `src/[name]/`

### 모듈은 싱글톤

- 각 모듈은 애플리케이션 전체에서 하나의 인스턴스만 생성됨
- 모듈 내부의 프로바이더도 싱글톤으로 관리됨

### 루트 모듈

- `AppModule`은 항상 루트 모듈
- `main.ts`에서 `AppModule`을 사용하여 애플리케이션 시작
- 다른 모든 모듈은 `AppModule`의 `imports`에 추가

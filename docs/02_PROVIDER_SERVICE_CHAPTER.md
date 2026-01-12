# Ch 3. 프로바이더 & 서비스 (Provider & Service) 정리

## 📋 프로젝트 개요

이 챕터에서는 NestJS의 핵심 개념인 **의존성 주입(Dependency Injection)**과 **제어의 역전(Inversion of Control)**을 학습하고, 컨트롤러의 비즈니스 로직을 서비스로 분리하여 코드 구조를 개선했습니다.

## 🏗️ 프로젝트 구조 변화

### Before (Ch 2 - 컨트롤러만 사용)
```
src/
├── app.controller.ts    # 모든 로직이 컨트롤러에 있음
└── app.service.ts       # 미사용
```

### After (Ch 3 - 컨트롤러 + 서비스)
```
src/
├── app.controller.ts    # HTTP 요청/응답 처리만 담당
├── app.service.ts       # 비즈니스 로직 담당
└── app.module.ts        # 의존성 주입 설정
```

## 🎯 핵심 개념

### 1. 제어의 역전 (Inversion of Control, IoC)

#### 개념 설명

**제어의 역전**은 프로그램의 제어 흐름을 개발자가 직접 관리하는 것이 아니라, 프레임워크나 컨테이너가 관리하도록 하는 디자인 패턴입니다.

#### 전통적인 방식 (제어의 역전 없음)

```typescript
// ❌ 나쁜 예: 클래스가 직접 의존성을 생성
class AppController {
  private appService: AppService;
  
  constructor() {
    // 직접 인스턴스를 생성 (강한 결합)
    this.appService = new AppService();
  }
}
```

**문제점:**
- `AppController`가 `AppService`의 생성 방법을 직접 알아야 함
- `AppService`를 다른 구현체로 교체하기 어려움
- 테스트 시 실제 서비스를 사용해야 함 (모킹 어려움)
- 클래스 간 강한 결합 (Tight Coupling)

#### NestJS 방식 (제어의 역전 적용)

```typescript
// ✅ 좋은 예: 의존성을 외부에서 주입받음
class AppController {
  constructor(private readonly appService: AppService) {
    // NestJS가 자동으로 AppService 인스턴스를 주입
  }
}
```

**장점:**
- `AppController`는 `AppService`의 생성 방법을 몰라도 됨
- `AppService`를 다른 구현체로 쉽게 교체 가능
- 테스트 시 Mock 객체를 쉽게 주입 가능
- 클래스 간 느슨한 결합 (Loose Coupling)

#### 제어의 역전이 일어나는 과정

1. **개발자가 작성하는 코드:**
   ```typescript
   constructor(private readonly appService: AppService) {}
   ```
   - "나는 AppService가 필요해"라고 선언만 함

2. **NestJS가 하는 일:**
   - `AppModule`의 `providers` 배열을 확인
   - `AppService` 인스턴스를 생성하거나 기존 인스턴스 재사용
   - `AppController` 생성 시 자동으로 주입

3. **결과:**
   - 개발자는 객체 생성에 신경 쓸 필요 없음
   - 프레임워크가 모든 의존성 관리

---

### 2. 의존성 주입 (Dependency Injection, DI)

#### 개념 설명

**의존성 주입**은 객체가 필요로 하는 의존성을 외부에서 주입받는 디자인 패턴입니다. IoC를 구현하는 구체적인 방법 중 하나입니다.

#### 의존성이란?

```typescript
class AppController {
  constructor(private readonly appService: AppService) {}
  //                              ↑
  //                    AppController가 AppService에 의존함
}
```

- `AppController`는 `AppService` 없이는 제대로 동작할 수 없음
- `AppService`가 `AppController`의 **의존성(Dependency)**

#### 의존성 주입의 3가지 방법

##### 1. 생성자 주입 (Constructor Injection) - NestJS 권장 방식

```typescript
@Controller('movies')
export class AppController {
  constructor(private readonly appService: AppService) {}
  //           ↑
  // 생성자에서 의존성을 주입받음
}
```

**장점:**
- 의존성이 필수임을 명확히 표현
- 불변성 보장 (`readonly`)
- 테스트 용이

##### 2. 프로퍼티 주입 (Property Injection)

```typescript
@Controller('movies')
export class AppController {
  @Inject(AppService)
  private readonly appService: AppService;
}
```

##### 3. 메서드 주입 (Method Injection)

```typescript
@Controller('movies')
export class AppController {
  someMethod(@Inject(AppService) appService: AppService) {
    // 메서드에서만 사용
  }
}
```

#### NestJS에서 의존성 주입이 작동하는 방법

```typescript
// 1. 서비스를 @Injectable() 데코레이터로 표시
@Injectable()
export class AppService {
  // ...
}

// 2. 모듈의 providers에 등록
@Module({
  providers: [AppService],  // NestJS가 관리할 클래스 등록
  controllers: [AppController],
})
export class AppModule {}

// 3. 컨트롤러에서 주입받기
@Controller('movies')
export class AppController {
  constructor(private readonly appService: AppService) {}
  // NestJS가 자동으로 AppService 인스턴스를 주입
}
```

**주입 과정:**
1. NestJS가 애플리케이션 시작 시 `AppModule`을 분석
2. `providers` 배열의 클래스들을 IoC 컨테이너에 등록
3. `AppController` 생성 시 필요한 `AppService`를 찾아서 주입
4. 싱글톤 패턴으로 관리 (같은 인스턴스 재사용)

---

### 3. 왜 컨트롤러와 서비스를 나누는가?

#### 관심사의 분리 (Separation of Concerns)

각 클래스가 하나의 책임만 가지도록 하는 원칙입니다.

#### 컨트롤러의 역할

```typescript
@Controller('movies')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getMovies(@Query('title') title?: string) {
    // ✅ HTTP 요청/응답 처리
    // ✅ 파라미터 추출 및 검증
    // ✅ 서비스 메서드 호출
    return this.appService.getManyMovies(title);
  }
}
```

**컨트롤러가 담당하는 것:**
- ✅ HTTP 요청/응답 처리
- ✅ URL 파라미터, Query 파라미터, Body 파라미터 추출
- ✅ 입력 데이터 검증 (기본적인 타입 체크)
- ✅ 서비스 메서드 호출
- ✅ HTTP 상태 코드 및 응답 형식 결정

**컨트롤러가 담당하지 않는 것:**
- ❌ 비즈니스 로직 (데이터 처리, 계산 등)
- ❌ 데이터베이스 접근
- ❌ 외부 API 호출
- ❌ 복잡한 알고리즘

#### 서비스의 역할

```typescript
@Injectable()
export class AppService {
  private movies: Movie[] = [...];

  getManyMovies(title?: string) {
    // ✅ 비즈니스 로직
    // ✅ 데이터 처리 및 조작
    if (!title) {
      return this.movies;
    }
    return this.movies.filter((m) => m.title.startsWith(title));
  }
}
```

**서비스가 담당하는 것:**
- ✅ 비즈니스 로직 구현
- ✅ 데이터 처리 및 조작
- ✅ 데이터베이스 접근 (향후)
- ✅ 외부 API 호출 (향후)
- ✅ 복잡한 계산 및 알고리즘

**서비스가 담당하지 않는 것:**
- ❌ HTTP 요청/응답 처리
- ❌ URL 파싱
- ❌ HTTP 상태 코드 결정

#### 분리의 장점

##### 1. 재사용성 (Reusability)

```typescript
// 서비스를 여러 곳에서 재사용 가능
@Controller('movies')
export class AppController {
  constructor(private readonly appService: AppService) {}
  // 웹 API에서 사용
}

@Controller('admin/movies')
export class AdminController {
  constructor(private readonly appService: AppService) {}
  // 관리자 페이지에서도 같은 서비스 사용
}
```

##### 2. 테스트 용이성 (Testability)

```typescript
// 컨트롤러 테스트 시 서비스를 Mock으로 교체 가능
describe('AppController', () => {
  let controller: AppController;
  let service: AppService;

  beforeEach(() => {
    // Mock 서비스 생성
    const mockService = {
      getManyMovies: jest.fn(),
    };
    
    controller = new AppController(mockService as any);
  });
});
```

##### 3. 유지보수성 (Maintainability)

```typescript
// 비즈니스 로직 변경 시 서비스만 수정
@Injectable()
export class AppService {
  // 기존: 메모리 배열 사용
  // private movies: Movie[] = [...];
  
  // 변경: 데이터베이스 사용
  constructor(private readonly movieRepository: MovieRepository) {}
  
  getManyMovies(title?: string) {
    // 서비스 로직만 변경하면 됨
    // 컨트롤러는 변경 불필요
  }
}
```

##### 4. 단일 책임 원칙 (Single Responsibility Principle)

- **컨트롤러**: HTTP 통신만 담당
- **서비스**: 비즈니스 로직만 담당

각 클래스가 하나의 책임만 가지므로 코드가 명확해집니다.

---

## 📝 현재 프로젝트 구조

### 1. AppService (서비스)

```typescript
@Injectable()
export class AppService {
  private movies: Movie[] = [...];
  private idCounter = 3;

  getManyMovies(title?: string) { ... }
  getMovieById(id: number) { ... }
  createMovie(title: string) { ... }
  updateMovie(id: number, title: string) { ... }
  deleteMovie(id: number) { ... }
}
```

**주요 특징:**
- `@Injectable()` 데코레이터로 NestJS에 서비스임을 알림
- 모든 비즈니스 로직을 포함
- 데이터 저장소 역할 (현재는 메모리 배열)
- `Movie` 인터페이스도 서비스 파일에 정의

**파일 위치:** `src/app.service.ts`

---

### 2. AppController (컨트롤러)

```typescript
@Controller('movies')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getMovies(@Query('title') title?: string) {
    return this.appService.getManyMovies(title);
  }

  @Get(':id')
  getMovie(@Param('id') id: string) {
    return this.appService.getMovieById(+id);
  }

  @Post()
  createMovie(@Body('title') title: string) {
    return this.appService.createMovie(title);
  }

  @Patch(':id')
  updateMovie(@Param('id') id: string, @Body('title') title: string) {
    return this.appService.updateMovie(+id, title);
  }

  @Delete(':id')
  deleteMovie(@Param('id') id: string) {
    return this.appService.deleteMovie(+id);
  }
}
```

**주요 특징:**
- HTTP 요청/응답만 처리
- 모든 비즈니스 로직은 서비스에 위임
- 생성자에서 `AppService`를 주입받음
- 매우 간결하고 읽기 쉬운 코드

**파일 위치:** `src/app.controller.ts`

---

### 3. AppModule (모듈)

```typescript
@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

**주요 특징:**
- `providers`: NestJS가 관리할 서비스 등록
- `controllers`: 사용할 컨트롤러 등록
- 의존성 주입 설정의 중심

**파일 위치:** `src/app.module.ts`

---

## 🔄 로직 전환 과정

### Before: 컨트롤러에 모든 로직

```typescript
@Controller('movies')
export class AppController {
  private movies: Movie[] = [...];  // ❌ 데이터도 컨트롤러에

  @Get()
  getMovies(@Query('title') title: string) {
    // ❌ 비즈니스 로직도 컨트롤러에
    if (!title) {
      return this.movies;
    }
    return this.movies.filter((m) => m.title.startsWith(title));
  }
}
```

### After: 서비스로 로직 분리

```typescript
// ✅ 서비스에 비즈니스 로직
@Injectable()
export class AppService {
  private movies: Movie[] = [...];

  getManyMovies(title?: string) {
    if (!title) {
      return this.movies;
    }
    return this.movies.filter((m) => m.title.startsWith(title));
  }
}

// ✅ 컨트롤러는 HTTP 처리만
@Controller('movies')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getMovies(@Query('title') title?: string) {
    return this.appService.getManyMovies(title);
  }
}
```

---

## 📚 API 엔드포인트별 구현

### 1. GET /movies - 전체 영화 목록 조회

**컨트롤러:**
```typescript
@Get()
getMovies(@Query('title') title?: string) {
  return this.appService.getManyMovies(title);
}
```

**서비스:**
```typescript
getManyMovies(title?: string) {
  if (!title) {
    return this.movies;
  }
  return this.movies.filter((m) => m.title.startsWith(title));
}
```

**역할 분리:**
- 컨트롤러: Query 파라미터 추출
- 서비스: 필터링 로직 처리

---

### 2. GET /movies/:id - 특정 영화 조회

**컨트롤러:**
```typescript
@Get(':id')
getMovie(@Param('id') id: string) {
  return this.appService.getMovieById(+id);
}
```

**서비스:**
```typescript
getMovieById(id: number) {
  const movie = this.movies.find((m) => m.id === +id);

  if (!movie) {
    throw new NotFoundException(`Movie with ID ${id} not found`);
  }

  return movie;
}
```

**역할 분리:**
- 컨트롤러: URL 파라미터 추출 및 타입 변환
- 서비스: 데이터 조회 및 에러 처리

---

### 3. POST /movies - 새 영화 생성

**컨트롤러:**
```typescript
@Post()
createMovie(@Body('title') title: string) {
  return this.appService.createMovie(title);
}
```

**서비스:**
```typescript
createMovie(title: string) {
  const newMovie: Movie = {
    id: this.idCounter++,
    title: title,
    character: [],
  };
  this.movies.push(newMovie);
  return newMovie;
}
```

**역할 분리:**
- 컨트롤러: Request Body에서 데이터 추출
- 서비스: 영화 생성 로직 및 데이터 저장

---

### 4. PATCH /movies/:id - 영화 정보 수정

**컨트롤러:**
```typescript
@Patch(':id')
updateMovie(@Param('id') id: string, @Body('title') title: string) {
  return this.appService.updateMovie(+id, title);
}
```

**서비스:**
```typescript
updateMovie(id: number, title: string) {
  const movie = this.movies.find((m) => m.id === +id);
  if (!movie) {
    throw new NotFoundException(`Movie with ID ${id} not found`);
  }
  Object.assign(movie, { title });
  return movie;
}
```

**역할 분리:**
- 컨트롤러: 파라미터 추출 및 타입 변환
- 서비스: 데이터 수정 로직 및 에러 처리

---

### 5. DELETE /movies/:id - 영화 삭제

**컨트롤러:**
```typescript
@Delete(':id')
deleteMovie(@Param('id') id: string) {
  return this.appService.deleteMovie(+id);
}
```

**서비스:**
```typescript
deleteMovie(id: number) {
  const movieIndex = this.movies.findIndex((m) => m.id === +id);
  if (movieIndex === -1) {
    throw new NotFoundException(`Movie with ID ${id} not found`);
  }
  this.movies.splice(movieIndex, 1);
  return id;
}
```

**역할 분리:**
- 컨트롤러: URL 파라미터 추출
- 서비스: 데이터 삭제 로직 및 에러 처리

---

## 🎓 학습한 내용 요약

### 강의 내용 체크리스트

1. ✅ **Dependency Injection and Inversion of Control**
   - IoC와 DI의 개념 이해
   - 전통적인 방식 vs NestJS 방식 비교

2. ✅ **Dependency Injection and Inversion of Control NestJS 코드에서 확인해보기**
   - NestJS 코드에서 IoC/DI가 어떻게 작동하는지 확인
   - `@Injectable()`, `providers`, 생성자 주입 이해

3. ✅ **GET movie 로직 service로 전환하기**
   - `getManyMovies()` 메서드를 서비스로 이동
   - 컨트롤러에서 서비스 호출

4. ✅ **GET movie id 로직 service로 전환하기**
   - `getMovieById()` 메서드를 서비스로 이동
   - 에러 처리도 서비스로 이동

5. ✅ **POST movie 로직 service로 전환하기**
   - `createMovie()` 메서드를 서비스로 이동
   - 데이터 생성 로직 분리

6. ✅ **PATCH DELETE 엔드포인트 전환하기**
   - `updateMovie()`, `deleteMovie()` 메서드를 서비스로 이동
   - 모든 비즈니스 로직을 서비스로 완전히 분리

---

## 🔑 핵심 정리

### 의존성 주입의 3단계

1. **의존성 선언**: 생성자에서 필요한 의존성 선언
   ```typescript
   constructor(private readonly appService: AppService) {}
   ```

2. **의존성 등록**: 모듈의 `providers`에 등록
   ```typescript
   @Module({
     providers: [AppService],
   })
   ```

3. **의존성 주입**: NestJS가 자동으로 주입
   - 애플리케이션 시작 시 자동 처리

### 컨트롤러 vs 서비스

| 구분 | 컨트롤러 | 서비스 |
|------|---------|--------|
| **역할** | HTTP 요청/응답 처리 | 비즈니스 로직 처리 |
| **책임** | 파라미터 추출, 서비스 호출 | 데이터 처리, 계산, 저장 |
| **재사용성** | 낮음 (HTTP에 특화) | 높음 (여러 곳에서 사용) |
| **테스트** | HTTP 모킹 필요 | 순수 로직 테스트 가능 |
| **변경 빈도** | 상대적으로 낮음 | 비즈니스 요구사항에 따라 자주 변경 |

### @Injectable() 데코레이터

```typescript
@Injectable()
export class AppService {
  // ...
}
```

**역할:**
- NestJS에게 "이 클래스는 의존성 주입이 가능한 서비스다"라고 알림
- IoC 컨테이너에 등록되어 다른 클래스에 주입 가능
- 없으면 의존성 주입이 작동하지 않음

---

## 🚀 다음 단계

현재 구조의 장점:
- ✅ 관심사 분리 완료
- ✅ 의존성 주입 적용
- ✅ 테스트 가능한 구조
- ✅ 유지보수 용이

향후 개선 가능한 부분:
- 데이터베이스 연동 (Repository 패턴)
- DTO를 사용한 데이터 검증
- 예외 처리 전략 수립
- 로깅 및 모니터링

---

## 📌 참고사항

- NestJS는 의존성 주입을 위해 내부적으로 **싱글톤 패턴**을 사용
- 같은 서비스 인스턴스가 애플리케이션 전체에서 재사용됨
- `private readonly`를 사용하여 의존성의 불변성 보장
- 서비스는 다른 서비스에도 주입 가능 (의존성 체인 형성 가능)

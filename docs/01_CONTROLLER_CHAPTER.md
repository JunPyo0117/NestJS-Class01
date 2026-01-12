# Ch 2. 컨트롤러 (Controller) 정리

## 📋 프로젝트 개요

NestJS를 사용하여 영화(Movie) API를 구현한 프로젝트입니다. 컨트롤러 챕터에서 학습한 내용을 바탕으로 RESTful API를 구현했습니다.

## 🏗️ 프로젝트 구조

```
src/
├── main.ts              # 애플리케이션 진입점
├── app.module.ts        # 루트 모듈
├── app.controller.ts    # 영화 API 컨트롤러
└── app.service.ts       # 서비스 (현재 미사용)
```

## 📝 구현 내용

### 1. Movie 인터페이스 정의

```typescript
interface Movie {
  id: number;
  title: string;
  character: string[];
}
```

- 영화 데이터의 구조를 정의
- `id`: 고유 식별자
- `title`: 영화 제목
- `character`: 등장인물 배열

### 2. 컨트롤러 설정

```typescript
@Controller('movies')
export class AppController {
  // ...
}
```

- `@Controller('movies')` 데코레이터로 `/movies` 경로에 대한 요청을 처리
- 컨트롤러 내부에 `movies` 배열을 private 프로퍼티로 관리
- `idCounter`를 사용하여 새 영화 생성 시 자동으로 ID 할당

### 3. 초기 데이터

```typescript
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
```

## 🔌 API 엔드포인트

### 1. GET /movies - 전체 영화 목록 조회

**구현 코드:**
```typescript
@Get()
getMovies(@Query('title') title: string) {
  if (!title) {
    return this.movies;
  }
  return this.movies.filter((m) => m.title.startsWith(title));
}
```

**기능:**
- Query Parameter가 없으면 전체 영화 목록 반환
- `?title=해리`와 같이 Query Parameter를 전달하면 제목으로 필터링
- `startsWith()` 메서드를 사용하여 부분 일치 검색

**사용 예시:**
- `GET /movies` → 전체 영화 목록
- `GET /movies?title=해리` → 제목이 "해리"로 시작하는 영화만 반환

**학습 포인트:**
- `@Query()` 데코레이터로 Query Parameter 추출
- Query Parameter는 선택적(optional)이므로 조건부 처리 필요

---

### 2. GET /movies/:id - 특정 영화 조회

**구현 코드:**
```typescript
@Get(':id')
getMovie(@Param('id') id: string) {
  const movie = this.movies.find((m) => m.id === +id);

  if (!movie) {
    throw new NotFoundException(`Movie with ID ${id} not found`);
  }

  return movie;
}
```

**기능:**
- URL 경로의 `:id` 파라미터로 특정 영화 조회
- 영화를 찾지 못하면 `NotFoundException` 에러 발생

**사용 예시:**
- `GET /movies/1` → id가 1인 영화 반환
- `GET /movies/999` → 404 에러 발생

**학습 포인트:**
- `@Param('id')` 데코레이터로 경로 파라미터 추출
- `+id`는 단항 플러스 연산자로 문자열을 숫자로 변환
- `find()` 메서드로 배열에서 조건에 맞는 첫 번째 요소 찾기
- `NotFoundException`으로 적절한 HTTP 에러 응답

---

### 3. POST /movies - 새 영화 생성

**구현 코드:**
```typescript
@Post()
createMovie(@Body('title') title: string) {
  const newMovie: Movie = {
    id: this.idCounter++,
    title: title,
    character: [],
  };
  this.movies.push(newMovie);
  return newMovie;
}
```

**기능:**
- Request Body에서 `title`을 받아 새 영화 생성
- 자동으로 ID 할당 (idCounter 사용)
- 생성된 영화를 배열에 추가하고 반환

**사용 예시:**
```json
POST /movies
Content-Type: application/json

{
  "title": "어벤져스"
}
```

**학습 포인트:**
- `@Post()` 데코레이터로 POST 요청 처리
- `@Body('title')` 데코레이터로 Request Body의 특정 필드 추출
- `idCounter++`로 자동 ID 증가
- `push()` 메서드로 배열에 요소 추가

---

### 4. PATCH /movies/:id - 영화 정보 수정

**구현 코드:**
```typescript
@Patch(':id')
updateMovie(@Param('id') id: string, @Body('title') title: string) {
  const movie = this.movies.find((m) => m.id === +id);
  if (!movie) {
    throw new NotFoundException(`Movie with ID ${id} not found`);
  }
  Object.assign(movie, { title });

  return movie;
}
```

**기능:**
- 특정 ID의 영화를 찾아 제목 수정
- 영화를 찾지 못하면 `NotFoundException` 에러 발생
- 수정된 영화 정보 반환

**사용 예시:**
```json
PATCH /movies/1
Content-Type: application/json

{
  "title": "해리포터와 마법사의 돌"
}
```

**학습 포인트:**
- `@Patch()` 데코레이터로 PATCH 요청 처리
- `Object.assign()`으로 객체 속성 업데이트
- 여러 파라미터를 동시에 받을 수 있음 (`@Param`, `@Body`)

---

### 5. DELETE /movies/:id - 영화 삭제

**구현 코드:**
```typescript
@Delete(':id')
deleteMovie(@Param('id') id: string) {
  const movieIndex = this.movies.findIndex((m) => m.id === +id);
  if (movieIndex === -1) {
    throw new NotFoundException(`Movie with ID ${id} not found`);
  }
  this.movies.splice(movieIndex, 1);
  return id;
}
```

**기능:**
- 특정 ID의 영화를 배열에서 삭제
- 영화를 찾지 못하면 `NotFoundException` 에러 발생
- 삭제된 영화의 ID 반환

**사용 예시:**
- `DELETE /movies/1` → id가 1인 영화 삭제

**학습 포인트:**
- `@Delete()` 데코레이터로 DELETE 요청 처리
- `findIndex()`로 배열에서 인덱스 찾기
- `splice(index, 1)`로 배열에서 요소 제거

## 🎯 핵심 개념 정리

### 1. 데코레이터 (Decorator)

NestJS에서 사용하는 데코레이터들:

- `@Controller('path')`: 컨트롤러 클래스에 적용, 기본 경로 설정
- `@Get()`, `@Post()`, `@Patch()`, `@Delete()`: HTTP 메서드 지정
- `@Param('name')`: URL 경로 파라미터 추출
- `@Body('field')`: Request Body의 특정 필드 추출
- `@Query('name')`: Query Parameter 추출

### 2. HTTP 메서드

| 메서드 | 용도 | 예시 |
|--------|------|------|
| GET | 데이터 조회 | `GET /movies`, `GET /movies/1` |
| POST | 새 리소스 생성 | `POST /movies` |
| PATCH | 리소스 부분 수정 | `PATCH /movies/1` |
| DELETE | 리소스 삭제 | `DELETE /movies/1` |

### 3. 파라미터 타입 변환

```typescript
@Param('id') id: string  // URL에서 받은 값은 항상 문자열
const movie = this.movies.find((m) => m.id === +id);  // 숫자로 변환
```

- URL 파라미터는 항상 문자열로 전달됨
- 숫자와 비교하려면 `+id` 또는 `parseInt(id)` 사용

### 4. 에러 처리

```typescript
if (!movie) {
  throw new NotFoundException(`Movie with ID ${id} not found`);
}
```

- `NotFoundException`은 NestJS에서 제공하는 HTTP 예외
- 자동으로 404 상태 코드와 메시지 반환

## 📚 학습한 내용 요약

1. ✅ 첫 요청 보내기 - NestJS 기본 구조 이해
2. ✅ HTTP 메서드 변경 - GET, POST, PATCH, DELETE 사용
3. ✅ Movie API 설계 - RESTful API 설계 원칙
4. ✅ Movie API Path 구현 - `@Controller` 데코레이터 사용
5. ✅ GET movie 구현 - 전체 목록 조회
6. ✅ GET movie id 구현 - 특정 리소스 조회 및 에러 처리
7. ✅ POST movie 구현 - 새 리소스 생성
8. ✅ PATCH movie id 구현 - 리소스 수정
9. ✅ DELETE movie id 구현 - 리소스 삭제
10. ✅ Query Parameter 사용 - `@Query()` 데코레이터로 필터링 구현

## 🚀 실행 방법

```bash
# 개발 모드로 실행
pnpm run start:dev

# 프로덕션 빌드
pnpm run build

# 프로덕션 실행
pnpm run start:prod
```

기본 포트: `http://localhost:3000`

## 📌 참고사항

- 현재는 메모리 내 배열에 데이터를 저장 (서버 재시작 시 데이터 초기화)
- 실제 프로덕션 환경에서는 데이터베이스 연동 필요
- 에러 처리는 기본적인 `NotFoundException`만 구현
- 향후 DTO(Data Transfer Object)를 사용하여 데이터 검증 추가 가능

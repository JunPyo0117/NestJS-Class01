# Relationship 정리

## 📋 프로젝트 개요

이 챕터에서는 TypeORM의 **Relationship (관계)**을 학습하고, `Movie`와 `MovieDetail` Entity 간의 **One-to-One 관계**를 구현하여 CRUD 작업을 수행했습니다.

## 🎯 핵심 개념

### 1. Relationship (관계)란?

**Relationship**은 데이터베이스에서 두 개 이상의 테이블 간의 연결을 나타냅니다. TypeORM은 객체 지향적인 방식으로 관계를 정의할 수 있습니다.

#### 관계의 종류

TypeORM은 4가지 관계 타입을 제공합니다:

1. **One-to-One (1:1)**: 한 Entity가 다른 Entity를 하나만 가짐
2. **One-to-Many (1:N)**: 한 Entity가 여러 개의 다른 Entity를 가짐
3. **Many-to-One (N:1)**: 여러 Entity가 하나의 다른 Entity를 가짐
4. **Many-to-Many (N:N)**: 여러 Entity가 여러 개의 다른 Entity를 가짐

#### 관계의 필요성

- ✅ 데이터 중복 제거 (정규화)
- ✅ 데이터 일관성 유지
- ✅ 복잡한 데이터 구조 표현
- ✅ 효율적인 데이터 조회

---

### 2. One-to-One Relationship

**One-to-One** 관계는 한 Entity가 다른 Entity를 정확히 하나만 가지는 관계입니다.

#### 예시

- **Movie** ↔ **MovieDetail**: 영화 하나는 상세 정보 하나만 가짐
- **User** ↔ **Profile**: 사용자 하나는 프로필 하나만 가짐
- **Order** ↔ **Shipping**: 주문 하나는 배송 정보 하나만 가짐

#### 관계 방향

- **단방향 (Unidirectional)**: 한 쪽에서만 관계 참조
- **양방향 (Bidirectional)**: 양쪽에서 서로 참조

---

## 📝 현재 프로젝트 구조

### 1. Movie Entity (소유 측)

**파일 위치:** `src/movie/entity/movie.entity.ts`

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { BaseTable } from './base-table.entity';
import { MovieDetail } from './movie-detail.entity';

@Entity()
export class Movie extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  genre: string;

  @OneToOne(() => MovieDetail, (movieDetail) => movieDetail.id, {
    cascade: true,
  })
  @JoinColumn()
  detail: MovieDetail;
}
```

**주요 특징:**
- `@OneToOne()`: One-to-One 관계 정의
- `@JoinColumn()`: 외래 키(Foreign Key)가 `movie` 테이블에 생성됨
- `cascade: true`: Movie 저장 시 MovieDetail도 자동 저장

**관계 설정:**
- `() => MovieDetail`: 관계 대상 Entity
- `(movieDetail) => movieDetail.id`: 관계 필드 (선택적)
- `cascade: true`: 자동 저장/업데이트/삭제

---

### 2. MovieDetail Entity (대상 측)

**파일 위치:** `src/movie/entity/movie-detail.entity.ts`

```typescript
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Movie } from './movie.entity';

@Entity()
export class MovieDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  detail: string;

  @OneToOne(() => Movie, (movie) => movie.id)
  movie: Movie;
}
```

**주요 특징:**
- `@OneToOne()`: 역방향 관계 정의
- `@JoinColumn()` 없음: 외래 키는 `movie` 테이블에 있음
- 양방향 관계 설정

---

### 3. 생성되는 테이블 구조

```sql
-- movie 테이블
CREATE TABLE movie (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  genre VARCHAR NOT NULL,
  "detailId" INTEGER UNIQUE,  -- 외래 키 (JoinColumn으로 생성)
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL,
  version INTEGER NOT NULL,
  FOREIGN KEY ("detailId") REFERENCES movie_detail(id)
);

-- movie_detail 테이블
CREATE TABLE movie_detail (
  id SERIAL PRIMARY KEY,
  detail VARCHAR NOT NULL
);
```

**특징:**
- `movie` 테이블에 `detailId` 컬럼 생성 (외래 키)
- `UNIQUE` 제약으로 One-to-One 관계 보장
- `@JoinColumn()`이 있는 쪽에 외래 키 생성

---

## 🔍 Relationship 데코레이터

### 1. @OneToOne()

One-to-One 관계를 정의합니다.

```typescript
@OneToOne(() => MovieDetail, (movieDetail) => movieDetail.id, {
  cascade: true,
})
detail: MovieDetail;
```

**파라미터:**
1. **타겟 Entity**: `() => MovieDetail` (함수로 전달하여 순환 참조 방지)
2. **역방향 관계 필드** (선택적): `(movieDetail) => movieDetail.id`
3. **옵션**:
   - `cascade`: 자동 저장/업데이트/삭제 여부
   - `eager`: 자동 로드 여부
   - `onDelete`: 삭제 시 동작 ('CASCADE', 'SET NULL' 등)

---

### 2. @JoinColumn()

외래 키 컬럼을 정의합니다.

```typescript
@OneToOne(() => MovieDetail)
@JoinColumn()
detail: MovieDetail;
```

**특징:**
- `@JoinColumn()`이 있는 쪽에 외래 키 생성
- One-to-One 관계에서는 한 쪽에만 사용
- 컬럼 이름 커스터마이징 가능: `@JoinColumn({ name: 'custom_id' })`

---

### 3. @ManyToOne()

Many-to-One 관계를 정의합니다.

```typescript
@ManyToOne(() => Director, (director) => director.movies)
director: Director;
```

**사용 예시:**
```typescript
// 감독은 여러 영화를 만들 수 있음
@Entity()
export class Movie {
  @ManyToOne(() => Director)
  director: Director;
}
```

---

### 4. @OneToMany()

One-to-Many 관계를 정의합니다.

```typescript
@OneToMany(() => Movie, (movie) => movie.director)
movies: Movie[];
```

**사용 예시:**
```typescript
// 감독은 여러 영화를 가짐
@Entity()
export class Director {
  @OneToMany(() => Movie, (movie) => movie.director)
  movies: Movie[];
}
```

---

### 5. @ManyToMany()

Many-to-Many 관계를 정의합니다.

```typescript
@ManyToMany(() => Genre, (genre) => genre.movies)
@JoinTable()
genres: Genre[];
```

**특징:**
- 중간 테이블(Join Table) 자동 생성
- `@JoinTable()`은 한 쪽에만 사용

---

## 🔄 CRUD 작업

### 1. Create (생성)

**파일 위치:** `src/movie/movie.service.ts`

```typescript
async createMovie(CreateMovieDto: CreateMovieDto) {
  const movie = await this.movieRepository.save({
    title: CreateMovieDto.title,
    genre: CreateMovieDto.genre,
    detail: {
      detail: CreateMovieDto.detail,
    },
  });

  return movie;
}
```

**특징:**
- `cascade: true` 옵션으로 `detail` 객체를 함께 저장하면 자동으로 `MovieDetail`도 생성됨
- 별도로 `movieDetailRepository.save()` 호출 불필요
- 중첩 객체로 관계 Entity 생성

**요청 예시:**
```json
POST /movie
{
  "title": "인터스텔라",
  "genre": "sci-fi",
  "detail": "우주를 배경으로 한 SF 영화"
}
```

**응답:**
```json
{
  "id": 1,
  "title": "인터스텔라",
  "genre": "sci-fi",
  "detail": {
    "id": 1,
    "detail": "우주를 배경으로 한 SF 영화"
  },
  "createdAt": "2026-01-12T10:08:54.573Z",
  "updatedAt": "2026-01-12T10:08:54.573Z",
  "version": 1
}
```

---

### 2. Read (조회)

#### 단일 조회 (관계 포함)

```typescript
async getMovieById(id: number) {
  const movie = await this.movieRepository.findOne({
    where: { id },
    relations: ['detail'],
  });

  if (!movie) {
    throw new NotFoundException(`Movie with ID ${id} not found`);
  }

  return movie;
}
```

**특징:**
- `relations: ['detail']`: 관계 Entity도 함께 로드
- `relations` 없으면 `detail`은 `undefined`
- JOIN 쿼리로 한 번에 조회

**응답:**
```json
{
  "id": 1,
  "title": "인터스텔라",
  "genre": "sci-fi",
  "detail": {
    "id": 1,
    "detail": "우주를 배경으로 한 SF 영화"
  },
  "createdAt": "2026-01-12T10:08:54.573Z",
  "updatedAt": "2026-01-12T10:08:54.573Z",
  "version": 1
}
```

#### 전체 조회

```typescript
async getManyMovies(title?: string) {
  if (!title) {
    return [
      await this.movieRepository.find(),
      await this.movieRepository.count(),
    ];
  }

  if (title) {
    return await this.movieRepository.findAndCount({
      where: { title: Like(`%${title}%`) },
    });
  }
}
```

**참고:**
- `relations: ['detail']`을 추가하면 관계도 함께 로드
- 현재는 관계 없이 조회

---

### 3. Update (수정)

```typescript
async updateMovie(id: number, UpdateMovieDto: UpdateMovieDto) {
  const movie = await this.movieRepository.findOne({
    where: { id },
    relations: ['detail'],
  });
  if (!movie) {
    throw new NotFoundException(`Movie with ID ${id} not found`);
  }

  const { detail, ...movieRest } = UpdateMovieDto;

  await this.movieRepository.update({ id }, movieRest);

  if (detail) {
    await this.movieDetailRepository.update(
      { id: movie.detail.id },
      { detail },
    );
  }

  const newMovie = await this.movieRepository.findOne({
    where: { id },
    relations: ['detail'],
  });

  return newMovie;
}
```

**특징:**
- `detail` 필드를 분리하여 처리
- `movieRest`로 Movie 필드만 업데이트
- `detail`이 있으면 `MovieDetail`도 별도로 업데이트
- `cascade: true`가 있어도 `update()`는 수동 처리 필요

**요청 예시:**
```json
PATCH /movie/1
{
  "title": "인터스텔라 (수정)",
  "detail": "수정된 상세 정보"
}
```

---

### 4. Delete (삭제)

```typescript
async deleteMovie(id: number) {
  const movie = await this.movieRepository.findOne({
    where: { id },
    relations: ['detail'],
  });
  if (!movie) {
    throw new NotFoundException(`Movie with ID ${id} not found`);
  }
  await this.movieRepository.delete(id);
  await this.movieDetailRepository.delete({ id: movie.detail.id });

  return id;
}
```

**특징:**
- 관계 Entity도 함께 삭제해야 함
- `cascade: true`가 있어도 `delete()`는 수동 처리 필요
- `relations: ['detail']`로 관계를 로드한 후 삭제

**주의사항:**
- `cascade: true`와 `onDelete: 'CASCADE'`를 함께 사용하면 자동 삭제 가능

---

## 🔄 Cascade 옵션

### Cascade란?

**Cascade**는 부모 Entity의 변경사항이 자식 Entity에 자동으로 전파되는 기능입니다.

#### Cascade 옵션

```typescript
@OneToOne(() => MovieDetail, {
  cascade: true,  // 또는 ['insert', 'update', 'remove']
})
detail: MovieDetail;
```

**옵션 값:**
- `true`: 모든 작업 (insert, update, remove) 자동 전파
- `false`: 자동 전파 없음 (기본값)
- `['insert', 'update']`: 특정 작업만 자동 전파

---

### Cascade 사용 예시

#### Before (Cascade 없음)

```typescript
// MovieDetail을 먼저 저장
const movieDetail = await this.movieDetailRepository.save({
  detail: CreateMovieDto.detail,
});

// 그 다음 Movie 저장
const movie = await this.movieRepository.save({
  title: CreateMovieDto.title,
  genre: CreateMovieDto.genre,
  detail: movieDetail,
});
```

**문제점:**
- 두 번의 저장 작업 필요
- 코드가 복잡해짐

---

#### After (Cascade 사용)

```typescript
// Movie만 저장하면 MovieDetail도 자동 저장
const movie = await this.movieRepository.save({
  title: CreateMovieDto.title,
  genre: CreateMovieDto.genre,
  detail: {
    detail: CreateMovieDto.detail,
  },
});
```

**장점:**
- 한 번의 저장으로 모두 처리
- 코드가 간결해짐
- 트랜잭션 내에서 자동 처리

---

### Cascade 주의사항

1. **save()만 적용**: `save()` 메서드에만 cascade 적용
2. **update()는 제외**: `update()` 메서드는 cascade 적용 안 됨
3. **delete()는 제외**: `delete()` 메서드는 cascade 적용 안 됨 (onDelete 옵션 사용)

**onDelete 옵션:**
```typescript
@OneToOne(() => MovieDetail, {
  cascade: true,
  onDelete: 'CASCADE',  // Movie 삭제 시 MovieDetail도 자동 삭제
})
detail: MovieDetail;
```

---

## 🔍 관계 로드 방법

### 1. relations 옵션

```typescript
const movie = await this.movieRepository.findOne({
  where: { id },
  relations: ['detail'],
});
```

**특징:**
- 명시적으로 관계 로드
- 필요한 관계만 선택적으로 로드 가능
- 여러 관계: `relations: ['detail', 'director', 'genres']`

---

### 2. eager 옵션

```typescript
@OneToOne(() => MovieDetail, {
  eager: true,  // 항상 자동 로드
})
detail: MovieDetail;
```

**특징:**
- 항상 관계가 자동으로 로드됨
- `relations` 옵션 불필요
- 성능에 영향 가능 (불필요한 조인 발생)

---

### 3. QueryBuilder 사용

```typescript
const movie = await this.movieRepository
  .createQueryBuilder('movie')
  .leftJoinAndSelect('movie.detail', 'detail')
  .where('movie.id = :id', { id })
  .getOne();
```

**특징:**
- 복잡한 조인 조건 가능
- 성능 최적화 가능
- 더 세밀한 제어

---

## 🎓 학습한 내용 요약

### 강의 내용 체크리스트

1. ✅ **Relationship 이론**
   - Relationship의 개념과 종류
   - One-to-One, One-to-Many, Many-to-One, Many-to-Many 이해
   - 관계의 필요성과 장점

2. ✅ **One to One Relationship 객체 만들어보기**
   - `@OneToOne()` 데코레이터 사용
   - `@JoinColumn()` 데코레이터 사용
   - 양방향 관계 설정

3. ✅ **One to One Relationship Create 작업 해보기**
   - `cascade: true` 옵션으로 자동 저장
   - 중첩 객체로 관계 Entity 생성

4. ✅ **One to One Relationship Read 작업 해보기**
   - `relations: ['detail']`로 관계 로드
   - JOIN 쿼리로 한 번에 조회

5. ✅ **One to One Relationship Update 작업 해보기**
   - 관계 Entity 별도 업데이트
   - 분리된 필드 처리

6. ✅ **One to One Relationship Delete 작업 해보기**
   - 관계 Entity 수동 삭제
   - `onDelete: 'CASCADE'` 옵션 이해

7. ✅ **Cascade 옵션 사용해보기**
   - `cascade: true` 옵션 적용
   - 자동 저장/업데이트/삭제 이해

---

## 🔑 핵심 정리

### Relationship 종류 비교

| 관계 | 데코레이터 | 예시 | 외래 키 위치 |
|------|-----------|------|-------------|
| **One-to-One** | `@OneToOne()` | Movie ↔ MovieDetail | 한 쪽 (JoinColumn) |
| **One-to-Many** | `@OneToMany()` | Director → Movies | Many 쪽 |
| **Many-to-One** | `@ManyToOne()` | Movies → Director | Many 쪽 |
| **Many-to-Many** | `@ManyToMany()` | Movies ↔ Genres | 중간 테이블 |

### 현재 프로젝트 구조

**Movie Entity:**
```typescript
@OneToOne(() => MovieDetail, {
  cascade: true,
})
@JoinColumn()
detail: MovieDetail;
```

**MovieDetail Entity:**
```typescript
@OneToOne(() => Movie, (movie) => movie.id)
movie: Movie;
```

**특징:**
- 양방향 One-to-One 관계
- `cascade: true`로 자동 저장
- `@JoinColumn()`으로 외래 키는 `movie` 테이블에 생성

### Cascade 옵션 정리

| 옵션 | save() | update() | delete() |
|------|--------|----------|----------|
| `cascade: true` | ✅ 적용 | ❌ 미적용 | ❌ 미적용 |
| `onDelete: 'CASCADE'` | - | - | ✅ 적용 |

---

## 🚀 다음 단계

현재 구조의 장점:
- ✅ One-to-One 관계 구현 완료
- ✅ Cascade로 자동 저장
- ✅ CRUD 작업 모두 구현

향후 개선 가능한 부분:
- One-to-Many 관계 구현 (Director → Movies)
- Many-to-Many 관계 구현 (Movies ↔ Genres)
- Eager Loading vs Lazy Loading 최적화
- 관계 삭제 시 `onDelete` 옵션 활용

---

## 📌 참고사항

### 프로젝트에서 사용 중인 기능

**Entity 관계 설정:**
```typescript
// Movie Entity
@OneToOne(() => MovieDetail, {
  cascade: true,
})
@JoinColumn()
detail: MovieDetail;

// MovieDetail Entity
@OneToOne(() => Movie, (movie) => movie.id)
movie: Movie;
```

**CRUD 작업:**
- **Create**: `cascade: true`로 자동 저장
- **Read**: `relations: ['detail']`로 관계 로드
- **Update**: 관계 Entity 별도 업데이트
- **Delete**: 관계 Entity 수동 삭제

### 주의사항

1. **순환 참조 방지**
   - Entity import 시 함수로 전달: `() => MovieDetail`
   - 직접 import하면 순환 참조 오류 발생

2. **외래 키 위치**
   - `@JoinColumn()`이 있는 쪽에 외래 키 생성
   - One-to-One에서는 한 쪽에만 사용

3. **Cascade 제한**
   - `save()`에만 적용
   - `update()`, `delete()`는 수동 처리 또는 `onDelete` 옵션 사용

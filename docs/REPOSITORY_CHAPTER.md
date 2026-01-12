# Repository CRUD 작업 정리

## 📋 프로젝트 개요

이 챕터에서는 **Repository 패턴**을 학습하고, TypeORM의 Repository를 사용하여 Movie API에 CRUD 작업을 적용했습니다.

## 🎯 핵심 개념

### 1. Repository 패턴이란?

**Repository 패턴**은 데이터 접근 로직을 캡슐화하여 비즈니스 로직과 데이터베이스 사이의 추상화 계층을 제공하는 디자인 패턴입니다.

#### Repository 패턴의 목적

1. **데이터 접근 로직 분리**: 비즈니스 로직과 데이터 접근 로직 분리
2. **테스트 용이성**: Mock Repository로 쉽게 테스트 가능
3. **유지보수성**: 데이터베이스 변경 시 Repository만 수정
4. **재사용성**: 여러 서비스에서 동일한 Repository 사용

#### 전통적인 방식 vs Repository 패턴

**Before (직접 SQL 쿼리):**
```typescript
// 서비스에서 직접 데이터베이스 접근
async getMovieById(id: number) {
  const result = await this.db.query('SELECT * FROM movie WHERE id = $1', [id]);
  return result.rows[0];
}
```

**After (Repository 패턴):**
```typescript
// Repository를 통한 데이터 접근
async getMovieById(id: number) {
  return await this.movieRepository.findOne({ where: { id } });
}
```

**장점:**
- ✅ SQL 쿼리 작성 불필요
- ✅ 타입 안정성
- ✅ 코드 가독성 향상
- ✅ 데이터베이스 독립적

---

### 2. TypeORM Repository란?

**TypeORM Repository**는 Entity에 대한 데이터베이스 작업을 수행하는 객체입니다.

#### Repository의 역할

- ✅ Entity의 CRUD 작업 수행
- ✅ 복잡한 쿼리 작성
- ✅ 트랜잭션 관리
- ✅ 관계(Relations) 처리

#### Repository 생성 방법

```typescript
// 1. 모듈에 Repository 등록
@Module({
  imports: [TypeOrmModule.forFeature([Movie])],
})
export class MovieModule {}

// 2. 서비스에 Repository 주입
@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
  ) {}
}
```

---

## 📝 현재 프로젝트 구조

### 1. MovieModule (Repository 등록)

**파일 위치:** `src/movie/movie.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { Movie } from './entity/movie.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Movie])],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
```

**주요 특징:**
- `TypeOrmModule.forFeature([Movie])`: Movie Entity의 Repository를 모듈에 등록
- 이제 `MovieService`에서 `@InjectRepository(Movie)`로 Repository 주입 가능

---

### 2. MovieService (Repository 사용)

**파일 위치:** `src/movie/movie.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { Movie } from './entity/movie.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
  ) {}

  getManyMovies(title?: string) {
    return this.movieRepository.find();
  }

  async getMovieById(id: number) {
    const movie = await this.movieRepository.findOne({ where: { id } });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    return movie;
  }

  async createMovie(CreateMovieDto: CreateMovieDto) {
    const movie = await this.movieRepository.save(CreateMovieDto);
    return movie;
  }

  async updateMovie(id: number, UpdateMovieDto: UpdateMovieDto) {
    const movie = await this.movieRepository.findOne({ where: { id } });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    await this.movieRepository.update({ id }, UpdateMovieDto);
    const newMovie = await this.movieRepository.findOne({ where: { id } });
    return newMovie;
  }

  async deleteMovie(id: number) {
    const movie = await this.movieRepository.findOne({ where: { id } });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    await this.movieRepository.delete(id);
    return id;
  }
}
```

**주요 특징:**
- `@InjectRepository(Movie)`: Movie Entity의 Repository 주입
- 모든 CRUD 작업을 Repository 메서드로 수행
- 메모리 배열 대신 데이터베이스 사용

---

## 🔍 Repository CRUD 작업

### 1. Create (생성)

#### save() 메서드

```typescript
async createMovie(CreateMovieDto: CreateMovieDto) {
  const movie = await this.movieRepository.save(CreateMovieDto);
  return movie;
}
```

**특징:**
- Entity 인스턴스 또는 일반 객체를 받음
- 새 레코드 생성 또는 기존 레코드 업데이트
- 생성된 Entity 반환 (ID, createdAt 등 자동 설정)

**동작:**
1. DTO를 Entity로 변환
2. 데이터베이스에 INSERT
3. 생성된 Entity 반환 (id, createdAt, updatedAt, version 자동 설정)

---

### 2. Read (조회)

#### find() - 전체 조회

```typescript
getManyMovies(title?: string) {
  return this.movieRepository.find();
}
```

**특징:**
- 모든 레코드 조회
- 옵션으로 조건, 정렬, 관계 등 지정 가능

**옵션 예시:**
```typescript
// 조건 추가
this.movieRepository.find({
  where: { genre: 'fantasy' },
  order: { createdAt: 'DESC' },
  take: 10,  // LIMIT
  skip: 0,   // OFFSET
});
```

#### findOne() - 단일 조회

```typescript
async getMovieById(id: number) {
  const movie = await this.movieRepository.findOne({ where: { id } });
  if (!movie) {
    throw new NotFoundException(`Movie with ID ${id} not found`);
  }
  return movie;
}
```

**특징:**
- 조건에 맞는 첫 번째 레코드 조회
- 없으면 `null` 반환
- 에러 처리 필요

**옵션 예시:**
```typescript
// 여러 조건
this.movieRepository.findOne({
  where: { id: 1, genre: 'fantasy' },
});

// 관계 포함
this.movieRepository.findOne({
  where: { id: 1 },
  relations: ['author', 'reviews'],
});
```

#### findOneBy() - 간단한 조회 (TypeORM 0.3+)

```typescript
const movie = await this.movieRepository.findOneBy({ id });
```

**특징:**
- `findOne({ where: { id } })`의 간단한 버전
- 조건만 전달하면 됨

---

### 3. Update (수정)

#### update() 메서드

```typescript
async updateMovie(id: number, UpdateMovieDto: UpdateMovieDto) {
  const movie = await this.movieRepository.findOne({ where: { id } });
  if (!movie) {
    throw new NotFoundException(`Movie with ID ${id} not found`);
  }
  await this.movieRepository.update({ id }, UpdateMovieDto);
  const newMovie = await this.movieRepository.findOne({ where: { id } });
  return newMovie;
}
```

**특징:**
- 조건에 맞는 레코드 업데이트
- Entity를 반환하지 않음 (영향받은 행 수만 반환)
- 업데이트된 Entity를 받으려면 다시 조회 필요

**대안: save() 사용**

```typescript
async updateMovie(id: number, UpdateMovieDto: UpdateMovieDto) {
  const movie = await this.movieRepository.findOne({ where: { id } });
  if (!movie) {
    throw new NotFoundException(`Movie with ID ${id} not found`);
  }
  Object.assign(movie, UpdateMovieDto);
  return await this.movieRepository.save(movie);
}
```

**장점:**
- 한 번의 쿼리로 업데이트 및 조회
- Entity 인스턴스 반환

---

### 4. Delete (삭제)

#### delete() 메서드

```typescript
async deleteMovie(id: number) {
  const movie = await this.movieRepository.findOne({ where: { id } });
  if (!movie) {
    throw new NotFoundException(`Movie with ID ${id} not found`);
  }
  await this.movieRepository.delete(id);
  return id;
}
```

**특징:**
- 조건에 맞는 레코드 삭제
- Entity를 반환하지 않음
- 삭제 전 존재 여부 확인 필요

**대안: remove() 사용**

```typescript
async deleteMovie(id: number) {
  const movie = await this.movieRepository.findOne({ where: { id } });
  if (!movie) {
    throw new NotFoundException(`Movie with ID ${id} not found`);
  }
  await this.movieRepository.remove(movie);
  return id;
}
```

**차이점:**
- `delete()`: ID나 조건으로 삭제 (빠름)
- `remove()`: Entity 인스턴스로 삭제 (관계 처리 가능)

---

## 🔄 Before & After 비교

### Before (메모리 배열 사용)

```typescript
@Injectable()
export class MovieService {
  private movies: Movie[] = [];
  private idCounter = 3;

  getManyMovies() {
    return this.movies;
  }

  getMovieById(id: number) {
    const movie = this.movies.find((m) => m.id === +id);
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    return movie;
  }

  createMovie(CreateMovieDto: CreateMovieDto) {
    const newMovie: Movie = {
      id: this.idCounter++,
      ...CreateMovieDto,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 0,
    };
    this.movies.push(newMovie);
    return newMovie;
  }
}
```

**문제점:**
- ❌ 서버 재시작 시 데이터 손실
- ❌ 여러 서버 인스턴스 간 데이터 공유 불가
- ❌ 영구 저장 불가
- ❌ 트랜잭션 관리 불가

---

### After (Repository 사용)

```typescript
@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
  ) {}

  getManyMovies() {
    return this.movieRepository.find();
  }

  async getMovieById(id: number) {
    const movie = await this.movieRepository.findOne({ where: { id } });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    return movie;
  }

  async createMovie(CreateMovieDto: CreateMovieDto) {
    const movie = await this.movieRepository.save(CreateMovieDto);
    return movie;
  }
}
```

**장점:**
- ✅ 데이터베이스에 영구 저장
- ✅ 서버 재시작 후에도 데이터 유지
- ✅ 여러 서버 인스턴스 간 데이터 공유
- ✅ 트랜잭션 관리 가능
- ✅ 복잡한 쿼리 작성 가능

---

## 📚 Repository 주요 메서드

### 조회 메서드

| 메서드 | 용도 | 반환값 |
|--------|------|--------|
| `find()` | 전체 조회 | `Entity[]` |
| `findOne()` | 단일 조회 | `Entity \| null` |
| `findOneBy()` | 간단한 단일 조회 | `Entity \| null` |
| `findBy()` | 조건 조회 | `Entity[]` |
| `count()` | 개수 조회 | `number` |
| `exist()` | 존재 여부 | `boolean` |

### 수정 메서드

| 메서드 | 용도 | 반환값 |
|--------|------|--------|
| `save()` | 생성/수정 | `Entity` |
| `update()` | 업데이트 | `UpdateResult` |
| `upsert()` | 생성 또는 업데이트 | `InsertResult` |

### 삭제 메서드

| 메서드 | 용도 | 반환값 |
|--------|------|--------|
| `delete()` | 조건 삭제 | `DeleteResult` |
| `remove()` | Entity 삭제 | `Entity` |
| `softDelete()` | 소프트 삭제 | `UpdateResult` |

---

## 🎓 학습한 내용 요약

### 강의 내용 체크리스트

1. ✅ **Repository CRUD 작업 이론**
   - Repository 패턴의 개념과 목적
   - TypeORM Repository의 역할
   - CRUD 작업 메서드 학습

2. ✅ **Movie API에 Repository 적용해보기**
   - `TypeOrmModule.forFeature()`로 Repository 등록
   - `@InjectRepository()`로 Repository 주입
   - 메모리 배열 대신 Repository 사용
   - 모든 CRUD 작업을 Repository 메서드로 구현

---

## 🔑 핵심 정리

### Repository 패턴의 장점

| 구분 | 메모리 배열 | Repository |
|------|------------|------------|
| **데이터 저장** | 임시 (메모리) | 영구 (데이터베이스) |
| **서버 재시작** | 데이터 손실 | 데이터 유지 |
| **확장성** | 제한적 | 높음 |
| **트랜잭션** | 불가 | 가능 |
| **복잡한 쿼리** | 어려움 | 쉬움 |

### Repository 등록 과정

1. **모듈에 Repository 등록**
   ```typescript
   @Module({
     imports: [TypeOrmModule.forFeature([Movie])],
   })
   ```

2. **서비스에 Repository 주입**
   ```typescript
   constructor(
     @InjectRepository(Movie)
     private readonly movieRepository: Repository<Movie>,
   ) {}
   ```

3. **CRUD 작업 수행**
   ```typescript
   await this.movieRepository.save(movie);
   await this.movieRepository.find();
   await this.movieRepository.update({ id }, data);
   await this.movieRepository.delete(id);
   ```

---

## 🚀 다음 단계

현재 구조의 장점:
- ✅ Repository 패턴으로 데이터 접근 로직 분리
- ✅ 데이터베이스에 영구 저장
- ✅ 타입 안전한 데이터 접근

향후 개선 가능한 부분:
- 쿼리 빌더 사용 (복잡한 쿼리)
- 트랜잭션 관리
- 관계(Relations) 처리
- 소프트 삭제 (Soft Delete)
- 페이징 및 정렬
- 검색 기능 구현

---

## 📌 참고사항

### 프로젝트에서 사용 중인 Repository 메서드

**조회:**
```typescript
this.movieRepository.find()                    // 전체 조회
this.movieRepository.findOne({ where: { id } }) // 단일 조회
```

**생성:**
```typescript
this.movieRepository.save(CreateMovieDto)      // 생성
```

**수정:**
```typescript
this.movieRepository.update({ id }, UpdateMovieDto)  // 업데이트
```

**삭제:**
```typescript
this.movieRepository.delete(id)               // 삭제
```

### 주의사항

1. **비동기 처리**
   - Repository 메서드는 모두 비동기
   - `await` 키워드 필수

2. **에러 처리**
   - `findOne()`은 `null` 반환 가능
   - 항상 존재 여부 확인 필요

3. **트랜잭션**
   - 여러 작업을 하나의 트랜잭션으로 묶으려면 `@Transactional()` 사용

4. **성능**
   - `find()`는 모든 레코드를 메모리에 로드
   - 대량 데이터는 `take`, `skip` 사용

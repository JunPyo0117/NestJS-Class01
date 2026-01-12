# Ch 2. TypeORM 기본기 정리

## 📋 프로젝트 개요

이 챕터에서는 **TypeORM**을 사용하여 데이터베이스와의 연결을 설정하고, Entity를 정의하여 테이블을 생성하는 방법을 학습했습니다.

## 🎯 핵심 개념

### 1. TypeORM이란?

**TypeORM**은 TypeScript와 JavaScript를 위한 ORM (Object-Relational Mapping) 라이브러리입니다.

#### ORM이란?

ORM은 객체와 관계형 데이터베이스 간의 데이터를 자동으로 매핑해주는 기술입니다.

**장점:**
- ✅ SQL 쿼리를 직접 작성하지 않아도 됨
- ✅ 타입 안정성 제공
- ✅ 데이터베이스 독립적 (PostgreSQL, MySQL, SQLite 등 지원)
- ✅ 마이그레이션 관리
- ✅ 관계(Relations) 쉽게 정의

#### 설치

```bash
pnpm add @nestjs/typeorm typeorm pg
```

**의존성:**
- `@nestjs/typeorm`: NestJS용 TypeORM 모듈
- `typeorm`: TypeORM 코어 라이브러리
- `pg`: PostgreSQL 드라이버

---

### 2. DataSource란?

**DataSource**는 데이터베이스 연결 정보를 담고 있는 객체입니다.

#### DataSource 구성 요소

1. **type**: 데이터베이스 종류 (postgres, mysql, sqlite 등)
2. **host**: 데이터베이스 호스트 주소
3. **port**: 데이터베이스 포트 번호
4. **username**: 데이터베이스 사용자명
5. **password**: 데이터베이스 비밀번호
6. **database**: 데이터베이스 이름
7. **entities**: Entity 클래스 배열
8. **synchronize**: 스키마 자동 동기화 여부

---

## 📝 현재 프로젝트 구조

### 1. Movie Entity (테이블 정의)

**파일 위치:** `src/movie/entity/movie.entity.ts`

```typescript
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

@Entity()
export class Movie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  genre: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;
}
```

**역할:**
- 데이터베이스의 `movie` 테이블 구조를 정의
- 각 필드는 테이블의 컬럼에 매핑됨
- TypeORM이 자동으로 테이블 생성

---

### 2. AppModule (DataSource 설정)

**파일 위치:** `src/app.module.ts`

```typescript
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Joi from 'joi';
import { Movie } from './movie/entity/movie.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DB_TYPE: Joi.string().valid('postgres').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>('DB_TYPE') as 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [Movie],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    MovieModule,
  ],
})
export class AppModule {}
```

**주요 특징:**
- `TypeOrmModule.forRootAsync()`: 비동기로 DataSource 설정
- `ConfigService`를 사용하여 환경 변수 주입
- `Joi`로 환경 변수 검증
- `entities: [Movie]`: Movie Entity 등록
- `synchronize: true`: 스키마 자동 동기화

---

## 🔍 TypeORM 데코레이터

### 1. @Entity()

클래스를 Entity로 표시합니다. 이 클래스는 데이터베이스 테이블에 매핑됩니다.

```typescript
@Entity()
export class Movie {
  // ...
}
```

**옵션:**
```typescript
@Entity('movies')  // 테이블 이름 지정 (기본값: 클래스 이름 소문자)
export class Movie {
  // ...
}
```

---

### 2. @Column()

일반 컬럼을 정의합니다.

```typescript
@Column()
title: string;
```

**옵션:**
```typescript
@Column({
  type: 'varchar',        // 컬럼 타입
  length: 100,            // 길이 제한
  nullable: false,        // NULL 허용 여부
  default: 'default',      // 기본값
  unique: true,           // 유니크 제약
})
title: string;
```

---

### 3. @PrimaryGeneratedColumn()

자동 증가하는 기본 키(Primary Key)를 정의합니다.

```typescript
@PrimaryGeneratedColumn()
id: number;
```

**옵션:**
```typescript
@PrimaryGeneratedColumn('uuid')  // UUID 사용
id: string;

@PrimaryGeneratedColumn('increment')  // 자동 증가 (기본값)
id: number;
```

---

### 4. @CreateDateColumn()

생성 날짜를 자동으로 관리하는 컬럼입니다.

```typescript
@CreateDateColumn()
createdAt: Date;
```

**특징:**
- 레코드 생성 시 자동으로 현재 시간 설정
- 수동으로 값을 설정할 수 없음 (TypeORM이 관리)

---

### 5. @UpdateDateColumn()

수정 날짜를 자동으로 관리하는 컬럼입니다.

```typescript
@UpdateDateColumn()
updatedAt: Date;
```

**특징:**
- 레코드 수정 시 자동으로 현재 시간으로 업데이트
- 수동으로 값을 설정할 수 없음 (TypeORM이 관리)

---

### 6. @VersionColumn()

낙관적 잠금(Optimistic Locking)을 위한 버전 컬럼입니다.

```typescript
@VersionColumn()
version: number;
```

**특징:**
- 레코드 수정 시마다 자동으로 증가
- 동시 수정을 감지하여 충돌 방지

**사용 예시:**
```typescript
// 첫 번째 사용자가 데이터 수정
movie.title = '새 제목';
await repository.save(movie);  // version: 0 → 1

// 두 번째 사용자가 같은 데이터 수정 시도
movie.title = '다른 제목';
await repository.save(movie);  // OptimisticLockVersionMismatchError 발생
```

---

## 🔄 DataSource 설정 방법

### 방법 1: forRoot() - 동기 방식

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'netflix',
  entities: [Movie],
  synchronize: true,
})
```

**단점:**
- 환경 변수를 직접 사용해야 함
- 타입 안정성 부족

---

### 방법 2: forRootAsync() - 비동기 방식 (권장)

**현재 프로젝트에서 사용 중**

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    type: configService.get<string>('DB_TYPE') as 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_DATABASE'),
    entities: [Movie],
    synchronize: true,
  }),
  inject: [ConfigService],
})
```

**장점:**
- `ConfigService`를 통해 타입 안전하게 환경 변수 접근
- 의존성 주입 활용
- 테스트 시 Mock 객체 주입 가능

**구성 요소:**
- `imports`: 필요한 모듈 import
- `useFactory`: DataSource 설정을 반환하는 팩토리 함수
- `inject`: 팩토리 함수에 주입할 의존성

---

## 🔐 환경 변수 검증 (Joi)

### Joi 스키마 정의

```typescript
import Joi from 'joi';

ConfigModule.forRoot({
  validationSchema: Joi.object({
    DB_TYPE: Joi.string().valid('postgres').required(),
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().required(),
    DB_USERNAME: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_DATABASE: Joi.string().required(),
  }),
})
```

**검증 규칙:**
- `DB_TYPE`: 'postgres'만 허용
- `DB_HOST`: 문자열 필수
- `DB_PORT`: 숫자 필수
- `DB_USERNAME`: 문자열 필수
- `DB_PASSWORD`: 문자열 필수
- `DB_DATABASE`: 문자열 필수

**장점:**
- 애플리케이션 시작 시 환경 변수 검증
- 필수 환경 변수 누락 시 즉시 에러 발생
- 타입 안정성 확보

---

## 📊 Entity와 테이블 매핑

### Entity 정의

```typescript
@Entity()
export class Movie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  genre: string;
}
```

### 생성되는 테이블

```sql
CREATE TABLE movie (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  genre VARCHAR NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 0
);
```

**매핑 규칙:**
- 클래스 이름 → 테이블 이름 (소문자)
- `@Entity('custom_name')`으로 테이블 이름 지정 가능
- 컬럼 이름은 기본적으로 속성 이름과 동일
- `@Column({ name: 'custom_name' })`으로 컬럼 이름 지정 가능

---

## ⚙️ synchronize 옵션

### synchronize: true

```typescript
synchronize: true
```

**동작:**
- Entity 정의에 따라 자동으로 테이블 생성/수정
- 개발 환경에서 유용

**주의사항:**
- ⚠️ **프로덕션에서는 사용하지 말 것**
- 데이터 손실 위험
- 마이그레이션으로 관리하는 것이 안전

### synchronize: false (권장)

```typescript
synchronize: false
```

**동작:**
- 자동 동기화 비활성화
- 마이그레이션으로 스키마 관리

---

## 🎓 학습한 내용 요약

### 강의 내용 체크리스트

1. ✅ **TypeORM 기본기 - DataSource와 Column**
   - TypeORM의 개념과 목적 이해
   - DataSource 구성 요소 학습
   - `@Entity()`, `@Column()` 데코레이터 사용

2. ✅ **DataSource 정의하고 환경변수 사용해보기**
   - `TypeOrmModule.forRoot()` 사용
   - 환경 변수로 데이터베이스 연결 정보 설정
   - `ConfigModule`과 `ConfigService` 사용

3. ✅ **Joi로 환경변수 검증하고 비동기로 DataSource 생성하기**
   - `Joi`를 사용한 환경 변수 검증
   - `TypeOrmModule.forRootAsync()` 사용
   - `ConfigService`를 통한 타입 안전한 설정

4. ✅ **TypeORM으로 테이블 생성하기**
   - Entity 클래스 정의
   - `@PrimaryGeneratedColumn()`, `@CreateDateColumn()`, `@UpdateDateColumn()`, `@VersionColumn()` 사용
   - `synchronize: true`로 자동 테이블 생성

---

## 🔑 핵심 정리

### TypeORM 모듈 설정 비교

| 구분 | forRoot() | forRootAsync() |
|------|-----------|----------------|
| **방식** | 동기 | 비동기 |
| **환경 변수** | 직접 접근 | ConfigService 사용 |
| **타입 안정성** | 낮음 | 높음 |
| **테스트** | 어려움 | 쉬움 (Mock 주입) |
| **권장** | ❌ | ✅ |

### Entity 데코레이터 정리

| 데코레이터 | 용도 | 예시 |
|-----------|------|------|
| `@Entity()` | Entity 클래스 표시 | `@Entity() export class Movie` |
| `@Column()` | 일반 컬럼 | `@Column() title: string` |
| `@PrimaryGeneratedColumn()` | 자동 증가 PK | `@PrimaryGeneratedColumn() id: number` |
| `@CreateDateColumn()` | 생성 날짜 | `@CreateDateColumn() createdAt: Date` |
| `@UpdateDateColumn()` | 수정 날짜 | `@UpdateDateColumn() updatedAt: Date` |
| `@VersionColumn()` | 버전 관리 | `@VersionColumn() version: number` |

### 환경 변수 검증의 중요성

- ✅ 필수 환경 변수 누락 방지
- ✅ 잘못된 값 입력 방지
- ✅ 애플리케이션 시작 전 오류 발견
- ✅ 타입 안정성 확보

---

## 🚀 다음 단계

현재 구조의 장점:
- ✅ TypeORM으로 데이터베이스 연결 설정 완료
- ✅ Entity를 통한 타입 안전한 데이터 모델링
- ✅ 환경 변수 검증으로 안정성 확보
- ✅ 자동 날짜/버전 관리

향후 개선 가능한 부분:
- Repository 패턴으로 데이터 접근 로직 분리
- 마이그레이션으로 스키마 관리
- 관계(Relations) 정의 (OneToMany, ManyToOne 등)
- 트랜잭션 관리
- 쿼리 빌더 사용

---

## 📌 참고사항

### 프로젝트에서 사용 중인 기능

**Movie Entity:**
```typescript
@Entity()
export class Movie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  genre: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;
}
```

**AppModule 설정:**
```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    // 환경 변수로 설정
    entities: [Movie],
    synchronize: true,  // 개발 환경에서만 사용
  }),
  inject: [ConfigService],
})
```

### 환경 변수 파일 (.env)

```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=netflix
```

### 주의사항

1. **synchronize: true**
   - 개발 환경에서만 사용
   - 프로덕션에서는 `false`로 설정하고 마이그레이션 사용

2. **환경 변수 보안**
   - `.env` 파일을 `.gitignore`에 추가
   - 프로덕션에서는 환경 변수 관리 시스템 사용

3. **Entity 네이밍**
   - 클래스 이름은 PascalCase
   - 테이블 이름은 기본적으로 소문자
   - `@Entity('custom_name')`으로 커스터마이징 가능

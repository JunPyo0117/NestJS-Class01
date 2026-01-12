# Entity Embedding & Entity Inheritance 정리

## 📋 프로젝트 개요

이 챕터에서는 **Entity Embedding**과 **Entity Inheritance**를 학습하여 코드 재사용성을 높이고, Entity 구조를 개선하는 방법을 배웠습니다.

## 🎯 핵심 개념

### 1. Entity Embedding (엔티티 임베딩)이란?

**Entity Embedding**은 공통 컬럼들을 별도의 클래스로 분리하여 여러 Entity에서 재사용하는 패턴입니다.

#### Embedding의 목적

1. **코드 재사용**: 공통 컬럼을 한 곳에서 관리
2. **일관성**: 모든 Entity에서 동일한 컬럼 구조 보장
3. **유지보수성**: 공통 컬럼 변경 시 한 곳만 수정

#### Embedding vs Inheritance

| 구분 | Embedding | Inheritance |
|------|-----------|-------------|
| **관계** | 포함 (has-a) | 상속 (is-a) |
| **데코레이터** | `@Embedded()` | `extends` |
| **테이블 구조** | 같은 테이블에 포함 | 상속 방식에 따라 다름 |

---

### 2. Entity Inheritance (엔티티 상속)이란?

**Entity Inheritance**는 TypeScript의 클래스 상속을 사용하여 Entity 간 공통 속성을 공유하는 패턴입니다.

#### Inheritance의 목적

1. **코드 재사용**: 공통 속성과 메서드 상속
2. **타입 안정성**: TypeScript의 타입 시스템 활용
3. **다형성**: 부모 타입으로 여러 자식 타입 처리

#### Inheritance 전략

TypeORM은 세 가지 상속 전략을 제공합니다:

1. **Single Table Inheritance**: 하나의 테이블에 모든 클래스 저장
2. **Concrete Table Inheritance**: 각 클래스마다 별도 테이블
3. **Table Per Class Inheritance**: 부모와 자식 모두 별도 테이블

---

## 📝 현재 프로젝트 구조

### Movie Entity (Entity Inheritance 적용)

**파일 위치:** `src/movie/entity/movie.entity.ts`

```typescript
import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

// BaseEntity: 공통 컬럼 정의
export class BaseEntity {
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;
}

// Movie: BaseEntity를 상속받아 공통 컬럼 사용
@Entity()
export class Movie extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  genre: string;
}
```

**특징:**
- `BaseEntity`에 공통 컬럼 정의
- `Movie`가 `BaseEntity`를 상속받음
- `createdAt`, `updatedAt`, `version` 자동 상속

**생성되는 테이블:**
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

---

## 🔍 Entity Embedding 상세

### 1. Embeddable 클래스 정의

```typescript
import { Column } from 'typeorm';

export class Address {
  @Column()
  street: string;

  @Column()
  city: string;

  @Column()
  zipCode: string;
}
```

**특징:**
- `@Entity()` 데코레이터 없음
- 일반 클래스로 정의
- 컬럼 데코레이터만 사용

---

### 2. Entity에서 Embedding 사용

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Address } from './address.embeddable';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column(() => Address)
  address: Address;
}
```

**특징:**
- `@Column(() => Address)`: Embeddable 클래스 지정
- 같은 테이블에 컬럼으로 포함됨

**생성되는 테이블:**
```sql
CREATE TABLE user (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  street VARCHAR NOT NULL,
  city VARCHAR NOT NULL,
  "zipCode" VARCHAR NOT NULL
);
```

---

### 3. Embedding 예제

#### 예제 1: 주소 정보 Embedding

```typescript
// address.embeddable.ts
import { Column } from 'typeorm';

export class Address {
  @Column()
  street: string;

  @Column()
  city: string;

  @Column()
  country: string;

  @Column()
  zipCode: string;
}

// user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Address } from './address.embeddable';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column(() => Address)
  homeAddress: Address;

  @Column(() => Address)
  workAddress: Address;
}
```

**생성되는 테이블:**
```sql
CREATE TABLE user (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  "homeAddressStreet" VARCHAR NOT NULL,
  "homeAddressCity" VARCHAR NOT NULL,
  "homeAddressCountry" VARCHAR NOT NULL,
  "homeAddressZipCode" VARCHAR NOT NULL,
  "workAddressStreet" VARCHAR NOT NULL,
  "workAddressCity" VARCHAR NOT NULL,
  "workAddressCountry" VARCHAR NOT NULL,
  "workAddressZipCode" VARCHAR NOT NULL
);
```

---

#### 예제 2: 이름 정보 Embedding

```typescript
// name.embeddable.ts
import { Column } from 'typeorm';

export class Name {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

// person.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Name } from './name.embeddable';

@Entity()
export class Person {
  @PrimaryGeneratedColumn()
  id: number;

  @Column(() => Name)
  name: Name;

  @Column()
  email: string;
}
```

---

## 🔄 Entity Inheritance 상세

### 1. 기본 Inheritance (현재 프로젝트)

**현재 프로젝트 구조:**

```typescript
// BaseEntity: 공통 컬럼
export class BaseEntity {
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;
}

// Movie: BaseEntity 상속
@Entity()
export class Movie extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  genre: string;
}
```

**특징:**
- TypeScript 클래스 상속만 사용
- 각 Entity는 별도 테이블 생성
- 공통 컬럼이 각 테이블에 포함됨

---

### 2. Single Table Inheritance (단일 테이블 상속)

**개념:**
- 하나의 테이블에 모든 클래스의 데이터 저장
- 구분 컬럼(discriminator)으로 타입 구분
- 모든 자식 클래스의 컬럼이 하나의 테이블에 포함

**장점:**
- 조인 불필요 (성능 좋음)
- 단순한 구조

**단점:**
- 많은 NULL 컬럼 발생 가능
- 테이블이 비대해질 수 있음

---

#### Single Table Inheritance 예제

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  TableInheritance,
  ChildEntity,
} from 'typeorm';

// 부모 Entity
@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class Content {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  createdAt: Date;
}

// 자식 Entity 1: Movie
@ChildEntity()
export class Movie extends Content {
  @Column()
  director: string;

  @Column()
  duration: number; // 분 단위

  @Column()
  rating: string; // 'G', 'PG', 'PG-13', 'R'
}

// 자식 Entity 2: TVShow
@ChildEntity()
export class TVShow extends Content {
  @Column()
  season: number;

  @Column()
  episode: number;

  @Column()
  network: string;
}

// 자식 Entity 3: Book
@ChildEntity()
export class Book extends Content {
  @Column()
  author: string;

  @Column()
  pages: number;

  @Column()
  isbn: string;
}
```

**생성되는 테이블:**
```sql
CREATE TABLE content (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  "createdAt" TIMESTAMP NOT NULL,
  type VARCHAR NOT NULL,  -- discriminator 컬럼
  director VARCHAR,       -- Movie 전용
  duration INTEGER,       -- Movie 전용
  rating VARCHAR,         -- Movie 전용
  season INTEGER,         -- TVShow 전용
  episode INTEGER,        -- TVShow 전용
  network VARCHAR,        -- TVShow 전용
  author VARCHAR,         -- Book 전용
  pages INTEGER,          -- Book 전용
  isbn VARCHAR            -- Book 전용
);
```

**사용 예시:**
```typescript
// Movie 저장
const movie = new Movie();
movie.title = '인터스텔라';
movie.director = '크리스토퍼 놀란';
movie.duration = 169;
movie.rating = 'PG-13';
movie.createdAt = new Date();
await movieRepository.save(movie);
// type 컬럼에 자동으로 'Movie' 저장됨

// TVShow 저장
const tvShow = new TVShow();
tvShow.title = '왕좌의 게임';
tvShow.season = 1;
tvShow.episode = 10;
tvShow.network = 'HBO';
tvShow.createdAt = new Date();
await movieRepository.save(tvShow);
// type 컬럼에 자동으로 'TVShow' 저장됨

// 조회
const contents = await contentRepository.find();
// 모든 타입의 Content 조회

// 특정 타입만 조회
const movies = await movieRepository.find();
// type = 'Movie'인 레코드만 조회
```

---

### 3. Concrete Table Inheritance (구체 테이블 상속)

**개념:**
- 각 클래스마다 별도 테이블 생성
- 부모 클래스의 컬럼이 각 자식 테이블에 복사됨

**장점:**
- 테이블이 깔끔함 (NULL 없음)
- 각 테이블이 독립적

**단점:**
- 조인 필요 (성능 저하 가능)
- 부모 컬럼 변경 시 모든 테이블 수정 필요

---

#### Concrete Table Inheritance 예제

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  TableInheritance,
  ChildEntity,
} from 'typeorm';

// 부모 Entity
@Entity()
@TableInheritance({ type: 'concrete-table' })
export class Content {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  createdAt: Date;
}

// 자식 Entity
@ChildEntity()
export class Movie extends Content {
  @Column()
  director: string;

  @Column()
  duration: number;
}

@ChildEntity()
export class TVShow extends Content {
  @Column()
  season: number;

  @Column()
  episode: number;
}
```

**생성되는 테이블:**
```sql
-- movie 테이블
CREATE TABLE movie (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  "createdAt" TIMESTAMP NOT NULL,
  director VARCHAR NOT NULL,
  duration INTEGER NOT NULL
);

-- tv_show 테이블
CREATE TABLE tv_show (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  "createdAt" TIMESTAMP NOT NULL,
  season INTEGER NOT NULL,
  episode INTEGER NOT NULL
);
```

---

### 4. Table Per Class Inheritance (클래스당 테이블 상속)

**개념:**
- 부모와 자식 모두 별도 테이블 생성
- 부모 테이블과 자식 테이블을 조인하여 사용

**장점:**
- 정규화된 구조
- 부모 데이터 중복 없음

**단점:**
- 복잡한 조인 필요
- 성능 저하 가능

---

#### Table Per Class Inheritance 예제

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  TableInheritance,
  ChildEntity,
} from 'typeorm';

// 부모 Entity
@Entity()
@TableInheritance({ type: 'table-per-class' })
export class Content {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  createdAt: Date;
}

// 자식 Entity
@ChildEntity()
export class Movie extends Content {
  @Column()
  director: string;

  @Column()
  duration: number;
}
```

**생성되는 테이블:**
```sql
-- content 테이블
CREATE TABLE content (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  "createdAt" TIMESTAMP NOT NULL
);

-- movie 테이블
CREATE TABLE movie (
  id INTEGER PRIMARY KEY,
  director VARCHAR NOT NULL,
  duration INTEGER NOT NULL,
  FOREIGN KEY (id) REFERENCES content(id)
);
```

---

## 🔄 Embedding vs Inheritance 비교

### Embedding 사용 시나리오

**적합한 경우:**
- 여러 Entity에서 동일한 컬럼 그룹 재사용
- 값 객체(Value Object) 패턴 구현
- 복합 타입 표현 (주소, 이름 등)

**예시:**
```typescript
// 주소 정보를 여러 Entity에서 사용
@Entity()
export class User {
  @Column(() => Address)
  homeAddress: Address;
}

@Entity()
export class Company {
  @Column(() => Address)
  officeAddress: Address;
}
```

---

### Inheritance 사용 시나리오

**적합한 경우:**
- 공통 컬럼과 메서드 상속
- 다형성 필요
- 타입 계층 구조 표현

**예시:**
```typescript
// 공통 컬럼 상속
@Entity()
export class Movie extends BaseEntity {
  // createdAt, updatedAt, version 자동 상속
}

@Entity()
export class User extends BaseEntity {
  // createdAt, updatedAt, version 자동 상속
}
```

---

## 🎓 학습한 내용 요약

### 강의 내용 체크리스트

1. ✅ **Entity Embedding & Entity Inheritance 이론**
   - Embedding의 개념과 사용법
   - Inheritance의 개념과 전략
   - 각 패턴의 장단점 이해

2. ✅ **Entity Embedding & Entity Inheritance 실습**
   - Embeddable 클래스 정의
   - Entity에서 Embedding 사용
   - BaseEntity를 통한 Inheritance 구현

3. ✅ **Single Table Inheritance 실습**
   - `@TableInheritance()` 데코레이터 사용
   - `@ChildEntity()` 데코레이터 사용
   - Discriminator 컬럼 이해
   - 실제 사용 예제

---

## 🔑 핵심 정리

### Inheritance 전략 비교

| 전략 | 테이블 수 | 조인 | NULL 컬럼 | 성능 | 복잡도 |
|------|----------|------|----------|------|--------|
| **Single Table** | 1 | 불필요 | 많음 | 빠름 | 낮음 |
| **Concrete Table** | N (자식 수) | 필요 | 없음 | 보통 | 중간 |
| **Table Per Class** | N+1 | 필요 | 없음 | 느림 | 높음 |

### 현재 프로젝트 구조

**BaseEntity (공통 컬럼):**
```typescript
export class BaseEntity {
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;
}
```

**Movie Entity (상속 사용):**
```typescript
@Entity()
export class Movie extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  genre: string;
}
```

**특징:**
- TypeScript 클래스 상속 사용
- 각 Entity는 별도 테이블
- 공통 컬럼이 각 테이블에 포함

---

## 🚀 실전 예제

### 예제 1: Single Table Inheritance로 Content 관리

```typescript
// content.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  TableInheritance,
  ChildEntity,
  CreateDateColumn,
} from 'typeorm';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class Content {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @CreateDateColumn()
  createdAt: Date;
}

@ChildEntity()
export class Movie extends Content {
  @Column()
  director: string;

  @Column()
  duration: number;
}

@ChildEntity()
export class TVShow extends Content {
  @Column()
  season: number;

  @Column()
  episode: number;
}
```

**사용:**
```typescript
// Movie 저장
const movie = new Movie();
movie.title = '인터스텔라';
movie.director = '크리스토퍼 놀란';
movie.duration = 169;
await contentRepository.save(movie);

// 모든 Content 조회
const contents = await contentRepository.find();

// Movie만 조회
const movies = await movieRepository.find();
```

---

### 예제 2: Embedding으로 주소 정보 재사용

```typescript
// address.embeddable.ts
import { Column } from 'typeorm';

export class Address {
  @Column()
  street: string;

  @Column()
  city: string;

  @Column()
  country: string;

  @Column()
  zipCode: string;
}

// user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Address } from './address.embeddable';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column(() => Address)
  address: Address;
}
```

---

## 📌 참고사항

### 프로젝트에서 사용 중인 패턴

**Entity Inheritance:**
- `BaseEntity` 클래스로 공통 컬럼 정의
- `Movie`가 `BaseEntity` 상속
- 각 Entity는 별도 테이블 생성

**현재 구조의 장점:**
- ✅ 공통 컬럼 재사용
- ✅ 코드 중복 제거
- ✅ 일관된 구조

**향후 개선 가능:**
- Single Table Inheritance 적용 (Content 계층 구조)
- Embedding으로 복합 타입 표현
- 더 복잡한 상속 구조 구현

---

## 🔍 주의사항

### Inheritance 사용 시

1. **Primary Key**
   - 부모와 자식 모두 `@PrimaryGeneratedColumn()` 사용 가능
   - Single Table Inheritance에서는 하나만 사용

2. **Discriminator 컬럼**
   - Single Table Inheritance에서 필수
   - 자동으로 타입 이름 저장

3. **Repository**
   - 부모 Repository로 모든 타입 조회 가능
   - 자식 Repository로 특정 타입만 조회

### Embedding 사용 시

1. **컬럼 이름**
   - `propertyName_columnName` 형식으로 생성
   - 예: `homeAddress_street`

2. **중복 사용**
   - 같은 Embeddable을 여러 번 사용 가능
   - 각각 다른 컬럼 이름으로 생성

3. **NULL 처리**
   - Embedding된 객체는 NULL 가능
   - 필요시 `nullable: true` 옵션 사용

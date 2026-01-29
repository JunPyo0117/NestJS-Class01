# Netflix API

NestJS + TypeORM(PostgreSQL) 기반 넷플릭스 백엔드 클론 프로젝트입니다.

## 기술 스택

- **Runtime**: Node.js
- **Framework**: NestJS
- **DB**: PostgreSQL, TypeORM
- **인증**: JWT, Passport (Local, JWT)
- **문서**: Swagger
- **캐시**: @nestjs/cache-manager (메모리)
- **큐**: BullMQ (Redis) — 썸네일 생성 비동기 처리
- **실시간**: WebSocket (Socket.io) — 채팅
- **파일**: Multer, AWS S3 (presigned URL)
- **미디어**: ffmpeg (썸네일 생성)

## 주요 기능

| 도메인       | 설명                                                         |
| ------------ | ------------------------------------------------------------ |
| **Movie**    | 영화 CRUD, 커서 페이지네이션, 좋아요/싫어요, 최근 목록 캐싱  |
| **Director** | 감독 CRUD                                                    |
| **Genre**    | 장르 CRUD                                                    |
| **User**     | 회원가입, 프로필                                             |
| **Auth**     | 로그인(JWT), RBAC(Admin/PaidUser/User), Bearer 토큰 미들웨어 |
| **Chat**     | WebSocket 실시간 채팅 (유저–어드민 룸 자동 생성)             |
| **Common**   | 비디오 업로드, S3 presigned URL                              |
| **Worker**   | BullMQ + Redis 기반 썸네일 생성 (별도 프로세스)              |

## 부가 기능

- **API 문서**: Swagger (`/doc`), DTO 예시
- **캐시**: GET 목록 등 메모리 캐시 (CacheInterceptor)
- **쓰로틀**: 사용자·분당 요청 수 제한 (ThrottleInterceptor, @Throttle)
- **커서 페이지네이션**: Base64 커서 + 정렬 지원
- **트랜잭션**: HTTP/WS 트랜잭션 인터셉터

## 프로젝트 구조

```
src/
├── app.module.ts
├── main.ts
├── auth/          # 인증, RBAC, JWT
├── chat/          # WebSocket 채팅
├── common/        # 공통(캐시, 쓰로틀, BullMQ 설정, 업로드)
├── director/
├── genre/
├── movie/
├── user/
└── worker/        # 썸네일 생성 워커 (TYPE=worker 시 로드)
```

## 사전 요구 사항

- Node.js (권장 LTS)
- pnpm
- PostgreSQL
- Redis (BullMQ 큐용 — 썸네일 워커 사용 시)

## 설치

```bash
pnpm install
```

## 환경 변수

프로젝트 루트에 `.env` 파일을 만들고 아래 변수를 설정하세요.

| 변수                                                                      | 설명                    |
| ------------------------------------------------------------------------- | ----------------------- |
| `ENV`                                                                     | `test` / `dev` / `prod` |
| `DB_TYPE`                                                                 | `postgres`              |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`         | PostgreSQL 접속 정보    |
| `HASH_ROUNDS`                                                             | bcrypt 라운드 수        |
| `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`                             | JWT 시크릿              |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `BUCKET_NAME` | S3 (presigned URL 등)   |

테스트 시에는 `test.env` 사용 (`NODE_ENV=test`).

## 실행

### 메인 앱 (API 서버)

```bash
# 개발 (watch)
pnpm run start:dev
```

기본 포트: `3000`  
Swagger: http://localhost:3000/doc

### 워커 (썸네일 생성)

비디오 업로드 시 썸네일을 비동기로 만들려면 **별도 터미널**에서 워커를 실행하세요.

```bash
pnpm run start:dev:worker
```

- `TYPE=worker`, `PORT=3001` 로 실행
- Redis에 쌓인 `thumbnail-generation` 잡을 처리
- Redis 연결 정보는 `src/common/common.module.ts`의 BullModule 설정 참고

## 테스트

```bash
# 단위 + 통합 + E2E
pnpm run test

# 통합 테스트만
pnpm run test:integration

# E2E
pnpm run test:e2e

# 커버리지
pnpm run test:cov
```

## API 문서 (Swagger)

- URL: http://localhost:3000/doc
- Bearer 토큰: 로그인 후 발급된 JWT를 Swagger Authorize에 입력

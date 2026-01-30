# Netflix 프론트엔드 (React + TypeScript)

이 프로젝트는 [Netflix 백엔드 API](https://github.com/JunPyo0117/NestJS-Class01)와 연동되는 영화 스트리밍 플랫폼 프론트엔드입니다.

## 기술 스택

- React 18 + TypeScript
- Vite
- React Router v6
- Axios (API 클라이언트)
- Socket.io-client (실시간 채팅)

## 로컬 실행

1. 백엔드가 `http://localhost:3000`에서 실행 중이어야 합니다.
2. 의존성 설치 및 실행:

```bash
cd frontend
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:5173`으로 접속합니다. Vite proxy로 `/api` 요청이 백엔드로 전달됩니다.

## 환경 변수

| 변수 | 설명 |
|------|------|
| `VITE_API_BASE` | 백엔드 API Base URL. 로컬 개발 시 비워두면 `/api`(proxy) 사용. **배포 시 반드시 백엔드 URL 지정** (예: `https://xxx.elasticbeanstalk.com`) |
| `VITE_WS_BASE` | WebSocket 서버 URL. 로컬: `http://localhost:3000`, 배포: 백엔드 URL |

`.env.example`을 참고해 `.env`를 만들고 필요한 값만 설정하면 됩니다.

## 빌드 및 배포

```bash
pnpm build
```

`dist/` 폴더가 생성됩니다. 정적 호스팅(S3 + CloudFront, Vercel, Netlify 등)에 올리면 됩니다.

**배포 시**: 빌드 전에 `VITE_API_BASE`, `VITE_WS_BASE`를 실제 백엔드 주소로 설정해야 API·채팅이 동작합니다.

## 제공 기능

- **영화 목록**: 커서 페이지네이션, 제목 검색
- **영화 상세**: 재생, 좋아요/싫어요 (로그인 시)
- **로그인/회원가입**: Basic Auth → JWT (Access/Refresh)
- **문의 채팅**: WebSocket 실시간 1:1 채팅 (유저–관리자 룸 자동 생성)
- **영상 업로드**: 직접 업로드(10MB 이하) 또는 Presigned URL(대용량) 후 썸네일 트리거

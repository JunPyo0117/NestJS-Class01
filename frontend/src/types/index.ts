/** 백엔드 API 응답 타입 (영화·감독·장르·유저·채팅 등) */

export enum Role {
  admin = 0,
  paidUser = 1,
  user = 2,
}

export interface Director {
  id: number;
  name: string;
  dob: string;
  nationality: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Genre {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MovieDetail {
  id: number;
  detail: string;
}

export interface Movie {
  id: number;
  title: string;
  movieFilePath: string;
  likeCount: number;
  dislikeCount: number;
  director: Director;
  detail?: MovieDetail;
  genres: Genre[];
  creator?: { id: number; email: string };
  likeStatus?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MoviesListResponse {
  data: Movie[];
  nextCursor: string | null;
  hasNextPage: boolean;
  count: number;
}

export interface User {
  id: number;
  email: string;
  role: Role;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ChatMessage {
  id: number;
  message: string;
  author: { id: number; email: string };
  chatRoom: { id: number };
  createdAt: string;
}

export interface ChatRoom {
  id: number;
  users?: User[];
}

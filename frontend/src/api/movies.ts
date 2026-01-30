import api from './client';
import type { Movie, MoviesListResponse } from '@/types';

export interface GetMoviesParams {
  cursor?: string;
  take?: number;
  order?: string[];
  title?: string;
  /** 목록 캐시 무효화 시 사용 (좋아요/싫어요 후 복귀 시 새 데이터 로드) */
  _cacheBust?: number;
}

/** 영화 등록 (Admin 전용) - POST /movie */
export interface CreateMovieBody {
  title: string;
  detail: string;
  directorId: number;
  genreIds: number[];
  movieFileName: string;
}

export async function getMovies(params?: GetMoviesParams): Promise<MoviesListResponse> {
  // 백엔드 쿼리 검증 호환: take/order를 문자열로 전달 (쿼리스트링은 모두 문자열)
  const query: Record<string, string | number | undefined> = {};
  if (params?.take != null) query.take = params.take;
  if (params?.cursor != null && params.cursor !== '') query.cursor = params.cursor;
  if (params?.title != null && params.title !== '') query.title = params.title;
  if (params?.order != null && params.order.length > 0) {
    query.order = params.order.length === 1 ? params.order[0] : params.order.join(',');
  }
  if (params?._cacheBust != null) {
    query._ = params._cacheBust;
  }
  const { data } = await api.get<MoviesListResponse>('/movie', { params: query });
  return data;
}

export async function getMovie(id: number): Promise<Movie> {
  const { data } = await api.get<Movie>(`/movie/${id}`);
  return data;
}

export async function getRecentMovies(): Promise<Movie[]> {
  const { data } = await api.get<Movie[]>('/movie/recent');
  return data;
}

export async function likeMovie(movieId: number): Promise<unknown> {
  return api.post(`/movie/${movieId}/like`);
}

export async function dislikeMovie(movieId: number): Promise<unknown> {
  return api.post(`/movie/${movieId}/dislike`);
}

/** 영화 등록 (Admin 전용) */
export async function createMovie(body: CreateMovieBody): Promise<Movie> {
  const { data } = await api.post<Movie>('/movie', body);
  return data;
}

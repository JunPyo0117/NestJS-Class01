import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMovies } from '@/api/movies';
import { getThumbnailUrl } from '@/utils/mediaUrl';
import { ThumbUpIcon, ThumbDownIcon } from '@/components/icons';
import type { Movie, MoviesListResponse } from '@/types';

export default function MovieList() {
  const [result, setResult] = useState<MoviesListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');

  const load = async (nextCursor?: string) => {
    setLoading(true);
    setError(null);
    let cacheBust: number | undefined;
    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('movieListInvalidated')) {
        sessionStorage.removeItem('movieListInvalidated');
        cacheBust = Date.now();
      }
    } catch {
      /* ignore */
    }
    try {
      const res = await getMovies({
        take: 12,
        order: ['id_DESC'],
        title: title || undefined,
        cursor: nextCursor,
        _cacheBust: nextCursor ? undefined : cacheBust,
      });
      setResult((prev) =>
        nextCursor && prev ? { ...res, data: [...prev.data, ...res.data] } : res
      );
    } catch (e) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { status?: number; data?: unknown } }).response?.status === 400
            ? '요청 형식 오류(400). take/order 파라미터 확인.'
            : (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : (e as Error)?.message ?? '목록을 불러오지 못했습니다.';
      setError(typeof msg === 'string' ? msg : Array.isArray(msg) ? msg[0] : '목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [title]);

  const loadMore = () => {
    if (result?.nextCursor) load(result.nextCursor);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 pt-8 pb-8">
      <div className="mb-6 flex gap-2 items-center">
        <input
          type="search"
          placeholder="영화 제목 검색"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="max-w-[300px] w-full px-3 py-2.5 border border-neutral-700 rounded bg-[var(--color-card)] focus:outline-none focus:border-[var(--color-accent)]"
        />
      </div>

      {error && <p className="text-[var(--color-accent)] text-sm mb-4">{error}</p>}
      {loading && !result ? (
        <p className="flex items-center justify-center min-h-[200px] text-[var(--color-muted)]">영화 목록 로딩 중...</p>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6">
            {(result?.data ?? []).map((movie: Movie) => {
              const thumbUrl = getThumbnailUrl(movie.movieFilePath);
              return (
                <Link
                  to={`/movie/${movie.id}`}
                  key={movie.id}
                  className="block bg-[var(--color-card)] rounded-lg overflow-hidden border border-neutral-700 no-underline text-inherit transition transform hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="aspect-video bg-neutral-700 overflow-hidden">
                    {thumbUrl ? (
                      <>
                        <img
                          src={thumbUrl}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const el = e.target as HTMLImageElement;
                            el.classList.add('hidden');
                            const placeholder = el.nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden w-full h-full flex items-center justify-center text-[var(--color-muted)] text-sm bg-neutral-700">
                          썸네일 없음
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)] text-sm">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="m-0 mb-1 text-base truncate">{movie.title}</h3>
                    <p className="text-[var(--color-muted)] text-sm my-1">
                      {movie.director?.name} · {movie.genres?.map((g) => g.name).join(', ')}
                    </p>
                    <div className="flex flex-wrap gap-1.5 my-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-neutral-700/80 text-[#e5e5e5]">
                        <ThumbUpIcon className="w-3.5 h-3.5" />
                        좋아요 {Math.max(0, movie.likeCount)}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-neutral-700/80 text-[#e5e5e5]">
                        <ThumbDownIcon className="w-3.5 h-3.5" />
                        싫어요 {Math.max(0, movie.dislikeCount)}
                      </span>
                      {movie.likeStatus !== undefined && movie.likeStatus !== null && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent/20 text-accent">
                          {movie.likeStatus ? '좋아요 함' : '싫어요 함'}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {(result?.data ?? []).length === 0 && !loading && (
            <p className="text-[var(--color-muted)] mt-8">등록된 영화가 없습니다.</p>
          )}
          {result?.hasNextPage && (
            <div className="text-center mt-8">
              <button
                type="button"
                className="inline-block px-4 py-2 rounded bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? '로딩 중...' : '더 보기'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

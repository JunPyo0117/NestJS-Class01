import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMovie, likeMovie, dislikeMovie } from '@/api/movies';
import { useAuth } from '@/context/AuthContext';
import { getThumbnailUrl, getVideoUrl } from '@/utils/mediaUrl';
import { ThumbUpIcon, ThumbDownIcon } from '@/components/icons';
import type { Movie } from '@/types';

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const posterRef = useRef<HTMLImageElement | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    getMovie(Number(id))
      .then(setMovie)
      .finally(() => setLoading(false));
  }, [id]);

  const invalidateListCache = () => {
    try {
      sessionStorage.setItem('movieListInvalidated', '1');
    } catch {
      /* ignore */
    }
  };

  const handleLike = async () => {
    if (!movie || !user || actionLoading) return;
    setActionLoading(true);
    try {
      await likeMovie(movie.id);
      invalidateListCache();
      setMovie((m) => {
        if (!m) return null;
        const wasLike = m.likeStatus === true;
        const wasDislike = m.likeStatus === false;
        const newStatus = wasLike ? null : true;
        const likeDelta = wasLike ? -1 : wasDislike ? 1 : 1; // 취소 시 -1, 싫어요→좋아요 또는 새로 누름 시 +1
        const dislikeDelta = wasDislike ? -1 : 0; // 싫어요 취소만 dislike -1
        return {
          ...m,
          likeStatus: newStatus,
          likeCount: Math.max(0, m.likeCount + likeDelta),
          dislikeCount: Math.max(0, m.dislikeCount + dislikeDelta),
        };
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDislike = async () => {
    if (!movie || !user || actionLoading) return;
    setActionLoading(true);
    try {
      await dislikeMovie(movie.id);
      invalidateListCache();
      setMovie((m) => {
        if (!m) return null;
        const wasLike = m.likeStatus === true;
        const wasDislike = m.likeStatus === false;
        const newStatus = wasDislike ? null : false;
        const dislikeDelta = wasDislike ? -1 : wasLike ? 1 : 1; // 취소 시 -1, 좋아요→싫어요 또는 새로 누름 시 +1
        const likeDelta = wasLike ? -1 : 0; // 좋아요 취소만 like -1
        return {
          ...m,
          likeStatus: newStatus,
          likeCount: Math.max(0, m.likeCount + likeDelta),
          dislikeCount: Math.max(0, m.dislikeCount + dislikeDelta),
        };
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !movie) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 pt-8">
        {loading ? (
          <p className="flex items-center justify-center min-h-screen text-muted">로딩 중...</p>
        ) : (
          <p>영화를 찾을 수 없습니다.</p>
        )}
      </div>
    );
  }

  const videoUrl = getVideoUrl(movie.movieFilePath);
  const thumbUrl = getThumbnailUrl(movie.movieFilePath);

  return (
    <div className="max-w-[1200px] mx-auto px-4 pt-8 pb-8">
      <Link
        to="/"
        className="inline-block mb-4 px-4 py-2 rounded border border-neutral-500 bg-card text-[#e5e5e5] font-semibold hover:bg-neutral-800"
      >
        ← 목록
      </Link>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          {videoUrl ? (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-neutral-900">
              {thumbUrl && (
                <>
                  <img
                    ref={posterRef}
                    src={thumbUrl}
                    alt={`${movie.title} 썸네일`}
                    className="absolute inset-0 w-full h-full object-contain z-[1] pointer-events-none"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.classList.add('hidden');
                      const fallback = el.nextElementSibling as HTMLElement;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden absolute inset-0 z-[1] flex items-center justify-center text-muted text-sm pointer-events-none">
                    썸네일을 불러올 수 없습니다
                  </div>
                </>
              )}
              <video
                controls
                src={videoUrl}
                poster={thumbUrl || undefined}
                className="absolute inset-0 w-full h-full object-contain rounded-lg"
                playsInline
                preload="metadata"
                onPlay={() => {
                  if (posterRef.current) posterRef.current.classList.add('hidden');
                }}
                onPause={(e) => {
                  const video = e.target as HTMLVideoElement;
                  if (video.currentTime === 0 && posterRef.current) posterRef.current.classList.remove('hidden');
                }}
                onEnded={() => {
                  if (posterRef.current) posterRef.current.classList.remove('hidden');
                }}
              >
                브라우저가 영상을 재생할 수 없습니다.
              </video>
            </div>
          ) : (
            <div className="bg-neutral-800 p-8 rounded-lg text-muted">
              영상 URL이 없습니다. 영화 등록 시 영화 파일명이 올바른지 확인하세요.
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">{movie.title}</h1>
          <p className="text-muted text-sm mb-2">
            감독: {movie.director?.name} · 장르: {movie.genres?.map((g) => g.name).join(', ')}
          </p>
          {movie.detail?.detail && <p className="whitespace-pre-wrap">{movie.detail.detail}</p>}
          <div className="flex flex-wrap gap-2 my-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium bg-neutral-700/80 text-[#e5e5e5]">
              <ThumbUpIcon className="w-4 h-4" />
              좋아요 {Math.max(0, movie.likeCount)}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium bg-neutral-700/80 text-[#e5e5e5]">
              <ThumbDownIcon className="w-4 h-4" />
              싫어요 {Math.max(0, movie.dislikeCount)}
            </span>
          </div>
          {user && (
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded font-semibold disabled:opacity-60 ${
                  movie.likeStatus === true
                    ? 'bg-accent text-white hover:bg-accent-hover'
                    : 'border border-neutral-500 bg-card text-[#e5e5e5] hover:bg-neutral-800'
                }`}
                onClick={handleLike}
                disabled={actionLoading}
              >
                <ThumbUpIcon className="w-5 h-5" />
                좋아요
              </button>
              <button
                type="button"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded font-semibold disabled:opacity-60 ${
                  movie.likeStatus === false
                    ? 'bg-accent text-white hover:bg-accent-hover'
                    : 'border border-neutral-500 bg-card text-[#e5e5e5] hover:bg-neutral-800'
                }`}
                onClick={handleDislike}
                disabled={actionLoading}
              >
                <ThumbDownIcon className="w-5 h-5" />
                싫어요
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

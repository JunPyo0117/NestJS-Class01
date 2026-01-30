import { API_BASE } from '@/api/client';

/**
 * movieFilePath(상대 또는 절대)에서 썸네일/영상 URL 생성.
 * 목록 API는 @Transform 없이 상대 경로(public/movie/xxx.mp4)를 줄 수 있어, 상대일 땐 API 베이스 붙임.
 */
function toThumbPath(path: string): string {
  return path
    .replace(/\/public\/temp\/|\/public\/movie\//, '/public/thumbnail/')
    .replace(/\.mp4$/i, '.png');
}

export function getThumbnailUrl(movieFilePath: string | undefined): string {
  if (!movieFilePath) return '';
  const clean = movieFilePath.replace(/\)$/, '').trim();
  if (!clean) return '';
  const thumbPath = toThumbPath(clean);
  if (/^https?:\/\//.test(clean)) return thumbPath;
  const base = API_BASE?.replace(/\/$/, '') ?? '';
  return base ? `${base}/${thumbPath.replace(/^\//, '')}` : `/${thumbPath.replace(/^\//, '')}`;
}

export function getVideoUrl(movieFilePath: string | undefined): string {
  if (!movieFilePath) return '';
  const clean = movieFilePath.replace(/\)$/, '').trim();
  if (!clean) return '';
  if (/^https?:\/\//.test(clean)) return clean;
  const base = API_BASE?.replace(/\/$/, '') ?? '';
  return base ? `${base}/${clean.replace(/^\//, '')}` : `/${clean.replace(/^\//, '')}`;
}

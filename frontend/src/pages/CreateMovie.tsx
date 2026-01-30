import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createMovie, type CreateMovieBody } from '@/api/movies';
import { getDirectors } from '@/api/directors';
import { getGenres } from '@/api/genres';
import type { Director, Genre } from '@/types';

export default function CreateMovie() {
  const navigate = useNavigate();
  const [directors, setDirectors] = useState<Director[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [form, setForm] = useState<CreateMovieBody>({
    title: '',
    detail: '',
    directorId: 0,
    genreIds: [],
    movieFileName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([getDirectors(), getGenres()]).then(([d, g]) => {
      setDirectors(d);
      setGenres(g);
      if (d.length && !form.directorId) setForm((f) => ({ ...f, directorId: d[0].id }));
    });
  }, []);

  const handleGenreToggle = (id: number) => {
    setForm((f) => ({
      ...f,
      genreIds: f.genreIds.includes(id) ? f.genreIds.filter((x) => x !== id) : [...f.genreIds, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.detail.trim() || !form.directorId || form.genreIds.length === 0 || !form.movieFileName.trim()) {
      setError('제목, 상세, 감독, 장르(1개 이상), 영화 파일명을 모두 입력하세요.');
      return;
    }
    setLoading(true);
    try {
      const movie = await createMovie(form);
      navigate(`/movie/${movie.id}`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : '영화 등록에 실패했습니다.';
      setError(Array.isArray(msg) ? msg[0] : msg ?? '영화 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-8">
      <Link
        to="/"
        className="inline-block px-4 py-2 rounded font-semibold border border-neutral-600 bg-card text-[#e5e5e5] hover:bg-neutral-700 mb-4 no-underline"
      >
        ← 목록
      </Link>
      <h1 className="text-2xl font-bold text-[#e5e5e5] mb-2">영화 등록 (Admin)</h1>
      <p className="text-muted text-sm mb-4">
        영상은 먼저 <Link to="/upload">업로드</Link>에서 올린 뒤, 여기서 등록할 때 <strong className="text-[#e5e5e5]">영화 파일명</strong>에 그 파일명(예: xxx.mp4)을 입력하세요.
      </p>
      <form onSubmit={handleSubmit} className="max-w-[500px] mt-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#e5e5e5] mb-1">제목 *</label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="영화 제목"
            required
            className="w-full px-3 py-2 rounded border border-neutral-600 bg-card text-inherit"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#e5e5e5] mb-1">상세 내용 *</label>
          <textarea
            value={form.detail}
            onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
            placeholder="영화 상세 설명"
            rows={4}
            required
            className="w-full px-3 py-2 rounded border border-neutral-600 bg-card text-inherit resize-y"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#e5e5e5] mb-1">감독 *</label>
          <select
            value={form.directorId || ''}
            onChange={(e) => setForm((f) => ({ ...f, directorId: Number(e.target.value) }))}
            className="w-full px-3 py-2 rounded border border-neutral-600 bg-card text-inherit"
          >
            <option value="">선택</option>
            {directors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#e5e5e5] mb-1">장르 (1개 이상) *</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {genres.map((g) => (
              <label key={g.id} className="flex items-center gap-1 cursor-pointer text-[#e5e5e5]">
                <input
                  type="checkbox"
                  checked={form.genreIds.includes(g.id)}
                  onChange={() => handleGenreToggle(g.id)}
                  className="rounded border-neutral-600 bg-card"
                />
                {g.name}
              </label>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#e5e5e5] mb-1">영화 파일명 *</label>
          <input
            value={form.movieFileName}
            onChange={(e) => setForm((f) => ({ ...f, movieFileName: e.target.value }))}
            placeholder="예: abc-123.mp4 (업로드에서 올린 파일명)"
            required
            className="w-full px-3 py-2 rounded border border-neutral-600 bg-card text-inherit"
          />
        </div>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <button
          type="submit"
          className="px-4 py-2 rounded font-semibold bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? '등록 중...' : '영화 등록'}
        </button>
      </form>
    </div>
  );
}

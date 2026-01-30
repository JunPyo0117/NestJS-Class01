import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createGenre } from '@/api/genres';

export default function CreateGenre() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim()) {
      setError('장르 이름을 입력하세요.');
      return;
    }
    setLoading(true);
    try {
      await createGenre(name.trim());
      setSuccess('장르가 등록되었습니다.');
      setName('');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
          : '장르 등록에 실패했습니다.';
      setError(Array.isArray(msg) ? msg[0] : String(msg ?? '장르 등록에 실패했습니다.'));
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
      <h1 className="text-2xl font-bold text-[#e5e5e5] mb-2">장르 등록 (Admin)</h1>
      <p className="text-muted text-sm mb-4">영화 등록 시 선택할 장르를 미리 등록합니다.</p>
      <form onSubmit={handleSubmit} className="max-w-[500px] mt-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#e5e5e5] mb-1">장르 이름 *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: Action, Drama, Comedy"
            required
            className="w-full px-3 py-2 rounded border border-neutral-600 bg-card text-inherit"
          />
        </div>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        {success && <p className="text-emerald-400 text-sm mb-2">{success}</p>}
        <button
          type="submit"
          className="px-4 py-2 rounded font-semibold bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? '등록 중...' : '장르 등록'}
        </button>
      </form>
    </div>
  );
}

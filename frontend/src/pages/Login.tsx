import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 입력하세요.');
      return;
    }
    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : '로그인에 실패했습니다.';
      setError(Array.isArray(msg) ? msg[0] : msg ?? '로그인에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] p-8 bg-[var(--color-card)] rounded-lg border border-neutral-700">
        <h1 className="mt-0 mb-6 text-2xl font-bold">로그인</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block mb-1 text-[var(--color-muted)] text-sm">이메일</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              autoComplete="email"
              className="w-full px-3 py-2.5 border border-neutral-700 rounded bg-[var(--color-card)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block mb-1 text-[var(--color-muted)] text-sm">비밀번호</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              autoComplete="current-password"
              className="w-full px-3 py-2.5 border border-neutral-700 rounded bg-[var(--color-card)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          {error && <p className="text-[var(--color-accent)] text-sm mt-1">{error}</p>}
          <button type="submit" className="w-full mt-2 px-4 py-2 rounded bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed">
            로그인
          </button>
        </form>
        <p className="mt-4 text-[var(--color-muted)] text-sm">
          계정이 없으신가요? <Link to="/register">회원가입</Link>
        </p>
      </div>
    </div>
  );
}

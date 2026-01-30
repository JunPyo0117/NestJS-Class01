import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-[var(--color-card)] border-b border-neutral-700 py-3">
        <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-[var(--color-accent)] no-underline hover:no-underline">
            Netflix
          </Link>
          <nav className="flex items-center gap-5">
            <Link to="/" className="text-[#e5e5e5] no-underline hover:text-[var(--color-accent)] hover:underline">
              영화
            </Link>
            {user ? (
              <>
                <Link to="/chat" className="text-[#e5e5e5] no-underline hover:text-[var(--color-accent)] hover:underline">문의 채팅</Link>
                <Link to="/upload" className="text-[#e5e5e5] no-underline hover:text-[var(--color-accent)] hover:underline">업로드</Link>
                {user.role === Role.admin && (
                  <>
                    <Link to="/movie/create" className="text-[#e5e5e5] no-underline hover:text-[var(--color-accent)] hover:underline">영화 등록</Link>
                    <Link to="/director/create" className="text-[#e5e5e5] no-underline hover:text-[var(--color-accent)] hover:underline">감독 등록</Link>
                    <Link to="/genre/create" className="text-[#e5e5e5] no-underline hover:text-[var(--color-accent)] hover:underline">장르 등록</Link>
                  </>
                )}
                <span className="text-[var(--color-muted)] text-sm">{user.email}</span>
                <button
                  type="button"
                  className="inline-block px-4 py-2 rounded border border-[var(--color-muted)] bg-[var(--color-card)] text-[#e5e5e5] font-semibold hover:bg-neutral-800"
                  onClick={handleLogout}
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-[#e5e5e5] no-underline hover:text-[var(--color-accent)] hover:underline">로그인</Link>
                <Link to="/register" className="text-[#e5e5e5] no-underline hover:text-[var(--color-accent)] hover:underline">회원가입</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

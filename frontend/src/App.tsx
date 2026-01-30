import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import MovieList from '@/pages/MovieList';
import MovieDetail from '@/pages/MovieDetail';
import CreateMovie from '@/pages/CreateMovie';
import CreateDirector from '@/pages/CreateDirector';
import CreateGenre from '@/pages/CreateGenre';
import Chat from '@/pages/Chat';
import Upload from '@/pages/Upload';
import { Role } from '@/types';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-[var(--color-muted)]">로딩 중...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-[var(--color-muted)]">로딩 중...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== Role.admin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<MovieList />} />
        <Route path="movie/:id" element={<MovieDetail />} />
        <Route
          path="movie/create"
          element={
            <AdminRoute>
              <CreateMovie />
            </AdminRoute>
          }
        />
        <Route
          path="director/create"
          element={
            <AdminRoute>
              <CreateDirector />
            </AdminRoute>
          }
        />
        <Route
          path="genre/create"
          element={
            <AdminRoute>
              <CreateGenre />
            </AdminRoute>
          }
        />
        <Route
          path="chat"
          element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          }
        />
        <Route
          path="upload"
          element={
            <PrivateRoute>
              <Upload />
            </PrivateRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

import axios, { AxiosError } from 'axios';

/** 로컬 개발: /api 사용 시 Vite proxy로 백엔드 연결. 배포 시 VITE_API_BASE에 백엔드 URL 설정 */
export const API_BASE = import.meta.env.VITE_API_BASE ?? (import.meta.env.DEV ? '/api' : '');

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // FormData 전송 시 Content-Type 제거 → 브라우저가 boundary 포함 multipart/form-data로 설정
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config;
    if (err.response?.status === 401 && original && !(original as { _retry?: boolean })._retry) {
      (original as { _retry?: boolean })._retry = true;
      const refresh = localStorage.getItem('refreshToken');
      if (refresh) {
        try {
          const { data } = await axios.post<{ accessToken: string }>(`${API_BASE}/auth/token/access`, undefined, {
            headers: { Authorization: `Bearer ${refresh}` },
          });
          localStorage.setItem('accessToken', data.accessToken);
          // FormData는 한 번 소비되면 재전송 불가 → 재시도하지 않고 토큰만 갱신 후 실패 처리 (사용자가 다시 시도하면 새 토큰으로 요청됨)
          if (original.data instanceof FormData) {
            return Promise.reject(err);
          }
          if (original.headers) original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          if (typeof window !== 'undefined') window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;

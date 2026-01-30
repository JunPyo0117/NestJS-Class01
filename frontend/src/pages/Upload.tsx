import { useState } from 'react';
import { getPresignedUrl, triggerThumbnail, uploadVideo } from '@/api/common';

const MAX_DIRECT = 10 * 1024 * 1024; // 10MB

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleDirectUpload = async () => {
    if (!file) {
      setError('파일을 선택하세요.');
      return;
    }
    if (file.type !== 'video/mp4') {
      setError('MP4 파일만 업로드 가능합니다.');
      return;
    }
    if (file.size > MAX_DIRECT) {
      setError('직접 업로드는 10MB 이하만 가능합니다. Presigned URL 방식을 사용하세요.');
      return;
    }
    setError('');
    setStatus('업로드 중...');
    try {
      const { filename } = await uploadVideo(file);
      setStatus(`업로드 완료: ${filename}. 썸네일은 백그라운드에서 생성됩니다.`);
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : '업로드 실패';
      setError(Array.isArray(msg) ? msg[0] : msg ?? '업로드 실패');
      setStatus('');
    }
  };

  const handlePresignedUpload = async () => {
    if (!file) {
      setError('파일을 선택하세요.');
      return;
    }
    if (file.type !== 'video/mp4') {
      setError('MP4 파일만 업로드 가능합니다.');
      return;
    }
    setError('');
    setStatus('Presigned URL 발급 중...');
    try {
      const { url, key } = await getPresignedUrl();
      setStatus('S3에 업로드 중...');
      const putRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': 'video/mp4' },
      });
      if (!putRes.ok) {
        const body = await putRes.text();
        const detail = body ? `${putRes.status}: ${body.slice(0, 200)}` : `HTTP ${putRes.status}`;
        throw new Error(`S3 업로드 실패 (${detail}). 버킷 CORS 설정을 확인하세요.`);
      }
      setStatus('썸네일 생성 트리거 중...');
      await triggerThumbnail(key);
      setStatus(`완료. key: ${key}. 썸네일은 백그라운드에서 생성됩니다.`);
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : e && typeof e === 'object' && 'response' in e
            ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
            : '업로드 실패';
      setError(Array.isArray(msg) ? msg[0] : String(msg ?? '업로드 실패'));
      setStatus('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-8">
      <h1 className="text-2xl font-bold text-[#e5e5e5] mb-2">영상 업로드</h1>
      <p className="text-muted text-sm mb-4">MP4 파일만 지원. 10MB 이하는 직접 업로드, 그 이상은 Presigned URL로 S3 직접 업로드.</p>
      <div className="max-w-md mt-4 mb-4">
        <label className="block text-sm font-medium text-[#e5e5e5] mb-1">파일 선택</label>
        <input
          type="file"
          accept="video/mp4"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setError('');
            setStatus('');
          }}
          className="w-full text-inherit file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-accent file:text-white file:font-semibold file:cursor-pointer"
        />
        {file && (
          <p className="text-muted text-sm mt-1">
            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      {status && <p className="text-emerald-400 text-sm mb-2">{status}</p>}
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          className="px-4 py-2 rounded font-semibold bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleDirectUpload}
          disabled={!file}
        >
          직접 업로드 (10MB 이하)
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded font-semibold border border-neutral-600 bg-card text-[#e5e5e5] hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handlePresignedUpload}
          disabled={!file}
        >
          Presigned URL 업로드 (대용량)
        </button>
      </div>
    </div>
  );
}

import api from './client';

export interface PresignedUrlResponse {
  url: string;
  key: string;
}

export async function getPresignedUrl(): Promise<PresignedUrlResponse> {
  const { data } = await api.post<PresignedUrlResponse>('/common/presigned-url');
  return data;
}

export async function triggerThumbnail(key: string): Promise<{ message: string; key: string }> {
  const { data } = await api.post<{ message: string; key: string }>('/common/trigger-thumbnail', { key });
  return data;
}

/** 직접 업로드 (10MB 이하 MP4). FormData에 video 파일 */
export async function uploadVideo(file: File): Promise<{ filename: string }> {
  const form = new FormData();
  form.append('video', file);
  // Content-Type 미설정 시 axios가 boundary 포함한 multipart/form-data로 설정 (Authorization 헤더 유지)
  const { data } = await api.post<{ filename: string }>('/common/video', form);
  return data;
}

import api from './client';
import type { Director } from '@/types';

export async function getDirectors(): Promise<Director[]> {
  const { data } = await api.get<Director[]>('/director');
  return data;
}

export async function getDirector(id: number): Promise<Director> {
  const { data } = await api.get<Director>(`/director/${id}`);
  return data;
}

export interface CreateDirectorBody {
  name: string;
  dob: string;
  nationality: string;
}

export async function createDirector(body: CreateDirectorBody): Promise<Director> {
  const { data } = await api.post<Director>('/director', body);
  return data;
}

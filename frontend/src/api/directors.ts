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

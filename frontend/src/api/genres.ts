import api from './client';
import type { Genre } from '@/types';

export async function getGenres(): Promise<Genre[]> {
  const { data } = await api.get<Genre[]>('/genre');
  return data;
}

export async function getGenre(id: number): Promise<Genre> {
  const { data } = await api.get<Genre>(`/genre/${id}`);
  return data;
}

export async function createGenre(name: string): Promise<Genre> {
  const { data } = await api.post<Genre>('/genre', { name });
  return data;
}

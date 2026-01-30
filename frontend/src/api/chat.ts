import api from './client';
import type { ChatMessage } from '@/types';

export interface ChatRoomWithUsers {
  id: number;
  users: { id: number; email: string }[];
  createdAt?: string;
}

export async function getChatRooms(): Promise<ChatRoomWithUsers[]> {
  const { data } = await api.get<ChatRoomWithUsers[]>('/chat/rooms');
  return data;
}

export async function getChatRoomMessages(roomId: number): Promise<ChatMessage[]> {
  const { data } = await api.get<ChatMessage[]>(`/chat/rooms/${roomId}/messages`);
  return data;
}

import api from './client';
import type { ChatMessage } from '@/types';

export interface ChatRoomWithUsers {
  id: number;
  users: { id: number; email: string }[];
  createdAt?: string;
}

/** 일반 사용자: 내 채팅방 ID (없으면 null) */
export async function getMyChatRoom(): Promise<{ roomId: number | null }> {
  const { data } = await api.get<{ roomId: number | null }>('/chat/rooms/me');
  return data;
}

export async function getChatRooms(): Promise<ChatRoomWithUsers[]> {
  const { data } = await api.get<ChatRoomWithUsers[]>('/chat/rooms');
  return data;
}

export async function getChatRoomMessages(roomId: number): Promise<ChatMessage[]> {
  const { data } = await api.get<ChatMessage[]>(`/chat/rooms/${roomId}/messages`);
  return data;
}

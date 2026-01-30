import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { getChatRooms, getChatRoomMessages, type ChatRoomWithUsers } from '@/api/chat';
import type { ChatMessage } from '@/types';
import { Role } from '@/types';

/** 개발 시 Vite proxy(/socket.io → 백엔드) 사용하려면 같은 origin 사용 */
const WS_BASE = import.meta.env.VITE_WS_BASE ?? '';

export default function Chat() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoomWithUsers[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [roomId, setRoomId] = useState<number | ''>('');
  const [connected, setConnected] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRoomIdRef = useRef<number | null>(selectedRoomId);
  const roomIdRef = useRef<number | ''>(roomId);
  const isAdmin = user?.role === Role.admin;

  selectedRoomIdRef.current = selectedRoomId;
  roomIdRef.current = roomId;

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !user) return;

    setConnectError(null);
    const url =
      WS_BASE ||
      (import.meta.env.DEV ? window.location.origin : window.location.origin.replace(/:\d+$/, ':3000'));
    const socket = io(url, {
      path: '/socket.io',
      auth: { token },
      extraHeaders: { Authorization: `Bearer ${token}` },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setConnectError(null);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (err) => {
      setConnected(false);
      setConnectError(err.message || '연결 실패. 백엔드가 켜져 있는지 확인하세요.');
    });
    socket.on('newMessage', (msg: ChatMessage) => {
      const target = user?.role === Role.admin ? selectedRoomIdRef.current : roomIdRef.current;
      const targetRoomId = typeof target === 'number' ? target : null;
      if (targetRoomId != null && msg.chatRoom?.id === targetRoomId) {
        setMessages((prev) => [...prev, msg]);
      }
    });
    socket.on('roomCreated', (id: number) => {
      setRoomId(id);
      setSelectedRoomId(id);
      // 일반 사용자: 백엔드 트랜잭션 커밋 후 히스토리가 보이도록 짧은 지연 후 조회
      setTimeout(() => {
        getChatRoomMessages(id).then(setMessages).catch(() => setMessages([]));
      }, 200);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  // 관리자: 채팅방 목록 로드
  useEffect(() => {
    if (!isAdmin || !connected) return;
    getChatRooms()
      .then(setRooms)
      .catch(() => setRooms([]));
  }, [isAdmin, connected]);

  // 선택한 방(또는 유저의 방) 메시지 히스토리 로드
  const effectiveRoomId = isAdmin ? selectedRoomId : (roomId === '' ? null : roomId);
  useEffect(() => {
    if (effectiveRoomId == null) {
      setMessages([]);
      return;
    }
    getChatRoomMessages(effectiveRoomId)
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [effectiveRoomId]);

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages]);

  const send = () => {
    if (!input.trim() || !socketRef.current) return;
    const room = isAdmin ? selectedRoomId : (roomId === '' ? undefined : Number(roomId));
    if (isAdmin && room == null) return;
    socketRef.current.emit('sendMessage', { message: input.trim(), room });
    setInput('');
  };

  const otherUsersInRoom = (room: ChatRoomWithUsers) =>
    room.users.filter((u) => u.id !== user?.id).map((u) => u.email).join(', ') || '빈 방';

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-8">
      <h1 className="text-2xl font-bold text-[#e5e5e5] mb-2">문의 채팅</h1>
      <p className="text-muted text-sm mb-4">
        {connected ? '연결됨' : connectError ? connectError : '연결 중...'}
        {isAdmin && ' (관리자: 채팅방을 선택한 뒤 메시지 입력)'}
      </p>

      {isAdmin && (
        <div className="mb-4">
          <p className="text-sm font-medium text-[#e5e5e5] mb-2">채팅방 선택</p>
          <div className="flex flex-wrap gap-2">
            {rooms.length === 0 && connected && <span className="text-muted text-sm">채팅방이 없습니다.</span>}
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => setSelectedRoomId(room.id)}
                className={`px-4 py-2 rounded border font-medium transition-colors ${
                  selectedRoomId === room.id
                    ? 'border-accent bg-accent/20 text-[#e5e5e5]'
                    : 'border-neutral-600 bg-card text-[#e5e5e5] hover:bg-neutral-700'
                }`}
              >
                Room {room.id} · {otherUsersInRoom(room)}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isAdmin && roomId === '' && (
        <p className="text-muted text-sm mb-4">문의 시 채팅방이 자동으로 생성됩니다. 메시지를 입력해 보내 보세요.</p>
      )}

      <div className="mb-2 text-sm text-[#e5e5e5]">
        {effectiveRoomId != null && (isAdmin ? `Room ${effectiveRoomId}` : '내 문의')}
      </div>
      <div
        ref={listRef}
        className="border border-neutral-600 rounded-lg min-h-[300px] max-h-[400px] overflow-y-auto p-4 my-4 flex flex-col gap-2"
      >
        {effectiveRoomId == null && (
          <p className="text-muted">
            {isAdmin ? '채팅방을 선택하거나 메시지를 보내면 채팅방이 생성됩니다.' : '아래 입력창에 메시지를 적고 전송하면 문의 채팅방이 만들어집니다.'}
          </p>
        )}
        {effectiveRoomId != null && messages.length === 0 && <p className="text-muted">메시지가 없습니다.</p>}
        {effectiveRoomId != null &&
          messages.map((m) => {
            const myId = user?.id ?? (user as { sub?: number })?.sub;
            const isMe = m.author?.id === myId;
            return (
              <div
                key={m.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    isMe
                      ? 'bg-accent text-white rounded-br-none'
                      : 'bg-neutral-700 text-[#e5e5e5] rounded-bl-none'
                  }`}
                >
                  {!isMe && (
                    <p className="text-xs text-muted mb-0.5">{m.author?.email ?? '알 수 없음'}</p>
                  )}
                  <p className="break-words">{m.message}</p>
                </div>
              </div>
            );
          })}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            if (e.nativeEvent.isComposing) return;
            e.preventDefault();
            send();
          }}
          placeholder="메시지 입력"
          className="flex-1 px-3 py-2 rounded border border-neutral-600 bg-card text-inherit"
          disabled={!connected || (isAdmin && selectedRoomId == null)}
        />
        <button
          type="button"
          className="px-4 py-2 rounded font-semibold bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={send}
          disabled={!connected || (isAdmin && selectedRoomId == null)}
        >
          전송
        </button>
      </div>
    </div>
  );
}

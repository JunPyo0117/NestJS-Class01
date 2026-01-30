import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import type { ChatMessage } from '@/types';

/** 개발 시 Vite proxy(/socket.io → 백엔드) 사용하려면 같은 origin 사용 */
const WS_BASE = import.meta.env.VITE_WS_BASE ?? '';

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [roomId, setRoomId] = useState<number | ''>('');
  const [connected, setConnected] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !user) return;

    setConnectError(null);
    // VITE_WS_BASE 없으면: 개발 시 같은 origin(프록시 사용), 그 외 백엔드 포트 직접 지정
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
      setMessages((prev) => [...prev, msg]);
    });
    socket.on('roomCreated', (id: number) => {
      setRoomId(id);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages]);

  const send = () => {
    if (!input.trim() || !socketRef.current) return;
    const room = roomId === '' ? undefined : Number(roomId);
    socketRef.current.emit('sendMessage', { message: input.trim(), room });
    setInput('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-8">
      <h1 className="text-2xl font-bold text-[#e5e5e5] mb-2">문의 채팅</h1>
      <p className="text-muted text-sm mb-4">
        {connected ? '연결됨' : connectError ? connectError : '연결 중...'} {user?.role === 0 && '(관리자: room ID 입력 후 메시지)'}
      </p>
      {user?.role === 0 && (
        <div className="mb-4 max-w-[120px]">
          <label className="block text-sm font-medium text-[#e5e5e5] mb-1">Room ID</label>
          <input
            type="number"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="1"
            className="w-full px-3 py-2 rounded border border-neutral-600 bg-card text-inherit"
          />
        </div>
      )}
      <div
        ref={listRef}
        className="border border-neutral-600 rounded-lg min-h-[300px] max-h-[400px] overflow-y-auto p-4 my-4"
      >
        {messages.length === 0 && <p className="text-muted">메시지가 없습니다.</p>}
        {messages.map((m) => (
          <div key={m.id} className="mb-2">
            <span className="text-muted text-xs">
              {m.chatRoom?.id != null ? `Room ${m.chatRoom.id} · ` : ''}
            </span>
            <strong className="text-[#e5e5e5]">{m.author?.email ?? '알 수 없음'}</strong>: <span className="text-[#e5e5e5]">{m.message}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="메시지 입력"
          className="flex-1 px-3 py-2 rounded border border-neutral-600 bg-card text-inherit"
        />
        <button
          type="button"
          className="px-4 py-2 rounded font-semibold bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={send}
          disabled={!connected}
        >
          전송
        </button>
      </div>
    </div>
  );
}

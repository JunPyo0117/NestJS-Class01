import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { ChatRoom } from './entity/chat-room.entity';
import { QueryRunner, Repository } from 'typeorm';
import { Chat } from './entity/chat.entity';
import { Role, User } from 'src/user/entity/user.entity';
import { CreateChatDto } from './dto/create-chat.dto';
import { WsException } from '@nestjs/websockets';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ChatService {
  private readonly connectedClients = new Map<number, Socket>();

  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  registerClient(userId: number, client: Socket) {
    this.connectedClients.set(userId, client);
  }

  removeClient(userId: number) {
    this.connectedClients.delete(userId);
  }

  async joinUserRooms(user: { sub: number }, client: Socket) {
    const chatRooms = await this.chatRoomRepository
      .createQueryBuilder('chatRoom')
      .innerJoin('chatRoom.users', 'user', 'user.id = :userId', {
        userId: user.sub,
      })
      .getMany();

    chatRooms.forEach((room) => {
      client.join(room.id.toString());
    });
  }

  async createMessage(
    payload: { sub: number },
    { message, room }: CreateChatDto,
    qr: QueryRunner,
  ) {
    const user = await this.userRepository.findOne({
      where: {
        id: payload.sub,
      },
    });

    if (!user) {
      throw new WsException('사용자를 찾을 수 없습니다.');
    }

    const chatRoom = await this.getOrCreateChatRoom(user, qr, room);

    if (!chatRoom) {
      throw new WsException('채팅방을 찾을 수 없습니다.');
    }

    const msgModel = await qr.manager.save(Chat, {
      author: user,
      message,
      chatRoom,
    });

    const client = this.connectedClients.get(user.id);

    if (client) {
      const payload = {
        ...plainToClass(Chat, msgModel),
        chatRoom: { id: chatRoom.id },
      };
      client.to(chatRoom.id.toString()).emit('newMessage', payload);
    }

    return message;
  }

  async getOrCreateChatRoom(user: User, qr: QueryRunner, room?: number) {
    if (user.role === Role.admin) {
      if (!room) {
        throw new WsException('어드민은 room 값을 필수로 제공해야합니다.');
      }

      return qr.manager.findOne(ChatRoom, {
        where: { id: room },
        relations: ['users'],
      });
    }

    let chatRoom = await qr.manager
      .createQueryBuilder(ChatRoom, 'chatRoom')
      .innerJoin('chatRoom.users', 'user')
      .where('user.id = :userId', { userId: user.id })
      .getOne();

    if (!chatRoom) {
      const adminUser = await qr.manager.findOne(User, {
        where: { role: Role.admin },
      });

      if (!adminUser) {
        throw new WsException('관리자를 찾을 수 없습니다.');
      }

      chatRoom = await qr.manager.save(ChatRoom, {
        users: [user, adminUser],
      });

      if (!chatRoom) {
        throw new WsException('채팅방 생성에 실패했습니다.');
      }

      // const roomId = chatRoom.id;
      [user.id, adminUser.id].forEach((userId) => {
        const client = this.connectedClients.get(userId);

        if (client) {
          client.emit('roomCreated', chatRoom!.id);
          client.join(chatRoom!.id.toString());
        }
      });
    }

    return chatRoom;
  }

  /** 일반 사용자: 내가 참여 중인 채팅방 1개 (문의용 1:1 방) */
  async getMyRoom(userId: number) {
    const room = await this.chatRoomRepository
      .createQueryBuilder('chatRoom')
      .innerJoin('chatRoom.users', 'user', 'user.id = :userId', { userId })
      .getOne();
    return room;
  }

  /** 관리자: 모든 채팅방 목록 (참여 유저 포함) */
  async getRoomsForAdmin() {
    return this.chatRoomRepository.find({
      relations: ['users'],
      order: { id: 'ASC' },
    });
  }

  /** 채팅방 메시지 목록 (관리자 또는 해당 방 참여자만) */
  async getMessagesByRoomId(roomId: number, userId: number, isAdmin: boolean) {
    const room = await this.chatRoomRepository.findOne({
      where: { id: roomId },
      relations: ['users'],
    });
    if (!room) return [];
    const isParticipant = room.users.some((u) => u.id === userId);
    if (!isAdmin && !isParticipant) return [];
    return this.chatRepository.find({
      where: { chatRoom: { id: roomId } },
      relations: ['author', 'chatRoom'],
      order: { createdAt: 'ASC' },
    });
  }
}

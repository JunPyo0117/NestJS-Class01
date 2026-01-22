import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { WsTransactionInterceptor } from 'src/common/interceptor/ws-transaction.intercepter';
import { UseInterceptors } from '@nestjs/common';
import { WsQueryRunner } from 'src/common/decorator/ws-query-runner.decorator';
import type { QueryRunner } from 'typeorm';
import { CreateChatDto } from './dto/create-chat.dto';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const rawToken = client.handshake.headers.authorization;
      if (!rawToken) {
        client.disconnect();
        return;
      }
      const payload = await this.authService.parseBearerToken(rawToken, false);

      if (payload) {
        client.data.user = payload;
        this.chatService.registerClient(payload.sub, client);
        await this.chatService.joinUserRooms(payload, client);
      } else {
        client.disconnect();
      }
    } catch (e) {
      console.log(e);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;

    if (user) {
      this.chatService.removeClient(user.sub);
    }
  }

  @SubscribeMessage('sendMessage')
  @UseInterceptors(WsTransactionInterceptor)
  async handleMessage(
    @MessageBody() body: CreateChatDto,
    @ConnectedSocket() client: Socket,
    @WsQueryRunner() qr: QueryRunner,
  ) {
    const payload = client.data.user;
    await this.chatService.createMessage(payload, body, qr);
  }

  // @SubscribeMessage('receiveMessage')
  // async receiveMessage(
  //   @MessageBody() data: { message: string },
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   console.log('receiveMessage');
  //   console.log(data);
  //   console.log(client);
  // }

  // @SubscribeMessage('sendMessage')
  // async sendMessage(
  //   @MessageBody() data: { message: string },
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   client.emit('sendMessage', {
  //     ...data,
  //     from: 'server',
  //   });
  //   client.emit('sendMessage', {
  //     ...data,
  //     from: 'server',
  //   });
  //   client.emit('sendMessage', {
  //     ...data,
  //     from: 'server',
  //   });
  // }
}

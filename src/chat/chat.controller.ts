import { Controller, Get, Param, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/user/entity/user.entity';
import { RBACGuard } from 'src/auth/guard/rbac.guard';
import { ChatService } from './chat.service';
import { UserId } from 'src/user/decorator/user-id.decorator';

@Controller('chat')
@ApiBearerAuth()
@ApiTags('Chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms/me')
  @ApiOperation({ description: '일반 사용자: 내 채팅방 ID (없으면 null)' })
  async getMyRoom(@UserId() userId: number) {
    const room = await this.chatService.getMyRoom(userId);
    return { roomId: room?.id ?? null };
  }

  @Get('rooms')
  @UseGuards(RBACGuard)
  @RBAC(Role.admin)
  @ApiOperation({ description: '관리자: 모든 채팅방 목록' })
  getRooms() {
    return this.chatService.getRoomsForAdmin();
  }

  @Get('rooms/:id/messages')
  @ApiOperation({ description: '채팅방 메시지 히스토리 (관리자 또는 해당 방 참여자)' })
  getRoomMessages(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
    @Req() req: { user?: { role?: Role } },
  ) {
    const isAdmin = req.user?.role === Role.admin;
    return this.chatService.getMessagesByRoomId(id, userId, isAdmin);
  }
}

import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/user/schema/user.schema';
import { ChatRoom } from './chat-room.schema';

export class Chat extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  author: User;

  @Prop({
    required: true,
  })
  message: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'ChatRoom',
    required: true,
  })
  chatRoom: ChatRoom;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

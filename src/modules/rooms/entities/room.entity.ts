import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ROOM_TYPES } from '../constants';
import type { RoomType } from '../types';

@Schema()
export class Room extends Document {
	@Prop({ unique: true, required: true })
	roomNumber: number;

	@Prop({ required: true, enum: Object.values(ROOM_TYPES), type: String })
	roomType: RoomType;

	@Prop({ default: false })
	hasSeaView: boolean;
}

export const RoomSchema = SchemaFactory.createForClass(Room);

RoomSchema.index({ roomNumber: 1 }, { unique: true });

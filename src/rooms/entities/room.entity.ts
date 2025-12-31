import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export const ROOM_TYPES = {
	SINGLE: 'single',
	DOUBLE: 'double',
	SUITE: 'suite',
} as const;

export type RoomType = (typeof ROOM_TYPES)[keyof typeof ROOM_TYPES];

export type RoomDocument = HydratedDocument<Room>;

@Schema()
export class Room extends Document {
	@Prop({ unique: true, required: true })
	roomNumber: number;

	@Prop({ required: true, enum: Object.values(ROOM_TYPES) })
	roomType: RoomType;

	@Prop({ default: false })
	hasSeaView: boolean;
}

export const RoomSchema = SchemaFactory.createForClass(Room);

RoomSchema.index({ roomNumber: 1 }, { unique: true });

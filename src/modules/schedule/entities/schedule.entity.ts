import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MSchema } from 'mongoose';
import { Room } from 'src/modules/rooms';

@Schema()
export class Schedule extends Document {
	@Prop({ type: MSchema.Types.ObjectId, ref: Room.name, required: true })
	roomId: Room;

	@Prop({ type: Date, required: true })
	date: Date;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);

ScheduleSchema.index({ roomId: 1, date: 1 }, { unique: true });

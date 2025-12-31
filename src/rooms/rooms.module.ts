import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Room, RoomSchema } from './entities/room.entity';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

@Module({
	imports: [MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }])],
	controllers: [RoomsController],
	providers: [RoomsService],
})
export class RoomsModule {}

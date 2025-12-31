import { IsBoolean, IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';
import { ROOM_TYPES, type RoomType } from '../entities/room.entity';

export class CreateRoomDto {
	@IsInt()
	@IsPositive()
	roomNumber: number;

	@IsEnum(ROOM_TYPES, {
		message: `roomType must be one of: ${Object.values(ROOM_TYPES).join(', ')}`,
	})
	roomType: RoomType;

	@IsOptional()
	@IsBoolean()
	hasSeaView?: boolean;
}

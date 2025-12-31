import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './entities/room.entity';
import { RoomsService } from './rooms.service';

@Controller('rooms')
export class RoomsController {
	constructor(private readonly roomsService: RoomsService) {}

	@Post()
	async create(@Body() createRoomDto: CreateRoomDto): Promise<Room> {
		return this.roomsService.create(createRoomDto);
	}

	@Get()
	async findAll(): Promise<Room[]> {
		return this.roomsService.findAll();
	}

	@Get('byRoomNumber/:roomNumber')
	async findByRoomNumber(
		@Param('roomNumber', ParseIntPipe) roomNumber: number,
	): Promise<Room | null> {
		return this.roomsService.findByRoomNumber(roomNumber);
	}

	@Delete('byRoomNumber/:roomNumber')
	async removeByRoomNumber(@Param('roomNumber', ParseIntPipe) roomNumber: number): Promise<void> {
		await this.roomsService.removeByRoomNumber(roomNumber);
	}

	@Get(':id')
	async findOne(@Param('id') id: string): Promise<Room | null> {
		return this.roomsService.findOne(id);
	}

	@Patch(':id')
	async update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
		return this.roomsService.update(id, updateRoomDto);
	}

	@Delete(':id')
	async remove(@Param('id') id: string): Promise<void> {
		await this.roomsService.remove(id);
	}
}

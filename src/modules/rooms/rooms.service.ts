import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ERRORS } from './constants';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './entities/room.entity';

@Injectable()
export class RoomsService {
	constructor(@InjectModel(Room.name) private roomModel: Model<Room>) {}

	async create(createRoomDto: CreateRoomDto): Promise<Room> {
		const existingRoom = await this.roomModel
			.findOne({ roomNumber: createRoomDto.roomNumber })
			.lean()
			.exec();

		if (existingRoom) {
			throw new HttpException(ERRORS.ROOM_ALREADY_EXISTS_ERROR, HttpStatus.CONFLICT);
		}

		const newRoom = new this.roomModel(createRoomDto);

		return newRoom.save();
	}

	async findAll(): Promise<Room[]> {
		return this.roomModel.find().lean().exec();
	}

	async findOne(id: string): Promise<Room | null> {
		const room = await this.roomModel.findById(id).lean().exec();

		if (!room) {
			throw new HttpException(ERRORS.ROOM_NOT_FOUND_ERROR, HttpStatus.NOT_FOUND);
		}

		return room;
	}

	async findByRoomNumber(roomNumber: number): Promise<Room | null> {
		const room = await this.roomModel.findOne({ roomNumber: roomNumber }).lean().exec();

		if (!room) {
			throw new HttpException(ERRORS.ROOM_NOT_FOUND_ERROR, HttpStatus.NOT_FOUND);
		}

		return room;
	}

	async update(id: string, updateRoomDto: UpdateRoomDto): Promise<Room | null> {
		const existingRoom = await this.roomModel.findById(id).lean().exec();

		if (!existingRoom) {
			throw new HttpException(ERRORS.ROOM_NOT_FOUND_ERROR, HttpStatus.NOT_FOUND);
		}

		if (updateRoomDto.roomNumber) {
			const duplicateRoom = await this.roomModel
				.findOne({
					roomNumber: updateRoomDto.roomNumber,
					_id: { $ne: id },
				})
				.lean()
				.exec();

			if (duplicateRoom) {
				throw new HttpException(ERRORS.ROOM_ALREADY_EXISTS_ERROR, HttpStatus.CONFLICT);
			}
		}

		return this.roomModel
			.findByIdAndUpdate(id, updateRoomDto, { new: true, runValidators: true })
			.exec();
	}

	async remove(id: string): Promise<void> {
		const deletedRoom = await this.roomModel.findByIdAndDelete(id).exec();

		if (!deletedRoom) {
			throw new HttpException(ERRORS.ROOM_NOT_FOUND_ERROR, HttpStatus.NOT_FOUND);
		}
	}

	async removeByRoomNumber(roomNumber: number): Promise<void> {
		const deletedRoom = await this.roomModel.findOneAndDelete({ roomNumber: roomNumber }).exec();

		if (!deletedRoom) {
			throw new HttpException(ERRORS.ROOM_NOT_FOUND_ERROR, HttpStatus.NOT_FOUND);
		}
	}
}

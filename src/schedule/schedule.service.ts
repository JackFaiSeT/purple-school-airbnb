import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { FindScheduleDto } from './dto/find-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Schedule } from './entities/schedule.entity';
import { ROOM_ALREADY_BOOKED_ERROR, SCHEDULE_NOT_FOUND_ERROR } from './schedule.constants';

@Injectable()
export class ScheduleService {
	constructor(@InjectModel(Schedule.name) private scheduleModel: Model<Schedule>) {}

	async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
		const date = new Date(createScheduleDto.date);
		date.setUTCHours(0, 0, 0, 0);

		const existingSchedule = await this.scheduleModel
			.findOne({
				roomId: createScheduleDto.roomId,
				date,
			})
			.lean()
			.exec();

		if (existingSchedule) {
			throw new HttpException(ROOM_ALREADY_BOOKED_ERROR, HttpStatus.CONFLICT);
		}

		const createdSchedule = new this.scheduleModel({
			...createScheduleDto,
			date,
		});

		return createdSchedule.save();
	}

	async findAll(query: FindScheduleDto): Promise<Schedule[]> {
		const filter: Record<string, unknown> = {};

		if (query.roomId) {
			filter.roomId = query.roomId;
		}

		if (query.date) {
			const start = new Date(query.date);
			const end = new Date(query.date);

			end.setUTCHours(23, 59, 59, 999);

			filter.date = {
				$gte: start,
				$lte: end,
			};
		}

		return this.scheduleModel.find(filter).lean().exec();
	}

	async findOne(id: string): Promise<Schedule | null> {
		const schedule = await this.scheduleModel.findById(id).lean().exec();

		if (!schedule) {
			throw new HttpException(SCHEDULE_NOT_FOUND_ERROR, HttpStatus.NOT_FOUND);
		}

		return schedule;
	}

	async update(id: string, updateScheduleDto: UpdateScheduleDto): Promise<Schedule | null> {
		const normalizedDate = new Date(updateScheduleDto.date);
		normalizedDate.setUTCHours(0, 0, 0, 0);

		const existingSchedule = await this.scheduleModel
			.findOne({
				roomId: updateScheduleDto.roomId,
				date: normalizedDate,
				_id: { $ne: id },
			})
			.lean()
			.exec();

		if (existingSchedule) {
			throw new HttpException(ROOM_ALREADY_BOOKED_ERROR, HttpStatus.CONFLICT);
		}

		const updatedSchedule = await this.scheduleModel
			.findByIdAndUpdate(
				id,
				{ ...updateScheduleDto, date: normalizedDate },
				{ new: true, runValidators: true },
			)
			.exec();

		if (!updatedSchedule) {
			throw new HttpException(SCHEDULE_NOT_FOUND_ERROR, HttpStatus.NOT_FOUND);
		}

		return updatedSchedule;
	}

	async remove(id: string): Promise<void> {
		const deletedSchedule = await this.scheduleModel.findByIdAndDelete(id).exec();

		if (!deletedSchedule) {
			throw new HttpException(SCHEDULE_NOT_FOUND_ERROR, HttpStatus.NOT_FOUND);
		}
	}
}

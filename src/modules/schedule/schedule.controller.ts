import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-object-id.pipe';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { FindScheduleDto } from './dto/find-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Schedule } from './entities/schedule.entity';
import { ScheduleService } from './schedule.service';

@Controller('schedule')
export class ScheduleController {
	constructor(private readonly scheduleService: ScheduleService) {}

	@Post()
	async create(@Body() createScheduleDto: CreateScheduleDto): Promise<Schedule> {
		return this.scheduleService.create(createScheduleDto);
	}

	@Get()
	async findAll(@Query() query: FindScheduleDto) {
		return this.scheduleService.findAll(query);
	}

	@Get(':id')
	async findOne(@Param('id', ParseObjectIdPipe) id: string): Promise<Schedule | null> {
		return this.scheduleService.findOne(id);
	}

	@Put(':id')
	async update(
		@Param('id', ParseObjectIdPipe) id: string,
		@Body() updateScheduleDto: UpdateScheduleDto,
	): Promise<Schedule | null> {
		return this.scheduleService.update(id, updateScheduleDto);
	}

	@Delete(':id')
	async remove(@Param('id', ParseObjectIdPipe) id: string): Promise<void> {
		await this.scheduleService.remove(id);
	}
}
